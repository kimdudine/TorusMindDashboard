/* Torus BD Dashboard.
   Two modes, same screens:
   - DEMO: no database configured (window.TORUS_CONFIG is null). Fictional sample data in memory.
   - LIVE: Supabase URL + anon key set in Vercel env vars. Team login by email link, every change
     saved to the database, live updates pushed to every open screen. No polling.
   Patient leads are stored only as MONTHLY COUNTS. IntakeQ exports are summarised in the browser;
   no patient-level data is ever sent anywhere. */
(async () => {
  const DAY = 864e5;
  const TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);
  const d = (offset) => new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + offset);
  const iso = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  const parse = (s) => { const [y, m, dd] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, m - 1, dd || 1); };
  const days = (s) => Math.round((parse(s) - TODAY) / DAY);
  const fmt = (s, o = { month: 'short', day: 'numeric' }) => parse(s).toLocaleDateString('en-US', o);
  const fmtMonth = (s, long = false) => parse(s).toLocaleDateString('en-US', long ? { month: 'long', year: 'numeric' } : { month: 'short', year: 'numeric' });
  const monthOf = (s) => String(s).slice(0, 7) + '-01';
  const monthShift = (n) => iso(new Date(TODAY.getFullYear(), TODAY.getMonth() + n, 1));
  const THIS_MONTH = monthShift(0), LAST_MONTH = monthShift(-1);
  const rel = (s) => { const n = days(s); return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n === -1 ? 'Yesterday' : n < 0 ? `${-n} days late` : n < 7 ? parse(s).toLocaleDateString('en-US', { weekday: 'long' }) : fmt(s); };
  const money = (n) => '$' + Math.round(n || 0).toLocaleString('en-US');
  const pct = (n) => (isFinite(n) ? Math.round(n * 100) + '%' : '–');
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

  /* ---------------- Vocabulary (from the playbook) ---------------- */
  const STAGES = ['Cold', 'Warm', 'Sent materials', 'Meeting scheduled', 'Referral made', 'Active referrer'];
  const ALL_STATUS = [...STAGES, 'Not a fit'];
  const ACTIVITIES = [
    { id: 'A1', name: 'Practice partnerships', long: '1 · Practice partnerships', color: 'var(--chart-1)' },
    { id: 'A2', name: 'Spravato insurance track', long: '2 · Spravato insurance track', color: 'var(--chart-3)' },
    { id: 'A3', name: 'Provider education', long: '3 · Provider education series', color: 'var(--chart-2)' },
    { id: 'A4', name: 'Community events', long: '4 · Wellness community events', color: 'var(--chart-5)' },
    { id: 'A5', name: "Shari's network", long: "5 · Shari's physician network", color: 'var(--chart-4)' },
    { id: 'D', name: 'Digital / direct', long: 'Digital / direct', color: 'var(--chart-6)' },
  ];
  const act = (id) => ACTIVITIES.find((a) => a.id === id) || ACTIVITIES[5];
  const SOURCES = ['Provider referral', 'Community event', 'Provider education event', 'Social media', 'Google / organic search', 'Email (Flodesk)', 'Word of mouth', 'Direct walk-in', 'Shari Retreats', 'Shari Yoga', 'Avonny', 'Other'];
  const CHANNELS = ['Discovery form (website)', 'Phone call', 'Email', 'Provider referral form', 'At an event', 'Walk-in'];
  const EVENT_TYPES = ['Lunch-and-learn', 'Webinar', 'Open house', 'Q&A', 'Tea', 'Integration circle', 'Community talk'];
  const TYPES = ['Clinical referrer', 'Hospital colleague', 'Community venue'];
  const OWNERS = ['Kim', 'Shari', 'Annette', 'Stephanie', 'Avonny'];
  const METHODS = ['Email', 'Text', 'Phone', 'In-person', 'Letter', 'Zoom'];
  const OUTCOMES = ['No response', 'Replied', 'Conversation held', 'Meeting scheduled', 'Materials sent', 'Referral agreed', 'Declined'];
  const PACKAGES = { 'None yet': 0, 'Single infusion': 450, '4-session series': 1800, '6-session series': 2600, 'Spravato (insurance)': 0 };

  /* ---------------- Data layer ---------------- */
  const CFG = window.TORUS_CONFIG || null;
  const LIVE = !!(CFG && CFG.supabaseUrl && CFG.supabaseAnonKey);
  const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
  const EMPTY = () => ({ settings: { openDate: iso(TODAY), staffCost: 50 }, partners: [], touches: [], events: [], counts: [], team: [] });
  let DATA = LIVE ? EMPTY() : window.TORUS_SAMPLE(PACKAGES);
  let db = null, session = null, me = null;

  // Database rows (snake_case) <-> app records (camelCase). One place to change if a column changes.
  const TABLES = {
    partners: { coll: 'partners', key: 'id',
      from: (r) => ({ id: r.id, contact: r.contact, org: r.org, type: r.type, activity: r.activity, spec: r.specialty, city: r.city, phone: r.phone, status: r.status, owner: r.owner, next: r.next_follow_up || '', nextStep: r.next_step, metAt: r.met_at || '' }),
      to: (p) => ({ id: p.id, contact: p.contact, org: p.org, type: p.type, activity: p.activity, specialty: p.spec || '', city: p.city || '', phone: p.phone || '', status: p.status, owner: p.owner || '', next_follow_up: p.next || null, next_step: p.nextStep || '', met_at: p.metAt || null }) },
    touches: { coll: 'touches', key: 'id',
      from: (r) => ({ id: r.id, partner: r.partner_id, date: r.date, method: r.method, by: r.done_by, outcome: r.outcome, note: r.note, hours: +r.hours, cost: +r.cost }),
      to: (t) => ({ partner_id: t.partner, date: t.date, method: t.method, done_by: t.by, outcome: t.outcome, note: t.note, hours: +t.hours || 0, cost: +t.cost || 0 }) },
    events: { coll: 'events', key: 'id',
      from: (r) => ({ id: r.id, name: r.name, type: r.type, activity: r.activity, date: r.date, venue: r.venue_id || '', format: r.format, attendees: +r.attendees, signups: +r.signups, cost: +r.cost, hours: +r.hours }),
      to: (e) => ({ id: e.id, name: e.name, type: e.type, activity: e.activity, date: e.date, venue_id: e.venue || null, format: e.format, attendees: +e.attendees || 0, signups: +e.signups || 0, cost: +e.cost || 0, hours: +e.hours || 0 }) },
    lead_counts: { coll: 'counts', key: 'id',
      from: (r) => ({ id: r.id, month: r.month, via: r.via, source: r.source, credit: r.credit_id || '', leads: +r.leads, consults: +r.consults, converted: +r.converted, revenue: +r.revenue }),
      to: (c) => ({ month: c.month, via: c.via, source: c.source, credit_id: c.credit || '', leads: +c.leads || 0, consults: +c.consults || 0, converted: +c.converted || 0, revenue: +c.revenue || 0 }) },
    team_members: { coll: 'team', key: 'email', from: (r) => ({ email: r.email, name: r.name, role: r.role }), to: (m) => ({ email: m.email.toLowerCase(), name: m.name || '', role: m.role || 'member' }) },
  };

  async function connect() {
    const { createClient } = await import(SUPABASE_JS);
    db = createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } });
    const { data } = await db.auth.getSession();
    session = data.session;
    if (/[?&]code=/.test(location.search)) history.replaceState(null, '', location.pathname + '#today');
    db.auth.onAuthStateChange((evt, s) => { const was = !!session; session = s; if (!!s !== was) boot(); });
  }
  async function loadAll() {
    const q = (t, order) => db.from(t).select('*').order(order, { ascending: true });
    const res = await Promise.all([q('partners', 'id'), q('touches', 'date'), q('events', 'date'), q('lead_counts', 'month'), db.from('settings').select('*').eq('id', 1), q('team_members', 'email')]);
    const err = res.find((r) => r.error); if (err) throw err.error;
    const [p, t, e, c, s, m] = res.map((r) => r.data || []);
    DATA = { partners: p.map(TABLES.partners.from), touches: t.map(TABLES.touches.from), events: e.map(TABLES.events.from), counts: c.map(TABLES.lead_counts.from),
      settings: s[0] ? { openDate: s[0].open_date, staffCost: +s[0].staff_cost } : EMPTY().settings, team: m.map(TABLES.team_members.from) };
    me = DATA.team.find((x) => x.email === (session.user.email || '').toLowerCase()) || null;
  }
  function subscribe() {
    db.channel('torus-live').on('postgres_changes', { event: '*', schema: 'public' }, (msg) => {
      const T = TABLES[msg.table];
      if (msg.table === 'settings') { if (msg.new) DATA.settings = { openDate: msg.new.open_date, staffCost: +msg.new.staff_cost }; return refresh(); }
      if (!T) return;
      const list = DATA[T.coll], keyOf = (r) => r[T.key];
      if (msg.eventType === 'DELETE') { const k = keyOf(msg.old || {}); DATA[T.coll] = list.filter((x) => x[T.key] !== k); }
      else { const rec = T.from(msg.new), i = list.findIndex((x) => x[T.key] === rec[T.key]); if (i >= 0) list[i] = rec; else list.push(rec); }
      refresh();
    }).subscribe();
  }
  // Save helpers: write to the database in LIVE mode, to memory in DEMO mode. Return the saved record.
  async function upsert(table, rec) {
    const T = TABLES[table];
    if (LIVE) {
      const row = T.to(rec); if (table === 'touches' && rec.id) row.id = rec.id;
      const { data, error } = await db.from(table).upsert(row).select().single();
      if (error) throw error; rec = T.from(data);
    } else if (table === 'touches' && !rec.id) rec.id = 'T' + Date.now();
    const list = DATA[T.coll], i = list.findIndex((x) => x[T.key] === rec[T.key]);
    if (i >= 0) list[i] = rec; else list.push(rec);
    return rec;
  }
  async function remove(table, key) {
    const T = TABLES[table];
    if (LIVE) { const { error } = await db.from(table).delete().eq(T.key, key); if (error) throw error; }
    DATA[T.coll] = DATA[T.coll].filter((x) => x[T.key] !== key);
  }
  async function saveSettings(s) {
    if (LIVE) { const { error } = await db.from('settings').upsert({ id: 1, open_date: s.openDate, staff_cost: s.staffCost }); if (error) throw error; }
    DATA.settings = s;
  }
  async function replaceCounts(rows) {
    if (LIVE) {
      const { error } = await db.rpc('replace_lead_counts', { p_rows: rows.map(TABLES.lead_counts.to) }); if (error) throw error;
      const { data, error: e2 } = await db.from('lead_counts').select('*').order('month'); if (e2) throw e2;
      DATA.counts = data.map(TABLES.lead_counts.from);
    } else {
      const pairs = new Set(rows.map((r) => r.month + '|' + r.via));
      DATA.counts = DATA.counts.filter((c) => !pairs.has(c.month + '|' + c.via)).concat(rows.map((r, i) => ({ ...r, id: 'I' + Date.now() + i })));
    }
  }
  const nextId = (prefix, list) => prefix + String(Math.max(0, ...list.map((x) => parseInt(String(x.id).slice(2), 10) || 0)) + 1).padStart(3, '0');

  /* ---------------- Derived values (all lead figures are monthly counts) ---------------- */
  const partner = (id) => DATA.partners.find((p) => p.id === id);
  const eventById = (id) => DATA.events.find((e) => e.id === id);
  const creditActivity = (id) => (String(id).startsWith('P-') ? partner(id)?.activity : String(id).startsWith('E-') ? eventById(id)?.activity : 'D') || 'D';
  const touchesOf = (id) => DATA.touches.filter((t) => t.partner === id).sort((a, b) => b.date.localeCompare(a.date));
  const sum = (rows) => rows.reduce((s, c) => ({ leads: s.leads + c.leads, consults: s.consults + c.consults, converted: s.converted + c.converted, revenue: s.revenue + c.revenue }), { leads: 0, consults: 0, converted: 0, revenue: 0 });
  const countsFor = (pred) => DATA.counts.filter(pred);
  const creditTotals = (id) => sum(countsFor((c) => c.credit === id));
  const byMonth = (rows) => { const m = new Map(); rows.forEach((c) => { const s = m.get(c.month) || []; s.push(c); m.set(c.month, s); }); return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([month, r]) => ({ month, ...sum(r) })); };
  const lastReferral = (id) => countsFor((c) => c.credit === id && c.leads > 0).map((c) => c.month).sort().at(-1) || '';
  const metAtEvent = (eid) => DATA.partners.filter((p) => p.metAt === eid);
  const overdue = (p) => p.next && days(p.next) < 0 && p.status !== 'Not a fit';
  const monthInRange = (month, range) => range === 'all' || month >= monthOf(iso(d(-range)));
  const inRange = (s, range) => range === 'all' || days(s) >= -range;
  const creditLink = (id) => (String(id).startsWith('P-') ? `<a href="#partner-${esc(id)}">${esc(partner(id)?.org || id)}</a>` : String(id).startsWith('E-') ? `<a href="#event-${esc(id)}">${esc(eventById(id)?.name || id)}</a>` : actChip('D'));
  function activityRoi(range) {
    const cost = DATA.settings.staffCost;
    return ACTIVITIES.map((a) => {
      const t = sum(countsFor((c) => creditActivity(c.credit) === a.id && monthInRange(c.month, range)));
      const tt = DATA.touches.filter((x) => partner(x.partner)?.activity === a.id && inRange(x.date, range));
      const ev = DATA.events.filter((e) => e.activity === a.id && days(e.date) <= 0 && inRange(e.date, range));
      const spend = tt.reduce((s, x) => s + x.cost + x.hours * cost, 0) + ev.reduce((s, e) => s + e.cost + e.hours * cost, 0);
      return { ...a, ...t, conv: t.converted, spend, touches: tt.length, events: ev.length, partners: DATA.partners.filter((p) => p.activity === a.id).length, active: DATA.partners.filter((p) => p.activity === a.id && p.status === 'Active referrer').length };
    });
  }
  function sourceStats(range) {
    return SOURCES.map((s) => ({ name: s, ...sum(countsFor((c) => c.source === s && monthInRange(c.month, range))) })).map((x) => ({ ...x, conv: x.converted }));
  }
  function scorecard() {
    const open = DATA.settings.openDate, openMonth = monthOf(open), since = (s) => Math.round((parse(s) - parse(open)) / DAY);
    const w = (max, a) => sum(countsFor((c) => creditActivity(c.credit) === a && c.month >= openMonth && since(c.month) <= max)).leads;
    const lead = partner('P-001');
    const a4 = DATA.events.filter((e) => e.activity === 'A4' && days(e.date) <= 0);
    const att = a4.reduce((s, e) => s + e.attendees, 0), sig = a4.reduce((s, e) => s + e.signups, 0);
    const msgs = DATA.touches.filter((t) => partner(t.partner)?.activity === 'A5' && t.by === 'Shari' && since(t.date) <= 30);
    const conv = DATA.touches.filter((t) => partner(t.partner)?.activity === 'A5' && ['Conversation held', 'Meeting scheduled', 'Referral agreed'].includes(t.outcome));
    const all = sum(DATA.counts);
    return [
      { a: 'A1', label: 'Lead partner at "Active referrer" within 60 days', target: 1, actual: lead?.status === 'Active referrer' ? 1 : 0, show: lead?.status || '–', unit: 'flag' },
      { a: 'A1', label: 'First referral from lead partner within 90 days', target: 1, actual: sum(countsFor((c) => c.credit === 'P-001' && since(c.month) <= 90)).leads },
      { a: 'A2', label: 'Spravato-specific referrals, first quarter', target: 3, actual: w(90, 'A2') },
      { a: 'A3', label: 'Referrals traced to education series, first 6 months', target: 2, actual: w(182, 'A3') },
      { a: 'A4', label: 'Community events held, months 1–3', target: 3, actual: a4.filter((e) => since(e.date) >= 0 && since(e.date) <= 91).length },
      { a: 'A4', label: 'Average attendees per community event', target: 10, actual: a4.length ? Math.round(att / a4.length) : 0 },
      { a: 'A4', label: 'Event waitlist signup rate', target: 0.2, actual: att ? sig / att : 0, unit: 'pct' },
      { a: 'A5', label: "Shari's personal messages, first 30 days", target: 10, actual: msgs.length },
      { a: 'A5', label: 'Conversations started with colleagues', target: 5, actual: conv.length },
      { a: 'A5', label: 'Physician-network referrals within 60 days', target: 2, actual: w(60, 'A5') },
      { a: 'D', label: 'Lead → consult rate', target: 0.4, actual: all.leads ? all.consults / all.leads : 0, unit: 'pct' },
    ];
  }

  /* ---------------- UI helpers ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const opts = (list, sel) => list.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}"${v === sel ? ' selected' : ''}>${esc(l)}</option>`; }).join('');
  const view = $('[data-view]');
  const ui = { state: 'ready', q: '', status: '', activity: '', via: '', pact: '', sort: 'next', dir: 1, range: 90, prange: 'all', month: new Date(TODAY.getFullYear(), TODAY.getMonth(), 1), pending: false, importRows: null };
  let lastFocus = null;

  const ICON = {
    today: '<path d="M4 12a8 8 0 1 0 16 0a8 8 0 1 0-16 0M12 8v4l3 2"/>',
    patients: '<path d="M12 11a3.5 3.5 0 1 0 0-7a3.5 3.5 0 0 0 0 7zM5 20a7 7 0 0 1 14 0"/>',
    partners: '<path d="M8 11a3 3 0 1 0 0-6a3 3 0 0 0 0 6zM2.5 19a5.5 5.5 0 0 1 11 0M16 11a2.5 2.5 0 1 0 0-5M15 14.5a5 5 0 0 1 6.5 4.5"/>',
    pipeline: '<path d="M4 5h4v14H4zM10 5h4v9h-4zM16 5h4v6h-4z"/>',
    events: '<path d="M5 6h14v13H5zM5 10h14M9 4v4M15 4v4"/>',
    sources: '<path d="M4 19V9M10 19V5M16 19v-7M3 19h18"/>',
    calendar: '<path d="M5 6h14v13H5zM5 10h14M9 14h2M13 14h2M9 17h2"/>',
    settings: '<path d="M12 15a3 3 0 1 0 0-6a3 3 0 0 0 0 6zM19 12l2-1-1-3-2 .3-1.4-1.4.3-2-3-1-1 2h-2l-1-2-3 1 .3 2L5 8.3 3 8 2 11l2 1v0l-2 1 1 3 2-.3 1.4 1.4-.3 2 3 1 1-2h2l1 2 3-1-.3-2 1.4-1.4 2 .3 1-3z"/>',
  };
  const PAGES = [
    { id: 'today', name: 'Today', icon: 'today' },
    { id: 'partners', name: 'Partners', long: 'Referral partners', icon: 'partners' },
    { id: 'patients', name: 'Patients', long: 'Patient leads', icon: 'patients' },
    { id: 'pipeline', name: 'Pipeline', icon: 'pipeline' },
    { id: 'events', name: 'Events', long: 'Events & education', icon: 'events' },
    { id: 'sources', name: 'ROI', long: 'Sources & ROI', icon: 'sources' },
    { id: 'calendar', name: 'Calendar', icon: 'calendar' },
    { id: 'setup', name: 'Settings', icon: 'settings' },
  ];
  $('[data-nav]').innerHTML = PAGES.map((p) => `<a href="#${p.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[p.icon]}</svg><span>${esc(p.name)}${p.long ? `<span class="sr lbl-long"> (${esc(p.long)})</span>` : ''}</span></a>`).join('');

  function toast(msg) { const t = $('[data-toast]'); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 3200); }
  const fail = (err, what) => { console.warn(what, err); toast(`Couldn't ${what}. Check your connection and try again.`); };
  function withState(items, empty, render) {
    if (ui.state === 'loading') return '<div aria-busy="true" aria-label="Loading">' + '<div class="skel"></div>'.repeat(4) + '</div>';
    if (ui.state === 'error') return `<div class="state" role="alert"><p>We couldn't load this. Check your connection, then try again.</p><button class="btn" data-act="retry">Try again</button></div>`;
    if (ui.state === 'empty' || !items.length) return `<div class="state"><p>${esc(empty.msg)}</p>${empty.btn ? `<button class="btn primary" data-act="${empty.act}">${esc(empty.btn)}</button>` : ''}</div>`;
    return render(items);
  }
  const statusChip = (s) => `<span class="chip ${{ 'Active referrer': 'success', 'Referral made': 'accent', 'Meeting scheduled': 'info', 'Sent materials': 'warning', 'Not a fit': '' }[s] || ''}">${esc(s)}</span>`;
  const actChip = (id) => `<span class="chip"><i class="dot" style="background:${act(id).color}"></i>${esc(act(id).name)}</span>`;
  const dueChip = (p) => !p.next ? '<span class="muted">–</span>' : `<span class="chip ${overdue(p) ? 'danger' : days(p.next) === 0 ? 'warning' : ''}">${esc(rel(p.next))}</span>`;
  const monthRows = (rows, empty) => withState(rows, { msg: empty }, (items) => `<table class="cards"><thead><tr><th>Month</th><th class="right">Leads</th><th class="right">Consults</th><th class="right">Converted</th></tr></thead><tbody>${items.map((r) => `<tr><td>${esc(fmtMonth(r.month, true))}</td><td class="right num" data-label="Leads">${r.leads}</td><td class="right num" data-label="Consults">${r.consults}</td><td class="right num" data-label="Converted">${r.converted}</td></tr>`).join('')}</tbody></table>`);

  /* ---------------- Pages ---------------- */
  const pages = {
    today() {
      const tm = sum(countsFor((c) => c.month === THIS_MONTH)), lm = sum(countsFor((c) => c.month === LAST_MONTH));
      const all = sum(DATA.counts), cr = all.leads ? all.consults / all.leads : 0;
      const df = sum(countsFor((c) => c.month === THIS_MONTH && c.via === CHANNELS[0]));
      const active = DATA.partners.filter((p) => p.status === 'Active referrer').length;
      const late = DATA.partners.filter(overdue);
      const attention = DATA.partners.filter((p) => p.next && days(p.next) <= 2 && p.status !== 'Not a fit').sort((a, b) => a.next.localeCompare(b.next));
      const src = sourceStats(90).filter((s) => s.leads).sort((a, b) => b.leads - a.leads), max = Math.max(1, ...src.map((s) => s.leads));
      const sc = scorecard(), met = sc.filter(isMet).length;
      const upcoming = DATA.events.filter((e) => days(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
      const delta = tm.leads - lm.leads, soon = attention.length - late.length;
      const who = LIVE ? (me?.name || session?.user?.email || '').split(/[ @]/)[0] : 'Kim';
      return `<section class="card welcome"><div><h2>${greeting()}${who ? ', ' + esc(who) : ''}</h2><p>${late.length ? `${plural(late.length, 'follow-up')} overdue and ${soon} due in the next two days.` : soon ? `No follow-ups are overdue. ${soon} due in the next two days.` : 'No follow-ups are overdue.'} ${met} of ${sc.length} playbook targets are met so far.</p>
          <a class="btn" href="#partners">Open follow-ups</a></div>${torusSvg()}</section>
        <section class="kpis" aria-label="Key numbers">
          ${kpi('New patient leads, this month', tm.leads, `${delta >= 0 ? '+' : ''}${delta} vs. ${fmtMonth(LAST_MONTH)}`, delta >= 0 ? 'good' : 'bad')}
          ${kpi('Lead → consult rate', all.leads ? pct(cr) : '–', !all.leads ? 'No leads recorded yet' : cr >= 0.4 ? 'At or above the 40% target' : 'Below the 40% target', all.leads ? (cr >= 0.4 ? 'good' : 'bad') : '')}
          ${kpi('Active referrers', active, `of ${DATA.partners.filter((p) => p.status !== 'Not a fit').length} partners in play`)}
          ${kpi('Follow-ups overdue', late.length, late.length ? 'Clear these first' : 'All caught up', late.length ? 'bad' : 'good')}
          ${kpi('Discovery form, this month', df.leads, `${df.consults} became consults`)}
        </section>
        <div class="bento">
          <section class="card span-7"><div class="card-head"><h2>Needs attention</h2><a href="#partners">All partners</a></div>
            <div class="rows">${withState(attention, { msg: DATA.partners.length ? 'Nothing is due in the next two days.' : 'No referral partners yet. Add the first one.', btn: 'Add a partner', act: 'add-partner' }, (items) => items.map((p) => `<a class="row" href="#partner-${esc(p.id)}"><span><span class="row-title">${esc(p.nextStep || 'Follow up')}</span><small>${esc(p.contact)} · ${esc(p.org)}${p.owner ? ' · ' + esc(p.owner) : ''}</small></span>${dueChip(p)}</a>`).join(''))}</div></section>
          <section class="card span-5"><div class="card-head"><h2>Where new patients came from</h2><span class="muted">Last 3 months · leads</span></div>
            ${withState(src, { msg: 'No patient leads recorded in the last 3 months. Import the IntakeQ export on the Patients page.', btn: 'Import IntakeQ export', act: 'import' }, (items) => `<div class="bars" role="list">${items.map((s) => `<div class="bar-row" role="listitem"><span>${esc(s.name)}</span><div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width:${(s.leads / max) * 100}%;background:var(--chart-1)"></div></div><span class="num">${s.leads} <span class="muted">· ${s.conv} converted</span></span></div>`).join('')}</div>`)}</section>
          <section class="card span-7"><div class="card-head"><h2>Playbook scorecard</h2><a href="#sources">Sources & ROI</a></div>${withState(sc, { msg: 'Set the opening date in Settings to start the scorecard.' }, (items) => items.slice(0, 6).map(scoreRow).join('') + `<p class="muted" style="margin-top:var(--space-3)">Counting from opening on ${esc(fmt(DATA.settings.openDate, { month: 'long', day: 'numeric', year: 'numeric' }))}. <a href="#sources">See all ${items.length}</a></p>`)}</section>
          <section class="card span-5"><div class="card-head"><h2>Coming up</h2><a href="#calendar">Calendar</a></div>
            <div class="rows">${withState(upcoming, { msg: 'No events scheduled.', btn: 'Plan an event', act: 'add-event' }, (items) => items.map((e) => `<a class="row" href="#event-${esc(e.id)}"><span><span class="row-title">${esc(e.name)}</span><small>${esc(e.type || '')} · ${esc(e.format)}${e.venue ? ' · ' + esc(partner(e.venue)?.org) : ''}</small></span><span class="chip">${esc(rel(e.date))}</span></a>`).join(''))}</div></section>
        </div>`;
    },

    partners() {
      const q = ui.q.toLowerCase();
      const key = { contact: (p) => p.contact, org: (p) => p.org, status: (p) => STAGES.indexOf(p.status), next: (p) => p.next || '9999', referred: (p) => creditTotals(p.id).leads, last: (p) => lastReferral(p.id) };
      const rows = DATA.partners.filter((p) => [p.contact, p.org, p.spec, p.city].join(' ').toLowerCase().includes(q) && (!ui.status || p.status === ui.status) && (!ui.activity || p.activity === ui.activity))
        .sort((a, b) => (key[ui.sort](a) > key[ui.sort](b) ? 1 : -1) * ui.dir);
      const th = (k, label, cls = '') => `<th class="${cls}" aria-sort="${ui.sort === k ? (ui.dir > 0 ? 'ascending' : 'descending') : 'none'}"><button data-sort="${k}">${label}</button></th>`;
      const filtered = ui.q || ui.status || ui.activity;
      return `<div class="toolbar"><input class="field search" type="search" placeholder="Search name, practice, specialty, city" aria-label="Search partners" value="${esc(ui.q)}" data-q>
          <select class="field" aria-label="Filter by status" data-filter="status"><option value="">All statuses</option>${opts(ALL_STATUS, ui.status)}</select>
          <select class="field" aria-label="Filter by BD activity" data-filter="activity"><option value="">All activities</option>${opts(ACTIVITIES.slice(0, 5).map((a) => [a.id, a.long]), ui.activity)}</select></div>
        <div class="card table-wrap">${withState(rows, { msg: filtered ? 'No partners match these filters. Clear them to see everyone.' : 'No referral partners yet. Add the first one from the playbook.', btn: filtered ? 'Clear filters' : 'Add a partner', act: filtered ? 'clear' : 'add-partner' },
          (items) => `<table class="cards"><thead><tr>${th('contact', 'Partner')}${th('org', 'Practice / organization')}<th>Activity</th>${th('status', 'Status')}${th('next', 'Next follow-up')}${th('referred', 'Referred', 'right')}${th('last', 'Last referral')}</tr></thead><tbody>
          ${items.map((p) => { const lr = lastReferral(p.id); return `<tr data-href="#partner-${esc(p.id)}" tabindex="0"><td><a class="person" href="#partner-${esc(p.id)}" tabindex="-1" style="text-decoration:none;color:inherit"><b>${esc(p.contact)}</b><small>${esc(p.spec)}</small></a></td><td data-label="Practice">${esc(p.org)}<br><small class="muted">${esc(p.city)}</small></td><td>${actChip(p.activity)}</td><td>${statusChip(p.status)}</td><td data-label="Next">${dueChip(p)}</td><td class="right num" data-label="Referred">${creditTotals(p.id).leads}</td><td data-label="Last referral">${lr ? esc(fmtMonth(lr)) : '<span class="muted">–</span>'}</td></tr>`; }).join('')}</tbody></table>`)}</div>
        <p class="muted">${rows.length} of ${DATA.partners.length} partners</p>`;
    },

    partner(id) {
      const p = partner(id);
      if (!p) return `<div class="card state"><p>That partner isn't in the list. It may have been removed.</p><a class="btn" href="#partners">Back to partners</a></div>`;
      const t = touchesOf(id), tot = creditTotals(id), lr = lastReferral(id);
      return `<div class="bento">
        <section class="card span-8"><div class="detail-head"><div><div class="top-actions">${statusChip(p.status)}${actChip(p.activity)}<span class="chip">${esc(p.type)}</span></div>
          <dl class="facts"><div><dt>Practice</dt><dd>${esc(p.org)}</dd></div><div><dt>Specialty</dt><dd>${esc(p.spec || '–')}</dd></div><div><dt>City</dt><dd>${esc(p.city || '–')}</dd></div><div><dt>Phone</dt><dd class="num">${esc(p.phone || '–')}</dd></div><div><dt>Owner</dt><dd>${esc(p.owner || '–')}</dd></div><div><dt>Patients referred</dt><dd class="num">${tot.leads} · ${tot.converted} converted</dd></div><div><dt>Last referral</dt><dd>${lr ? esc(fmtMonth(lr, true)) : 'None yet'}</dd></div>${p.metAt ? `<div><dt>First met at</dt><dd><a href="#event-${esc(p.metAt)}">${esc(eventById(p.metAt)?.name || p.metAt)}</a></dd></div>` : ''}</dl></div></div>
          <label class="field-label" style="margin-top:var(--space-5);max-width:320px">Move to stage<select class="field" data-move="${esc(p.id)}">${opts(ALL_STATUS, p.status)}</select></label></section>
        <section class="card next span-4"><h2>Next step</h2><p style="margin:var(--space-2) 0 var(--space-3)">${esc(p.nextStep || 'No next step set')}</p>${dueChip(p)}
          <div class="top-actions" style="margin-top:var(--space-4)"><button class="btn primary" data-act="log" data-id="${esc(p.id)}">Log a touch</button></div></section>
        <section class="card span-7"><div class="card-head"><h2>Touch history</h2><span class="muted">${plural(t.length, 'touch').replace('touchs', 'touches')}</span></div>
          ${withState(t, { msg: 'No touches logged yet. Log the first outreach.', btn: 'Log a touch', act: 'log' }, (items) => `<ol class="timeline">${items.map((x) => `<li><time datetime="${esc(x.date)}">${esc(fmt(x.date))}</time><div><b>${esc(x.outcome)}</b> <span class="muted">· ${esc(x.method)} by ${esc(x.by)}</span><br>${esc(x.note)}</div></li>`).join('')}</ol>`)}</section>
        <section class="card span-5 table-wrap" style="padding:0"><div class="card-head" style="padding:var(--space-5) var(--space-5) 0"><h2>Patients referred</h2><span class="muted">Monthly counts</span></div>
          ${monthRows(byMonth(countsFor((c) => c.credit === id)), 'No referrals credited to this partner yet.')}</section>
      </div>`;
    },

    patients() {
      const r = ui.prange, rows = countsFor((c) => monthInRange(c.month, r));
      const df = sum(countsFor((c) => c.via === CHANNELS[0])), dfm = sum(countsFor((c) => c.via === CHANNELS[0] && c.month === THIS_MONTH));
      const allm = sum(countsFor((c) => c.month === THIS_MONTH)), all = sum(DATA.counts);
      const ch = CHANNELS.map((c) => ({ c, ...sum(rows.filter((x) => x.via === c)) }));
      const detail = rows.filter((c) => (!ui.via || c.via === ui.via) && (!ui.pact || creditActivity(c.credit) === ui.pact)).sort((a, b) => b.month.localeCompare(a.month) || b.leads - a.leads);
      const seg = `<div class="seg" role="group" aria-label="Time range">${[[1, 'This month'], [92, 'Last 3 months'], ['all', 'All time']].map(([v, l]) => `<button data-prange="${v}" aria-pressed="${String(ui.prange) === String(v)}">${l}</button>`).join('')}</div>`;
      const filtered = ui.via || ui.pact;
      return `<section class="kpis" aria-label="Discovery form">${kpi('Discovery form, this month', dfm.leads, `${dfm.consults} became consults`)}${kpi('Discovery form, all time', df.leads, all.leads ? `${pct(df.leads / all.leads)} of all patient leads` : 'No leads yet')}${kpi('Discovery → consult', df.leads ? pct(df.consults / df.leads) : '–', plural(df.consults, 'consult') + ' booked')}${kpi('All patient leads, this month', allm.leads, `${all.leads} all time`)}${kpi('Converted to a package', all.converted, money(all.revenue) + ' revenue')}</section>
        <div class="toolbar">${seg}<span class="muted">Counts only. Patient details stay in IntakeQ.</span></div>
        <section class="card table-wrap" style="padding:0"><div class="card-head" style="padding:var(--space-5) var(--space-5) 0"><h2>How patients came in</h2><span class="muted">The source columns say what drove them</span></div>
          ${withState(ch.filter((x) => x.leads), { msg: 'No patient leads recorded for this period. Import the IntakeQ export or add counts.', btn: 'Import IntakeQ export', act: 'import' }, (items) => `<table class="cards"><thead><tr><th>Came in via</th><th class="right">Leads</th><th class="right">Consults</th><th class="right">Converted</th><th class="right">Lead → consult</th></tr></thead><tbody>${items.map((x) => `<tr><td>${x.c === CHANNELS[0] ? `<b>${esc(x.c)}</b>` : esc(x.c)}</td><td class="right num" data-label="Leads">${x.leads}</td><td class="right num" data-label="Consults">${x.consults}</td><td class="right num" data-label="Converted">${x.converted}</td><td class="right num" data-label="Lead → consult">${x.leads ? pct(x.consults / x.leads) : '–'}</td></tr>`).join('')}</tbody></table>`)}</section>
        <section class="card table-wrap" style="padding:0"><div class="card-head" style="padding:var(--space-5) var(--space-5) 0"><h2>By month</h2></div>${monthRows(byMonth(rows), 'No months recorded yet.')}</section>
        <div class="toolbar"><select class="field" aria-label="Filter by how they came in" data-filter="via"><option value="">Every channel</option>${opts(CHANNELS, ui.via)}</select>
          <select class="field" aria-label="Filter by activity" data-filter="pact"><option value="">Every activity</option>${opts(ACTIVITIES.map((x) => [x.id, x.long]), ui.pact)}</select></div>
        <div class="card table-wrap">${withState(detail, { msg: filtered ? 'No counts match these filters.' : 'No patient leads yet. Import the IntakeQ export or add counts by hand.', btn: filtered ? 'Clear filters' : 'Add counts', act: filtered ? 'clear' : 'add-counts' }, (items) => `<table class="cards"><thead><tr><th>Month</th><th>Came in via</th><th>Source</th><th>Credited to</th><th class="right">Leads</th><th class="right">Consults</th><th class="right">Converted</th><th class="right">Revenue</th><th><span class="sr">Actions</span></th></tr></thead><tbody>
          ${items.map((c) => `<tr><td>${esc(fmtMonth(c.month))}</td><td data-label="Came in via">${esc(c.via)}</td><td data-label="Source">${esc(c.source)}</td><td data-label="Credited to">${creditLink(c.credit)}</td><td class="right num" data-label="Leads">${c.leads}</td><td class="right num" data-label="Consults">${c.consults}</td><td class="right num" data-label="Converted">${c.converted}</td><td class="right num" data-label="Revenue">${money(c.revenue)}</td><td class="right"><button class="btn small" data-act="edit-counts" data-id="${esc(c.id)}">Edit</button></td></tr>`).join('')}</tbody></table>`)}</div>`;
    },

    pipeline() {
      return `<p class="muted">Drag a card to a new column, or use "Move to". Partners marked "Not a fit" are hidden here.</p>
        <div class="board" data-board>${STAGES.map((s) => { const items = DATA.partners.filter((p) => p.status === s);
        return `<section class="col" data-col="${esc(s)}" aria-label="${esc(s)}"><h2><span>${esc(s)}</span><span class="num">${items.length}</span></h2>
          ${items.map((p) => `<article class="tile" draggable="true" data-drag="${esc(p.id)}"><a href="#partner-${esc(p.id)}">${esc(p.contact)}</a><small>${esc(p.org)}</small>
            <div class="top-actions">${actChip(p.activity)}${p.next ? dueChip(p) : ''}</div>
            <label class="field-label">Move to<select class="field" data-move="${esc(p.id)}">${opts(ALL_STATUS, s)}</select></label></article>`).join('') || '<p class="muted" style="padding:var(--space-2)">Nobody at this stage yet.</p>'}</section>`; }).join('')}</div>`;
    },

    events() {
      const rows = [...DATA.events].sort((a, b) => b.date.localeCompare(a.date));
      return `<div class="card table-wrap">${withState(rows, { msg: 'No events yet. Plan the first community event or lunch-and-learn.', btn: 'Plan an event', act: 'add-event' }, (items) => `<table class="cards"><thead><tr><th>Event</th><th>Date</th><th>Activity</th><th class="right">Attendees</th><th class="right">Signup rate</th><th class="right">Contacts made</th><th class="right">Patient leads</th><th class="right">Revenue</th></tr></thead><tbody>
        ${items.map((e) => { const t = creditTotals(e.id), past = days(e.date) <= 0; return `<tr data-href="#event-${esc(e.id)}" tabindex="0"><td><b>${esc(e.name)}</b><br><small class="muted">${esc(e.type || '')} · ${esc(e.format)}${e.venue ? ' · ' + esc(partner(e.venue)?.org) : ''}</small></td><td data-label="Date">${past ? esc(fmt(e.date)) : `<span class="chip info">${esc(rel(e.date))}</span>`}</td><td>${actChip(e.activity)}</td><td class="right num" data-label="Attendees">${past ? e.attendees : '–'}</td><td class="right num" data-label="Signup rate">${past && e.attendees ? pct(e.signups / e.attendees) : '–'}</td><td class="right num" data-label="Contacts made">${metAtEvent(e.id).length}</td><td class="right num" data-label="Patient leads">${t.leads}</td><td class="right num" data-label="Revenue">${money(t.revenue)}</td></tr>`; }).join('')}</tbody></table>`)}</div>`;
    },

    event(id) {
      const e = eventById(id);
      if (!e) return `<div class="card state"><p>That event isn't in the list.</p><a class="btn" href="#events">Back to events</a></div>`;
      const t = creditTotals(id), past = days(e.date) <= 0, met = metAtEvent(id);
      const spend = e.cost + e.hours * DATA.settings.staffCost;
      const target = e.activity === 'A4' && past ? (e.attendees >= 10 && e.signups / (e.attendees || 1) >= 0.2 ? '<span class="chip success">Met the event targets</span>' : '<span class="chip warning">Below the event targets</span>') : '';
      return `<section class="kpis" aria-label="Event results">${kpi('Attendees', past ? e.attendees : '–', past ? 'Target 10+' : 'Not held yet')}${kpi('Waitlist signups', past ? e.signups : '–', past && e.attendees ? pct(e.signups / e.attendees) + ' of attendees' : '')}${kpi('Professional contacts', met.length, 'first met here')}${kpi('Patient leads', t.leads, `${plural(t.consults, 'consult')} · ${t.converted} converted`)}${kpi('Revenue vs. cost', money(t.revenue), `${money(spend)} spent${spend ? ' · ' + (t.revenue / spend).toFixed(1) + '× return' : ''}`)}</section>
        <div class="bento"><section class="card span-7"><div class="card-head"><h2>Details</h2>${target}</div><dl class="facts"><div><dt>Type</dt><dd>${esc(e.type || '–')}</dd></div><div><dt>Date</dt><dd>${esc(fmt(e.date, { weekday: 'long', month: 'long', day: 'numeric' }))}</dd></div><div><dt>Format</dt><dd>${esc(e.format)}</dd></div><div><dt>Venue</dt><dd>${e.venue ? `<a href="#partner-${esc(e.venue)}">${esc(partner(e.venue)?.org)}</a>` : 'Torus / online'}</dd></div><div><dt>Activity</dt><dd>${actChip(e.activity)}</dd></div></dl>
          <div class="top-actions" style="margin-top:var(--space-5)"><button class="btn" data-act="edit-event" data-id="${esc(e.id)}">Update results</button></div></section>
        <section class="card span-5"><div class="card-head"><h2>Professional contacts made</h2><span class="muted">${met.length}</span></div><div class="rows">${withState(met, { msg: past ? 'No provider contacts linked to this event. Set "First met at" on a partner to link one.' : 'Contacts appear here after the event.' }, (items) => items.map((p) => `<a class="row" href="#partner-${esc(p.id)}"><span><span class="row-title">${esc(p.contact)}</span><small>${esc(p.org)}</small></span>${statusChip(p.status)}</a>`).join(''))}</div></section>
        <section class="card span-12 table-wrap" style="padding:0"><div class="card-head" style="padding:var(--space-5) var(--space-5) 0"><h2>Patient leads from this event</h2><span class="muted">Monthly counts</span></div>${monthRows(byMonth(countsFor((c) => c.credit === id)), past ? 'No patient leads credited to this event yet.' : 'Leads appear here after the event.')}</section></div>`;
    },

    sources() {
      const r = ui.range, roi = activityRoi(r), src = sourceStats(r), maxRev = Math.max(1, ...roi.map((a) => Math.max(a.revenue, a.spend))), sc = scorecard();
      const seg = `<div class="seg" role="group" aria-label="Time range">${[[30, '30 days'], [90, '90 days'], ['all', 'All time']].map(([v, l]) => `<button data-range="${v}" aria-pressed="${String(ui.range) === String(v)}">${l}</button>`).join('')}</div>`;
      return `<div class="toolbar">${seg}<span class="muted">Leads count by month. Revenue counts packages only; Spravato is billed to insurance and shows $0.</span></div>
        <div class="bento">
        <section class="card span-7"><div class="card-head"><h2>Revenue vs. cost by BD activity</h2></div><div class="bars">${roi.map((a) => `<div class="bar-row wide"><span><i class="dot" style="background:${a.color}"></i> ${esc(a.name)}</span><div><div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width:${(a.revenue / maxRev) * 100}%;background:${a.color}"></div></div><div class="bar-track" aria-hidden="true" style="height:6px;margin-top:4px"><div class="bar-fill" style="width:${(a.spend / maxRev) * 100}%;background:var(--border-strong)"></div></div></div><span class="num">${money(a.revenue)} <span class="muted">/ ${money(a.spend)}</span></span></div>`).join('')}</div><div class="legend"><span><i class="dot" style="background:var(--chart-1)"></i>Revenue (thick)</span><span><i class="dot" style="background:var(--border-strong)"></i>Cost: cash + hours × ${money(DATA.settings.staffCost)}/hr (thin)</span></div></section>
        <section class="card span-5"><div class="card-head"><h2>Playbook scorecard</h2><span class="muted">From opening</span></div>${sc.map(scoreRow).join('')}</section>
        <section class="card span-12 table-wrap" style="padding:0"><div class="card-head" style="padding:var(--space-5) var(--space-5) 0"><h2>By BD activity</h2></div><table class="cards"><thead><tr><th>Activity</th><th class="right">Partners</th><th class="right">Active</th><th class="right">Touches</th><th class="right">Events</th><th class="right">Leads</th><th class="right">Consults</th><th class="right">Converted</th><th class="right">Revenue ÷ cost</th></tr></thead><tbody>${roi.map((a) => `<tr><td><i class="dot" style="background:${a.color}"></i> ${esc(a.long)}</td><td class="right num" data-label="Partners">${a.partners}</td><td class="right num" data-label="Active">${a.active}</td><td class="right num" data-label="Touches">${a.touches}</td><td class="right num" data-label="Events">${a.events}</td><td class="right num" data-label="Leads">${a.leads}</td><td class="right num" data-label="Consults">${a.consults}</td><td class="right num" data-label="Converted">${a.conv}</td><td class="right num" data-label="Return">${a.spend ? (a.revenue / a.spend).toFixed(1).replace(/\.0$/, '') + '×' : '–'}</td></tr>`).join('')}</tbody></table></section>
        <section class="card span-12 table-wrap" style="padding:0"><div class="card-head" style="padding:var(--space-5) var(--space-5) 0"><h2>By referral source</h2><span class="muted">Matches the IntakeQ "How did you hear about us?" field</span></div><table class="cards"><thead><tr><th>Source</th><th class="right">Leads</th><th class="right">Consults</th><th class="right">Converted</th><th class="right">Conversion</th><th class="right">Revenue</th></tr></thead><tbody>${src.map((s) => `<tr><td>${esc(s.name)}</td><td class="right num" data-label="Leads">${s.leads}</td><td class="right num" data-label="Consults">${s.consults}</td><td class="right num" data-label="Converted">${s.conv}</td><td class="right num" data-label="Conversion">${s.leads ? pct(s.conv / s.leads) : '–'}</td><td class="right num" data-label="Revenue">${money(s.revenue)}</td></tr>`).join('')}</tbody></table></section>
        </div>`;
    },

    calendar() {
      const m = ui.month, start = new Date(m.getFullYear(), m.getMonth(), 1 - m.getDay());
      const items = [...DATA.partners.filter((p) => p.next && p.status !== 'Not a fit').map((p) => ({ date: p.next, kind: 'follow', late: overdue(p), label: p.contact, sub: p.nextStep, href: `#partner-${p.id}` })),
        ...DATA.events.map((e) => ({ date: e.date, kind: 'event', label: e.name, sub: `${e.type || ''} · ${e.format}`, href: `#event-${e.id}` }))];
      const cells = Array.from({ length: 42 }, (_, i) => { const dt = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i); const k = iso(dt); return { dt, k, items: items.filter((x) => x.date === k) }; });
      const monthItems = items.filter((x) => parse(x.date).getMonth() === m.getMonth() && parse(x.date).getFullYear() === m.getFullYear()).sort((a, b) => a.date.localeCompare(b.date));
      return `<div class="toolbar"><button class="btn small" data-month="-1" aria-label="Previous month">‹ Previous</button><h2 style="min-width:180px;text-align:center">${m.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2><button class="btn small" data-month="1" aria-label="Next month">Next ›</button><button class="btn small" data-month="0">This month</button>
          <span class="legend" style="margin:0"><span><i class="dot" style="background:var(--accent)"></i>Follow-up</span><span><i class="dot" style="background:var(--danger)"></i>Overdue</span><span><i class="dot" style="background:var(--torus-solar-resin)"></i>Event</span></span></div>
        <div class="cal" role="grid" aria-label="Month">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((x) => `<div class="dow" role="columnheader">${x}</div>`).join('')}
          ${cells.map((c) => `<div class="day${c.dt.getMonth() !== m.getMonth() ? ' out' : ''}${c.k === iso(TODAY) ? ' today' : ''}" role="gridcell"><span class="d">${c.dt.getDate()}</span>${c.items.slice(0, 3).map((x) => `<a class="ev ${x.kind}${x.late ? ' late' : ''}" href="${esc(x.href)}" title="${esc(x.label)}">${esc(x.label)}</a>`).join('')}${c.items.length > 3 ? `<small class="muted">+${c.items.length - 3} more</small>` : ''}</div>`).join('')}</div>
        <section class="card agenda"><div class="rows">${withState(monthItems, { msg: 'Nothing scheduled this month.' }, (its) => its.map((x) => `<a class="row" href="${esc(x.href)}"><span><span class="row-title">${esc(x.label)}</span><small>${esc(x.sub)}</small></span><span class="chip ${x.late ? 'danger' : x.kind === 'event' ? 'warning' : ''}">${esc(fmt(x.date, { weekday: 'short', month: 'short', day: 'numeric' }))}</span></a>`).join(''))}</div></section>`;
    },

    setup() {
      const isAdmin = !LIVE || me?.role === 'admin';
      return `<div class="bento">
        <section class="card span-6"><h2>Practice settings</h2><p class="muted" style="margin:var(--space-1) 0 var(--space-4)">These drive the playbook's 30/60/90-day targets and the cost side of the return figures.</p>
          <form class="grid" data-form="settings" novalidate>
            <label class="field-label">Practice opening date<input class="field" type="date" name="openDate" value="${esc(DATA.settings.openDate)}" required></label>
            <label class="field-label">Staff time cost (dollars per hour)<input class="field" type="number" min="0" step="5" name="staffCost" value="${DATA.settings.staffCost}" required aria-describedby="err-staffCost"><span class="err" id="err-staffCost" role="alert"></span></label>
            <div><button class="btn primary">Save settings</button></div></form></section>
        <section class="card span-6"><h2>Data connection</h2>
          ${LIVE ? `<p style="margin:var(--space-2) 0"><span class="chip success">Live</span> Saved to the Torus database. Changes appear on every open screen.</p><p class="muted">Signed in as ${esc(session?.user?.email)}${me ? ` · ${esc(me.role)}` : ''}.</p>`
            : `<p style="margin:var(--space-2) 0"><span class="chip warning">Demo</span> Sample data only. Changes last until you close the page.</p><p class="muted">To go live, add the Supabase URL and anon key to Vercel. The steps are in docs/SETUP.md in the repo.</p>`}
          <p class="muted" style="margin-top:var(--space-3)">Patient leads are stored as monthly counts only. Patient details stay in IntakeQ.</p></section>
        <section class="card span-6"><h2>Team</h2><p class="muted" style="margin:var(--space-1) 0 var(--space-4)">Only these emails can sign in and see Torus data.${isAdmin ? '' : ' Ask an admin to add someone.'}</p>
          <div class="rows">${withState(DATA.team, { msg: LIVE ? 'No team members yet.' : 'The team list appears here once the database is connected.' }, (items) => items.map((m) => `<div class="row" style="cursor:default"><span><span class="row-title">${esc(m.name || m.email)}</span><small>${esc(m.email)} · ${esc(m.role)}</small></span>${isAdmin && LIVE && m.email !== session?.user?.email ? `<button class="btn small" data-act="remove-member" data-id="${esc(m.email)}">Remove ${esc(m.name || m.email)}</button>` : ''}</div>`).join(''))}</div>
          ${LIVE && isAdmin ? `<form class="form-grid" data-form="member" novalidate style="margin-top:var(--space-4)"><label class="field-label">Email<input class="field" type="email" name="email" required aria-describedby="err-email"><span class="err" id="err-email" role="alert"></span></label><label class="field-label">Name<input class="field" name="name"></label><label class="field-label">Role<select class="field" name="role">${opts([['member', 'Member'], ['admin', 'Admin']])}</select></label><div class="full"><button class="btn primary">Add team member</button></div></form>` : ''}</section>
        <section class="card span-6"><h2>Dropdown lists</h2><p class="muted" style="margin:var(--space-1) 0 var(--space-4)">Same wording as the playbook and the IntakeQ form. Keep the referral sources identical to the form.</p>
          <dl class="facts" style="margin:0"><div><dt>Pipeline stages</dt><dd>${STAGES.map(esc).join(' → ')}</dd></div><div><dt>Referral sources</dt><dd>${SOURCES.map(esc).join(', ')}</dd></div><div><dt>Came in via</dt><dd>${CHANNELS.map(esc).join(', ')}</dd></div><div><dt>Packages (placeholder prices)</dt><dd>${Object.entries(PACKAGES).filter(([k]) => k !== 'None yet').map(([k, v]) => `${esc(k)} ${v ? money(v) : '(insurance)'}`).join(', ')}</dd></div></dl></section>
        <section class="card span-6"><h2>Preview a data state</h2><p class="muted" style="margin:var(--space-1) 0 var(--space-4)">For reviewing the design. Every list and chart can show each of these.</p>
          <label class="field-label">Data state<select class="field" data-state>${opts([['ready', 'Populated'], ['loading', 'Loading'], ['empty', 'Empty'], ['error', 'Error']], ui.state)}</select></label></section>
      </div>`;
    },
  };

  function isMet(s) { return s.actual >= s.target; }
  function scoreRow(s) {
    const show = s.unit === 'pct' ? pct(s.actual) : s.unit === 'flag' ? s.show : s.actual, tgt = s.unit === 'pct' ? pct(s.target) : s.unit === 'flag' ? 'Active referrer' : s.target;
    const w = Math.min(1, s.target ? s.actual / s.target : 0) * 100;
    return `<div class="score"><span>${esc(s.label)}<small>${esc(s.a === 'D' ? 'All sources' : act(s.a).name)} · target ${esc(tgt)}</small></span><span class="chip ${isMet(s) ? 'success' : ''}">${isMet(s) ? 'Met · ' : ''}${esc(show)}</span><div class="meter" aria-hidden="true"><i class="${isMet(s) ? 'met' : ''}" style="width:${w}%"></i></div></div>`;
  }
  function kpi(label, value, sub, tone = '') { return `<div class="card kpi"><span>${esc(label)}</span><b class="num">${esc(value)}</b><small class="${tone}">${esc(sub)}</small></div>`; }
  function greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }
  function torusSvg() { return `<svg class="torus" viewBox="0 0 220 130" aria-hidden="true">${Array.from({ length: 11 }, (_, i) => `<ellipse cx="110" cy="65" rx="${100 - i * 4}" ry="${18 + i * 4.2}" transform="rotate(${(i - 5) * 3} 110 65)"/>`).join('')}</svg>`; }

  /* ---------------- Drawers ---------------- */
  function openDrawer(html, wide = false) { lastFocus = document.activeElement; const p = $('[data-drawer-panel]'); p.classList.toggle('wide', wide); p.innerHTML = html; $('[data-drawer]').hidden = false; ($('[data-drawer-panel] input, [data-drawer-panel] select, [data-drawer-panel] textarea') || $('[data-drawer-panel] button')).focus(); }
  function closeDrawer() { $('[data-drawer]').hidden = true; ui.importRows = null; lastFocus?.focus?.(); if (ui.pending) { ui.pending = false; rerender(); } }
  const actions = `<div class="top-actions full">BUTTON<button type="button" class="btn" data-act="close">Cancel</button></div>`;
  const creditOptions = (sel) => `<option value="">No specific provider or event</option><optgroup label="Referral partners">${opts(DATA.partners.map((p) => [p.id, `${p.contact} · ${p.org}`]), sel)}</optgroup><optgroup label="Events">${opts(DATA.events.map((e) => [e.id, `${e.name} (${fmt(e.date)})`]), sel)}</optgroup>`;
  function partnerForm(p = {}) {
    openDrawer(`<h2 id="drawer-title">${p.id ? 'Edit ' + esc(p.contact) : 'Add a partner'}</h2>
      <form class="form-grid" data-form="partner" data-id="${esc(p.id || '')}" novalidate>
        <label class="field-label full">Contact name<input class="field" name="contact" value="${esc(p.contact)}" required aria-describedby="err-contact"><span class="err" id="err-contact" role="alert"></span></label>
        <label class="field-label full">Practice / organization<input class="field" name="org" value="${esc(p.org)}" required aria-describedby="err-org"><span class="err" id="err-org" role="alert"></span></label>
        <label class="field-label">Type<select class="field" name="type">${opts(TYPES, p.type)}</select></label>
        <label class="field-label">BD activity<select class="field" name="activity">${opts(ACTIVITIES.slice(0, 5).map((a) => [a.id, a.long]), p.activity)}</select></label>
        <label class="field-label">Specialty<input class="field" name="spec" value="${esc(p.spec)}"></label>
        <label class="field-label">City<input class="field" name="city" value="${esc(p.city)}"></label>
        <label class="field-label">Status<select class="field" name="status">${opts(ALL_STATUS, p.status || 'Cold')}</select></label>
        <label class="field-label">Owner<select class="field" name="owner">${opts(OWNERS, p.owner || 'Kim')}</select></label>
        <label class="field-label">Next follow-up<input class="field" type="date" name="next" value="${esc(p.id ? p.next : iso(d(3)))}"></label>
        <label class="field-label">Phone<input class="field" type="tel" name="phone" value="${esc(p.phone)}"></label>
        <label class="field-label full">Next step<input class="field" name="nextStep" value="${esc(p.nextStep)}" placeholder="e.g. Send intro letter"></label>
        <label class="field-label full">First met at (event)<select class="field" name="metAt"><option value="">Not met at an event</option>${opts(DATA.events.map((x) => [x.id, x.name]), p.metAt)}</select></label>
        ${actions.replace('BUTTON', `<button class="btn primary">${p.id ? 'Save changes' : 'Add partner'}</button>`)}</form>`);
  }
  function touchForm(id) {
    const p = partner(id);
    openDrawer(`<h2 id="drawer-title">Log a touch</h2><p class="muted">${esc(p.contact)} · ${esc(p.org)}</p>
      <form class="form-grid" data-form="touch" data-id="${esc(p.id)}" novalidate>
        <label class="field-label">Date<input class="field" type="date" name="date" value="${iso(TODAY)}" required></label>
        <label class="field-label">Method<select class="field" name="method">${opts(METHODS, 'Email')}</select></label>
        <label class="field-label">Done by<select class="field" name="by">${opts(OWNERS, p.owner)}</select></label>
        <label class="field-label">Outcome<select class="field" name="outcome">${opts(OUTCOMES, 'Replied')}</select></label>
        <label class="field-label full">What happened<textarea class="field" name="note" required aria-describedby="err-note" placeholder="One line, no patient details"></textarea><span class="err" id="err-note" role="alert"></span></label>
        <label class="field-label">Move to stage<select class="field" name="status">${opts(ALL_STATUS, p.status)}</select></label>
        <label class="field-label">Next follow-up<input class="field" type="date" name="next" value="${iso(d(7))}"></label>
        <label class="field-label full">Next step<input class="field" name="nextStep" value="${esc(p.nextStep)}"></label>
        <label class="field-label">Hours spent<input class="field" type="number" min="0" step="0.25" name="hours" value="0.5"></label>
        <label class="field-label">Cash cost ($)<input class="field" type="number" min="0" step="1" name="cost" value="0"></label>
        ${actions.replace('BUTTON', '<button class="btn primary">Save touch</button>')}</form>`);
  }
  function eventForm(e = {}) {
    openDrawer(`<h2 id="drawer-title">${e.id ? 'Update event results' : 'Plan an event'}</h2>
      <form class="form-grid" data-form="event" data-id="${esc(e.id || '')}" novalidate>
        <label class="field-label full">Event name<input class="field" name="name" value="${esc(e.name)}" required aria-describedby="err-name"><span class="err" id="err-name" role="alert"></span></label>
        <label class="field-label">Type<select class="field" name="type">${opts(EVENT_TYPES, e.type)}</select></label>
        <label class="field-label">Date<input class="field" type="date" name="date" value="${esc(e.date || iso(d(21)))}" required></label>
        <label class="field-label">BD activity<select class="field" name="activity">${opts([['A4', '4 · Community events'], ['A3', '3 · Provider education'], ['A1', '1 · Practice partnerships'], ['A2', '2 · Spravato insurance track'], ['A5', "5 · Shari's physician network"]], e.activity)}</select></label>
        <label class="field-label">Format<select class="field" name="format">${opts(['In-person', 'Virtual (Zoom)'], e.format)}</select></label>
        <label class="field-label full">Venue<select class="field" name="venue"><option value="">Torus / online</option>${opts(DATA.partners.filter((p) => p.type === 'Community venue').map((p) => [p.id, p.org]), e.venue)}</select></label>
        <label class="field-label">Attendees<input class="field" type="number" min="0" name="attendees" value="${e.attendees || 0}"></label>
        <label class="field-label">Waitlist signups<input class="field" type="number" min="0" name="signups" value="${e.signups || 0}" aria-describedby="err-signups"><span class="err" id="err-signups" role="alert"></span></label>
        <label class="field-label">Cash cost ($)<input class="field" type="number" min="0" name="cost" value="${e.cost || 0}"></label>
        <label class="field-label">Hours spent<input class="field" type="number" min="0" step="0.5" name="hours" value="${e.hours || 0}"></label>
        ${actions.replace('BUTTON', `<button class="btn primary">${e.id ? 'Save results' : 'Add event'}</button>`)}</form>`);
  }
  function countsForm(c = {}) {
    openDrawer(`<h2 id="drawer-title">${c.id ? 'Edit counts' : 'Add counts'}</h2><p class="muted">Totals for one month, channel, source and credit. No patient details.</p>
      <form class="form-grid" data-form="counts" data-id="${esc(c.id || '')}" novalidate>
        <label class="field-label">Month<input class="field" type="month" name="month" value="${esc((c.month || THIS_MONTH).slice(0, 7))}" required></label>
        <label class="field-label">Came in via<select class="field" name="via">${opts(CHANNELS, c.via)}</select></label>
        <label class="field-label">How they heard about us<select class="field" name="source">${opts(SOURCES, c.source)}</select></label>
        <label class="field-label">Credit to<select class="field" name="credit">${creditOptions(c.credit)}</select></label>
        <label class="field-label">Leads<input class="field" type="number" min="0" name="leads" value="${c.leads || 0}" aria-describedby="err-leads"><span class="err" id="err-leads" role="alert"></span></label>
        <label class="field-label">Consults booked<input class="field" type="number" min="0" name="consults" value="${c.consults || 0}"></label>
        <label class="field-label">Converted to a package<input class="field" type="number" min="0" name="converted" value="${c.converted || 0}"></label>
        <label class="field-label">Package revenue ($)<input class="field" type="number" min="0" name="revenue" value="${c.revenue || 0}"></label>
        <div class="top-actions full"><button class="btn primary">${c.id ? 'Save counts' : 'Add counts'}</button>${c.id ? `<button type="button" class="btn" data-act="delete-counts" data-id="${esc(c.id)}">Delete these counts</button>` : ''}<button type="button" class="btn" data-act="close">Cancel</button></div></form>`);
  }

  /* ---------------- IntakeQ import (summarised in the browser) ---------------- */
  function parseCSV(text) {
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
      else if (ch === '"') q = true; else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((c) => c.trim()));
  }
  const toISO = (v) => { const s = String(v || '').trim(); let m;
    if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/))) return `${m[3].length === 2 ? '20' + m[3] : m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
    const t = Date.parse(s); return isNaN(t) ? '' : iso(new Date(t)); };
  const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const matchList = (val, list, fallback) => { const v = norm(val); if (!v) return fallback; return list.find((x) => norm(x) === v) || list.find((x) => v.includes(norm(x)) || norm(x).includes(v)) || fallback; };
  const matchSource = (val) => { const v = norm(val); if (!v) return 'Other';
    const rules = [[/retreat/, 'Shari Retreats'], [/\b(shari|sheri)\b.*yoga|yoga.*\b(shari|sheri)\b/, 'Shari Yoga'], [/\bavonn?e?y\b/, 'Avonny'], [/refer|doctor|physician|provider|therapist/, 'Provider referral'], [/lunch|webinar|education/, 'Provider education event'], [/event|talk|tea|open house|circle|yoga|class/, 'Community event'], [/insta|facebook|social|tiktok|linkedin/, 'Social media'], [/google|search|online|web/, 'Google / organic search'], [/email|newsletter|flodesk/, 'Email (Flodesk)'], [/friend|family|word|mouth/, 'Word of mouth'], [/walk/, 'Direct walk-in']];
    return matchList(val, SOURCES, null) || (rules.find(([re]) => re.test(v)) || [null, 'Other'])[1]; };
  const matchCredit = (val) => { const v = norm(val); if (!v || v.length < 3) return '';
    const hit = DATA.partners.find((p) => [p.contact, p.org].some((x) => norm(x) && (v.includes(norm(x)) || norm(x).includes(v)))) || DATA.events.find((e) => norm(e.name) && (v.includes(norm(e.name)) || norm(e.name).includes(v)));
    return hit ? hit.id : ''; };
  function importForm() {
    openDrawer(`<h2 id="drawer-title">Import an IntakeQ export</h2>
      <p class="muted">Choose the CSV export (or paste it). The file is read on this computer only: names, contact details, PHQ-9 and insurance never leave it. Only monthly totals are saved.</p>
      <div class="grid" data-import>
        <label class="field-label">IntakeQ export (.csv)<input class="field" type="file" accept=".csv,text/csv" data-import-file style="padding-top:var(--space-2)"></label>
        <label class="field-label">…or paste the CSV<textarea class="field" data-import-text rows="4" placeholder="Paste the rows here, including the header row"></textarea></label>
        <div><button type="button" class="btn" data-act="import-read">Read the file</button></div>
        <div data-import-map></div>
      </div>`, true);
  }
  function importMapping(rows) {
    const head = rows[0].map((h) => h.trim()), guess = (re) => String(head.findIndex((h) => re.test(h.toLowerCase())));
    const sel = (name, label, g, optional = true) => `<label class="field-label">${label}<select class="field" name="${name}">${optional ? '<option value="-1">Not in this file</option>' : ''}${head.map((h, i) => `<option value="${i}"${String(i) === g ? ' selected' : ''}>${esc(h || 'Column ' + (i + 1))}</option>`).join('')}</select></label>`;
    $('[data-import-map]').innerHTML = `<form class="form-grid" data-form="import-map" novalidate><p class="full muted">${plural(rows.length - 1, 'row')} found. Match the columns, then preview the totals.</p>
      ${sel('date', 'First contact date', guess(/date|created|submitted|added/), false)}
      ${sel('source', 'How they heard about us', guess(/hear|source|referr(al)? source|how did/))}
      ${sel('credit', 'Referring provider or event (optional)', guess(/referring|referred by|provider name|event/))}
      ${sel('consult', 'Consult date (optional)', guess(/consult|appointment|booked/))}
      ${sel('pkg', 'Package or service (optional)', guess(/package|service|plan/))}
      <label class="field-label">Came in via<select class="field" name="via">${opts(CHANNELS)}</select></label>
      <div class="full top-actions"><button class="btn primary">Preview the totals</button></div></form><div data-import-preview></div>`;
    ui.importRows = rows;
  }
  function importPreview(map) {
    const rows = ui.importRows.slice(1), agg = new Map(); let skipped = 0, unmatched = 0;
    rows.forEach((r) => {
      const first = toISO(r[map.date]); if (!first) { skipped++; return; }
      const source = map.source >= 0 ? matchSource(r[map.source]) : 'Other';
      const credit = map.credit >= 0 ? matchCredit(r[map.credit]) : ''; if (map.credit >= 0 && String(r[map.credit] || '').trim() && !credit) unmatched++;
      const pkgRaw = map.pkg >= 0 ? String(r[map.pkg] || '').trim() : '', pkg = matchList(pkgRaw, Object.keys(PACKAGES).slice(1), '');
      const conv = !!pkgRaw && !/^(none|no|n\/a|-)$/i.test(pkgRaw);
      const month = monthOf(first), key = [month, map.via, source, credit].join('|');
      const c = agg.get(key) || { month, via: map.via, source, credit, leads: 0, consults: 0, converted: 0, revenue: 0 };
      c.leads++; if (map.consult >= 0 && toISO(r[map.consult])) c.consults++; if (conv) { c.converted++; c.revenue += PACKAGES[pkg] || 0; }
      agg.set(key, c);
    });
    const out = [...agg.values()].sort((a, b) => b.month.localeCompare(a.month));
    ui.importAgg = out;
    const months = [...new Set(out.map((c) => c.month))];
    $('[data-import-preview]').innerHTML = !out.length ? `<div class="state"><p>No rows had a readable date. Check the "First contact date" column.</p></div>` : `<div class="card" style="margin-top:var(--space-4)"><h3>Totals to save</h3><p class="muted" style="margin:var(--space-1) 0 var(--space-3)">${plural(rows.length - skipped, 'patient')} → ${plural(out.length, 'row')} of counts. Saving replaces the existing "${esc(map.via)}" counts for ${months.map((m) => esc(fmtMonth(m))).join(', ')}.${skipped ? ` ${plural(skipped, 'row')} skipped (no date).` : ''}${unmatched ? ` ${plural(unmatched, 'referrer')} didn't match a partner or event and count as uncredited; add them on Partners and re-import.` : ''}</p>
      <div class="table-wrap"><table class="cards"><thead><tr><th>Month</th><th>Source</th><th>Credited to</th><th class="right">Leads</th><th class="right">Consults</th><th class="right">Converted</th></tr></thead><tbody>${out.map((c) => `<tr><td>${esc(fmtMonth(c.month))}</td><td data-label="Source">${esc(c.source)}</td><td data-label="Credited to">${c.credit ? esc(partner(c.credit)?.org || eventById(c.credit)?.name) : '<span class="muted">–</span>'}</td><td class="right num" data-label="Leads">${c.leads}</td><td class="right num" data-label="Consults">${c.consults}</td><td class="right num" data-label="Converted">${c.converted}</td></tr>`).join('')}</tbody></table></div>
      <div class="top-actions" style="margin-top:var(--space-4)"><button class="btn primary" data-act="import-save">Save ${plural(out.length, 'row')} of counts</button><button class="btn" data-act="close">Cancel</button></div></div>`;
  }

  /* ---------------- Router ---------------- */
  function route() {
    const h = location.hash.replace(/^#\/?/, ''); const m = h.match(/^(partner|event)-(.+)$/); const id = m ? m[1] + 's' : h, sub = m ? decodeURIComponent(m[2]) : '';
    const page = PAGES.find((p) => p.id === id) || PAGES[0];
    document.querySelectorAll('[data-nav] a').forEach((a) => (a.getAttribute('href') === '#' + page.id ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    let title = page.long || page.name, subtitle = '', crumb = '', buttons = '', html;
    if (page.id === 'partners' && sub) { const p = partner(sub); title = p ? p.contact : 'Partner not found'; subtitle = p ? `${p.org}${p.city ? ' · ' + p.city : ''}` : ''; crumb = '<a class="crumb" href="#partners">‹ Referral partners</a>'; buttons = p ? `<button class="btn" data-act="edit-partner" data-id="${esc(p.id)}">Edit partner</button><button class="btn primary" data-act="log" data-id="${esc(p.id)}">Log a touch</button>` : ''; html = pages.partner(sub); }
    else if (page.id === 'events' && sub) { const e = eventById(sub); title = e ? e.name : 'Event not found'; subtitle = e ? `${fmt(e.date, { month: 'long', day: 'numeric', year: 'numeric' })} · ${e.format}` : ''; crumb = '<a class="crumb" href="#events">‹ Events & education</a>'; html = pages.event(sub); }
    else {
      subtitle = { today: 'What needs you first, and how the playbook is tracking.', partners: 'Every provider, practice, venue and colleague in the referral pipeline.', patients: 'How patients came in, and which activity, event or provider gets the credit. Monthly counts only.', pipeline: 'Move each relationship one step forward.', events: 'Community events and lunch-and-learns, with the contacts and patients each one brought in.', sources: 'Which sources and activities turn into consults, packages and return.', calendar: 'Follow-ups and events by month.', setup: 'Targets, costs, team and lists.' }[page.id];
      buttons = { patients: '<button class="btn" data-act="add-counts">Add counts</button><button class="btn primary" data-act="import">Import IntakeQ export</button>', partners: '<button class="btn primary" data-act="add-partner">Add a partner</button>', pipeline: '<button class="btn primary" data-act="add-partner">Add a partner</button>', events: '<button class="btn primary" data-act="add-event">Plan an event</button>', today: '<button class="btn" data-act="add-event">Plan an event</button><button class="btn primary" data-act="add-partner">Add a partner</button>' }[page.id] || '';
      if (page.id === 'today') title = 'Today';
      html = pages[page.id]();
    }
    $('[data-crumb]').innerHTML = crumb; $('[data-title]').textContent = title; $('[data-subtitle]').textContent = subtitle; $('[data-actions]').innerHTML = buttons;
    document.title = `${title} · Torus BD`;
    view.innerHTML = html;
  }
  function rerender(keepFocusSel) { route(); if (keepFocusSel) { const el = $(keepFocusSel); if (el) { el.focus(); if (el.setSelectionRange && el.type === 'search') el.setSelectionRange(el.value.length, el.value.length); } } }
  // Live changes from other people: redraw now, or after the open form closes so nobody loses typing.
  function refresh() { if (!$('[data-drawer]').hidden || document.activeElement?.matches?.('[data-view] input, [data-view] textarea')) ui.pending = true; else rerender(); }

  /* ---------------- Events ---------------- */
  document.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-act],[data-sort],[data-range],[data-prange],[data-month],tr[data-href]');
    if (!t) { if (e.target.matches('[data-drawer]')) closeDrawer(); return; }
    if (t.matches('tr[data-href]')) { if (!e.target.closest('a,button,select')) location.hash = t.dataset.href; return; }
    if (t.dataset.sort) { ui.dir = ui.sort === t.dataset.sort ? -ui.dir : 1; ui.sort = t.dataset.sort; rerender(); return; }
    if (t.dataset.range) { ui.range = t.dataset.range === 'all' ? 'all' : +t.dataset.range; rerender(); return; }
    if (t.dataset.prange) { ui.prange = t.dataset.prange === 'all' ? 'all' : +t.dataset.prange; rerender(); return; }
    if (t.dataset.month) { const v = +t.dataset.month; ui.month = v === 0 ? new Date(TODAY.getFullYear(), TODAY.getMonth(), 1) : new Date(ui.month.getFullYear(), ui.month.getMonth() + v, 1); rerender(); return; }
    const a = t.dataset.act, id = t.dataset.id || (location.hash.match(/^#(?:partner|event)-(.+)$/) || [])[1];
    try {
      if (a === 'add-partner') partnerForm();
      else if (a === 'edit-partner') partnerForm(partner(id));
      else if (a === 'log') touchForm(id);
      else if (a === 'add-event') eventForm();
      else if (a === 'edit-event') eventForm(eventById(id));
      else if (a === 'add-counts') countsForm();
      else if (a === 'edit-counts') countsForm(DATA.counts.find((c) => String(c.id) === id));
      else if (a === 'delete-counts') { const c = DATA.counts.find((x) => String(x.id) === id); await remove('lead_counts', c.id); closeDrawer(); rerender(); toast(`Deleted ${fmtMonth(c.month)} · ${c.via} · ${c.source} counts`); }
      else if (a === 'import') importForm();
      else if (a === 'import-read') {
        const file = $('[data-import-file]').files[0], text = file ? await file.text() : $('[data-import-text]').value;
        const rows = parseCSV(text || '');
        if (rows.length < 2) { $('[data-import-map]').innerHTML = '<p class="err">Choose an IntakeQ CSV export, or paste it including the header row.</p>'; return; }
        importMapping(rows);
      }
      else if (a === 'import-save') { const n = ui.importAgg.length; t.disabled = true; await replaceCounts(ui.importAgg); ui.importAgg = null; closeDrawer(); location.hash = '#patients'; rerender(); toast(`Saved ${plural(n, 'row')} of counts`); }
      else if (a === 'remove-member') { await remove('team_members', id); rerender(); toast(`${id} removed from the team`); }
      else if (a === 'sign-out') { await db.auth.signOut(); }
      else if (a === 'close') closeDrawer();
      else if (a === 'retry') { ui.state = 'ready'; if (LIVE) await boot(); else rerender(); }
      else if (a === 'clear') { Object.assign(ui, { q: '', status: '', activity: '', via: '', pact: '' }); rerender(); }
    } catch (err) { t.disabled = false; fail(err, 'save that'); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('[data-drawer]').hidden) closeDrawer();
    if (e.key === 'Enter' && e.target.matches('tr[data-href]')) location.hash = e.target.dataset.href;
    if (e.key === 'Tab' && !$('[data-drawer]').hidden) {
      const f = [...$('[data-drawer-panel]').querySelectorAll('input,select,textarea,button,a[href]')].filter((x) => !x.disabled); const first = f[0], last = f.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  document.addEventListener('input', (e) => { if (e.target.matches('[data-q]')) { ui.q = e.target.value; rerender('[data-q]'); } });
  document.addEventListener('focusout', () => { setTimeout(() => { if (ui.pending && $('[data-drawer]').hidden && !document.activeElement?.matches?.('[data-view] input, [data-view] textarea')) { ui.pending = false; rerender(); } }, 0); });
  document.addEventListener('change', async (e) => {
    const t = e.target;
    try {
      if (t.matches('[data-move]')) { const p = partner(t.dataset.move); await upsert('partners', { ...p, status: t.value }); rerender(); toast(`${p.contact} moved to ${t.value}`); }
      if (t.matches('[data-filter]')) { ui[t.dataset.filter] = t.value; rerender(`[data-filter="${t.dataset.filter}"]`); }
      if (t.matches('[data-state]')) { ui.state = t.value; toast(`Every list now shows the ${t.options[t.selectedIndex].text.toLowerCase()} state`); }
    } catch (err) { fail(err, 'move that partner'); rerender(); }
  });
  document.addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target, v = Object.fromEntries(new FormData(f)), kind = f.dataset.form, btn = f.querySelector('button.primary');
    const need = (name, msg) => { const el = $('#err-' + name); if (!String(v[name] || '').trim()) { if (el) el.textContent = msg; f[name].focus(); return true; } if (el) el.textContent = ''; return false; };
    if (kind === 'auth') return signIn(f, v);
    if (kind === 'import-map') { const map = Object.fromEntries(['date', 'source', 'credit', 'consult', 'pkg'].map((k) => [k, +v[k]])); map.via = v.via; return importPreview(map); }
    try {
      if (btn) btn.disabled = true;
      if (kind === 'partner') {
        if (need('contact', 'Enter the contact’s name.') || need('org', 'Enter the practice or organization.')) return;
        const base = f.dataset.id ? partner(f.dataset.id) : { id: nextId('P-', DATA.partners) };
        await upsert('partners', { ...base, ...v }); closeDrawer(); rerender(); toast(`${v.contact} saved`);
      } else if (kind === 'touch') {
        if (need('note', 'Add one line on what happened.')) return;
        const p = partner(f.dataset.id);
        await upsert('touches', { partner: p.id, date: v.date, method: v.method, by: v.by, outcome: v.outcome, note: v.note, hours: +v.hours || 0, cost: +v.cost || 0 });
        await upsert('partners', { ...p, status: v.status, next: v.next, nextStep: v.nextStep });
        closeDrawer(); rerender(); toast(`Touch logged for ${p.contact}`);
      } else if (kind === 'event') {
        if (need('name', 'Give the event a name.')) return;
        if (+v.signups > +v.attendees) { $('#err-signups').textContent = 'Signups can’t be more than attendees.'; f.signups.focus(); return; }
        const base = f.dataset.id ? eventById(f.dataset.id) : { id: nextId('E-', DATA.events) };
        await upsert('events', { ...base, ...v, attendees: +v.attendees, signups: +v.signups, cost: +v.cost, hours: +v.hours }); closeDrawer(); rerender(); toast(`${v.name} saved`);
      } else if (kind === 'counts') {
        if (+v.leads < 1) { $('#err-leads').textContent = 'Enter at least one lead.'; f.leads.focus(); return; }
        const rec = { month: v.month + '-01', via: v.via, source: v.source, credit: v.credit, leads: +v.leads, consults: +v.consults, converted: +v.converted, revenue: +v.revenue };
        const clash = DATA.counts.find((c) => c.month === rec.month && c.via === rec.via && c.source === rec.source && c.credit === rec.credit && String(c.id) !== f.dataset.id);
        if (clash) { $('#err-leads').textContent = 'Counts for this month, channel, source and credit already exist. Edit that row instead.'; return; }
        if (f.dataset.id) rec.id = DATA.counts.find((c) => String(c.id) === f.dataset.id).id; else if (!LIVE) rec.id = 'M' + Date.now();
        if (LIVE && f.dataset.id) { const { error } = await db.from('lead_counts').update(TABLES.lead_counts.to(rec)).eq('id', rec.id); if (error) throw error; Object.assign(DATA.counts.find((c) => c.id === rec.id), rec); }
        else if (LIVE) { const { data, error } = await db.from('lead_counts').insert(TABLES.lead_counts.to(rec)).select().single(); if (error) throw error; DATA.counts.push(TABLES.lead_counts.from(data)); }
        else { const i = DATA.counts.findIndex((c) => c.id === rec.id); if (i >= 0) DATA.counts[i] = rec; else DATA.counts.push(rec); }
        closeDrawer(); rerender(); toast('Counts saved');
      } else if (kind === 'settings') {
        if (v.staffCost === '' || +v.staffCost < 0) { $('#err-staffCost').textContent = 'Enter a cost of zero or more.'; f.staffCost.focus(); return; }
        await saveSettings({ openDate: v.openDate, staffCost: +v.staffCost }); rerender(); toast('Settings saved');
      } else if (kind === 'member') {
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email || '')) { $('#err-email').textContent = 'Enter a valid email address.'; f.email.focus(); return; }
        await upsert('team_members', { email: v.email.trim().toLowerCase(), name: v.name, role: v.role }); rerender(); toast(`${v.email} added. They can now sign in with an email link.`);
      }
    } catch (err) { fail(err, 'save that'); }
    finally { if (btn) btn.disabled = false; }
  });

  /* Pipeline drag and drop (the "Move to" select is the keyboard path) */
  document.addEventListener('dragstart', (e) => { const t = e.target.closest?.('[data-drag]'); if (!t) return; e.dataTransfer.setData('text/plain', t.dataset.drag); t.classList.add('dragging'); });
  document.addEventListener('dragend', (e) => { e.target.closest?.('[data-drag]')?.classList.remove('dragging'); document.querySelectorAll('.col.drop').forEach((c) => c.classList.remove('drop')); });
  document.addEventListener('dragover', (e) => { const c = e.target.closest?.('[data-col]'); if (!c) return; e.preventDefault(); document.querySelectorAll('.col.drop').forEach((x) => x !== c && x.classList.remove('drop')); c.classList.add('drop'); });
  document.addEventListener('drop', async (e) => { const c = e.target.closest?.('[data-col]'); if (!c) return; e.preventDefault(); const p = partner(e.dataTransfer.getData('text/plain')); if (p && p.status !== c.dataset.col) { try { await upsert('partners', { ...p, status: c.dataset.col }); rerender(); toast(`${p.contact} moved to ${c.dataset.col}`); } catch (err) { fail(err, 'move that partner'); } } });

  window.addEventListener('hashchange', () => { if (document.body.classList.contains('signed-out')) return; route(); window.scrollTo(0, 0); $('#main').focus({ preventScroll: true }); });

  /* ---------------- Sign-in (LIVE only) ---------------- */
  function signInView(msg = '') {
    document.body.classList.add('signed-out');
    $('[data-crumb]').innerHTML = ''; $('[data-title]').textContent = 'Sign in'; $('[data-subtitle]').textContent = 'Torus business development'; $('[data-actions]').innerHTML = '';
    view.innerHTML = `<section class="card signin"><h2>Sign in with your email</h2><p class="muted">We'll email you a one-time sign-in link. Only Torus team members can sign in.</p>
      <form class="grid" data-form="auth" novalidate><label class="field-label">Work email<input class="field" type="email" name="email" autocomplete="email" required aria-describedby="err-auth"><span class="err" id="err-auth" role="alert">${esc(msg)}</span></label>
      <div><button class="btn primary">Email me a sign-in link</button></div></form></section>`;
    $('[data-view] input').focus();
  }
  async function signIn(f, v) {
    const email = String(v.email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { $('#err-auth').textContent = 'Enter your work email address.'; f.email.focus(); return; }
    const btn = f.querySelector('button'); btn.disabled = true;
    const { error } = await db.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname, shouldCreateUser: true } });
    btn.disabled = false;
    if (error) { $('#err-auth').textContent = 'We couldn’t send the link. Check the address and try again in a minute.'; return; }
    view.innerHTML = `<section class="card signin"><h2>Check your email</h2><p>We sent a sign-in link to <b>${esc(email)}</b>. Open it on this device to continue.</p><button class="btn" data-act="retry">Use a different email</button></section>`;
  }
  function footer() {
    $('[data-foot]').innerHTML = LIVE
      ? `<p class="who">${esc(session?.user?.email || '')}</p><button class="btn small" data-act="sign-out">Sign out</button>`
      : '<p class="sample">Demo · sample data, all names and numbers are fictional</p>';
  }

  /* ---------------- Boot ---------------- */
  async function boot() {
    if (!LIVE) { document.body.classList.remove('signed-out'); footer(); route(); return; }
    try {
      if (!db) await connect();
      if (!session) { footer(); return signInView(); }
      document.body.classList.remove('signed-out'); footer();
      ui.state = 'loading'; route();
      await loadAll();
      if (!me) { document.body.classList.add('signed-out'); view.innerHTML = `<section class="card signin"><h2>You're signed in, but not on the Torus team list</h2><p class="muted">Ask a Torus admin to add ${esc(session.user.email)} in Settings, then reload this page.</p><button class="btn" data-act="sign-out">Sign out</button></section>`; return; }
      ui.state = 'ready'; route();
      if (!boot.subscribed) { subscribe(); boot.subscribed = true; }
    } catch (err) { console.warn(err); ui.state = 'error'; route(); }
  }
  await boot();
})();

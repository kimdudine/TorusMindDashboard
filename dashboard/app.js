/* Torus BD Dashboard: Level 1 clickable prototype.
   No build step, no dependencies, no polling. State lives in memory for the session.
   ALL DATA IS FICTIONAL SAMPLE DATA. Leads carry an IntakeQ-style ID only, never patient details. */
(() => {
  const DAY = 864e5;
  const TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);
  const d = (offset) => new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + offset);
  const iso = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  const parse = (s) => { const [y, m, dd] = s.split('-').map(Number); return new Date(y, m - 1, dd); };
  const days = (s) => Math.round((parse(s) - TODAY) / DAY);
  const fmt = (s, o = { month: 'short', day: 'numeric' }) => parse(s).toLocaleDateString('en-US', o);
  const rel = (s) => { const n = days(s); return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n === -1 ? 'Yesterday' : n < 0 ? `${-n} days late` : n < 7 ? parse(s).toLocaleDateString('en-US', { weekday: 'long' }) : fmt(s); };
  const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
  const pct = (n) => (isFinite(n) ? Math.round(n * 100) + '%' : '–');

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
  const SOURCES = ['Provider referral', 'Community event', 'Provider education event', 'Social media', 'Google / organic search', 'Email (Flodesk)', 'Word of mouth', 'Direct walk-in'];
  const CHANNELS = ['Discovery form (website)', 'Phone call', 'Email', 'Provider referral form', 'At an event', 'Walk-in'];
  const EVENT_TYPES = ['Lunch-and-learn', 'Webinar', 'Open house', 'Q&A', 'Tea', 'Integration circle', 'Community talk'];
  const TYPES = ['Clinical referrer', 'Hospital colleague', 'Community venue'];
  const OWNERS = ['Kim', 'Shari', 'Annette', 'Stephanie', 'Avonny'];
  const METHODS = ['Email', 'Text', 'Phone', 'In-person', 'Letter', 'Zoom'];
  const OUTCOMES = ['No response', 'Replied', 'Conversation held', 'Meeting scheduled', 'Materials sent', 'Referral agreed', 'Declined'];
  const PACKAGES = { 'None yet': 0, 'Single infusion': 450, '4-session series': 1800, '6-session series': 2600, 'Spravato (insurance)': 0 };

  /* ---------------- Sample data (fictional) ---------------- */
  const P = (id, contact, org, type, a, spec, city, status, owner, next, nextStep, phone) => ({ id, contact, org, type, activity: a, spec, city, status, owner, next: next == null ? '' : iso(d(next)), nextStep, phone });
  const DATA = {
    settings: { openDate: iso(d(-75)), staffCost: 50 },
    partners: [
      P('P-001', 'Dr. Imani Brooks', 'Sailfish Hormone & Wellness', 'Clinical referrer', 'A1', 'HRT / cash-pay wellness', 'Stuart', 'Active referrer', 'Shari', 3, 'Drop off co-branded HRT–mood one-pager', '(772) 555-0141'),
      P('P-002', 'Dr. Theo Vance', 'Palm City Pain & Spine', 'Clinical referrer', 'A1', 'Pain management', 'Palm City', 'Meeting scheduled', 'Kim', 1, 'Confirm 20-min meeting with Dr. Samson', '(772) 555-0188'),
      P('P-003', 'Dr. Priya Lakshman', 'Indian River Functional Medicine', 'Clinical referrer', 'A3', 'Functional medicine', 'Jensen Beach', 'Referral made', 'Kim', -2, 'Thank-you note + clinical brief', '(772) 555-0102'),
      P('P-004', 'Owen Castellanos, NP', 'Riverbend Primary Care', 'Clinical referrer', 'A3', 'Primary care', 'Port St. Lucie', 'Warm', 'Kim', 0, 'Invite to Q1 lunch-and-learn', '(772) 555-0164'),
      P('P-005', 'Dr. Hana Sato', 'Coastline OB-GYN', 'Clinical referrer', 'A3', 'OB-GYN', 'Stuart', 'Sent materials', 'Kim', -5, 'Call to discuss perimenopause brief', '(772) 555-0119'),
      P('P-006', 'Dr. Marcus Feld', 'Harborline Women’s Health', 'Clinical referrer', 'A3', 'OB-GYN', 'Palm City', 'Cold', 'Annette', 6, 'Send intro letter', '(772) 555-0177'),
      P('P-007', 'Dr. Elise Navarro', 'Seabreeze Psychiatry', 'Clinical referrer', 'A2', 'Psychiatry', 'Stuart', 'Active referrer', 'Kim', 9, 'Share Spravato prior-auth checklist', '(772) 555-0133'),
      P('P-008', 'Dr. Jonah Whitaker', 'St. Lucie Family Practice', 'Clinical referrer', 'A2', 'Primary care', 'Port St. Lucie', 'Sent materials', 'Kim', -1, 'Follow up on Spravato letter', '(772) 555-0158'),
      P('P-009', 'Ruth Adeyemi, PMHNP', 'Anchor Counseling Group', 'Clinical referrer', 'A2', 'Psychiatric NP', 'Stuart', 'Warm', 'Kim', 4, 'Phone intro after letter', '(772) 555-0126'),
      P('P-010', 'Dr. Caleb Moss', 'Treasure Coast Surgical Associates', 'Clinical referrer', 'A1', 'Surgery (perioperative)', 'Stuart', 'Cold', 'Stephanie', 12, 'Draft perioperative care one-pager', '(772) 555-0190'),
      P('P-011', 'Nina Ferreira, LMHC', 'Jensen Beach Therapy Collective', 'Clinical referrer', 'A1', 'Therapy', 'Jensen Beach', 'Meeting scheduled', 'Kim', 2, 'Meeting: integration support handoff', '(772) 555-0112'),
      P('P-012', 'Dr. Samuel Ortiz', 'Lighthouse Integrative Medicine', 'Clinical referrer', 'A3', 'Integrative medicine', 'Port St. Lucie', 'Not a fit', 'Kim', null, 'Offers ketamine in-house', '(772) 555-0145'),
      P('P-013', 'Dr. Avery Lin', 'Hospital colleague · Palm Beach Gardens', 'Hospital colleague', 'A5', 'Anesthesiology', 'Palm Beach Gardens', 'Referral made', 'Shari', 5, 'Coffee catch-up', '(561) 555-0131'),
      P('P-014', 'Dr. Grace Holloway', 'Hospital colleague · Delray Beach', 'Hospital colleague', 'A5', 'Internal medicine', 'Delray Beach', 'Warm', 'Shari', -3, 'Reply to her text about TRD patient', '(561) 555-0109'),
      P('P-015', 'Dr. Felix Romero', 'Hospital colleague · Weston', 'Hospital colleague', 'A5', 'Neurology', 'Weston', 'Cold', 'Shari', 0, 'Send personal message', '(954) 555-0170'),
      P('P-016', 'Dr. Mara Quinn', 'Hospital colleague · Palm Beach Gardens', 'Hospital colleague', 'A5', 'Pain medicine', 'Palm Beach Gardens', 'Meeting scheduled', 'Shari', 7, '15-min catch-up call', '(561) 555-0183'),
      P('P-017', 'Tessa (studio owner)', 'Salt & Sun Yoga', 'Community venue', 'A4', 'Yoga studio', 'Stuart', 'Active referrer', 'Annette', 10, 'Confirm December event date', '(772) 555-0151'),
      P('P-018', 'Jordan (manager)', 'Driftwood Pilates', 'Community venue', 'A4', 'Pilates studio', 'Palm City', 'Warm', 'Annette', -7, 'Send event proposal', '(772) 555-0122'),
      P('P-019', 'Leah (coordinator)', 'Mangrove Wellness Collective', 'Community venue', 'A4', 'Wellness space', 'Jupiter', 'Referral made', 'Annette', 14, 'Book January talk', '(561) 555-0167'),
      P('P-020', 'Dr. Ben Adler', 'Northfork Psychiatry', 'Clinical referrer', 'A2', 'Psychiatry', 'Port St. Lucie', 'Cold', 'Kim', 3, 'Send Spravato referral letter', '(772) 555-0195'),
    ],
    touches: [],
    events: [
      { id: 'E-001', name: 'What is ketamine therapy, and is it right for you?', activity: 'A4', date: iso(d(-61)), venue: 'P-017', format: 'In-person', attendees: 18, signups: 5, cost: 120, hours: 6 },
      { id: 'E-002', name: 'Q4 lunch-and-learn: when to refer for ketamine vs. Spravato', activity: 'A3', date: iso(d(-48)), venue: '', format: 'Virtual (Zoom)', attendees: 11, signups: 0, cost: 0, hours: 5 },
      { id: 'E-003', name: 'The perimenopause–mood connection', activity: 'A4', date: iso(d(-34)), venue: 'P-019', format: 'In-person', attendees: 14, signups: 4, cost: 150, hours: 6 },
      { id: 'E-004', name: 'Burnout, grief and separation', activity: 'A4', date: iso(d(-19)), venue: 'P-018', format: 'In-person', attendees: 7, signups: 1, cost: 90, hours: 5 },
      { id: 'E-005', name: 'In-office lunch-and-learn: what happens in a KAT session', activity: 'A3', date: iso(d(-8)), venue: '', format: 'In-person', attendees: 9, signups: 0, cost: 210, hours: 4 },
      { id: 'E-006', name: 'Moving beyond antidepressants', activity: 'A4', date: iso(d(12)), venue: 'P-017', format: 'In-person', attendees: 0, signups: 0, cost: 0, hours: 0 },
      { id: 'E-007', name: 'Q1 lunch-and-learn: the hormonal–mood interface', activity: 'A3', date: iso(d(33)), venue: '', format: 'Virtual (Zoom)', attendees: 0, signups: 0, cost: 0, hours: 0 },
    ],
    leads: [],
  };

  DATA.events.push({ id: 'E-008', name: 'Wellness tea & Q&A at Torus', activity: 'A4', date: iso(d(-3)), venue: '', format: 'In-person', attendees: 12, signups: 3, cost: 60, hours: 3 });
  const ETYPE = { 'E-001': 'Community talk', 'E-002': 'Webinar', 'E-003': 'Community talk', 'E-004': 'Integration circle', 'E-005': 'Lunch-and-learn', 'E-006': 'Open house', 'E-007': 'Webinar', 'E-008': 'Tea' };
  DATA.events.forEach((e) => { e.type = ETYPE[e.id]; });
  DATA.events.find((e) => e.id === 'E-006').name = 'Open house: moving beyond antidepressants';
  // Professional contacts first met at an event (fictional)
  Object.entries({ 'P-003': 'E-002', 'P-004': 'E-005', 'P-005': 'E-002', 'P-009': 'E-005', 'P-018': 'E-003', 'P-020': 'E-008' }).forEach(([pid, eid]) => { DATA.partners.find((x) => x.id === pid).metAt = eid; });

  // Touches: a believable history per partner (fictional)
  const TT = [
    ['P-001', -70, 'Email', 'Annette', 'Meeting scheduled', 'Booked 20-min meeting at their Stuart office'], ['P-001', -63, 'In-person', 'Shari', 'Referral agreed', 'Handoff protocol agreed; co-produce one-pager'], ['P-001', -30, 'Email', 'Kim', 'Materials sent', 'Draft one-pager for review'], ['P-001', -9, 'Phone', 'Shari', 'Conversation held', 'Two referrals this month; asked for more brochures'],
    ['P-002', -20, 'Letter', 'Kim', 'No response', 'Intro letter + clinical brief'], ['P-002', -6, 'Phone', 'Annette', 'Meeting scheduled', 'Meeting set with Dr. Samson'],
    ['P-003', -48, 'Zoom', 'Kim', 'Conversation held', 'Attended Q4 lunch-and-learn'], ['P-003', -40, 'Email', 'Kim', 'Materials sent', 'Clinical brief + personal note from Dr. Samson'], ['P-003', -12, 'Phone', 'Kim', 'Referral agreed', 'First referral sent'],
    ['P-004', -8, 'In-person', 'Kim', 'Replied', 'Met at in-office lunch-and-learn'],
    ['P-005', -26, 'Email', 'Kim', 'Materials sent', 'Perimenopause brief'], ['P-005', -12, 'Phone', 'Annette', 'No response', 'Left voicemail'],
    ['P-007', -55, 'Letter', 'Kim', 'Replied', 'Spravato insurance letter'], ['P-007', -41, 'In-person', 'Shari', 'Referral agreed', 'Agreed to send TRD patients'], ['P-007', -15, 'Email', 'Kim', 'Conversation held', 'Discussed prior-auth timelines'],
    ['P-008', -14, 'Letter', 'Kim', 'Materials sent', 'Spravato insurance letter'],
    ['P-009', -10, 'Letter', 'Kim', 'Replied', 'Interested; prefers a call'],
    ['P-011', -16, 'Email', 'Kim', 'Replied', 'Wants to discuss integration support'], ['P-011', -5, 'Phone', 'Annette', 'Meeting scheduled', 'Meeting booked'],
    ['P-012', -33, 'Email', 'Kim', 'Declined', 'Already offers ketamine in-house'],
    ['P-013', -66, 'Text', 'Shari', 'Conversation held', 'Personal catch-up'], ['P-013', -50, 'Email', 'Annette', 'Materials sent', 'Clinical brief'], ['P-013', -22, 'Phone', 'Shari', 'Referral agreed', 'Referred a post-op patient'],
    ['P-014', -45, 'Text', 'Shari', 'Replied', 'Happy to hear about Torus'], ['P-014', -18, 'Text', 'Shari', 'Conversation held', 'Mentioned a TRD patient'],
    ['P-016', -40, 'Email', 'Shari', 'No response', 'Personal note'], ['P-016', -11, 'Text', 'Shari', 'Meeting scheduled', 'Call set'],
    ['P-017', -80, 'In-person', 'Annette', 'Meeting scheduled', 'Venue walkthrough'], ['P-017', -61, 'In-person', 'Annette', 'Conversation held', 'Hosted event E-001'], ['P-017', -20, 'Email', 'Annette', 'Referral agreed', 'Monthly events agreed'],
    ['P-018', -30, 'Email', 'Annette', 'Replied', 'Open to a talk'], ['P-018', -19, 'In-person', 'Annette', 'Conversation held', 'Hosted event E-004'],
    ['P-019', -40, 'Email', 'Annette', 'Meeting scheduled', 'Venue call'], ['P-019', -34, 'In-person', 'Annette', 'Conversation held', 'Hosted event E-003'],
  ];
  DATA.touches = TT.map(([partner, off, method, by, outcome, note], i) => ({ id: 'T' + i, partner, date: iso(d(off)), method, by, outcome, note, hours: method === 'In-person' ? 1.5 : 0.5, cost: method === 'Letter' ? 4 : 0 }));

  // Leads: IntakeQ client IDs only. Fictional, generated with a fixed seed so they are the same every load.
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const leadPlan = [
    ['Provider referral', ['P-001', 'P-001', 'P-001', 'P-003', 'P-007', 'P-007', 'P-013', 'P-014'], 12],
    ['Community event', ['E-001', 'E-003', 'E-004', 'E-008'], 12],
    ['Provider education event', ['E-002', 'E-005'], 2],
    ['Social media', [''], 7], ['Google / organic search', [''], 9], ['Email (Flodesk)', [''], 3], ['Word of mouth', [''], 5], ['Direct walk-in', [''], 1],
  ];
  let n = 1040;
  leadPlan.forEach(([source, ids, count]) => {
    for (let i = 0; i < count; i++) {
      const sid = pick(ids);
      const ev = DATA.events.find((e) => e.id === sid);
      const off = ev ? days(ev.date) + Math.floor(rnd() * 10) : -Math.floor(rnd() * 88) - 1;
      const first = Math.min(off, -1);
      const consulted = rnd() < (source === 'Provider referral' ? 0.8 : source === 'Community event' ? 0.6 : 0.45);
      const cOff = first + 3 + Math.floor(rnd() * 9);
      const hasConsult = consulted && cOff <= 6;
      const isSprav = sid === 'P-007' || (source === 'Provider referral' && rnd() < 0.15);
      const pk = !hasConsult || cOff > 0 || rnd() < 0.3 ? 'None yet' : isSprav ? 'Spravato (insurance)' : pick(['Single infusion', '4-session series', '4-session series', '6-session series']);
      const via = source === 'Provider referral' ? pick(['Provider referral form', 'Provider referral form', 'Phone call'])
        : source.endsWith('event') ? pick(['Discovery form (website)', 'Discovery form (website)', 'At an event', 'Phone call'])
        : source === 'Direct walk-in' ? 'Walk-in' : pick(['Discovery form (website)', 'Discovery form (website)', 'Discovery form (website)', 'Phone call', 'Email']);
      DATA.leads.push({ id: 'IQ-' + n++, via, first: iso(d(first)), source, sourceId: sid, consult: hasConsult ? iso(d(cOff)) : '', pkg: pk, value: PACKAGES[pk] });
    }
  });

  /* ---------------- Derived values ---------------- */
  const partner = (id) => DATA.partners.find((p) => p.id === id);
  const eventById = (id) => DATA.events.find((e) => e.id === id);
  const leadActivity = (l) => (l.sourceId.startsWith('P-') ? partner(l.sourceId)?.activity : l.sourceId.startsWith('E-') ? eventById(l.sourceId)?.activity : 'D') || 'D';
  const touchesOf = (id) => DATA.touches.filter((t) => t.partner === id).sort((a, b) => b.date.localeCompare(a.date));
  const leadsOf = (id) => DATA.leads.filter((l) => l.sourceId === id);
  const converted = (l) => l.pkg !== 'None yet';
  const lastReferral = (id) => leadsOf(id).map((l) => l.first).sort().at(-1) || '';
  const metAtEvent = (eid) => DATA.partners.filter((p) => p.metAt === eid);
  const stageOf = (l) => (converted(l) ? l.pkg : l.consult ? 'Consult booked' : 'Lead');
  const creditOf = (l) => (l.sourceId.startsWith('P-') ? { href: '#partner-' + l.sourceId, label: partner(l.sourceId)?.org } : l.sourceId.startsWith('E-') ? { href: '#event-' + l.sourceId, label: eventById(l.sourceId)?.name } : null);
  const overdue = (p) => p.next && days(p.next) < 0 && p.status !== 'Not a fit';
  const inRange = (s, range) => range === 'all' || days(s) >= -range;
  function activityRoi(range) {
    const cost = DATA.settings.staffCost;
    return ACTIVITIES.map((a) => {
      const leads = DATA.leads.filter((l) => leadActivity(l) === a.id && inRange(l.first, range));
      const t = DATA.touches.filter((x) => partner(x.partner)?.activity === a.id && inRange(x.date, range));
      const ev = DATA.events.filter((e) => e.activity === a.id && days(e.date) <= 0 && inRange(e.date, range));
      const spend = t.reduce((s, x) => s + x.cost + x.hours * cost, 0) + ev.reduce((s, e) => s + e.cost + e.hours * cost, 0);
      const revenue = leads.reduce((s, l) => s + l.value, 0);
      return { ...a, leads: leads.length, consults: leads.filter((l) => l.consult).length, conv: leads.filter(converted).length, revenue, spend, touches: t.length, events: ev.length, partners: DATA.partners.filter((p) => p.activity === a.id).length, active: DATA.partners.filter((p) => p.activity === a.id && p.status === 'Active referrer').length };
    });
  }
  function sourceStats(range) {
    return SOURCES.map((s) => { const l = DATA.leads.filter((x) => x.source === s && inRange(x.first, range)); return { name: s, leads: l.length, consults: l.filter((x) => x.consult).length, conv: l.filter(converted).length, revenue: l.reduce((a, x) => a + x.value, 0) }; });
  }
  function scorecard() {
    const open = DATA.settings.openDate, since = (s) => Math.round((parse(s) - parse(open)) / DAY);
    const w = (l, max, a) => leadActivity(l) === a && since(l.first) >= 0 && since(l.first) <= max;
    const relive = partner('P-001');
    const a4 = DATA.events.filter((e) => e.activity === 'A4' && days(e.date) <= 0);
    const att = a4.reduce((s, e) => s + e.attendees, 0), sig = a4.reduce((s, e) => s + e.signups, 0);
    const msgs = DATA.touches.filter((t) => partner(t.partner)?.activity === 'A5' && t.by === 'Shari' && since(t.date) <= 30);
    const conv = DATA.touches.filter((t) => partner(t.partner)?.activity === 'A5' && ['Conversation held', 'Meeting scheduled', 'Referral agreed'].includes(t.outcome));
    const all = DATA.leads, wl = all.length ? all.filter((l) => l.consult).length / all.length : 0;
    return [
      { a: 'A1', label: 'Lead partner at "Active referrer" within 60 days', target: 1, actual: relive?.status === 'Active referrer' ? 1 : 0, show: relive?.status || '–', unit: 'flag' },
      { a: 'A1', label: 'First referral from lead partner within 90 days', target: 1, actual: all.filter((l) => l.sourceId === 'P-001' && since(l.first) <= 90).length },
      { a: 'A2', label: 'Spravato-specific referrals, first quarter', target: 3, actual: all.filter((l) => w(l, 90, 'A2')).length },
      { a: 'A3', label: 'Referrals traced to education series, first 6 months', target: 2, actual: all.filter((l) => w(l, 182, 'A3')).length },
      { a: 'A4', label: 'Community events held, months 1–3', target: 3, actual: a4.filter((e) => since(e.date) >= 0 && since(e.date) <= 91).length },
      { a: 'A4', label: 'Average attendees per community event', target: 10, actual: a4.length ? Math.round(att / a4.length) : 0 },
      { a: 'A4', label: 'Event waitlist signup rate', target: 0.2, actual: att ? sig / att : 0, unit: 'pct' },
      { a: 'A5', label: "Shari's personal messages, first 30 days", target: 10, actual: msgs.length },
      { a: 'A5', label: 'Conversations started with colleagues', target: 5, actual: conv.length },
      { a: 'A5', label: 'Physician-network referrals within 60 days', target: 2, actual: all.filter((l) => w(l, 60, 'A5')).length },
      { a: 'D', label: 'Lead → consult rate', target: 0.4, actual: wl, unit: 'pct' },
    ];
  }

  /* ---------------- UI helpers ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const opts = (list, sel) => list.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}"${v === sel ? ' selected' : ''}>${esc(l)}</option>`; }).join('');
  const view = $('[data-view]');
  const ui = { state: 'ready', q: '', q2: '', via: '', pact: '', status: '', activity: '', sort: 'next', dir: 1, range: 90, month: new Date(TODAY.getFullYear(), TODAY.getMonth(), 1) };
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
  
  function toast(msg) { const t = $('[data-toast]'); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 2800); }
  function withState(items, empty, render) {
    if (ui.state === 'loading') return '<div aria-busy="true" aria-label="Loading">' + '<div class="skel"></div>'.repeat(4) + '</div>';
    if (ui.state === 'error') return `<div class="state" role="alert"><p>We couldn't load this. Check your connection, then try again.</p><button class="btn" data-act="retry">Try again</button></div>`;
    if (ui.state === 'empty' || !items.length) return `<div class="state"><p>${esc(empty.msg)}</p>${empty.btn ? `<button class="btn primary" data-act="${empty.act}">${esc(empty.btn)}</button>` : ''}</div>`;
    return render(items);
  }
  const statusChip = (s) => `<span class="chip ${{ 'Active referrer': 'success', 'Referral made': 'accent', 'Meeting scheduled': 'info', 'Sent materials': 'warning', 'Not a fit': '' }[s] || ''}">${esc(s)}</span>`;
  const actChip = (id) => `<span class="chip"><i class="dot" style="background:${act(id).color}"></i>${esc(act(id).name)}</span>`;
  const dueChip = (p) => !p.next ? '<span class="muted">–</span>' : `<span class="chip ${overdue(p) ? 'danger' : days(p.next) === 0 ? 'warning' : ''}">${esc(rel(p.next))}</span>`;

  /* ---------------- Pages ---------------- */
  const pages = {
    today() {
      const L = DATA.leads, l30 = L.filter((l) => days(l.first) >= -30), l60 = L.filter((l) => days(l.first) < -30 && days(l.first) >= -60);
      const cr = L.length ? L.filter((l) => l.consult).length / L.length : 0;
      const active = DATA.partners.filter((p) => p.status === 'Active referrer').length;
      const late = DATA.partners.filter(overdue);
      const roi = activityRoi('all').filter((a) => a.id !== 'D'), rev = roi.reduce((s, a) => s + a.revenue, 0), spend = roi.reduce((s, a) => s + a.spend, 0);
      const attention = DATA.partners.filter((p) => p.next && days(p.next) <= 2 && p.status !== 'Not a fit').sort((a, b) => a.next.localeCompare(b.next));
      const src = sourceStats(90).filter((s) => s.leads).sort((a, b) => b.leads - a.leads), max = Math.max(1, ...src.map((s) => s.leads));
      const sc = scorecard(), met = sc.filter(isMet).length;
      const upcoming = DATA.events.filter((e) => days(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
      const delta = l30.length - l60.length;
      return `<section class="card welcome"><div><h2>${greeting()}, Kim</h2><p>${late.length ? `${late.length} follow-up${late.length > 1 ? 's are' : ' is'} overdue and ${attention.length - late.length} ${attention.length - late.length === 1 ? 'is' : 'are'} due in the next two days.` : 'No follow-ups are overdue.'} ${met} of ${sc.length} playbook targets are met so far.</p>
          <a class="btn" href="#partners">Open follow-ups</a></div>${torusSvg()}</section>
        <section class="kpis" aria-label="Key numbers">
          ${kpi('New leads, last 30 days', l30.length, `${delta >= 0 ? '+' : ''}${delta} vs. previous 30`, delta >= 0 ? 'good' : 'bad')}
          ${kpi('Lead → consult rate', pct(cr), cr >= 0.4 ? 'At or above the 40% target' : 'Below the 40% target', cr >= 0.4 ? 'good' : 'bad')}
          ${kpi('Active referrers', active, `of ${DATA.partners.filter((p) => p.status !== 'Not a fit').length} partners in play`)}
          ${kpi('Follow-ups overdue', late.length, late.length ? 'Clear these first' : 'All caught up', late.length ? 'bad' : 'good')}
          ${(() => { const df = l30.filter((l) => l.via === CHANNELS[0]); return kpi('Discovery form, last 30 days', df.length, `${df.filter((l) => l.consult).length} became consults`); })()}
        </section>
        <div class="bento">
          <section class="card span-7"><div class="card-head"><h2>Needs attention</h2><a href="#partners">All partners</a></div>
            <div class="rows">${withState(attention, { msg: 'Nothing is due in the next two days.', btn: 'Add a partner', act: 'add-partner' }, (items) => items.map((p) => `<a class="row" href="#partner-${p.id}"><span><span class="row-title">${esc(p.nextStep)}</span><small>${esc(p.contact)} · ${esc(p.org)} · ${esc(p.owner)}</small></span>${dueChip(p)}</a>`).join(''))}</div></section>
          <section class="card span-5"><div class="card-head"><h2>Where new patients came from</h2><span class="muted">Last 90 days · leads</span></div>
            ${withState(src, { msg: 'No leads in the last 90 days yet.' }, (items) => `<div class="bars" role="list">${items.map((s) => `<div class="bar-row" role="listitem"><span>${esc(s.name)}</span><div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width:${(s.leads / max) * 100}%;background:var(--chart-1)"></div></div><span class="num">${s.leads} <span class="muted">· ${s.conv} converted</span></span></div>`).join('')}</div>`)}</section>
          <section class="card span-7"><div class="card-head"><h2>Playbook scorecard</h2><a href="#sources">Sources & ROI</a></div>${withState(sc, { msg: 'Set the opening date in Settings to start the scorecard.' }, (items) => items.slice(0, 6).map(scoreRow).join('') + `<p class="muted" style="margin-top:var(--space-3)">Counting from opening on ${esc(fmt(DATA.settings.openDate, { month: 'long', day: 'numeric', year: 'numeric' }))}. <a href="#sources">See all ${items.length}</a></p>`)}</section>
          <section class="card span-5"><div class="card-head"><h2>Coming up</h2><a href="#calendar">Calendar</a></div>
            <div class="rows">${withState(upcoming, { msg: 'No events scheduled.', btn: 'Plan an event', act: 'add-event' }, (items) => items.map((e) => `<a class="row" href="#event-${e.id}"><span><span class="row-title">${esc(e.name)}</span><small>${esc(e.format)}${e.venue ? ' · ' + esc(partner(e.venue)?.org) : ''}</small></span><span class="chip">${esc(rel(e.date))}</span></a>`).join(''))}</div></section>
        </div>`;
    },

    partners() {
      const q = ui.q.toLowerCase();
      const key = { contact: (p) => p.contact, org: (p) => p.org, status: (p) => STAGES.indexOf(p.status), next: (p) => p.next || '9999', referred: (p) => leadsOf(p.id).length, last: (p) => lastReferral(p.id) };
      const rows = DATA.partners.filter((p) => (p.contact + p.org + p.spec + p.city).toLowerCase().includes(q) && (!ui.status || p.status === ui.status) && (!ui.activity || p.activity === ui.activity))
        .sort((a, b) => (key[ui.sort](a) > key[ui.sort](b) ? 1 : -1) * ui.dir);
      const th = (k, label, cls = '') => `<th class="${cls}" aria-sort="${ui.sort === k ? (ui.dir > 0 ? 'ascending' : 'descending') : 'none'}"><button data-sort="${k}">${label}</button></th>`;
      return `<div class="toolbar"><input class="field search" type="search" placeholder="Search name, practice, specialty, city" aria-label="Search partners" value="${esc(ui.q)}" data-q>
          <select class="field" aria-label="Filter by status" data-filter="status"><option value="">All statuses</option>${opts(ALL_STATUS, ui.status)}</select>
          <select class="field" aria-label="Filter by BD activity" data-filter="activity"><option value="">All activities</option>${opts(ACTIVITIES.slice(0, 5).map((a) => [a.id, a.long]), ui.activity)}</select></div>
        <div class="card table-wrap">${withState(rows, { msg: ui.q || ui.status || ui.activity ? 'No partners match these filters. Clear them to see everyone.' : 'No referral partners yet. Add the first one from the playbook.', btn: ui.q || ui.status || ui.activity ? 'Clear filters' : 'Add a partner', act: ui.q || ui.status || ui.activity ? 'clear' : 'add-partner' },
          (items) => `<table class="cards"><thead><tr>${th('contact', 'Partner')}${th('org', 'Practice / organization')}<th>Activity</th>${th('status', 'Status')}${th('next', 'Next follow-up')}${th('referred', 'Referred', 'right')}${th('last', 'Last referral')}</tr></thead><tbody>
          ${items.map((p) => `<tr data-href="#partner-${p.id}" tabindex="0"><td><a class="person" href="#partner-${p.id}" tabindex="-1" style="text-decoration:none;color:inherit"><b>${esc(p.contact)}</b><small>${esc(p.spec)}</small></a></td><td data-label="Practice">${esc(p.org)}<br><small class="muted">${esc(p.city)}</small></td><td>${actChip(p.activity)}</td><td>${statusChip(p.status)}</td><td data-label="Next">${dueChip(p)}</td><td class="right num" data-label="Referred">${leadsOf(p.id).length}</td><td data-label="Last referral">${lastReferral(p.id) ? esc(fmt(lastReferral(p.id))) : '<span class="muted">–</span>'}</td></tr>`).join('')}</tbody></table>`)}</div>
        <p class="muted" style="margin-top:var(--space-3)">${rows.length} of ${DATA.partners.length} partners</p>`;
    },

    partner(id) {
      const p = partner(id);
      if (!p) return `<div class="card state"><p>That partner isn't in the list. It may have been removed.</p><a class="btn" href="#partners">Back to partners</a></div>`;
      const t = touchesOf(id), l = leadsOf(id);
      return `<div class="bento">
        <section class="card span-8"><div class="detail-head"><div><div class="top-actions">${statusChip(p.status)}${actChip(p.activity)}<span class="chip">${esc(p.type)}</span></div>
          <dl class="facts"><div><dt>Practice</dt><dd>${esc(p.org)}</dd></div><div><dt>Specialty</dt><dd>${esc(p.spec)}</dd></div><div><dt>City</dt><dd>${esc(p.city)}</dd></div><div><dt>Phone</dt><dd class="num">${esc(p.phone)}</dd></div><div><dt>Owner</dt><dd>${esc(p.owner)}</dd></div><div><dt>Patients referred</dt><dd class="num">${l.length} · ${l.filter(converted).length} converted</dd></div><div><dt>Last referral</dt><dd>${l.length ? esc(fmt(lastReferral(p.id))) : 'None yet'}</dd></div>${p.metAt ? `<div><dt>First met at</dt><dd><a href="#event-${p.metAt}">${esc(eventById(p.metAt)?.name)}</a></dd></div>` : ''}</dl></div></div>
          <label class="field-label" style="margin-top:var(--space-5);max-width:320px">Move to stage<select class="field" data-move="${p.id}">${opts(ALL_STATUS, p.status)}</select></label></section>
        <section class="card next span-4"><h2>Next step</h2><p style="margin:var(--space-2) 0 var(--space-3)">${esc(p.nextStep || 'No next step set')}</p>${dueChip(p)}
          <div class="top-actions" style="margin-top:var(--space-4)"><button class="btn primary" data-act="log" data-id="${p.id}">Log a touch</button></div></section>
        <section class="card span-7"><div class="card-head"><h2>Touch history</h2><span class="muted">${t.length} touches</span></div>
          ${withState(t, { msg: 'No touches logged yet. Log the first outreach.', btn: 'Log a touch', act: 'log' }, (items) => `<ol class="timeline">${items.map((x) => `<li><time datetime="${x.date}">${esc(fmt(x.date))}</time><div><b>${esc(x.outcome)}</b> <span class="muted">· ${esc(x.method)} by ${esc(x.by)}</span><br>${esc(x.note)}</div></li>`).join('')}</ol>`)}</section>
        <section class="card span-5"><div class="card-head"><h2>Patients referred</h2><span class="muted">IntakeQ IDs only</span></div>
          <div class="rows">${withState(l, { msg: 'No referrals traced to this partner yet.' }, (items) => items.map((x) => `<div class="row" style="cursor:default"><span><span class="num">${esc(x.id)}</span><small>First contact ${esc(fmt(x.first))}${x.consult ? ' · consult ' + esc(fmt(x.consult)) : ''}</small></span><span class="chip ${converted(x) ? 'success' : ''}">${esc(converted(x) ? x.pkg : x.consult ? 'Consulted' : 'Lead')}</span></div>`).join(''))}</div></section>
      </div>`;
    },

    patients() {
      const q = ui.q2.toLowerCase();
      const rows = DATA.leads.filter((l) => (!ui.via || l.via === ui.via) && (!ui.pact || leadActivity(l) === ui.pact) && l.id.toLowerCase().includes(q)).sort((a, b) => b.first.localeCompare(a.first));
      const ch = CHANNELS.map((c) => { const l = DATA.leads.filter((x) => x.via === c); return { c, n: l.length, cons: l.filter((x) => x.consult).length, conv: l.filter(converted).length }; });
      const df = DATA.leads.filter((l) => l.via === CHANNELS[0]), df30 = df.filter((l) => days(l.first) >= -30);
      const filtered = ui.via || ui.pact || ui.q2;
      return `<section class="kpis" aria-label="Discovery form">${kpi('Discovery form, last 30 days', df30.length, 'website submissions')}${kpi('Discovery form, all time', df.length, `${pct(df.length / (DATA.leads.length || 1))} of all patient leads`)}${kpi('Discovery → consult', pct(df.filter((l) => l.consult).length / (df.length || 1)), `${df.filter((l) => l.consult).length} consults booked`)}${kpi('Discovery → package', df.filter(converted).length, money(df.reduce((s, l) => s + l.value, 0)) + ' revenue')}${kpi('All patient leads', DATA.leads.length, `${DATA.leads.filter((l) => days(l.first) >= -30).length} in the last 30 days`)}</section>
        <section class="card table-wrap" style="padding:0"><div class="card-head" style="padding:var(--space-5) var(--space-5) 0"><h2>How patients came in</h2><span class="muted">All time · the source below says what drove them</span></div>
          <table class="cards"><thead><tr><th>Came in via</th><th class="right">Leads</th><th class="right">Consults</th><th class="right">Converted</th><th class="right">Lead → consult</th></tr></thead><tbody>${ch.map((x) => `<tr><td>${x.c === CHANNELS[0] ? `<b>${esc(x.c)}</b>` : esc(x.c)}</td><td class="right num" data-label="Leads">${x.n}</td><td class="right num" data-label="Consults">${x.cons}</td><td class="right num" data-label="Converted">${x.conv}</td><td class="right num" data-label="Lead → consult">${x.n ? pct(x.cons / x.n) : '–'}</td></tr>`).join('')}</tbody></table></section>
        <div class="toolbar"><input class="field search" type="search" placeholder="Search IntakeQ ID" aria-label="Search by IntakeQ ID" value="${esc(ui.q2)}" data-q2>
          <select class="field" aria-label="Filter by how they came in" data-filter="via"><option value="">Every channel</option>${opts(CHANNELS, ui.via)}</select>
          <select class="field" aria-label="Filter by activity" data-filter="pact"><option value="">Every activity</option>${opts(ACTIVITIES.map((x) => [x.id, x.long]), ui.pact)}</select></div>
        <div class="card table-wrap">${withState(rows, { msg: filtered ? 'No patient leads match these filters.' : 'No patient leads yet. Add one from the IntakeQ export.', btn: filtered ? 'Clear filters' : 'Add a patient lead', act: filtered ? 'clear' : 'add-lead' }, (items) => `<table class="cards"><thead><tr><th>IntakeQ ID</th><th>First contact</th><th>Came in via</th><th>Source</th><th>Credited to</th><th>Stage</th></tr></thead><tbody>
          ${items.map((l) => { const c = creditOf(l); return `<tr><td><b class="num">${esc(l.id)}</b></td><td data-label="First contact">${esc(fmt(l.first))}</td><td data-label="Came in via">${esc(l.via)}</td><td data-label="Source">${esc(l.source)}</td><td data-label="Credited to">${c ? `<a href="${c.href}">${esc(c.label)}</a>` : actChip(leadActivity(l))}</td><td><span class="chip ${converted(l) ? 'success' : l.consult ? 'info' : ''}">${esc(stageOf(l))}</span></td></tr>`; }).join('')}</tbody></table>`)}</div>
        <p class="muted">${rows.length} of ${DATA.leads.length} patient leads · IntakeQ IDs only, no names or health details</p>`;
    },

    pipeline() {
      return `<p class="muted" style="margin-bottom:var(--space-4)">Drag a card to a new column, or use "Move to". Partners marked "Not a fit" are hidden here.</p>
        <div class="board" data-board>${STAGES.map((s) => { const items = DATA.partners.filter((p) => p.status === s);
        return `<section class="col" data-col="${esc(s)}" aria-label="${esc(s)}"><h2><span>${esc(s)}</span><span class="num">${items.length}</span></h2>
          ${items.map((p) => `<article class="tile" draggable="true" data-drag="${p.id}"><a href="#partner-${p.id}">${esc(p.contact)}</a><small>${esc(p.org)}</small>
            <div class="top-actions">${actChip(p.activity)}${p.next ? dueChip(p) : ''}</div>
            <label class="field-label">Move to<select class="field" data-move="${p.id}">${opts(ALL_STATUS, s)}</select></label></article>`).join('') || '<p class="muted" style="padding:var(--space-2)">Nobody at this stage yet.</p>'}</section>`; }).join('')}</div>`;
    },

    events() {
      const rows = [...DATA.events].sort((a, b) => b.date.localeCompare(a.date));
      return `<div class="card table-wrap">${withState(rows, { msg: 'No events yet. Plan the first community event or lunch-and-learn.', btn: 'Plan an event', act: 'add-event' }, (items) => `<table class="cards"><thead><tr><th>Event</th><th>Date</th><th>Activity</th><th class="right">Attendees</th><th class="right">Signup rate</th><th class="right">Contacts made</th><th class="right">Patient leads</th><th class="right">Revenue</th></tr></thead><tbody>
        ${items.map((e) => { const l = leadsOf(e.id), past = days(e.date) <= 0; return `<tr data-href="#event-${e.id}" tabindex="0"><td><b>${esc(e.name)}</b><br><small class="muted">${esc(e.type || '')} · ${esc(e.format)}${e.venue ? ' · ' + esc(partner(e.venue)?.org) : ''}</small></td><td data-label="Date">${past ? esc(fmt(e.date)) : `<span class="chip info">${esc(rel(e.date))}</span>`}</td><td>${actChip(e.activity)}</td><td class="right num" data-label="Attendees">${past ? e.attendees : '–'}</td><td class="right num" data-label="Signup rate">${past && e.attendees ? pct(e.signups / e.attendees) : '–'}</td><td class="right num" data-label="Contacts made">${metAtEvent(e.id).length}</td><td class="right num" data-label="Patient leads">${l.length}</td><td class="right num" data-label="Revenue">${money(l.reduce((s, x) => s + x.value, 0))}</td></tr>`; }).join('')}</tbody></table>`)}</div>`;
    },

    event(id) {
      const e = eventById(id);
      if (!e) return `<div class="card state"><p>That event isn't in the list.</p><a class="btn" href="#events">Back to events</a></div>`;
      const l = leadsOf(id), past = days(e.date) <= 0, c30 = l.filter((x) => x.consult && days(x.consult) - days(e.date) <= 30);
      const spend = e.cost + e.hours * DATA.settings.staffCost, rev = l.reduce((s, x) => s + x.value, 0);
      const target = e.activity === 'A4' && past ? (e.attendees >= 10 && e.signups / (e.attendees || 1) >= 0.2 ? '<span class="chip success">Met the event targets</span>' : '<span class="chip warning">Below the event targets</span>') : '';
      return `<section class="kpis" aria-label="Event results">${kpi('Attendees', past ? e.attendees : '–', past ? 'Target 10+' : 'Not held yet')}${kpi('Waitlist signups', past ? e.signups : '–', past && e.attendees ? pct(e.signups / e.attendees) + ' of attendees' : '')}${kpi('Consults within 30 days', c30.length, `${l.length} lead${l.length === 1 ? '' : 's'} traced`)}${kpi('Revenue', money(rev), `${l.filter(converted).length} package${l.filter(converted).length === 1 ? '' : 's'}`)}${kpi('Cost (cash + time)', money(spend), spend ? (rev / spend).toFixed(1) + '× return' : '')}</section>
        <div class="bento"><section class="card span-7"><div class="card-head"><h2>Details</h2>${target}</div><dl class="facts"><div><dt>Type</dt><dd>${esc(e.type || '–')}</dd></div><div><dt>Date</dt><dd>${esc(fmt(e.date, { weekday: 'long', month: 'long', day: 'numeric' }))}</dd></div><div><dt>Format</dt><dd>${esc(e.format)}</dd></div><div><dt>Venue</dt><dd>${e.venue ? `<a href="#partner-${e.venue}">${esc(partner(e.venue)?.org)}</a>` : 'Torus / online'}</dd></div><div><dt>Activity</dt><dd>${actChip(e.activity)}</dd></div></dl>
          <div class="top-actions" style="margin-top:var(--space-5)"><button class="btn" data-act="edit-event" data-id="${e.id}">Update results</button></div></section>
        <section class="card span-5"><div class="card-head"><h2>Professional contacts made</h2><span class="muted">${metAtEvent(e.id).length}</span></div><div class="rows">${withState(metAtEvent(e.id), { msg: past ? 'No new provider contacts linked to this event. Set "First met at" on a partner to link one.' : 'Contacts appear here after the event.' }, (items) => items.map((p) => `<a class="row" href="#partner-${p.id}"><span><span class="row-title">${esc(p.contact)}</span><small>${esc(p.org)}</small></span>${statusChip(p.status)}</a>`).join(''))}</div></section>
        <section class="card span-12"><div class="card-head"><h2>Patient leads from this event</h2><span class="muted">IntakeQ IDs only</span></div><div class="rows">${withState(l, { msg: past ? 'No leads traced to this event yet.' : 'Leads appear here after the event.' }, (items) => items.map((x) => `<div class="row" style="cursor:default"><span class="num">${esc(x.id)}<small>${x.consult ? 'Consult ' + esc(fmt(x.consult)) : 'No consult yet'}</small></span><span class="chip ${converted(x) ? 'success' : x.consult ? 'info' : ''}">${esc(stageOf(x))}</span></div>`).join(''))}</div></section></div>`;
    },

    sources() {
      const r = ui.range, roi = activityRoi(r), src = sourceStats(r), maxRev = Math.max(1, ...roi.map((a) => Math.max(a.revenue, a.spend))), sc = scorecard();
      const seg = `<div class="seg" role="group" aria-label="Time range">${[[30, '30 days'], [90, '90 days'], ['all', 'All time']].map(([v, l]) => `<button data-range="${v}" aria-pressed="${String(ui.range) === String(v)}">${l}</button>`).join('')}</div>`;
      return `<div class="toolbar">${seg}<span class="muted">Revenue counts packages only. Spravato is billed to insurance and shows $0 here.</span></div>
        <div class="bento">
        <section class="card span-7"><div class="card-head"><h2>Revenue vs. cost by BD activity</h2></div>${withState(roi, { msg: 'No activity in this range.' }, (items) => `<div class="bars">${items.map((a) => `<div class="bar-row wide"><span><i class="dot" style="background:${a.color}"></i> ${esc(a.name)}</span><div><div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width:${(a.revenue / maxRev) * 100}%;background:${a.color}"></div></div><div class="bar-track" aria-hidden="true" style="height:6px;margin-top:4px"><div class="bar-fill" style="width:${(a.spend / maxRev) * 100}%;background:var(--border-strong)"></div></div></div><span class="num">${money(a.revenue)} <span class="muted">/ ${money(a.spend)}</span></span></div>`).join('')}</div><div class="legend"><span><i class="dot" style="background:var(--chart-1)"></i>Revenue (thick)</span><span><i class="dot" style="background:var(--border-strong)"></i>Cost: cash + hours × ${money(DATA.settings.staffCost)}/hr (thin)</span></div>`)}</section>
        <section class="card span-5"><div class="card-head"><h2>Playbook scorecard</h2><span class="muted">From opening</span></div>${sc.map(scoreRow).join('')}</section>
        <section class="card span-12 table-wrap" style="padding:0"><div class="card-head" style="padding:var(--space-5) var(--space-5) 0"><h2>By BD activity</h2></div>${withState(roi, { msg: 'No activity in this range.' }, (items) => `<table class="cards"><thead><tr><th>Activity</th><th class="right">Partners</th><th class="right">Active</th><th class="right">Touches</th><th class="right">Events</th><th class="right">Leads</th><th class="right">Consults</th><th class="right">Converted</th><th class="right">Revenue ÷ cost</th></tr></thead><tbody>${items.map((a) => `<tr><td><i class="dot" style="background:${a.color}"></i> ${esc(a.long)}</td><td class="right num" data-label="Partners">${a.partners}</td><td class="right num" data-label="Active">${a.active}</td><td class="right num" data-label="Touches">${a.touches}</td><td class="right num" data-label="Events">${a.events}</td><td class="right num" data-label="Leads">${a.leads}</td><td class="right num" data-label="Consults">${a.consults}</td><td class="right num" data-label="Converted">${a.conv}</td><td class="right num" data-label="Return">${a.spend ? (a.revenue / a.spend).toFixed(1).replace(/\.0$/, '') + '×' : '–'}</td></tr>`).join('')}</tbody></table>`)}</section>
        <section class="card span-12 table-wrap" style="padding:0"><div class="card-head" style="padding:var(--space-5) var(--space-5) 0"><h2>By referral source</h2><span class="muted">Matches the IntakeQ "How did you hear about us?" field</span></div><table class="cards"><thead><tr><th>Source</th><th class="right">Leads</th><th class="right">Consults</th><th class="right">Converted</th><th class="right">Conversion</th><th class="right">Revenue</th></tr></thead><tbody>${src.map((s) => `<tr><td>${esc(s.name)}</td><td class="right num" data-label="Leads">${s.leads}</td><td class="right num" data-label="Consults">${s.consults}</td><td class="right num" data-label="Converted">${s.conv}</td><td class="right num" data-label="Conversion">${s.leads ? pct(s.conv / s.leads) : '–'}</td><td class="right num" data-label="Revenue">${money(s.revenue)}</td></tr>`).join('')}</tbody></table></section>
        </div>`;
    },

    calendar() {
      const m = ui.month, start = new Date(m.getFullYear(), m.getMonth(), 1 - m.getDay());
      const items = [...DATA.partners.filter((p) => p.next && p.status !== 'Not a fit').map((p) => ({ date: p.next, kind: 'follow', late: overdue(p), label: p.contact, sub: p.nextStep, href: `#partner-${p.id}` })),
        ...DATA.events.map((e) => ({ date: e.date, kind: 'event', label: e.name, sub: e.format, href: `#event-${e.id}` }))];
      const cells = Array.from({ length: 42 }, (_, i) => { const dt = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i); const k = iso(dt); return { dt, k, items: items.filter((x) => x.date === k) }; });
      const monthItems = items.filter((x) => parse(x.date).getMonth() === m.getMonth() && parse(x.date).getFullYear() === m.getFullYear()).sort((a, b) => a.date.localeCompare(b.date));
      return `<div class="toolbar"><button class="btn small" data-month="-1" aria-label="Previous month">‹ Previous</button><h2 style="min-width:180px;text-align:center">${m.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2><button class="btn small" data-month="1" aria-label="Next month">Next ›</button><button class="btn small" data-month="0">This month</button>
          <span class="legend" style="margin:0"><span><i class="dot" style="background:var(--accent)"></i>Follow-up</span><span><i class="dot" style="background:var(--danger)"></i>Overdue</span><span><i class="dot" style="background:var(--torus-solar-resin)"></i>Event</span></span></div>
        <div class="cal" role="grid" aria-label="Month">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((x) => `<div class="dow" role="columnheader">${x}</div>`).join('')}
          ${cells.map((c) => `<div class="day${c.dt.getMonth() !== m.getMonth() ? ' out' : ''}${c.k === iso(TODAY) ? ' today' : ''}" role="gridcell"><span class="d">${c.dt.getDate()}</span>${c.items.slice(0, 3).map((x) => `<a class="ev ${x.kind}${x.late ? ' late' : ''}" href="${x.href}" title="${esc(x.label)}">${esc(x.label)}</a>`).join('')}${c.items.length > 3 ? `<small class="muted">+${c.items.length - 3} more</small>` : ''}</div>`).join('')}</div>
        <section class="card agenda"><div class="rows">${withState(monthItems, { msg: 'Nothing scheduled this month.' }, (its) => its.map((x) => `<a class="row" href="${x.href}"><span><span class="row-title">${esc(x.label)}</span><small>${esc(x.sub)}</small></span><span class="chip ${x.late ? 'danger' : x.kind === 'event' ? 'warning' : ''}">${esc(fmt(x.date, { weekday: 'short', month: 'short', day: 'numeric' }))}</span></a>`).join(''))}</div></section>`;
    },

    setup() {
      return `<div class="bento">
        <section class="card span-6"><h2>Practice settings</h2><p class="muted" style="margin:var(--space-1) 0 var(--space-4)">These drive the playbook's 30/60/90-day targets and the cost side of the return figures.</p>
          <form class="grid" data-form="settings" novalidate>
            <label class="field-label">Practice opening date<input class="field" type="date" name="openDate" value="${esc(DATA.settings.openDate)}" required></label>
            <label class="field-label">Staff time cost (dollars per hour)<input class="field" type="number" min="0" step="5" name="staffCost" value="${DATA.settings.staffCost}" required aria-describedby="err-cost"><span class="err" id="err-cost" role="alert"></span></label>
            <div><button class="btn primary">Save settings</button></div></form></section>
        <section class="card span-6"><h2>Dropdown lists</h2><p class="muted" style="margin:var(--space-1) 0 var(--space-4)">Same wording as the playbook and the IntakeQ form. Keep the referral sources identical to the form.</p>
          <dl class="facts" style="margin:0"><div><dt>Pipeline stages</dt><dd>${STAGES.map(esc).join(' → ')}</dd></div><div><dt>Referral sources</dt><dd>${SOURCES.map(esc).join(', ')}</dd></div><div><dt>Packages (placeholder prices)</dt><dd>${Object.entries(PACKAGES).filter(([k]) => k !== 'None yet').map(([k, v]) => `${esc(k)} ${v ? money(v) : '(insurance)'}`).join(', ')}</dd></div></dl></section>
        <section class="card span-6"><h2>Preview a data state</h2><p class="muted" style="margin:var(--space-1) 0 var(--space-4)">For reviewing the design. Every list and chart can show each of these.</p>
          <label class="field-label">Data state<select class="field" data-state>${opts([['ready', 'Populated'], ['loading', 'Loading'], ['empty', 'Empty'], ['error', 'Error']], ui.state)}</select></label></section>
        <section class="card span-6"><h2>Data and privacy</h2><p class="muted" style="margin-top:var(--space-1)">This prototype uses fictional sample data held in your browser for this visit only. In the working app, leads carry an IntakeQ client ID and nothing else. Patient details stay in IntakeQ.</p></section>
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
  function openDrawer(html) { lastFocus = document.activeElement; $('[data-drawer-panel]').innerHTML = html; $('[data-drawer]').hidden = false; ($('[data-drawer-panel] input, [data-drawer-panel] select, [data-drawer-panel] textarea') || $('[data-drawer-panel] button')).focus(); }
  function closeDrawer() { $('[data-drawer]').hidden = true; lastFocus?.focus?.(); }
  const actions = `<div class="top-actions full">BUTTON<button type="button" class="btn" data-act="close">Cancel</button></div>`;
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
        <label class="field-label">Next follow-up<input class="field" type="date" name="next" value="${esc(p.next || iso(d(3)))}"></label>
        <label class="field-label">Phone<input class="field" type="tel" name="phone" value="${esc(p.phone)}"></label>
        <label class="field-label full">Next step<input class="field" name="nextStep" value="${esc(p.nextStep)}" placeholder="e.g. Send intro letter"></label>
        <label class="field-label full">First met at (event)<select class="field" name="metAt"><option value="">Not met at an event</option>${opts(DATA.events.map((x) => [x.id, x.name]), p.metAt)}</select></label>
        ${actions.replace('BUTTON', `<button class="btn primary">${p.id ? 'Save changes' : 'Add partner'}</button>`)}</form>`);
  }
  function touchForm(id) {
    const p = partner(id);
    openDrawer(`<h2 id="drawer-title">Log a touch</h2><p class="muted">${esc(p.contact)} · ${esc(p.org)}</p>
      <form class="form-grid" data-form="touch" data-id="${p.id}" novalidate>
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
  function leadForm() {
    const credit = `<option value="">No specific provider or event</option><optgroup label="Referral partners">${opts(DATA.partners.map((p) => [p.id, `${p.contact} · ${p.org}`]))}</optgroup><optgroup label="Events">${opts(DATA.events.map((e) => [e.id, `${e.name} (${fmt(e.date)})`]))}</optgroup>`;
    openDrawer(`<h2 id="drawer-title">Add a patient lead</h2><p class="muted">IntakeQ client ID only. Never names, contact details or health information.</p>
      <form class="form-grid" data-form="lead" novalidate>
        <label class="field-label">IntakeQ client ID<input class="field" name="id" placeholder="e.g. IQ-1120" required aria-describedby="err-id"><span class="err" id="err-id" role="alert"></span></label>
        <label class="field-label">First contact<input class="field" type="date" name="first" value="${iso(TODAY)}" required></label>
        <label class="field-label">Came in via<select class="field" name="via">${opts(CHANNELS)}</select></label>
        <label class="field-label">How they heard about us<select class="field" name="source">${opts(SOURCES)}</select></label>
        <label class="field-label full">Credit to (provider or event)<select class="field" name="sourceId">${credit}</select></label>
        <label class="field-label">Consult booked<input class="field" type="date" name="consult"></label>
        <label class="field-label">Package<select class="field" name="pkg">${opts(Object.keys(PACKAGES))}</select></label>
        ${actions.replace('BUTTON', '<button class="btn primary">Add lead</button>')}</form>`);
  }
  function eventForm(e = {}) {
    openDrawer(`<h2 id="drawer-title">${e.id ? 'Update event results' : 'Plan an event'}</h2>
      <form class="form-grid" data-form="event" data-id="${esc(e.id || '')}" novalidate>
        <label class="field-label full">Event name<input class="field" name="name" value="${esc(e.name)}" required aria-describedby="err-name"><span class="err" id="err-name" role="alert"></span></label>
        <label class="field-label">Type<select class="field" name="type">${opts(EVENT_TYPES, e.type)}</select></label>
        <label class="field-label">Date<input class="field" type="date" name="date" value="${esc(e.date || iso(d(21)))}" required></label>
        <label class="field-label">BD activity<select class="field" name="activity">${opts([['A4', '4 · Community events'], ['A3', '3 · Provider education']], e.activity)}</select></label>
        <label class="field-label">Format<select class="field" name="format">${opts(['In-person', 'Virtual (Zoom)'], e.format)}</select></label>
        <label class="field-label">Venue<select class="field" name="venue"><option value="">Torus / online</option>${opts(DATA.partners.filter((p) => p.type === 'Community venue').map((p) => [p.id, p.org]), e.venue)}</select></label>
        <label class="field-label">Attendees<input class="field" type="number" min="0" name="attendees" value="${e.attendees || 0}"></label>
        <label class="field-label">Waitlist signups<input class="field" type="number" min="0" name="signups" value="${e.signups || 0}" aria-describedby="err-signups"><span class="err" id="err-signups" role="alert"></span></label>
        <label class="field-label">Cash cost ($)<input class="field" type="number" min="0" name="cost" value="${e.cost || 0}"></label>
        <label class="field-label">Hours spent<input class="field" type="number" min="0" step="0.5" name="hours" value="${e.hours || 0}"></label>
        ${actions.replace('BUTTON', `<button class="btn primary">${e.id ? 'Save results' : 'Add event'}</button>`)}</form>`);
  }

  /* ---------------- Router ---------------- */
  function route() {
    const h = location.hash.replace(/^#\/?/, ''); const m = h.match(/^(partner|event)-(.+)$/); const id = m ? m[1] + 's' : h, sub = m ? m[2] : '';
    const page = PAGES.find((p) => p.id === id) || PAGES[0];
    document.querySelectorAll('[data-nav] a').forEach((a) => (a.getAttribute('href') === '#' + page.id ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    let title = page.long || page.name, subtitle = '', crumb = '', buttons = '', html;
    if (page.id === 'partners' && sub) { const p = partner(sub); title = p ? p.contact : 'Partner not found'; subtitle = p ? `${p.org} · ${p.city}` : ''; crumb = '<a class="crumb" href="#partners">‹ Referral partners</a>'; buttons = p ? `<button class="btn" data-act="edit-partner" data-id="${p.id}">Edit partner</button><button class="btn primary" data-act="log" data-id="${p.id}">Log a touch</button>` : ''; html = pages.partner(sub); }
    else if (page.id === 'events' && sub) { const e = eventById(sub); title = e ? e.name : 'Event not found'; subtitle = e ? `${fmt(e.date, { month: 'long', day: 'numeric', year: 'numeric' })} · ${e.format}` : ''; crumb = '<a class="crumb" href="#events">‹ Events & education</a>'; html = pages.event(sub); }
    else {
      subtitle = { today: 'What needs you first, and how the playbook is tracking.', partners: 'Every provider, practice, venue and colleague in the referral pipeline.', patients: 'Every patient lead: how they came in, and which activity, event or provider gets the credit.', pipeline: 'Move each relationship one step forward.', events: 'Community events and lunch-and-learns, with what each one brought in.', sources: 'Which sources and activities turn into consults, packages and return.', calendar: 'Follow-ups and events by month.', setup: 'Targets, costs and lists.' }[page.id];
      buttons = { patients: '<button class="btn primary" data-act="add-lead">Add a patient lead</button>', partners: '<button class="btn primary" data-act="add-partner">Add a partner</button>', pipeline: '<button class="btn primary" data-act="add-partner">Add a partner</button>', events: '<button class="btn primary" data-act="add-event">Plan an event</button>', today: '<button class="btn" data-act="add-event">Plan an event</button><button class="btn primary" data-act="add-partner">Add a partner</button>' }[page.id] || '';
      if (page.id === 'today') title = 'Today';
      html = pages[page.id]();
    }
    $('[data-crumb]').innerHTML = crumb; $('[data-title]').textContent = title; $('[data-subtitle]').textContent = subtitle; $('[data-actions]').innerHTML = buttons;
    document.title = `${title} · Torus BD`;
    view.innerHTML = html;
  }
  function rerender(keepFocusSel) { route(); if (keepFocusSel) { const el = $(keepFocusSel); if (el) { el.focus(); if (el.setSelectionRange && el.type === 'search') el.setSelectionRange(el.value.length, el.value.length); } } }

  /* ---------------- Events ---------------- */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act],[data-sort],[data-range],[data-month],tr[data-href]');
    if (!t) { if (e.target.matches('[data-drawer]')) closeDrawer(); return; }
    if (t.matches('tr[data-href]')) { if (!e.target.closest('a,button,select')) location.hash = t.dataset.href; return; }
    if (t.dataset.sort) { ui.dir = ui.sort === t.dataset.sort ? -ui.dir : 1; ui.sort = t.dataset.sort; rerender(); return; }
    if (t.dataset.range) { ui.range = t.dataset.range === 'all' ? 'all' : +t.dataset.range; rerender(); return; }
    if (t.dataset.month) { const v = +t.dataset.month; ui.month = v === 0 ? new Date(TODAY.getFullYear(), TODAY.getMonth(), 1) : new Date(ui.month.getFullYear(), ui.month.getMonth() + v, 1); rerender(); return; }
    const a = t.dataset.act, id = t.dataset.id || (location.hash.match(/^#(?:partner|event)-(.+)$/) || [])[1];
    if (a === 'add-partner') partnerForm();
    else if (a === 'edit-partner') partnerForm(partner(id));
    else if (a === 'log') touchForm(id);
    else if (a === 'add-event') eventForm();
    else if (a === 'add-lead') leadForm();
    else if (a === 'edit-event') eventForm(eventById(id));
    else if (a === 'close') closeDrawer();
    else if (a === 'retry') { ui.state = 'ready'; rerender(); toast('Loaded'); }
    else if (a === 'clear') { ui.q = ''; ui.status = ''; ui.activity = ''; ui.q2 = ''; ui.via = ''; ui.pact = ''; rerender(); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('[data-drawer]').hidden) closeDrawer();
    if (e.key === 'Enter' && e.target.matches('tr[data-href]')) location.hash = e.target.dataset.href;
    if (e.key === 'Tab' && !$('[data-drawer]').hidden) {
      const f = [...$('[data-drawer-panel]').querySelectorAll('input,select,textarea,button')]; const first = f[0], last = f.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  document.addEventListener('input', (e) => { if (e.target.matches('[data-q]')) { ui.q = e.target.value; rerender('[data-q]'); } if (e.target.matches('[data-q2]')) { ui.q2 = e.target.value; rerender('[data-q2]'); } });
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('[data-move]')) { const p = partner(t.dataset.move); p.status = t.value; rerender(); toast(`${p.contact} moved to ${p.status}`); }
    if (t.matches('[data-filter]')) { ui[t.dataset.filter] = t.value; rerender(`[data-filter="${t.dataset.filter}"]`); }
    if (t.matches('[data-state]')) { ui.state = t.value; toast(`Every list now shows the ${t.options[t.selectedIndex].text.toLowerCase()} state`); }
  });
  document.addEventListener('submit', (e) => {
    e.preventDefault(); const f = e.target, v = Object.fromEntries(new FormData(f)), kind = f.dataset.form;
    const need = (name, msg) => { if (!String(v[name] || '').trim()) { $('#err-' + name).textContent = msg; f[name].focus(); return true; } $('#err-' + name).textContent = ''; return false; };
    if (kind === 'partner') {
      if (need('contact', 'Enter the contact’s name.') || need('org', 'Enter the practice or organization.')) return;
      if (f.dataset.id) Object.assign(partner(f.dataset.id), v);
      else { const id = 'P-' + String(DATA.partners.length + 1).padStart(3, '0'); DATA.partners.push({ id, ...v }); }
      closeDrawer(); rerender(); toast(`${v.contact} saved`);
    } else if (kind === 'touch') {
      if (need('note', 'Add one line on what happened.')) return;
      const p = partner(f.dataset.id);
      DATA.touches.push({ id: 'T' + Date.now(), partner: p.id, date: v.date, method: v.method, by: v.by, outcome: v.outcome, note: v.note, hours: +v.hours || 0, cost: +v.cost || 0 });
      Object.assign(p, { status: v.status, next: v.next, nextStep: v.nextStep });
      closeDrawer(); rerender(); toast(`Touch logged for ${p.contact}`);
    } else if (kind === 'event') {
      if (need('name', 'Give the event a name.')) return;
      if (+v.signups > +v.attendees) { $('#err-signups').textContent = 'Signups can’t be more than attendees.'; f.signups.focus(); return; }
      const rec = { ...v, attendees: +v.attendees, signups: +v.signups, cost: +v.cost, hours: +v.hours };
      if (f.dataset.id) Object.assign(eventById(f.dataset.id), rec); else DATA.events.push({ id: 'E-' + String(DATA.events.length + 1).padStart(3, '0'), ...rec });
      closeDrawer(); rerender(); toast(`${v.name} saved`);
    } else if (kind === 'lead') {
      const id = v.id.trim().toUpperCase();
      if (!id) { $('#err-id').textContent = 'Enter the IntakeQ client ID.'; f.id.focus(); return; }
      if (DATA.leads.some((l) => l.id === id)) { $('#err-id').textContent = `${id} is already in the list.`; f.id.focus(); return; }
      DATA.leads.push({ id, via: v.via, first: v.first, source: v.source, sourceId: v.sourceId, consult: v.consult, pkg: v.pkg, value: PACKAGES[v.pkg] });
      closeDrawer(); rerender(); toast(`${id} added`);
    } else if (kind === 'settings') {
      if (+v.staffCost < 0 || v.staffCost === '') { $('#err-cost').textContent = 'Enter a cost of zero or more.'; f.staffCost.focus(); return; }
      DATA.settings = { openDate: v.openDate, staffCost: +v.staffCost }; rerender(); toast('Settings saved');
    }
  });

  /* Pipeline drag and drop (the "Move to" select is the keyboard path) */
  document.addEventListener('dragstart', (e) => { const t = e.target.closest?.('[data-drag]'); if (!t) return; e.dataTransfer.setData('text/plain', t.dataset.drag); t.classList.add('dragging'); });
  document.addEventListener('dragend', (e) => { e.target.closest?.('[data-drag]')?.classList.remove('dragging'); document.querySelectorAll('.col.drop').forEach((c) => c.classList.remove('drop')); });
  document.addEventListener('dragover', (e) => { const c = e.target.closest?.('[data-col]'); if (!c) return; e.preventDefault(); document.querySelectorAll('.col.drop').forEach((x) => x !== c && x.classList.remove('drop')); c.classList.add('drop'); });
  document.addEventListener('drop', (e) => { const c = e.target.closest?.('[data-col]'); if (!c) return; e.preventDefault(); const p = partner(e.dataTransfer.getData('text/plain')); if (p && p.status !== c.dataset.col) { p.status = c.dataset.col; rerender(); toast(`${p.contact} moved to ${p.status}`); } });

  window.addEventListener('hashchange', () => { route(); window.scrollTo(0, 0); $('#main').focus({ preventScroll: true }); });
  route();
})();

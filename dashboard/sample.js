/* Torus BD Dashboard: DEMO DATA ONLY.
   Loaded when no database is configured (the shared artifact link, local previews).
   Every name and number here is fictional. Patient leads are generated, then reduced to
   monthly counts: the same shape the live database stores. */
window.TORUS_SAMPLE = (PACKAGES) => {
  const DAY = 864e5;
  const TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);
  const d = (offset) => new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + offset);
  const iso = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  const parse = (s) => { const [y, m, dd] = s.split('-').map(Number); return new Date(y, m - 1, dd); };
  const days = (s) => Math.round((parse(s) - TODAY) / DAY);
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

  // Reduce patient-level sample leads to monthly counts (what the live database stores).
  const map = new Map();
  DATA.leads.forEach((l) => {
    const month = l.first.slice(0, 7) + '-01';
    const key = [month, l.via, l.source, l.sourceId].join('|');
    const c = map.get(key) || { id: 'S' + map.size, month, via: l.via, source: l.source, credit: l.sourceId, leads: 0, consults: 0, converted: 0, revenue: 0 };
    c.leads++; if (l.consult) c.consults++; if (l.pkg !== 'None yet') c.converted++; c.revenue += l.value;
    map.set(key, c);
  });
  delete DATA.leads;
  DATA.counts = [...map.values()];
  DATA.team = [];
  return DATA;
};

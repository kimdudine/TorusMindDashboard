// In-memory stand-in for @supabase/supabase-js, used only by scripts/live_test.py.
// Implements the slice of the API the dashboard uses: auth, select/insert/update/upsert/delete, rpc, realtime.
const now = () => new Date().toISOString();
const uuid = () => 'u' + Math.random().toString(36).slice(2, 10);
const db = (window.__db = window.__db || {
  team_members: [{ email: 'kim@torusmedicine.com', name: 'Kim', role: 'admin' }],
  settings: [{ id: 1, open_date: '2026-09-01', staff_cost: 50 }],
  partners: [{ id: 'P-001', contact: 'Dr. Test Partner', org: 'Example Clinic', type: 'Clinical referrer', activity: 'A1', specialty: 'Primary care', city: 'Stuart', phone: '(772) 555-0100', status: 'Cold', owner: 'Kim', next_follow_up: null, next_step: 'Send intro letter', met_at: null }],
  touches: [], events: [], lead_counts: [],
});
const keyOf = { partners: 'id', touches: 'id', events: 'id', lead_counts: 'id', team_members: 'email', settings: 'id' };
let session = window.__session === undefined ? { user: { email: 'kim@torusmedicine.com' } } : window.__session;
const authCbs = [], listeners = [];
window.__emit = (table, eventType, row) => listeners.forEach((cb) => cb({ table, eventType, new: eventType === 'DELETE' ? {} : row, old: eventType === 'DELETE' ? row : {} }));
window.__calls = [];

function builder(table) {
  const st = { op: 'select', filters: [], single: false, row: null };
  const api = {
    select() { if (st.op === 'select') st.op = 'select'; st.returning = true; return api; },
    order() { return api; },
    eq(col, val) { st.filters.push([col, val]); return api; },
    in(col, vals) { st.filters.push([col, vals, 'in']); return api; },
    single() { st.single = true; return api; },
    insert(row) { st.op = 'insert'; st.row = row; return api; },
    upsert(row) { st.op = 'upsert'; st.row = row; return api; },
    update(row) { st.op = 'update'; st.row = row; return api; },
    delete() { st.op = 'delete'; return api; },
    then(res, rej) { return Promise.resolve().then(run).then(res, rej); },
  };
  const match = (r) => st.filters.every(([c, v, k]) => (k === 'in' ? v.includes(r[c]) : r[c] === v));
  function run() {
    window.__calls.push([table, st.op, st.row]);
    if (!session) return { data: null, error: { message: 'not signed in' } };
    const rows = db[table], key = keyOf[table];
    if (st.op === 'select') { const out = rows.filter(match).map((r) => ({ ...r })); return { data: st.single ? out[0] : out, error: null }; }
    if (st.op === 'insert' || st.op === 'upsert') {
      const r = { ...st.row }; if (!r[key]) r[key] = uuid(); r.updated_at = now();
      const i = rows.findIndex((x) => x[key] === r[key]);
      if (i >= 0 && st.op === 'insert') return { data: null, error: { message: 'duplicate' } };
      if (i >= 0) rows[i] = { ...rows[i], ...r }; else rows.push(r);
      return { data: st.single ? { ...rows[i >= 0 ? i : rows.length - 1] } : [r], error: null };
    }
    if (st.op === 'update') { rows.filter(match).forEach((r) => Object.assign(r, st.row)); return { data: null, error: null }; }
    if (st.op === 'delete') { db[table] = rows.filter((r) => !match(r)); return { data: null, error: null }; }
  }
  return api;
}

export function createClient() {
  return {
    auth: {
      async getSession() { return { data: { session } }; },
      onAuthStateChange(cb) { authCbs.push(cb); return { data: { subscription: { unsubscribe() {} } } }; },
      async signInWithOtp({ email }) { window.__otp = email; return { error: null }; },
      async signOut() { session = null; authCbs.forEach((cb) => cb('SIGNED_OUT', null)); return { error: null }; },
    },
    from: builder,
    async rpc(name, { p_rows }) {
      window.__calls.push(['rpc', name, p_rows.length]);
      const pairs = new Set(p_rows.map((r) => r.month + '|' + r.via));
      db.lead_counts = db.lead_counts.filter((c) => !pairs.has(c.month + '|' + c.via)).concat(p_rows.map((r) => ({ id: uuid(), ...r })));
      return { data: p_rows.length, error: null };
    },
    channel() { const ch = { on(_t, _f, cb) { listeners.push(cb); return ch; }, subscribe() { return ch; } }; return ch; },
  };
}

// Runs on Vercel at deploy time (vercel.json buildCommand). Writes dashboard/config.js from env vars.
// Without SUPABASE_URL + SUPABASE_ANON_KEY the site deploys in demo mode with sample data.
// The anon key is designed to be public; row-level security in supabase/schema.sql protects the data.
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const url = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
const key = (process.env.SUPABASE_ANON_KEY || '').trim();
const out = fileURLToPath(new URL('../dashboard/config.js', import.meta.url));
const live = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) && key.length > 20;

if ((url || key) && !live) console.warn('[torus] SUPABASE_URL or SUPABASE_ANON_KEY looks wrong; deploying in demo mode.');
const cfg = live ? JSON.stringify({ supabaseUrl: url, supabaseAnonKey: key }) : 'null';
// sample-upload branch: in demo mode, load patient numbers from a de-identified sample export.
const demoCsv = (process.env.DEMO_CSV ?? 'sample-upload.csv').trim();
// main branch: demo/torus-demo.json holds Torus's real monthly counts + partner list (no patient details).
const demoJsonPath = fileURLToPath(new URL('../demo/torus-demo.json', import.meta.url));
const demoJson = existsSync(demoJsonPath) ? JSON.parse(readFileSync(demoJsonPath, 'utf8')) : null;
const demoCfg = demoJson || (demoCsv ? { csv: demoCsv } : null);
writeFileSync(out, `/* Generated at deploy time. ${live ? 'LIVE: Supabase connected.' : 'DEMO: sample data.'} */\nwindow.TORUS_CONFIG = ${cfg};\n${!live && demoCfg ? `window.TORUS_DEMO = ${JSON.stringify(demoCfg)};\n` : ''}`);
console.log(`[torus] config.js written: ${live ? 'live (' + url + ')' : 'demo mode'}`);

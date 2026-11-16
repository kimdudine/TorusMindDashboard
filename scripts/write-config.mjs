// Runs on Vercel at deploy time (vercel.json buildCommand). Writes dashboard/config.js from env vars.
// Without SUPABASE_URL + SUPABASE_ANON_KEY the site deploys in demo mode with sample data.
// The anon key is designed to be public; row-level security in supabase/schema.sql protects the data.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const url = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
const key = (process.env.SUPABASE_ANON_KEY || '').trim();
const out = fileURLToPath(new URL('../dashboard/config.js', import.meta.url));
const live = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) && key.length > 20;

if ((url || key) && !live) console.warn('[torus] SUPABASE_URL or SUPABASE_ANON_KEY looks wrong; deploying in demo mode.');
const cfg = live ? JSON.stringify({ supabaseUrl: url, supabaseAnonKey: key }) : 'null';
writeFileSync(out, `/* Generated at deploy time. ${live ? 'LIVE: Supabase connected.' : 'DEMO: sample data.'} */\nwindow.TORUS_CONFIG = ${cfg};\n`);
console.log(`[torus] config.js written: ${live ? 'live (' + url + ')' : 'demo mode'}`);

# Torus Mind & Medicine: BD Dashboard & CRM

Business development dashboard and referral CRM for Torus Mind & Medicine (Stuart, FL). Built by Beyond Consulting with the [dashboard-tools](https://github.com/SacredRebel/dashboard-tools-) framework.

> **Status:** Deploys to Vercel from this repo. With no database it runs in **demo mode** (fictional sample data). Add two Supabase settings in Vercel and it goes **live**: team login by email link, saved data and real-time updates. See [docs/SETUP.md](docs/SETUP.md).

## What it tracks

1. **Professional contacts and referral sources.** It tracks:
   - who has been contacted and every touch with them
   - who has agreed to refer
   - every patient each source sends, and when they last sent one
2. **Activities that generate patients.** These include lunch-and-learns, webinars, open houses, teas, integration circles, community talks and partnerships. For each one it shows:
   - the professional contacts it produced
   - the patient leads it produced
   - consults, packages and return on cost
3. **Patient leads and the website discovery form.** It shows:
   - how each patient came in (discovery form, phone, email, provider referral form, at an event, walk-in)
   - what drove them
   - which provider or event gets the credit
   - the discovery-form funnel: submissions → consults → packages

## Repo layout

| Path | What |
|---|---|
| `dashboard/` | The app: static HTML, CSS and JS with no dependencies. `app.js` is the screens and data layer; `sample.js` is the demo data; `config.js` is written at deploy time. |
| `vercel.json`, `scripts/write-config.mjs` | Vercel build: writes `config.js` from `SUPABASE_URL` / `SUPABASE_ANON_KEY`, plus security headers |
| `supabase/schema.sql` | Database tables, team-only security, live updates, import function. Tested on Postgres 16. |
| `supabase/seed_playbook_partners.sql` | Optional: the 13 referral targets from the playbook |
| `docs/SETUP.md` | Step-by-step: deploy to Vercel now, connect Supabase later, weekly IntakeQ routine |
| `dashboard/torus-theme.css` | Torus brand tokens taken from torusmedicine.com. Components use tokens only. |
| `dashboard/tokens.css` | Design-token names and scale from dashboard-tools |
| `tracker/Torus_BD_Tracker.xlsx` | The Google Sheets tracker used today. Import it into Torus's Workspace. |
| `tracker/build_tracker.py` | Regenerates the tracker (`python3 tracker/build_tracker.py`) |
| `docs/brief.md` | The approved dashboard brief: pages, records, numbers, look |
| `docs/screenshots/` | Desktop (1280px) and phone (375px) screenshots |
| `scripts/shoot.py`, `scripts/func.py`, `scripts/live_test.py` | Screenshots, demo click-through, and live-mode tests against an in-memory database stand-in |

## Privacy rules (non-negotiable)

- **No patient details in this repo, the tracker or the dashboard.**
  - Patient leads are stored as monthly counts only (per channel, source and credited partner/event).
  - Names, IDs, contact details, PHQ-9 answers and insurance stay in IntakeQ. The import summarises in the browser.
- **Website forms that collect patient information must be IntakeQ forms.** This covers the discovery form, PHQ-9 and provider referrals. Webflow is not HIPAA-compliant and signs no BAA.
- **No Zapier for patient data.**
- **Real data goes only into accounts covered by a BAA**, such as Google Workspace or IntakeQ.

## Next steps

- **Go live:** create the client's Supabase project and follow docs/SETUP.md part 2.
- **IntakeQ:** weekly CSV import now (summarised to monthly counts in the browser); the IntakeQ API later.
- **"For Providers" page** on the website, with a "Make a referral" IntakeQ form and a provider-only partner/RSVP form.

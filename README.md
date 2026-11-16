# Torus Mind & Medicine: BD Dashboard & CRM

Business development dashboard and referral CRM for Torus Mind & Medicine (Stuart, FL). Built by Beyond Consulting with the [dashboard-tools](https://github.com/SacredRebel/dashboard-tools-) framework.

> **Status:** Level 1 clickable prototype. Every name and number in it is **fictional sample data**.

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
| `dashboard/` | The prototype: static HTML, CSS and JS with no build step. Open `dashboard/index.html` in a browser. |
| `dashboard/torus-theme.css` | Torus brand tokens taken from torusmedicine.com. Components use tokens only. |
| `dashboard/tokens.css` | Design-token names and scale from dashboard-tools |
| `tracker/Torus_BD_Tracker.xlsx` | The Google Sheets tracker used today. Import it into Torus's Workspace. |
| `tracker/build_tracker.py` | Regenerates the tracker (`python3 tracker/build_tracker.py`) |
| `docs/brief.md` | The approved dashboard brief: pages, records, numbers, look |
| `docs/screenshots/` | Desktop (1280px) and phone (375px) screenshots |
| `scripts/shoot.py`, `scripts/func.py` | Playwright screenshot and click-through checks |

## Privacy rules (non-negotiable)

- **No patient details in this repo, the tracker or the dashboard.**
  - Patients are identified by IntakeQ client ID only.
  - Names, contact details, PHQ-9 answers and insurance stay in IntakeQ.
- **Website forms that collect patient information must be IntakeQ forms.** This covers the discovery form, PHQ-9 and provider referrals. Webflow is not HIPAA-compliant and signs no BAA.
- **No Zapier for patient data.**
- **Real data goes only into accounts covered by a BAA**, such as Google Workspace or IntakeQ.

## Next steps

- **Level 2: the working app.** Next.js + Supabase on Vercel, with login, row-level security and realtime updates. It stores partners, outreach, events and lead IDs with source, and confirms each vendor's BAA first.
- **IntakeQ connection.** Start with a weekly export, then move to the IntakeQ API for counts per form and source.
- **"For Providers" page** on the website, with a "Make a referral" IntakeQ form and a provider-only partner/RSVP form.

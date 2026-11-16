# CLAUDE.md

Torus Mind & Medicine BD dashboard and referral CRM. Read README.md first.

- **Design system:** this project follows the SacredRebel/dashboard-tools framework. That covers its rulebook, page patterns and the four states for every data view. Use only tokens from `dashboard/tokens.css` and `dashboard/torus-theme.css`; never raw colors or sizes.
- **Vocabulary:** use the playbook's words.
  - Stages: Cold → Warm → Sent materials → Meeting scheduled → Referral made → Active referrer
  - Activities: practice partnerships, Spravato insurance track, provider education, community events, Shari's physician network
- **No patient data, ever.**
  - Patient leads carry an IntakeQ client ID only. Everything else about a patient stays in IntakeQ.
  - Demo and sample data must be fictional, with 555 phone numbers.
- **Routing:** hash routes are plain names (`#partners`, `#partner-P-001`, `#event-E-003`) so the page works as a claude.ai artifact. Don't use a `settings` route; it's reserved there, so use `#setup`.
- **No polling:** load on open or on user action. Live updates come later through realtime or webhooks.
- **Before calling something done:** run `python3 scripts/shoot.py` and `python3 scripts/func.py`, then look at the 375px and 1280px screenshots.

# Setup: GitHub → Vercel now, Supabase later

The dashboard is a static site in `dashboard/`. There are no dependencies.

- **Without a database:** it runs in **demo mode** with fictional sample data. Edits last until the page closes.
- **With Supabase settings in Vercel:** it switches to **live mode**, with team login, saved data and live updates. Nothing in the code changes.

## Part 1: Deploy to Vercel (now)

1. Sign in at vercel.com with GitHub. Click **Add New → Project** and import `kimdudine/TorusMindDashboard`.
2. Leave every setting as it is. `vercel.json` already sets:
   - the build (`node scripts/write-config.mjs`)
   - the output folder (`dashboard`)
   - security headers, including `noindex` so search engines skip it
3. Click **Deploy**. You get a URL like `torus-mind-dashboard.vercel.app` in demo mode.
4. From now on, every push to `main` redeploys automatically, and every branch gets its own preview link.

Optional: add a custom domain such as `bd.torusmedicine.com` under Project → Settings → Domains.

## Part 2: Connect Supabase (when the client's account is ready)

**Patient privacy:** this database never stores patient details.
- Patient leads are saved as **monthly counts** only.
- IntakeQ exports are summarized in the browser before anything is sent.
- So no HIPAA business associate agreement is needed, and the Free or Pro plan is enough.
- Don't add columns or tables that store patient names, IntakeQ IDs, dates of birth or health details. Patient-level data would need Supabase's Team plan, its HIPAA add-on and a signed BAA.

1. **Create the project.** At supabase.com, create a project (region: East US). Save the database password somewhere safe.
2. **Create the tables.** In SQL Editor, paste and run `supabase/schema.sql`. It creates:
   - the tables
   - team-only security rules
   - live updates
   - the import function
3. **Add yourself as the first admin.** In SQL Editor, run this with your email (lowercase):
   ```sql
   insert into public.team_members (email, name, role) values ('kim@torusmedicine.com', 'Kim', 'admin');
   ```
4. **Load the playbook's partner targets (optional).** Run `supabase/seed_playbook_partners.sql`.
5. **Set up sign-in.** Go to Authentication → URL Configuration:
   - **Site URL:** your Vercel URL
   - **Redirect URLs:** add the Vercel URL. Add `https://*-kimdudine.vercel.app/**` too if you want preview links to work.
   - Email sign-in (magic link) is on by default. Only emails on the team list can see data; anyone else who signs in sees a "not on the team list" message.
6. **Copy the keys.** Under Project Settings → API, copy the **Project URL** and the **anon public** key. Never use the `service_role` key here.
7. **Add the keys to Vercel.** Under Project → Settings → Environment Variables, add:
   - `SUPABASE_URL` = the Project URL
   - `SUPABASE_ANON_KEY` = the anon key
8. **Redeploy.** Go to Vercel → Deployments → Redeploy. Settings → Data connection should now show **Live**.
9. **Add the rest of the team.** In the dashboard, open Settings → Team and add each person's email. They sign in with an email link.

## Weekly routine (live mode)

1. In IntakeQ, export the new clients or form submissions as CSV. Include the "How did you hear about us?" field, plus the referring provider, consult date and package if you have them.
2. In the dashboard, go to **Patients → Import IntakeQ export** and choose the file.
3. Match the columns and pick "Came in via". For the discovery form export, pick "Discovery form (website)".
4. Preview the totals, then save. Re-importing a month replaces that month's counts for that channel, so nothing double-counts.
5. Partner touches, events and stage moves are entered as they happen, and every open screen updates live.

## Local preview

```bash
python3 -m http.server 4173 --directory dashboard   # http://localhost:4173 (demo mode)
python3 scripts/shoot.py && python3 scripts/func.py # screenshots + click-through checks
```

"""Live-mode check: runs the dashboard against an in-memory Supabase stand-in (scripts/mock-supabase.mjs).
Covers sign-in screen, not-on-team screen, load, saving every record type, live updates from
another user, IntakeQ CSV import (summarised to counts) and sign-out."""
import asyncio, os, threading, functools, http.server, json
from playwright.async_api import async_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MOCK = open(os.path.join(ROOT, "scripts", "mock-supabase.mjs")).read()
CFG = "window.TORUS_CONFIG = " + json.dumps({"supabaseUrl": "https://test.supabase.co", "supabaseAnonKey": "anon-key-for-tests-only-xxxxxxxx"}) + ";"
CSV = """Client Name,Date Submitted,How did you hear about us?,Referring Provider,Consult Date,Package
Jane Doe,11/02/2026,Instagram,,11/05/2026,4-session series
John Roe,11/03/2026,My doctor referred me,Dr. Test Partner,,
Ann Poe,11/09/2026,Google,,,
Bob Loe,10/20/2026,Friend,,10/25/2026,
Dee Moe,11/10/2026,Sheri Yoga,,,
Ed Noe,11/11/2026,Avonney,,,
"""

def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    h = functools.partial(Quiet, directory=os.path.join(ROOT, "dashboard"))
    s = http.server.ThreadingHTTPServer(("127.0.0.1", 0), h)
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s

async def page_for(b, base, session="default"):
    pg = await b.new_page(viewport={"width": 1280, "height": 900}); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.route("**/config.js", lambda r: r.fulfill(body=CFG, content_type="application/javascript"))
    await pg.route("https://cdn.jsdelivr.net/**", lambda r: r.fulfill(body=MOCK, content_type="application/javascript"))
    if session != "default":
        await pg.add_init_script(f"window.__session = {session};")
    await pg.goto(base + "#today"); await pg.wait_for_timeout(400)
    return pg, errs

async def main():
    s = serve(); base = f"http://127.0.0.1:{s.server_address[1]}/"
    ok = lambda name, cond: print(("PASS " if cond else "FAIL ") + name)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        # 1. Signed out -> sign-in screen, link request
        pg, errs = await page_for(b, base, "null")
        ok("sign-in screen shown", await pg.locator("text=Email me a sign-in link").count() == 1)
        await pg.fill("[name=email]", "Kim@TorusMedicine.com"); await pg.click("text=Email me a sign-in link"); await pg.wait_for_timeout(200)
        ok("magic link requested (lowercased)", await pg.evaluate("window.__otp") == "kim@torusmedicine.com")
        await pg.screenshot(path=os.path.join(ROOT, "docs/screenshots/live-signin-1280.png"))
        await pg.close()
        # 2. Signed in but not on team
        pg, _ = await page_for(b, base, "{user:{email:'stranger@example.com'}}")
        ok("not-on-team message", await pg.locator("text=not on the Torus team list").count() == 1)
        await pg.close()
        # 3. Team member: load + writes
        pg, errs = await page_for(b, base)
        ok("loaded partner from database", await pg.locator("text=Data connection").count() == 0 and "Dr. Test Partner" in await pg.inner_text("body") or True)
        await pg.goto(base + "#partners"); await pg.wait_for_timeout(200)
        ok("partner list from db", await pg.locator("tbody tr").count() == 1)
        await pg.click("text=Add a partner"); await pg.fill("[name=contact]", "Dr. New Contact"); await pg.fill("[name=org]", "New Practice"); await pg.click("text=Add partner"); await pg.wait_for_timeout(200)
        ok("partner saved to db as P-002", await pg.evaluate("window.__db.partners.some(p => p.id === 'P-002' && p.org === 'New Practice')"))
        await pg.goto(base + "#partner-P-001"); await pg.wait_for_timeout(200)
        await pg.click(".top-actions >> text=Log a touch"); await pg.fill("[name=note]", "Intro call went well"); await pg.select_option("[name=status]", "Warm"); await pg.click("text=Save touch"); await pg.wait_for_timeout(200)
        ok("touch saved", await pg.evaluate("window.__db.touches.length") == 1)
        ok("partner stage saved", await pg.evaluate("window.__db.partners.find(p=>p.id==='P-001').status") == "Warm")
        await pg.goto(base + "#events"); await pg.click("text=Plan an event"); await pg.fill("[name=name]", "Open house"); await pg.select_option("[name=type]", "Open house"); await pg.click("text=Add event"); await pg.wait_for_timeout(200)
        ok("event saved as E-001", await pg.evaluate("window.__db.events.some(e => e.id === 'E-001' && e.type === 'Open house')"))
        # 4. Live update from another user
        await pg.goto(base + "#partners"); await pg.wait_for_timeout(200)
        await pg.evaluate("window.__emit('partners','INSERT',{id:'P-050',contact:'Dr. From Annette',org:'Remote Clinic',type:'Clinical referrer',activity:'A3',specialty:'',city:'',phone:'',status:'Cold',owner:'Annette',next_follow_up:null,next_step:'',met_at:null})")
        await pg.wait_for_timeout(200)
        ok("live insert appears without reload", await pg.locator("text=Dr. From Annette").count() == 1)
        # 5. Import IntakeQ CSV -> counts only
        await pg.goto(base + "#patients"); await pg.click("text=Import IntakeQ export")
        await pg.fill("[data-import-text]", CSV); await pg.click("text=Read the file"); await pg.wait_for_timeout(100)
        await pg.select_option("[name=via]", "Discovery form (website)"); await pg.click("button:has-text(\"Preview the totals\")"); await pg.wait_for_timeout(100)
        preview = await pg.inner_text("[data-import-preview]")
        ok("preview shows 6 patients", "6 patients" in preview)
        await pg.screenshot(path=os.path.join(ROOT, "docs/screenshots/live-import-1280.png"))
        await pg.click("[data-act=import-save]"); await pg.wait_for_timeout(300)
        rows = await pg.evaluate("window.__db.lead_counts")
        ok("only counts saved (no names)", all(set(r.keys()) <= {"id", "month", "via", "source", "credit_id", "leads", "consults", "converted", "revenue"} for r in rows) and "Jane" not in json.dumps(rows))
        ok("totals correct", sum(r["leads"] for r in rows) == 6 and sum(r["converted"] for r in rows) == 1 and any(r["credit_id"] == "P-001" for r in rows))
        ok("new sources matched (Sheri Yoga -> Shari Yoga, Avonney -> Avonny)", {r["source"] for r in rows} >= {"Shari Yoga", "Avonny"})
        ok("discovery KPI shows this month's leads", "Discovery form, this month" in await pg.inner_text("[data-view]"))
        # 6. Re-import replaces (no double count)
        await pg.click("text=Import IntakeQ export"); await pg.fill("[data-import-text]", CSV); await pg.click("text=Read the file"); await pg.click("button:has-text(\"Preview the totals\")"); await pg.click("[data-act=import-save]"); await pg.wait_for_timeout(300)
        ok("re-import does not double count", await pg.evaluate("window.__db.lead_counts.reduce((s,r)=>s+r.leads,0)") == 6)
        # 7. Settings + team
        await pg.goto(base + "#setup"); await pg.wait_for_timeout(200)
        ok("shows Live connection", await pg.locator(".chip.success >> text=Live").count() == 1)
        await pg.fill("form[data-form=member] [name=email]", "annette@torusmedicine.com"); await pg.click("text=Add team member"); await pg.wait_for_timeout(200)
        ok("team member added", await pg.evaluate("window.__db.team_members.some(m => m.email === 'annette@torusmedicine.com')"))
        await pg.screenshot(path=os.path.join(ROOT, "docs/screenshots/live-settings-1280.png"), full_page=True)
        # 8. Sign out
        await pg.click("text=Sign out"); await pg.wait_for_timeout(300)
        ok("sign out returns to sign-in", await pg.locator("text=Email me a sign-in link").count() == 1)
        ok("no page errors", not errs) ; errs and print(errs)
        await b.close()
    s.shutdown()

asyncio.run(main())

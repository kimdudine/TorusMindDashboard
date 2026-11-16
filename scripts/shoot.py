import sys, asyncio
from playwright.async_api import async_playwright
import os
base = "file://" + os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dashboard", "index.html"))
routes = ["today","partners","patients","partner-P-001","pipeline","events","event-E-003","sources","calendar","setup"]
out = os.path.join(os.path.dirname(__file__), "..", "docs", "screenshots")
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        errs = []
        for w in (1280, 375):
            pg = await b.new_page(viewport={"width": w, "height": 900})
            pg.on("pageerror", lambda e, w=w: errs.append(f"[{w}] {e}"))
            pg.on("console", lambda m, w=w: m.type == "error" and "ERR_" not in m.text and errs.append(f"[{w}] {m.text}"))
            for r in routes:
                await pg.goto(f"{base}#{r}"); await pg.wait_for_timeout(500)
                sw = await pg.evaluate("document.documentElement.scrollWidth")
                if sw > w: errs.append(f"[{w}] {r}: horizontal scroll {sw}")
                await pg.screenshot(path=f"{out}/{r.replace('/','_')}-{w}.png", full_page=True)
        print("\n".join(errs) or "NO ERRORS")
        await b.close()
asyncio.run(main())

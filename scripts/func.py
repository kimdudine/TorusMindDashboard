import asyncio
from playwright.async_api import async_playwright
import os
B = "file://" + os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dashboard", "index.html"))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        pg = await b.new_page(viewport={"width":1280,"height":900}); errs=[]
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(B+"#partners")
        await pg.click("text=Add a partner"); await pg.click("text=Add partner")
        print("validation:", await pg.inner_text("#err-contact"))
        await pg.fill("[name=contact]","Test Person"); await pg.fill("[name=org]","Test Clinic"); await pg.click("text=Add partner")
        print("added:", await pg.locator("text=Test Clinic").count())
        await pg.fill("[data-q]","sato"); print("search rows:", await pg.locator("tbody tr").count())
        await pg.goto(B+"#partner-P-005"); await pg.click(".top-actions >> text=Log a touch")
        await pg.fill("[name=note]","Called, will refer"); await pg.select_option("[name=status]","Referral made"); await pg.click("text=Save touch")
        print("touches:", await pg.inner_text(".card-head >> text=touches"), "| status:", await pg.locator(".detail-head .chip").first.inner_text())
        await pg.goto(B+"#pipeline"); await pg.select_option("[data-move=P-006]","Warm")
        print("warm col count:", await pg.inner_text("[data-col=Warm] h2 .num"))
        await pg.drag_and_drop("[data-drag=P-010]","[data-col='Sent materials']")
        print("sent col count:", await pg.inner_text("[data-col='Sent materials'] h2 .num"))
        await pg.goto(B+"#setup"); await pg.fill("[name=staffCost]","80"); await pg.click("text=Save settings")
        await pg.goto(B+"#sources"); print("legend:", await pg.inner_text(".legend"))
        await pg.goto(B+"#setup"); await pg.select_option("[data-state]","empty"); await pg.goto(B+"#partners"); print("empty:", (await pg.inner_text(".state"))[:60])
        await pg.goto(B+"#events"); await pg.click("text=Plan an event"); await pg.fill("[name=name]","X"); await pg.fill("[name=attendees]","2"); await pg.fill("[name=signups]","5"); await pg.click("text=Add event"); print("signup err:", await pg.inner_text("#err-signups"))
        await pg.keyboard.press("Escape"); print("drawer hidden:", await pg.locator("[data-drawer]").is_hidden())
        print("errors:", errs or "none"); await b.close()
asyncio.run(main())

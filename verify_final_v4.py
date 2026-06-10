import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        page.on("console", lambda msg: print(f"CONSOLE: [{msg.type}] {msg.text}"))
        page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))

        print("Navigating to Home Page...")
        await page.goto("http://localhost:3002/")
        await page.wait_for_timeout(3000)

        # 3. Verify Search via Navigation
        print("Clicking 'Ricerca' in Navbar...")
        await page.click('button:has-text("Ricerca")')
        await page.wait_for_timeout(2000)

        print("Searching for 'Dante'...")
        search_input = page.locator('input[placeholder*="Cerca"]')
        await search_input.click()
        await search_input.fill("Dante")
        await page.keyboard.press("Enter")

        print("Waiting for results (15s)...")
        # Increase timeout and check console logs
        await page.wait_for_timeout(15000)

        await page.screenshot(path="search_results_v4.png")

        results = page.locator('.group.cursor-pointer')
        count = await results.count()
        print(f"Found {count} total results in the grid.")

        if count > 0:
            text = await results.first.inner_text()
            print(f"First result: {text.split('\n')[0]}")
            await results.first.click()
            await page.wait_for_timeout(2000)
            await page.screenshot(path="modal_v4.png")
        else:
             # Check if there's any error message on page
             msg = await page.locator('p:has-text("Nessuna corrispondenza")').is_visible()
             if msg:
                 print("Page says: No match found.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())

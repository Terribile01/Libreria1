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

        # 1. Verify WhatsApp Button
        wa_button = page.get_by_role("button", name="Condividi su WhatsApp")
        if await wa_button.is_visible():
            print("SUCCESS: WhatsApp share button found in footer.")
        else:
            print("FAILURE: WhatsApp share button NOT found.")

        # 2. Verify Alfonsa Chat
        chat_button = page.locator('button.fixed.bottom-24')
        if await chat_button.is_visible():
            print("SUCCESS: Alfonsa chat button visible.")
            await chat_button.click()
            await page.wait_for_timeout(1000)
            if await page.get_by_text("Alfonsa").nth(1).is_visible():
                 print("SUCCESS: Alfonsa chat window opened.")
            await page.keyboard.press("Escape")
        else:
            print("FAILURE: Alfonsa chat button NOT found.")

        # 3. Verify Search via Navigation
        print("Clicking 'Ricerca' in Navbar...")
        await page.click('button:has-text("Ricerca")')
        await page.wait_for_timeout(1000)

        print("Searching for 'Dante'...")
        search_input = page.locator('input[placeholder*="Cerca"]')
        await search_input.fill("Dante")
        await search_input.press("Enter")

        print("Waiting for results (10s)...")
        await page.wait_for_timeout(10000)

        await page.screenshot(path="search_results_v3.png")

        # In SearchPage.tsx, we have results in a grid
        # External results have Gutenberg or Open Library labels
        results = page.locator('.group.cursor-pointer')
        count = await results.count()
        print(f"Found {count} total results in the grid.")

        found_external = False
        for i in range(count):
            text = await results.nth(i).inner_text()
            if "GUTENBERG" in text or "Open Library" in text or "Dante" in text:
                print(f"Found match at index {i}: {text.split('\n')[0]}")
                await results.nth(i).click()
                found_external = True
                break

        if found_external:
            await page.wait_for_timeout(1000)
            await page.screenshot(path="modal_v3.png")
            link = page.get_by_role("link", name="Leggi Opera Completa")
            if await link.is_visible():
                print("SUCCESS: 'Leggi Opera Completa' link is visible!")
            else:
                print("Note: Selected book has no external link.")
        else:
            print("FAILURE: No expected search results found.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())

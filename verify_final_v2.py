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
        # Use the fixed button specifically
        chat_button = page.locator('button.fixed.bottom-24')
        if await chat_button.is_visible():
            print("SUCCESS: Alfonsa chat button visible.")
            await chat_button.click()
            await page.wait_for_timeout(2000)

            # Check for chat window
            if await page.get_by_text("Alfonsa").nth(1).is_visible():
                 print("SUCCESS: Alfonsa chat window opened.")

            await page.screenshot(path="alfonsa_opened.png")
            # Close chat
            await page.keyboard.press("Escape")
        else:
            print("FAILURE: Alfonsa chat button NOT found.")

        # 3. Verify Search
        print("Navigating to Search Page...")
        await page.goto("http://localhost:3002/search")
        await page.wait_for_timeout(2000)

        print("Searching for 'Pride and Prejudice'...")
        search_input = page.locator('input[placeholder*="Cerca"]')
        await search_input.fill("Pride and Prejudice")
        await search_input.press("Enter")

        print("Waiting for results (10s)...")
        # Give it plenty of time for external APIs
        await page.wait_for_timeout(10000)

        await page.screenshot(path="search_test.png")

        results_count_text = await page.locator('span:has-text("Risultati")').inner_text()
        print(f"Results text: {results_count_text}")

        results = page.locator('.group.cursor-pointer')
        count = await results.count()
        print(f"Found {count} result elements.")

        if count > 0:
            print("SUCCESS: Search results found.")
            # Click first result
            await results.first.click()
            await page.wait_for_timeout(2000)
            await page.screenshot(path="search_modal.png")

            # Look for external link
            link = page.get_by_role("link", name="Leggi Opera Completa")
            if await link.is_visible():
                href = await link.get_attribute("href")
                print(f"SUCCESS: 'Leggi Opera Completa' link visible: {href}")
            else:
                print("Note: First result doesn't have an external link.")
        else:
            print("FAILURE: No results found for 'Pride and Prejudice'.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())

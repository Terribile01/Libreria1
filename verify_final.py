import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))

        print("Navigating to Home Page...")
        await page.goto("http://localhost:3002/")
        await page.wait_for_timeout(2000)

        # 1. Verify WhatsApp Button
        whatsapp_link = page.locator('a[href*="wa.me"]')
        if await whatsapp_link.is_visible():
            href = await whatsapp_link.get_attribute("href")
            print(f"SUCCESS: WhatsApp link found: {href}")
        else:
            print("FAILURE: WhatsApp link NOT found in footer.")

        # 2. Verify Alfonsa Chat
        chat_button = page.locator('button').filter(has=page.locator('svg.lucide-message-circle'))
        if await chat_button.is_visible():
            print("SUCCESS: Alfonsa chat button visible.")
            await chat_button.click()
            await page.wait_for_timeout(2000)
            # Check for fallback message
            if await page.get_by_text("Alfonsa sta riposando").is_visible():
                print("SUCCESS: Alfonsa fallback message shown correctly.")
            else:
                # Type something
                input_field = page.locator('input[placeholder*="Scrivi"]')
                if await input_field.is_visible():
                    await input_field.fill("Ciao Alfonsa")
                    await input_field.press("Enter")
                    await page.wait_for_timeout(3000)
                    print("Sent message to Alfonsa.")
                    await page.screenshot(path="alfonsa_chat.png")
        else:
            print("FAILURE: Alfonsa chat button NOT found.")

        # 3. Verify Search
        print("Navigating to Search Page...")
        await page.goto("http://localhost:3002/search")
        await page.wait_for_timeout(2000)

        print("Searching for 'Shakespeare'...")
        search_input = page.locator('input[placeholder*="Cerca"]')
        await search_input.fill("Shakespeare")
        await search_input.press("Enter")

        print("Waiting for results...")
        # Wait up to 10 seconds for results
        try:
            await page.wait_for_selector('.group.cursor-pointer', timeout=10000)
            print("Results loaded!")
        except:
            print("Timeout waiting for search results.")

        await page.screenshot(path="final_search_results.png")

        results = page.locator('.group.cursor-pointer')
        count = await results.count()
        print(f"Found {count} results for 'Shakespeare'")

        if count > 0:
            # Click first result
            await results.first.click()
            await page.wait_for_timeout(1000)
            await page.screenshot(path="final_book_modal.png")

            link = page.get_by_role("link", name="Leggi Opera Completa")
            if await link.is_visible():
                print("SUCCESS: 'Leggi Opera Completa' link visible.")
            else:
                print("Note: First result doesn't have an external link (might be local).")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())

import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Go to Search Page
        print("Navigating to Search Page...")
        await page.goto("http://localhost:3002/search")
        await page.wait_for_timeout(2000)

        # Type search query
        print("Searching for 'Dante'...")
        await page.fill('input[placeholder*="titolo"]', "Dante")
        await page.keyboard.press("Enter")

        # Wait for results to load (External APIs might take a second)
        print("Waiting for results...")
        await page.wait_for_timeout(5000)

        # Take a screenshot of the search results
        await page.screenshot(path="search_results.png")
        print("Screenshot saved: search_results.png")

        # Find a result from Project Gutenberg or Open Library
        # They should have the badge or extraLabel
        results = page.locator('.group.cursor-pointer')
        count = await results.count()
        print(f"Found {count} results")

        found_external = False
        for i in range(count):
            text = await results.nth(i).inner_text()
            if "Gutenberg" in text or "Open Library" in text:
                print(f"Found external result at index {i}: {text.split('\n')[0]}")
                await results.nth(i).click()
                found_external = True
                break

        if found_external:
            await page.wait_for_timeout(1000)
            await page.screenshot(path="book_modal.png")
            print("Screenshot saved: book_modal.png")

            # Check for "Leggi Opera Completa" link
            link = page.get_by_role("link", name="Leggi Opera Completa")
            if await link.is_visible():
                print("SUCCESS: 'Leggi Opera Completa' link is visible!")
                href = await link.get_attribute("href")
                print(f"Link href: {href}")
            else:
                print("FAILURE: 'Leggi Opera Completa' link NOT found in modal.")
        else:
            print("FAILURE: No external results found for 'Dante'.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())

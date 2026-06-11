import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Go to Home
        print("Navigating to Home Page...")
        await page.goto("http://localhost:3002/")
        await page.wait_for_timeout(2000)

        # Click Ricerca in Navbar
        print("Clicking 'Ricerca' in Navbar...")
        await page.click('button:has-text("Ricerca")')
        await page.wait_for_timeout(1000)

        # Type search query
        print("Searching for 'Dante'...")
        # Using a more robust selector
        search_input = page.locator('input[placeholder*="Cerca"]')
        await search_input.fill("Dante")
        await search_input.press("Enter")

        # Wait for results
        print("Waiting for results...")
        await page.wait_for_timeout(5000)

        # Take a screenshot
        await page.screenshot(path="search_results_v2.png")
        print("Screenshot saved: search_results_v2.png")

        # Check for results
        results = page.locator('h3:has-text("Dante")')
        count = await results.count()
        print(f"Found {count} results containing 'Dante'")

        if count > 0:
            # Click the first one
            await results.first.click()
            await page.wait_for_timeout(1000)
            await page.screenshot(path="book_modal_v2.png")
            print("Screenshot saved: book_modal_v2.png")

            # Check for "Leggi Opera Completa"
            link = page.get_by_role("link", name="Leggi Opera Completa")
            if await link.is_visible():
                print("SUCCESS: 'Leggi Opera Completa' link is visible!")
                href = await link.get_attribute("href")
                print(f"Link href: {href}")
            else:
                # Some local books might not have externalUrl, let's look for one that does
                # Actually, external results usually have 'GUTENBERG' or 'Open Library'
                print("Checking for external link in modal...")
                # Try to close and find an external one
                await page.keyboard.press("Escape")

                external_result = page.locator('div:has-text("GUTENBERG"), div:has-text("Open Library")').first
                if await external_result.is_visible():
                    print("Found external result, clicking...")
                    await external_result.click()
                    await page.wait_for_timeout(1000)
                    if await link.is_visible():
                        print("SUCCESS: 'Leggi Opera Completa' link is visible on external book!")
                    else:
                        print("FAILURE: External link NOT found even on external book.")
                else:
                    print("No external results found to verify link.")
        else:
            print("FAILURE: No results found for 'Dante'.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())

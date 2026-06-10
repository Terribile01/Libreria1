import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        print("Navigating to Home Page...")
        await page.goto("http://localhost:3002/")
        await page.wait_for_timeout(2000)

        print("Clicking 'Ricerca'...")
        await page.click('button:has-text("Ricerca")')
        await page.wait_for_timeout(1000)

        print("Searching for 'Principe' (local book)...")
        search_input = page.locator('input[placeholder*="Cerca"]')
        await search_input.fill("Principe")
        await page.keyboard.press("Enter")
        await page.wait_for_timeout(2000)

        await page.screenshot(path="local_search_results.png")

        results = page.locator('h3:has-text("Principe")')
        if await results.count() > 0:
            print(f"SUCCESS: Found local book 'Il Piccolo Principe'.")
            await results.first.click()
            await page.wait_for_timeout(1000)
            await page.screenshot(path="local_book_modal.png")
            print("Modal opened for local book.")
        else:
            print("FAILURE: Local book 'Principe' not found in search results.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())

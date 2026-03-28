import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        try:
            # Go to the local dev server
            await page.goto('http://localhost:3000', timeout=60000)
            print("Page loaded")

            # Click start button
            await page.wait_for_selector('button:has-text("ROZPOCZNIJ BITWĘ")')
            await page.click('button:has-text("ROZPOCZNIJ BITWĘ")')
            print("Clicked start")

            # Wait for game UI
            await page.wait_for_selector('h2:has-text("BITWA TRWA")')

            # Press W for movement
            await page.keyboard.down('w')
            await asyncio.sleep(2)
            await page.keyboard.up('w')

            # Press Space to fire
            await page.keyboard.press(' ')
            print("Fired cannon")

            # Take screenshot
            os.makedirs('verification', exist_ok=True)
            await page.screenshot(path='verification/ship_verify.png')
            print("Screenshot saved to verification/ship_verify.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run())

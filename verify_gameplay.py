import asyncio
from playwright.async_api import async_playwright
import os

async def run_verification():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Navigate to the local dev server
        url = "http://localhost:3000"
        try:
            await page.goto(url, timeout=60000)
        except Exception as e:
            print(f"Failed to load page: {e}")
            await browser.close()
            return

        # Check for the start screen
        await page.wait_for_selector("text=STATKI 3D")
        print("Start screen detected.")

        # Click the start button
        await page.click("text=ROZPOCZNIJ BITWĘ")
        print("Clicked start button.")

        # Wait for the HUD to appear
        await page.wait_for_selector("text=STATUS FLOTY")
        print("HUD detected.")

        # Press Space multiple times to fire
        for _ in range(5):
            await page.keyboard.press("Space")
            await asyncio.sleep(0.5)
        print("Fired cannon 5 times.")

        # Check if "Zatopione" text is present
        zatopione = await page.query_selector("text=Zatopione")
        if zatopione:
            print("'Zatopione' counter found in HUD.")

        # Take a screenshot
        screenshot_path = "verification/ship_final_verify.png"
        os.makedirs("verification", exist_ok=True)
        await page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_verification())

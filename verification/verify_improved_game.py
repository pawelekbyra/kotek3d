from playwright.sync_api import sync_playwright, expect
import time

def verify_game(page):
    # Navigate to the game
    page.goto("http://localhost:3001")

    # Wait for the Canvas
    page.wait_for_selector("canvas", timeout=10000)

    # Check HUD elements
    expect(page.get_by_text("POLUTEK 3D")).to_be_visible()
    expect(page.get_by_text("Wynik")).to_be_visible()

    # Move forward
    page.keyboard.down("w")
    time.sleep(1)
    page.keyboard.up("w")

    # Jump
    page.keyboard.press(" ")
    time.sleep(0.5)

    # Take screenshot
    page.screenshot(path="/home/jules/verification/game_improved_physics.png")
    print("Screenshot saved to /home/jules/verification/game_improved_physics.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_game(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

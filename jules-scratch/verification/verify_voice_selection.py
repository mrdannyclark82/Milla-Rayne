from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:5000", timeout=60000)

    # Open the settings menu
    page.click('button[aria-label="Open settings menu"]')

    # Wait for the dropdown menu to appear
    page.wait_for_selector('div[role="menu"][data-side="bottom"]')

    # Open the voice picker dialog
    page.click('div[role="menuitem"]:has-text("Voice Settings")')

    # Wait for the voice picker dialog to appear
    page.wait_for_selector('div[role="dialog"]')

    # Wait for the default voice option to be visible
    page.wait_for_selector('select[data-testid="select-voice-picker"] option[value="21m00Tcm4TlvDq8ikWAM"]', state='visible', timeout=10000)

    # Select a new voice
    page.select_option('select[data-testid="select-voice-picker"]', index=1)

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
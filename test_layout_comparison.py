from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # Test with different viewport sizes
    viewports = [
        {'width': 1920, 'height': 1080, 'name': 'desktop_large'},
        {'width': 1440, 'height': 900, 'name': 'desktop_medium'},
        {'width': 768, 'height': 1024, 'name': 'tablet'},
    ]

    for viewport in viewports:
        print(f"\n{'='*60}")
        print(f"Testing {viewport['name']} ({viewport['width']}x{viewport['height']})")
        print(f"{'='*60}")

        context = browser.new_context(viewport={'width': viewport['width'], 'height': viewport['height']})
        page = context.new_page()

        # Navigate to home page first
        page.goto('http://localhost:3000')
        page.wait_for_load_state('networkidle')

        # Take screenshot of home
        page.screenshot(path=f'/tmp/home_{viewport["name"]}.png', full_page=False)
        print(f"✅ Home page screenshot: /tmp/home_{viewport['name']}.png")

        # Navigate to dashboard/okrs (will redirect to login if not authenticated)
        page.goto('http://localhost:3000/dashboard/okrs')
        page.wait_for_load_state('networkidle')
        time.sleep(1)

        # Take screenshot
        page.screenshot(path=f'/tmp/okr_{viewport["name"]}.png', full_page=True)
        print(f"✅ OKR page screenshot: /tmp/okr_{viewport['name']}.png")

        # Analyze layout
        analysis = page.evaluate('''() => {
            const main = document.querySelector('main');
            const spaceDiv = document.querySelector('[class*="space-y-6"]');

            if (!main) return { hasMain: false };

            const mainStyles = window.getComputedStyle(main);
            const rect = main.getBoundingClientRect();

            return {
                hasMain: true,
                maxWidth: mainStyles.maxWidth,
                width: rect.width,
                marginLeft: mainStyles.marginLeft,
                marginRight: mainStyles.marginRight,
                paddingLeft: mainStyles.paddingLeft,
                paddingRight: mainStyles.paddingRight,
                hasConstrainedWidth: mainStyles.maxWidth !== 'none',
                hasCentering: mainStyles.marginLeft === 'auto' || mainStyles.marginRight === 'auto'
            };
        }''')

        if analysis['hasMain']:
            print(f"  📐 Main container:")
            print(f"     Max-width: {analysis['maxWidth']}")
            print(f"     Actual width: {analysis['width']}px")
            print(f"     Padding: {analysis['paddingLeft']} / {analysis['paddingRight']}")
            print(f"     Margin: {analysis['marginLeft']} / {analysis['marginRight']}")
            print(f"     ✓ Has max-width constraint: {analysis['hasConstrainedWidth']}")
            print(f"     ✓ Has auto centering: {analysis['hasCentering']}")
        else:
            print(f"  ❌ No main container found (content may fill full width)")

        context.close()

    browser.close()

print(f"\n{'='*60}")
print("Layout testing complete!")
print("Check the screenshots in /tmp/ to verify the layout improvements.")
print(f"{'='*60}")

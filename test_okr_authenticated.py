from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # Navigate to the app
    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')

    print("🔍 Testing OKR UI layout...")

    # Try to access OKR page directly
    page.goto('http://localhost:3000/okr')
    page.wait_for_load_state('networkidle')
    time.sleep(2)  # Wait for any redirects or renders

    # Check if we're on login page or OKR page
    current_url = page.url
    print(f"📍 Current URL: {current_url}")

    # If redirected to signin, try to sign in
    if 'signin' in current_url or 'login' in current_url:
        print("🔐 Need to sign in first...")

        # Try to sign in with test credentials
        try:
            page.fill('input[type="email"]', 'test@example.com')
            page.fill('input[type="password"]', 'password123')
            page.click('button[type="submit"]')
            page.wait_for_load_state('networkidle')
            time.sleep(2)
            print("✅ Signed in")
        except:
            print("❌ Could not sign in - may need to create account first")

            # Try Get Started button
            try:
                page.goto('http://localhost:3000')
                page.wait_for_load_state('networkidle')
                page.click('text=Get Started')
                page.wait_for_load_state('networkidle')
                time.sleep(1)

                # Fill signup form
                page.fill('input[name="name"]', 'Test User')
                page.fill('input[name="email"]', 'test@example.com')
                page.fill('input[name="password"]', 'password123')
                page.click('button[type="submit"]')
                page.wait_for_load_state('networkidle')
                time.sleep(2)
                print("✅ Created account")
            except Exception as e:
                print(f"❌ Could not create account: {e}")

    # Now try to navigate to OKR page
    page.goto('http://localhost:3000/okr')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    # Take full page screenshot
    page.screenshot(path='/tmp/okr_full_page.png', full_page=True)
    print("✅ Full page screenshot saved to /tmp/okr_full_page.png")

    # Get page content analysis
    analysis = page.evaluate('''() => {
        const main = document.querySelector('main');
        const containers = document.querySelectorAll('[class*="container"], [class*="max-w"]');

        const getStyles = (el) => {
            if (!el) return null;
            const styles = window.getComputedStyle(el);
            return {
                tag: el.tagName,
                className: el.className,
                maxWidth: styles.maxWidth,
                width: styles.width,
                padding: styles.padding,
                margin: styles.margin,
                paddingLeft: styles.paddingLeft,
                paddingRight: styles.paddingRight,
                boxSizing: styles.boxSizing
            };
        };

        return {
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            main: getStyles(main),
            containers: Array.from(containers).map(getStyles),
            bodyWidth: document.body.scrollWidth,
            hasMaxWidth: Array.from(document.querySelectorAll('*')).some(el => {
                const styles = window.getComputedStyle(el);
                return styles.maxWidth && styles.maxWidth !== 'none' && !styles.maxWidth.includes('100%');
            })
        };
    }''')

    print("\n📊 Layout Analysis:")
    print(f"Viewport: {analysis['viewport']}")
    print(f"Body width: {analysis['bodyWidth']}px")
    print(f"Has max-width constraints: {analysis['hasMaxWidth']}")
    print(f"\nMain element:")
    if analysis['main']:
        for key, value in analysis['main'].items():
            print(f"  {key}: {value}")

    print(f"\nContainers found: {len(analysis['containers'])}")
    for i, container in enumerate(analysis['containers'][:5]):  # Show first 5
        print(f"\nContainer {i+1}:")
        for key, value in container.items():
            print(f"  {key}: {value}")

    browser.close()

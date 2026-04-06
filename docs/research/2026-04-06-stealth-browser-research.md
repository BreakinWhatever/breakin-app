# Stealth Browser Setups for 2025-2026: Deep Research

> Comprehensive guide to bypassing Cloudflare, bot detection, and CAPTCHAs using browser automation.

---

## Table of Contents

1. [Puppeteer Stealth](#1-puppeteer-stealth)
2. [Playwright Stealth](#2-playwright-stealth)
3. [Undetected Chrome (Python + Node.js)](#3-undetected-chrome)
4. [Browser Fingerprinting](#4-browser-fingerprinting)
5. [Cloudflare Bypass Specifically](#5-cloudflare-bypass)
6. [Cookie/Session Persistence](#6-cookiesession-persistence)
7. [Real Browser Connection](#7-real-browser-connection)
8. [Residential Proxy Integration](#8-residential-proxy-integration)
9. [CDP Direct Control](#9-cdp-direct-control)
10. [Tier List & Recommendations](#10-tier-list--recommendations)

---

## 1. Puppeteer Stealth

### Package
```
npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
```

### What It Patches (Evasion Modules)

The stealth plugin ships with ~12 evasion modules that each fix one detectable difference between Puppeteer-controlled Chrome and a real browser:

| Evasion Module | What It Fixes |
|---|---|
| `chrome.app` | Adds missing `chrome.app` object |
| `chrome.csi` | Adds missing `chrome.csi()` function |
| `chrome.loadTimes` | Adds missing `chrome.loadTimes()` function |
| `chrome.runtime` | Fakes `chrome.runtime` to look like a real extension environment |
| `defaultArgs` | Removes `--enable-automation` from Chrome launch args |
| `iframe.contentWindow` | Fixes iframe detection via `contentWindow` |
| `media.codecs` | Reports correct media codec support |
| `navigator.hardwareConcurrency` | Spoofs consistent CPU core count |
| `navigator.languages` | Ensures language arrays are realistic |
| `navigator.permissions` | Fixes permission query results |
| `navigator.plugins` | Adds realistic plugin array (PDF viewer, etc.) |
| `navigator.webdriver` | Deletes `navigator.webdriver = true` flag |
| `sourceurl` | Hides injected script source URLs |
| `user-agent-override` | Removes "HeadlessChrome" from UA string |
| `webgl.vendor` | Spoofs WebGL vendor/renderer strings |
| `window.outerdimensions` | Sets realistic window.outerWidth/outerHeight |

### Basic Setup

```javascript
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Use with all default evasions
puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new', // use new headless mode
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1920,1080',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Add random delay to mimic human
  await page.goto('https://target-site.com', {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });

  // ... your scraping logic
  await browser.close();
})();
```

### Detection Bypass Rate

- **Basic bot detection (Distil, simple checks):** ~90-95% bypass
- **Cloudflare JS Challenge (non-Turnstile):** ~60-70% bypass
- **Cloudflare Turnstile CAPTCHA:** ~10-20% bypass (very unreliable)
- **DataDome, PerimeterX:** ~30-50% bypass

### Critical Limitation (2025-2026)

**puppeteer-extra-plugin-stealth was effectively deprecated in Feb 2025** as Cloudflare updated their detection to catch the CDP `Runtime.Enable` leak that all Puppeteer-based tools expose. The plugin still works against basic detection but fails against modern Cloudflare, DataDome, and similar WAFs.

**Recommended upgrade path:** Use `rebrowser-puppeteer` instead (see Section 9).

---

## 2. Playwright Stealth

### Package
```
npm install playwright-extra puppeteer-extra-plugin-stealth
```

Note: `playwright-extra` reuses the same stealth plugin from the puppeteer-extra ecosystem.

### Setup

```javascript
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

chromium.use(StealthPlugin());

(async () => {
  const browser = await chromium.launch({
    headless: false, // headed mode recommended for stealth
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'en-US',
    timezoneId: 'America/New_York',
  });

  const page = await context.newPage();
  await page.goto('https://target-site.com');
  // ... your logic
  await browser.close();
})();
```

### Playwright vs Puppeteer Stealth Comparison

| Aspect | Puppeteer Stealth | Playwright Stealth |
|---|---|---|
| **Plugin ecosystem** | Mature, many plugins | Uses same puppeteer-extra plugins |
| **Browser support** | Chromium only | Chromium, Firefox, WebKit |
| **Stealth quality** | Same evasion modules | Same evasion modules |
| **API quality** | Good | Superior (auto-waiting, better selectors) |
| **Multi-context** | Manual | Native browser contexts |
| **Session persistence** | Via userDataDir | Via storageState + persistentContext |
| **CDP leak** | Yes (Runtime.Enable) | Yes (same underlying issue) |
| **Active maintenance** | Slowing | Slowing |

### Verdict

Playwright and Puppeteer stealth are functionally identical in evasion capability since they share the same plugin. Playwright has a better API but the same fundamental CDP leak problem.

---

## 3. Undetected Chrome

### 3A. Python: undetected-chromedriver

```bash
pip install undetected-chromedriver selenium
```

```python
import undetected_chromedriver as uc

options = uc.ChromeOptions()
options.add_argument('--window-size=1920,1080')
# options.add_argument('--proxy-server=http://user:pass@proxy:port')

driver = uc.Chrome(options=options, use_subprocess=True)
driver.get('https://target-site.com')

# Save cookies for reuse
import pickle
pickle.dump(driver.get_cookies(), open('cookies.pkl', 'wb'))

driver.quit()
```

**Status:** Superseded by **Nodriver** (same author). undetected-chromedriver is no longer actively maintained.

### 3B. Python: Nodriver (the successor)

```bash
pip install nodriver
```

```python
import nodriver as uc

async def main():
    browser = await uc.start()
    page = await browser.get('https://target-site.com')

    # Wait for content
    await page.sleep(2)

    # Find elements
    element = await page.find('Submit')
    if element:
        await element.click()

    # Get page content
    content = await page.get_content()
    print(content)

if __name__ == '__main__':
    uc.loop().run_until_complete(main())
```

**Key differences from undetected-chromedriver:**
- No WebDriver binary at all (built from scratch)
- Uses CDP directly without Selenium
- No `navigator.webdriver` flag ever set
- Native stealth capabilities, no patches needed
- Actively maintained by the same author

### 3C. Python: SeleniumBase UC Mode

```bash
pip install seleniumbase
```

```python
from seleniumbase import SB

with SB(uc=True, test=True, incognito=True) as sb:
    url = "https://target-site.com"
    sb.uc_open_with_reconnect(url, reconnect_time=2)

    # Auto-handle Cloudflare Turnstile or reCAPTCHA
    sb.uc_gui_handle_captcha()

    # Continue scraping
    sb.assert_element("body")
    content = sb.get_page_source()
```

**Key UC Mode Methods:**
- `sb.uc_open_with_reconnect(url, reconnect_time)` -- Opens URL, disconnects chromedriver during page load
- `sb.uc_gui_click_captcha()` -- Clicks Turnstile/reCAPTCHA via PyAutoGUI (OS-level click)
- `sb.uc_gui_handle_captcha()` -- Auto-detects CAPTCHA type and handles it
- `sb.uc_click(selector)` -- Stealthy element clicking

**Note:** The `uc_gui_*` methods require a display (works on macOS/Windows natively, needs xvfb on Linux).

### 3D. Node.js: rebrowser-puppeteer

```bash
npm install rebrowser-puppeteer
# Drop-in replacement for puppeteer
```

```javascript
// Just change the import -- API is identical to puppeteer
const puppeteer = require('rebrowser-puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--window-size=1920,1080'],
  });

  const page = await browser.newPage();
  await page.goto('https://target-site.com');
  // ... identical Puppeteer API
  await browser.close();
})();
```

### 3E. Node.js: puppeteer-real-browser

```bash
npm install puppeteer-real-browser
```

```javascript
const { connect } = require('puppeteer-real-browser');

(async () => {
  const { browser, page } = await connect({
    headless: false,
    turnstile: true,     // Auto-solve Cloudflare Turnstile
    connectOption: {},
    disableXvfb: false,
  });

  await page.goto('https://target-site.com');
  // Turnstile is auto-clicked if present

  const content = await page.content();
  console.log(content);

  await browser.close();
})();
```

### 3F. Python: Camoufox (Firefox-based)

```bash
pip install camoufox
playwright install firefox  # uses Playwright's Firefox
```

```python
from camoufox.sync_api import Camoufox

with Camoufox(headless=True) as browser:
    page = browser.new_page()
    page.goto("https://target-site.com")

    content = page.content()
    print(content)
```

**Why Camoufox is different:**
- Built on **Firefox** (not Chromium) -- completely different fingerprint profile
- Modifies device info in **C++ source**, not via JS injection (undetectable)
- Uses BrowserForge fingerprint generator for statistical realism
- Fixes `navigator.webdriver`, headless detection, and more at the engine level
- Passes CreepJS, BrowserScan, and other fingerprint tests

### Detection Bypass Rate Comparison

| Tool | Basic Bots | CF JS Challenge | CF Turnstile | DataDome | Headless? |
|---|---|---|---|---|---|
| undetected-chromedriver | 85% | 50% | 5% | 20% | No |
| Nodriver | 95% | 80% | 40% | 60% | No |
| SeleniumBase UC | 95% | 85% | 70%* | 65% | No** |
| rebrowser-puppeteer | 95% | 85% | 50% | 70% | Partial |
| puppeteer-real-browser | 95% | 85% | 65% | 60% | No |
| Camoufox | 95% | 90% | 60% | 75% | Yes |

\* SeleniumBase Turnstile bypass requires `uc_gui_click_captcha()` which uses OS-level mouse clicks.
\** SeleniumBase UC Mode requires a display; on Linux, needs xvfb.

---

## 4. Browser Fingerprinting

### What Gets Checked

Anti-bot systems collect 50+ signals. Here are the critical ones:

#### Tier 1: Automation Flags (instant detection)
```javascript
// These will get you caught immediately
navigator.webdriver              // true = automated
navigator.plugins.length         // 0 = headless
navigator.languages.length       // 0 = headless
window.chrome                    // undefined = not real Chrome
window.chrome.runtime            // missing/malformed = automated
Notification.permission          // "denied" by default in automation
```

#### Tier 2: Browser Consistency Checks
```javascript
// These must be internally consistent
navigator.userAgent              // must match other signals
navigator.platform               // must match UA
navigator.hardwareConcurrency    // must be realistic (2-16)
navigator.deviceMemory           // must be realistic (2-8)
screen.width / screen.height     // must match viewport claims
window.outerWidth / innerWidth   // suspicious if identical
navigator.connection             // must exist in Chrome
```

#### Tier 3: Rendering Fingerprints
```javascript
// Unique per GPU/driver/OS combination
Canvas 2D fingerprint            // Render text, hash pixels
WebGL fingerprint                // 3D scene render hash
WebGL vendor/renderer            // GPU identification
WebGL parameters                 // Max texture size, extensions, etc.
AudioContext fingerprint          // Audio processing differences
```

#### Tier 4: TLS/Network Fingerprints
```
JA3 fingerprint                  // TLS ClientHello hash
JA4 fingerprint                  // Enhanced TLS fingerprint (2023+)
HTTP/2 settings frame            // SETTINGS_INITIAL_WINDOW_SIZE etc.
Header order                     // Browsers send headers in specific order
Accept-Language consistency      // Must match navigator.languages
```

#### Tier 5: Behavioral Analysis
```
Mouse movements                  // Bots move in straight lines
Scroll patterns                  // Bots don't scroll naturally
Keystroke timing                 // Uniform = bot
Time-to-interact                 // Instant interaction = bot
Focus/blur events                // Tab switching patterns
Touch events                     // Mobile device claims
```

### Fingerprint Spoofing Tools

#### fingerprint-suite (Node.js, by Apify)

```bash
npm install fingerprint-generator fingerprint-injector
```

```javascript
import { FingerprintGenerator } from 'fingerprint-generator';
import { FingerprintInjector } from 'fingerprint-injector';
import { chromium } from 'playwright';

const fingerprintGenerator = new FingerprintGenerator();

const fingerprint = fingerprintGenerator.getFingerprint({
  browsers: ['chrome'],
  operatingSystems: ['windows'],
  devices: ['desktop'],
  locales: ['en-US'],
});

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();

const fingerprintInjector = new FingerprintInjector();
await fingerprintInjector.attachFingerprintToPlaywright(context, fingerprint);

const page = await context.newPage();
await page.goto('https://target-site.com');
```

**What fingerprint-suite generates:**
- Realistic User-Agent with matching Client Hints
- Consistent screen resolution and viewport
- Navigator properties (hardwareConcurrency, deviceMemory, platform)
- WebGL vendor/renderer (matched to OS)
- Uses a Bayesian network trained on real browser distribution data

**Limitation:** Still fails Chrome runtime and plugins checks on some test sites.

#### BrowserForge (Python, used by Camoufox)

```bash
pip install browserforge
```

```python
from browserforge.fingerprints import FingerprintGenerator

fg = FingerprintGenerator(browser='chrome', os='windows')
fingerprint = fg.generate()

print(fingerprint.navigator.userAgent)
print(fingerprint.screen.width)
```

### Key Detection Test Sites

| Site | What It Tests |
|---|---|
| [CreepJS](https://abrahamjuliot.github.io/creepjs/) | Comprehensive fingerprint analysis |
| [BrowserScan](https://browserscan.net/) | Automation detection + fingerprint |
| [Bot.sannysoft.com](https://bot.sannysoft.com/) | Common bot checks |
| [nowsecure.nl](https://nowsecure.nl/) | Cloudflare challenge page |
| [pixelscan.net](https://pixelscan.net/) | Browser fingerprint consistency |

---

## 5. Cloudflare Bypass Specifically

### How Cloudflare Detection Works (2025-2026)

Cloudflare uses a multi-layer approach:

1. **IP Reputation** -- Datacenter IPs are flagged; residential IPs get a pass
2. **TLS Fingerprint (JA3/JA4)** -- Must match a real browser's TLS handshake
3. **HTTP/2 Fingerprint** -- Settings frame must match browser defaults
4. **JavaScript Challenge** -- Executes JS that checks browser APIs
5. **Canvas/WebGL Fingerprint** -- Headless browsers produce different hashes
6. **CDP Detection** -- Detects `Runtime.Enable` CDP command usage
7. **Behavioral Analysis** -- Mouse movement, timing, interaction patterns
8. **Turnstile CAPTCHA** -- Interactive challenge as a last resort

### What Actually Works Against Cloudflare in 2025-2026

#### Tier 1: Best Options

**SeleniumBase UC Mode (Python)** -- Most reliable free tool
```python
from seleniumbase import SB

with SB(uc=True, incognito=True) as sb:
    sb.uc_open_with_reconnect("https://cloudflare-protected.com", 3)
    sb.uc_gui_handle_captcha()  # handles Turnstile
    html = sb.get_page_source()
```
Success rate: ~70-85% on Turnstile, ~90% on JS challenges.

**Camoufox (Python, headless-capable)** -- Best headless option
```python
from camoufox.sync_api import Camoufox

with Camoufox(headless=True) as browser:
    page = browser.new_page()
    page.goto("https://cloudflare-protected.com")
    page.wait_for_timeout(5000)  # wait for challenge
    content = page.content()
```
Success rate: ~60% on Turnstile, ~90% on JS challenges (in headless).

**puppeteer-real-browser (Node.js)** -- Best Node.js option
```javascript
const { connect } = require('puppeteer-real-browser');

const { browser, page } = await connect({
  headless: false,
  turnstile: true,
});
await page.goto('https://cloudflare-protected.com');
```
Success rate: ~65% on Turnstile, ~85% on JS challenges.

#### Tier 2: Viable Alternatives

**Nodriver (Python)** -- Good but no Turnstile auto-solve
```python
import nodriver as uc

async def main():
    browser = await uc.start()
    page = await browser.get('https://cloudflare-protected.com')
    await page.sleep(5)  # wait for JS challenge to resolve
```

**rebrowser-puppeteer (Node.js)** -- Fixes CDP leak but no CAPTCHA solving
```javascript
const puppeteer = require('rebrowser-puppeteer');
const browser = await puppeteer.launch({ headless: false });
const page = await browser.newPage();
await page.goto('https://cloudflare-protected.com');
```

#### Tier 3: Headless-Specific Approaches

For **headless** servers, the problem is much harder. Options:

1. **Camoufox in headless mode** -- Best headless option (Firefox-based, C++ level patches)
2. **Xvfb + headed browser** -- Run a "headed" browser in a virtual display
   ```bash
   apt-get install xvfb
   xvfb-run python your_script.py
   ```
3. **Cloud browser services** -- Browserless.io, Bright Data Scraping Browser, Scrapeless

#### What Does NOT Work Against Modern Cloudflare

- puppeteer-extra-plugin-stealth alone (CDP leak detected)
- undetected-chromedriver (outdated patches)
- Simple User-Agent spoofing
- Playwright/Puppeteer in default headless mode
- Datacenter proxies without browser fingerprint fixes

### TLS Fingerprint Bypass

Cloudflare checks JA3/JA4 TLS fingerprints. HTTP libraries expose non-browser fingerprints.

**Node.js: got-scraping**
```bash
npm install got-scraping
```
```javascript
import { gotScraping } from 'got-scraping';

const response = await gotScraping({
  url: 'https://cloudflare-protected.com',
  proxyUrl: 'http://user:pass@residential-proxy:port',
  headerGeneratorOptions: {
    browsers: ['chrome'],
    operatingSystems: ['windows'],
    devices: ['desktop'],
  },
});
console.log(response.body);
```

**Python: curl_cffi**
```bash
pip install curl_cffi
```
```python
from curl_cffi import requests

response = requests.get(
    "https://cloudflare-protected.com",
    impersonate="chrome",  # mimics Chrome's TLS fingerprint
    proxies={"https": "http://user:pass@proxy:port"},
)
print(response.text)
```

---

## 6. Cookie/Session Persistence

### Why It Matters

Once you pass a Cloudflare challenge, the `cf_clearance` cookie grants access for a period (usually 15-30 minutes). Saving and reusing this cookie avoids repeated CAPTCHAs.

### Puppeteer: Cookie Save/Restore

```javascript
const fs = require('fs');
const puppeteer = require('puppeteer');

const COOKIE_FILE = './cookies.json';

async function saveCookies(page) {
  const cookies = await page.cookies();
  fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2));
  console.log(`Saved ${cookies.length} cookies`);
}

async function loadCookies(page) {
  if (fs.existsSync(COOKIE_FILE)) {
    const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE));
    await page.setCookie(...cookies);
    console.log(`Loaded ${cookies.length} cookies`);
    return true;
  }
  return false;
}

// Usage
(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Try loading existing cookies first
  const hasCookies = await loadCookies(page);

  await page.goto('https://target-site.com');

  if (!hasCookies) {
    // Handle login/CAPTCHA...
    // Then save cookies for next time
    await saveCookies(page);
  }

  await browser.close();
})();
```

### Puppeteer: User Data Directory Persistence

```javascript
const puppeteer = require('puppeteer');

// All cookies, localStorage, cache persist automatically
const browser = await puppeteer.launch({
  headless: false,
  userDataDir: './my-browser-data', // persistent directory
});

// Everything from previous sessions is available
const page = await browser.newPage();
await page.goto('https://target-site.com'); // already logged in!
```

### Playwright: Storage State

```javascript
import { chromium } from 'playwright';

// SAVE session state
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

await page.goto('https://target-site.com');
// ... login, pass CAPTCHA, etc.

// Save all cookies + localStorage to file
await context.storageState({ path: 'state.json' });
await browser.close();

// RESTORE session state in a new run
const browser2 = await chromium.launch();
const context2 = await browser2.newContext({
  storageState: 'state.json', // restores cookies + localStorage
});
const page2 = await context2.newPage();
await page2.goto('https://target-site.com'); // already authenticated!
```

### Playwright: Persistent Context

```javascript
import { chromium } from 'playwright';

// Uses a real browser profile directory -- everything persists
const context = await chromium.launchPersistentContext(
  './my-playwright-profile', // persistent directory
  {
    headless: false,
    viewport: { width: 1920, height: 1080 },
  }
);

const page = context.pages()[0] || await context.newPage();
await page.goto('https://target-site.com');
```

### Python: Nodriver Session Persistence

```python
import nodriver as uc

async def main():
    browser = await uc.start(
        user_data_dir='./my-chrome-profile',  # persistent profile
    )
    page = await browser.get('https://target-site.com')
    # Previous session cookies are available

uc.loop().run_until_complete(main())
```

### Key Cookie for Cloudflare

The critical cookie is `cf_clearance`:
- Set after passing a Cloudflare challenge
- Typically valid for 15-30 minutes
- Tied to IP address -- changing IP invalidates it
- Tied to User-Agent -- must reuse the same UA string

---

## 7. Real Browser Connection

Connecting to the user's real Chrome instance (with their cookies, extensions, and authenticated sessions) is the most powerful stealth approach.

### Method 1: Chrome Remote Debugging (Recommended)

**Step 1: Close all Chrome instances**

**Step 2: Launch Chrome with remote debugging**

macOS:
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/Library/Application Support/Google/Chrome"
```

Windows:
```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" \
  --remote-debugging-port=9222 \
  --user-data-dir="C:\Users\YOU\AppData\Local\Google\Chrome\User Data"
```

Linux:
```bash
google-chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/.config/google-chrome"
```

**Step 3: Connect from Puppeteer**

```javascript
const puppeteer = require('puppeteer');

(async () => {
  // Connect to the real Chrome instance
  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
    defaultViewport: null, // use Chrome's actual viewport
  });

  // Get existing tabs
  const pages = await browser.pages();
  console.log(`Found ${pages.length} existing tabs`);

  // Open a new tab -- inherits all cookies and auth
  const page = await browser.newPage();
  await page.goto('https://authenticated-site.com');
  // Already logged in! Uses real cookies from your browser.

  // IMPORTANT: disconnect, don't close (keeps Chrome running)
  browser.disconnect();
})();
```

**Step 3 (alternative): Connect from Playwright**

```javascript
import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:9222');
const defaultContext = browser.contexts()[0];
const page = defaultContext.pages()[0]; // existing tab

// Or open new tab in existing context
const newPage = await defaultContext.newPage();
await newPage.goto('https://authenticated-site.com');

browser.disconnect(); // don't close!
```

### Method 2: Launch with Existing Profile

**Puppeteer:**
```javascript
const puppeteer = require('puppeteer');

const browser = await puppeteer.launch({
  headless: false,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  userDataDir: '/Users/YOU/Library/Application Support/Google/Chrome',
  args: [
    '--profile-directory=Default', // or 'Profile 1', etc.
    '--no-first-run',
  ],
});
```

**Playwright:**
```javascript
import { chromium } from 'playwright';

const context = await chromium.launchPersistentContext(
  '/Users/YOU/Library/Application Support/Google/Chrome/Default',
  {
    headless: false,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    viewport: null,
  }
);
```

### Why Real Browser Connection Is the Ultimate Stealth

- **Real cookies**: Already authenticated on target sites
- **Real extensions**: uBlock Origin, etc. (makes fingerprint look human)
- **Real history**: Browser has browsing history, cached data
- **Real fingerprint**: Canvas, WebGL, fonts all match the real machine
- **No CDP leak**: When connecting to an already-running browser, the CDP commands look normal
- **Cloudflare trust**: If the user has previously passed challenges, `cf_clearance` is present

### Caveat

You cannot use the same Chrome profile simultaneously in two instances. Close Chrome before launching it from automation, or use `--remote-debugging-port` on an already-running instance.

---

## 8. Residential Proxy Integration

### Why Residential Proxies Matter

Cloudflare maintains a database of IP reputation. Datacenter IPs are flagged almost instantly. Residential IPs look like real users.

### Top Proxy Providers for Scraping (2025-2026)

| Provider | Pool Size | Price (GB) | Rotating | Sticky Sessions | Best For |
|---|---|---|---|---|---|
| **Bright Data** | 72M+ | $8-12/GB | Yes | Yes | Enterprise, most features |
| **Oxylabs** | 100M+ | $8-10/GB | Yes | Yes | Large scale, good API |
| **Smartproxy** | 40M+ | $7-8/GB | Yes | Yes | Good value, easy setup |
| **NetNut** | 85M+ | $6-8/GB | Yes | Yes | Speed, ISP proxies |
| **IPRoyal** | 32M+ | $5-7/GB | Yes | Yes | Budget option |
| **SOAX** | 8M+ | $6-8/GB | Yes | Yes | Granular geo-targeting |

### Integration with Puppeteer

```javascript
const puppeteer = require('puppeteer');

const browser = await puppeteer.launch({
  headless: false,
  args: [
    '--proxy-server=http://gate.smartproxy.com:7000',
  ],
});

const page = await browser.newPage();

// Authenticate proxy
await page.authenticate({
  username: 'your-proxy-user',
  password: 'your-proxy-pass',
});

await page.goto('https://target-site.com');
```

### Integration with Playwright

```javascript
import { chromium } from 'playwright';

const browser = await chromium.launch({
  proxy: {
    server: 'http://gate.smartproxy.com:7000',
    username: 'your-proxy-user',
    password: 'your-proxy-pass',
  },
});

const page = await browser.newPage();
await page.goto('https://target-site.com');
```

### Integration with Nodriver (Python)

```python
import nodriver as uc

browser = await uc.start(
    browser_args=['--proxy-server=http://gate.smartproxy.com:7000']
)
```

### Proxy Rotation Strategy

```javascript
const PROXIES = [
  'http://user:pass@us1.proxy.com:8000',
  'http://user:pass@us2.proxy.com:8000',
  'http://user:pass@eu1.proxy.com:8000',
];

function getRandomProxy() {
  return PROXIES[Math.floor(Math.random() * PROXIES.length)];
}

// Most proxy services handle rotation automatically via their gateway
// Example: Bright Data's rotating endpoint
// proxy: 'http://user-zone-residential:pass@brd.superproxy.io:22225'
```

### ISP Proxies (Best of Both Worlds)

ISP proxies (also called "static residential") combine datacenter speed with residential IP trust. They use IPs registered to ISPs but hosted in data centers.

- Best providers: NetNut, Bright Data, Oxylabs
- Price: $2-5/IP/month (static) vs $8-12/GB (rotating residential)
- Use case: When you need a persistent IP that looks residential

---

## 9. CDP (Chrome DevTools Protocol) Direct

### The CDP Detection Problem

This is the most important development in 2024-2025. Anti-bot systems now detect CDP usage itself:

**How detection works:**
1. Puppeteer/Playwright call `Runtime.Enable` on page load
2. This creates detectable side effects in the page's JavaScript environment
3. Cloudflare, DataDome, and others check for these side effects
4. Result: Even with perfect fingerprinting, CDP usage is detected

### rebrowser-patches: The Fix

```bash
# Option 1: Use pre-patched puppeteer
npm install rebrowser-puppeteer

# Option 2: Use pre-patched playwright
npm install rebrowser-playwright

# Option 3: Patch your existing installation
npx rebrowser-patches@latest patch --packageName puppeteer-core
```

**What rebrowser-patches fixes:**
- Removes `Runtime.Enable` leak (the main detection vector)
- Patches `addBinding` to avoid Runtime domain
- Uses `Runtime.evaluate` instead of `Runtime.enable` where possible
- Makes CDP usage invisible to page-side JavaScript

### Using CDP Directly for Maximum Control

```javascript
const puppeteer = require('rebrowser-puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Get CDP session for raw protocol access
  const client = await page.target().createCDPSession();

  // Intercept and modify network requests
  await client.send('Network.enable');
  await client.send('Network.setRequestInterception', {
    patterns: [{ urlPattern: '*' }],
  });

  client.on('Network.requestIntercepted', async ({ interceptionId, request }) => {
    // Modify headers, block requests, etc.
    await client.send('Network.continueInterceptedRequest', {
      interceptionId,
      headers: {
        ...request.headers,
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
  });

  // Inject scripts before page loads
  await client.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      // Override navigator.webdriver
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

      // Add chrome.runtime
      window.chrome = { runtime: {} };

      // Fake plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
    `,
  });

  // Emulate human-like mouse movement
  await client.send('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x: 100,
    y: 200,
  });

  await page.goto('https://target-site.com');
  await browser.close();
})();
```

### Pydoll: CDP Without WebDriver (Python)

```bash
pip install pydoll
```

```python
import asyncio
from pydoll.browser.chrome import Chrome
from pydoll.connection.connection_handler import ConnectionHandler

async def main():
    async with Chrome() as browser:
        await browser.start()
        page = await browser.get_page()

        await page.go_to("https://target-site.com")
        content = await page.get_content()
        print(content)

asyncio.run(main())
```

**Why Pydoll matters:**
- No WebDriver binary at all
- No `navigator.webdriver` flag
- Direct CDP over WebSocket
- No Selenium/chromedriver dependency
- Python-native async API

### CDP Method Sensitivity Levels

From the rebrowser-patches documentation:

| CDP Method | Detection Risk | What It Does |
|---|---|---|
| `Runtime.Enable` | CRITICAL | Enables JS runtime -- main detection vector |
| `Runtime.evaluate` | Low | Evaluates JS in page context |
| `Page.addScriptToEvaluateOnNewDocument` | Low | Injects JS before page load |
| `Network.enable` | Low | Enables network monitoring |
| `DOM.enable` | Medium | Enables DOM inspection |
| `Target.attachToTarget` | Medium | Attaches to iframes/workers |

---

## 10. Tier List & Recommendations

### Overall Tier List (April 2026)

#### S Tier -- Best Available
| Tool | Language | Headless? | CF Turnstile | Notes |
|---|---|---|---|---|
| **SeleniumBase UC Mode** | Python | No (needs display) | ~70-85% | Most reliable free tool for Turnstile |
| **Camoufox** | Python | Yes | ~60% | Best headless option, Firefox-based |
| **Real Chrome + CDP** | Any | No | ~95% | Connect to user's actual browser |

#### A Tier -- Very Good
| Tool | Language | Headless? | CF Turnstile | Notes |
|---|---|---|---|---|
| **rebrowser-puppeteer** | Node.js | Partial | ~50% | Fixes CDP leak, drop-in replacement |
| **puppeteer-real-browser** | Node.js | No | ~65% | Auto-solves Turnstile, uses rebrowser patches |
| **Nodriver** | Python | No | ~40% | Successor to undetected-chromedriver |

#### B Tier -- Decent with Limitations
| Tool | Language | Headless? | CF Turnstile | Notes |
|---|---|---|---|---|
| **Pydoll** | Python | No | ~40% | CDP-direct, no WebDriver, newer project |
| **puppeteer-extra + stealth** | Node.js | Yes | ~10-20% | Aging; CDP leak not fixed |
| **playwright-extra + stealth** | Node.js | Yes | ~10-20% | Same stealth plugin as puppeteer |

#### C Tier -- Supplementary Tools
| Tool | Language | Purpose |
|---|---|---|
| **fingerprint-suite** | Node.js | Fingerprint generation/injection |
| **got-scraping** | Node.js | HTTP-level scraping with TLS mimicry |
| **curl_cffi** | Python | TLS fingerprint impersonation |
| **BrowserForge** | Python | Fingerprint generation |

### Recommended Stack for Your Project (Node.js)

Given you are building a job search automation tool in Node.js:

```
Primary:     puppeteer-real-browser (auto Turnstile, good API)
Fallback:    rebrowser-puppeteer + fingerprint-suite
Proxy:       Smartproxy or Bright Data residential
Cookies:     storageState persistence between runs
Real auth:   Connect to user's Chrome via --remote-debugging-port=9222
```

### Recommended Stack (Python)

```
Primary:     SeleniumBase UC Mode (best Turnstile bypass)
Fallback:    Camoufox (best headless option)
HTTP-only:   curl_cffi with residential proxy
Proxy:       Bright Data or Smartproxy
```

### Decision Flowchart

```
Need to bypass Cloudflare Turnstile?
  |
  +-- Yes --> Need headless?
  |             |
  |             +-- Yes --> Camoufox (Python) or cloud browser service
  |             |
  |             +-- No  --> SeleniumBase UC Mode (Python)
  |                         or puppeteer-real-browser (Node.js)
  |
  +-- No (just JS challenges) --> Need headless?
                |
                +-- Yes --> rebrowser-puppeteer + residential proxy
                |
                +-- No  --> Nodriver (Python) or rebrowser-puppeteer (Node.js)

Already authenticated on target site?
  |
  +-- Yes --> Connect to real Chrome (--remote-debugging-port)
  |
  +-- No  --> Use session persistence (cookies/storageState)

Using datacenter server?
  |
  +-- Must use residential/ISP proxy
  +-- Consider cloud browser service (Browserless.io, Bright Data)
```

---

## Sources

- [Strategies for Bypassing Cloudflare Protection with Puppeteer](https://latenode.com/blog/web-automation-scraping/avoiding-bot-detection/strategies-for-bypassing-cloudflare-protection-with-puppeteer)
- [Bypass Cloudflare with Puppeteer (2025 Guide)](https://www.browserless.io/blog/bypass-cloudflare-with-puppeteer)
- [Invisible Automation: puppeteer-extra-plugin-stealth](https://latenode.com/blog/web-automation-scraping/avoiding-bot-detection/invisible-automation-using-puppeteer-extra-plugin-stealth-to-bypass-bot-protection)
- [Puppeteer-Extra-Stealth Guide (ScrapeOps)](https://scrapeops.io/puppeteer-web-scraping-playbook/nodejs-puppeteer-extra-stealth-plugin/)
- [Avoiding Bot Detection with Playwright Stealth](https://brightdata.com/blog/how-tos/avoid-bot-detection-with-playwright-stealth)
- [How to Use Playwright Stealth for Scraping (ZenRows)](https://www.zenrows.com/blog/playwright-stealth)
- [undetected_chromedriver Tutorial (ScrapingBee)](https://www.scrapingbee.com/blog/undetected-chromedriver-python-tutorial-avoiding-bot-detection/)
- [Can You Bypass Cloudflare With Undetected ChromeDriver? (ZenRows)](https://www.zenrows.com/blog/undetected-chromedriver-cloudflare)
- [Nodriver GitHub](https://github.com/ultrafunkamsterdam/nodriver)
- [SeleniumBase UC Mode Docs](https://seleniumbase.io/help_docs/uc_mode/)
- [How to use SeleniumBase UC mode to Bypass bot detection](https://roundproxies.com/blog/seleniumbase-uc-mode/)
- [rebrowser-patches GitHub](https://github.com/rebrowser/rebrowser-patches)
- [rebrowser-puppeteer GitHub](https://github.com/rebrowser/rebrowser-puppeteer)
- [Sensitive CDP Methods (Rebrowser docs)](https://rebrowser.net/docs/sensitive-cdp-methods)
- [puppeteer-real-browser npm](https://www.npmjs.com/package/puppeteer-real-browser)
- [puppeteer-real-browser GitHub](https://github.com/ZFC-Digital/puppeteer-real-browser)
- [Camoufox Stealth Overview](https://camoufox.com/stealth/)
- [Camoufox GitHub](https://github.com/daijro/camoufox)
- [Pydoll GitHub](https://github.com/autoscrape-labs/pydoll)
- [How New Headless Chrome & the CDP Signal Are Impacting Bot Detection (DataDome)](https://datadome.co/threat-research/how-new-headless-chrome-the-cdp-signal-are-impacting-bot-detection/)
- [From Puppeteer stealth to Nodriver: How anti-detect frameworks evolved](https://blog.castle.io/from-puppeteer-stealth-to-nodriver-how-anti-detect-frameworks-evolved-to-evade-bot-detection/)
- [fingerprint-suite GitHub (Apify)](https://github.com/apify/fingerprint-suite)
- [How to use fingerprint-suite in 5 steps (2026)](https://roundproxies.com/blog/fingerprint-suite/)
- [Browser Fingerprinting Explained (Dev.to)](https://dev.to/vhub_systems_ed5641f65d59/browser-fingerprinting-explained-what-websites-know-about-your-scraper-and-how-to-fix-it-218h)
- [How to use CreepJS in 2026](https://roundproxies.com/blog/creepjs/)
- [5 Working Methods to Bypass Cloudflare (Jan 2026)](https://scrape.do/blog/bypass-cloudflare/)
- [I Tried Every Headless Browser to Solve Cloudflare Turnstile (Dev.to)](https://dev.to/arsonxdev/i-tried-every-headless-browser-to-solve-cloudflare-turnstile-only-one-worked-1j20)
- [How to Bypass Cloudflare When Web Scraping in 2026 (Scrapfly)](https://scrapfly.io/blog/posts/how-to-bypass-cloudflare-anti-scraping)
- [How to bypass Cloudflare in 2026: 5 simple methods](https://roundproxies.com/blog/bypass-cloudflare/)
- [TLS Fingerprint Bypass Techniques (ScrapeHero)](https://www.scrapehero.com/tls-fingerprint-bypass-techniques/)
- [got-scraping / curl_cffi TLS bypass](https://dev.to/datakaz/how-to-bypass-cloudflare-with-tls-fingerprinting-in-nodejs-2pb2)
- [Connecting Playwright to an Existing Browser (BrowserStack)](https://www.browserstack.com/guide/playwright-connect-to-existing-browser)
- [Mastering Persistent Sessions in Playwright](https://medium.com/@Gayathri_krish/mastering-persistent-sessions-in-playwright-keep-your-logins-alive-8e4e0fd52751)
- [How to manage cookies, sessions for Puppeteer (Browserless)](https://www.browserless.io/blog/manage-sessions)
- [Best Proxy Providers for Large-Scale Scraping 2026 (KDnuggets)](https://www.kdnuggets.com/2025/11/brightdata/the-best-proxy-providers-for-large-scale-scraping-for-2026)
- [Web Scraping Without Getting Banned in 2026](https://dev.to/vhub_systems_ed5641f65d59/web-scraping-without-getting-banned-in-2026-the-complete-anti-bot-bypass-guide-297h)
- [2026 Guide to Anti-Bot Detection: Lessons from 34 Production Scrapers](https://earezki.com/ai-news/2026-03-18-i-built-34-web-scrapers-heres-what-i-learned-about-anti-bot-detection/)
- [AI Browser Automation in 2026: Camoufox, Nodriver & Stealth MCP](https://www.proxies.sx/blog/ai-browser-automation-camoufox-nodriver-2026)

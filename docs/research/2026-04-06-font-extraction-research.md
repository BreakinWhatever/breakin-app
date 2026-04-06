# Font Extraction from Websites: Complete Technical Reference

> Research date: 2026-04-06
> Purpose: Extract exact fonts from any website for pixel-perfect cloning

---

## Table of Contents

1. [Font Detection from Browser](#1-font-detection-from-browser)
2. [Font File Extraction](#2-font-file-extraction)
3. [Font Matching / Identification](#3-font-matching--identification)
4. [Self-Hosted Font Detection](#4-self-hosted-font-detection)
5. [Variable Fonts](#5-variable-fonts)
6. [Font Rendering Comparison](#6-font-rendering-comparison)
7. [Next.js Font Integration](#7-nextjs-font-integration)

---

## 1. Font Detection from Browser

### 1.1 Computed Styles via `getComputedStyle()`

The most direct method. Works in any browser or headless environment.

```javascript
// Extract all font properties from an element
function getFontProperties(element) {
  const cs = window.getComputedStyle(element);
  return {
    fontFamily:             cs.getPropertyValue('font-family'),
    fontSize:               cs.getPropertyValue('font-size'),
    fontWeight:             cs.getPropertyValue('font-weight'),
    fontStyle:              cs.getPropertyValue('font-style'),
    fontStretch:            cs.getPropertyValue('font-stretch'),
    fontVariationSettings:  cs.getPropertyValue('font-variation-settings'),
    fontFeatureSettings:    cs.getPropertyValue('font-feature-settings'),
    lineHeight:             cs.getPropertyValue('line-height'),
    letterSpacing:          cs.getPropertyValue('letter-spacing'),
    fontOpticalSizing:      cs.getPropertyValue('font-optical-sizing'),
  };
}
```

### 1.2 Extract ALL Fonts from a Page (Puppeteer)

```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://target-site.com');

  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready);

  const fontData = await page.evaluate(() => {
    const elements = document.body.getElementsByTagName('*');
    const fontMap = new Map();

    [...elements].forEach(el => {
      const cs = window.getComputedStyle(el);
      const key = [
        cs.fontFamily,
        cs.fontWeight,
        cs.fontStyle,
        cs.fontStretch,
        cs.fontVariationSettings,
      ].join('|');

      if (!fontMap.has(key)) {
        fontMap.set(key, {
          fontFamily:            cs.fontFamily,
          fontWeight:            cs.fontWeight,
          fontStyle:             cs.fontStyle,
          fontStretch:           cs.fontStretch,
          fontVariationSettings: cs.fontVariationSettings,
          fontFeatureSettings:   cs.fontFeatureSettings,
          fontSize:              cs.fontSize,
          lineHeight:            cs.lineHeight,
          letterSpacing:         cs.letterSpacing,
          sampleText:            el.textContent?.slice(0, 50) || '',
          tagName:               el.tagName,
          className:             el.className,
        });
      }
    });

    return [...fontMap.values()];
  });

  console.log(JSON.stringify(fontData, null, 2));
  await browser.close();
})();
```

### 1.3 Detect Font Substitution vs Actually Loaded

The `document.fonts` API (CSS Font Loading API) is the definitive way to check whether a font actually loaded or was substituted.

```javascript
// Check if a specific font is loaded
function isFontLoaded(fontSpec) {
  // fontSpec uses CSS font shorthand: "italic bold 16px MyFont"
  return document.fonts.check(fontSpec);
}

// Examples
document.fonts.check('16px Inter');        // true if Inter loaded
document.fonts.check('bold 16px Inter');   // true if Inter bold loaded
document.fonts.check('16px "Comic Sans"'); // false if not available

// Wait for ALL fonts to finish loading, then enumerate
document.fonts.ready.then(() => {
  // Iterate over every loaded FontFace
  for (const font of document.fonts) {
    console.log({
      family:  font.family,
      weight:  font.weight,
      style:   font.style,
      stretch: font.stretch,
      status:  font.status,  // 'loaded', 'loading', 'error', 'unloaded'
      unicodeRange: font.unicodeRange,
    });
  }
});
```

### 1.4 CDP `CSS.getPlatformFontsForNode` -- The Gold Standard

This Chrome DevTools Protocol method reveals which **actual platform font** the browser used to render text, including whether it was downloaded (custom) or resolved locally (system fallback).

```javascript
// Using Puppeteer with CDP session
const puppeteer = require('puppeteer');

async function getPlatformFonts(page, selector) {
  const client = await page.target().createCDPSession();
  await client.send('DOM.enable');
  await client.send('CSS.enable');

  // Get the DOM node
  const { root } = await client.send('DOM.getDocument');
  const { nodeId } = await client.send('DOM.querySelector', {
    nodeId: root.nodeId,
    selector: selector,
  });

  // Get ACTUAL rendered fonts (not just CSS declaration)
  const { fonts } = await client.send('CSS.getPlatformFontsForNode', {
    nodeId: nodeId,
  });

  // Each font entry contains:
  // - familyName:    "Inter" (actual font used)
  // - postScriptName: "Inter-Regular"
  // - isCustomFont:  true (downloaded) or false (system/fallback)
  // - glyphCount:    142 (number of glyphs rendered with this font)
  return fonts;
}

// Usage
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://target-site.com');
  await page.evaluate(() => document.fonts.ready);

  const fonts = await getPlatformFonts(page, 'h1');
  console.log(fonts);
  // [{ familyName: "Inter", postScriptName: "Inter-Bold",
  //    isCustomFont: true, glyphCount: 12 }]

  // Get computed styles too via CDP
  const client = await page.target().createCDPSession();
  const { root } = await client.send('DOM.getDocument');
  const { nodeId } = await client.send('DOM.querySelector', {
    nodeId: root.nodeId, selector: 'h1'
  });
  const { computedStyle } = await client.send('CSS.getComputedStyleForNode', {
    nodeId
  });
  // computedStyle is an array of { name, value } pairs
  const fontProps = computedStyle.filter(p =>
    p.name.startsWith('font-') || p.name === 'letter-spacing' || p.name === 'line-height'
  );
  console.log(fontProps);

  await browser.close();
})();
```

**Key insight**: `isCustomFont: true` means the font was downloaded (web font). `isCustomFont: false` means it fell back to a system font -- this is how you detect substitution.

### 1.5 Browser Extensions for Quick Inspection

| Tool | What it does |
|------|-------------|
| **WhatFont** (Chrome/Firefox) | Hover over text to see font-family, weight, size, line-height, color. Shows whether Google Fonts or Typekit. |
| **Peek** (Chrome) | Extract colors and typography (font-family, size, weight, line-height) from any element. Copy CSS instantly. |
| **Font Ninja** (Chrome) | Identifies all fonts on a page, shows specimens, links to purchase. |

---

## 2. Font File Extraction

### 2.1 Network Interception with Playwright

The most reliable automated method. Intercepts actual font file downloads.

```javascript
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function extractFonts(url, outputDir = './extracted-fonts') {
  fs.mkdirSync(outputDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  const fontFiles = [];

  // Intercept all network responses
  page.on('response', async (response) => {
    const resourceType = response.request().resourceType();
    const responseUrl = response.url();

    if (resourceType === 'font' ||
        /\.(woff2?|ttf|otf|eot)(\?|$)/i.test(responseUrl)) {
      try {
        const buffer = await response.body();
        const ext = responseUrl.match(/\.(woff2?|ttf|otf|eot)/i)?.[1] || 'woff2';
        const filename = path.basename(new URL(responseUrl).pathname) ||
                         `font-${fontFiles.length}.${ext}`;
        const outPath = path.join(outputDir, filename);

        fs.writeFileSync(outPath, buffer);
        fontFiles.push({
          url: responseUrl,
          filename,
          size: buffer.length,
          contentType: response.headers()['content-type'],
        });
        console.log(`Downloaded: ${filename} (${buffer.length} bytes)`);
      } catch (e) {
        console.error(`Failed to download ${responseUrl}: ${e.message}`);
      }
    }
  });

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  // Also extract @font-face rules from stylesheets
  const fontFaceRules = await page.evaluate(() => {
    const rules = [];
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule instanceof CSSFontFaceRule) {
            rules.push({
              fontFamily: rule.style.getPropertyValue('font-family'),
              src:        rule.style.getPropertyValue('src'),
              fontWeight: rule.style.getPropertyValue('font-weight'),
              fontStyle:  rule.style.getPropertyValue('font-style'),
              fontStretch: rule.style.getPropertyValue('font-stretch'),
              fontDisplay: rule.style.getPropertyValue('font-display'),
              unicodeRange: rule.style.getPropertyValue('unicode-range'),
            });
          }
        }
      } catch (e) {
        // CORS: can't read cross-origin stylesheets
      }
    }
    return rules;
  });

  console.log('\n@font-face rules found:', fontFaceRules);

  await browser.close();
  return { fontFiles, fontFaceRules };
}

extractFonts('https://target-site.com');
```

### 2.2 Extract from Google Fonts

Google Fonts serves different formats based on User-Agent. Force woff2:

```bash
# CLI: Download Google Fonts CSS and font files
curl -sL "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
  -o google-fonts.css

# Extract font URLs from CSS
grep -oP 'url\(\K[^)]+' google-fonts.css | while read url; do
  filename=$(basename "$url" | cut -d'?' -f1)
  curl -sL "$url" -o "fonts/$filename"
  echo "Downloaded: $filename"
done
```

```bash
# NPM tool: webfont-dl (dedicated Google Fonts downloader)
npm install -g webfont-dl

# Download and inline woff2
webfont-dl "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700" \
  -o css/fonts.css --font-out=fonts/ --css-rel=../fonts \
  --woff2=link --woff1=omit --ttf=omit --eot=omit
```

### 2.3 Extract from Adobe Fonts / Typekit

Adobe Fonts does NOT officially support downloading font files. However:

```javascript
// Method 1: Intercept the CSS that Adobe serves
// Adobe embeds via: <link rel="stylesheet" href="https://use.typekit.net/XXXXXXX.css">
// That CSS contains @font-face rules with obfuscated URLs

// Method 2: Network interception (same as 2.1)
// Adobe serves woff2 files from use.typekit.net -- intercept them

// Method 3: Adobe Font Extractor (GitHub)
// https://github.com/echeno/adobe-font-extractor
// Extracts fonts from Adobe Creative Cloud local sync
// NOTE: License restrictions apply
```

### 2.4 CLI Tools Summary

| Tool | Install | Use Case |
|------|---------|----------|
| **webfont-dl** | `npm i -g webfont-dl` | Download fonts from any CSS @font-face URL |
| **google-webfonts-helper** | Web tool | Self-host Google Fonts with all formats |
| **glyphhanger** | `npm i -g glyphhanger` | Subset fonts, detect used glyphs on a page |
| **fonttools** (Python) | `pip install fonttools brotli` | Convert, subset, inspect font files |
| **woff2** (Google) | Build from source | Compress/decompress woff2 |

---

## 3. Font Matching / Identification

### 3.1 WhatFontIs API (Programmatic)

The only major font identification service with a public API. Database of 990K+ fonts.

```javascript
// WhatFontIs API v2.1
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

async function identifyFont(imagePath) {
  const imageBase64 = fs.readFileSync(imagePath).toString('base64');

  const response = await fetch('https://www.whatfontis.com/api2/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      API_KEY: process.env.WHATFONTIS_API_KEY,
      IMAGEBASE64: 1,
      urlimagebase64: imageBase64,
      limit: 10,
      FREEFONTS: 0,           // 0 = all fonts, 1 = free only
      NOTTEXTBOXSDETECTION: 0, // 0 = auto-detect text boxes
    }),
  });

  const results = await response.json();
  // Each result: { title, url, image, type: "Commercial"|"Free", site }
  return results;
}

// Usage
identifyFont('./screenshot-heading.png').then(console.log);
```

**Rate limits**: 200 requests/day free (personal use). Commercial requires contacting them.
**Accuracy**: 77% exact match rate in their testing.

### 3.2 Screenshot-Based Workflow (Automated)

```javascript
// Take a screenshot of a specific element, then identify it
const { chromium } = require('playwright');

async function screenshotAndIdentify(url, selector) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  // Screenshot just the element
  const element = await page.$(selector);
  await element.screenshot({ path: 'font-sample.png' });
  await browser.close();

  // Then pass to WhatFontIs API
  return identifyFont('font-sample.png');
}
```

### 3.3 All Font Identification Tools

| Tool | Method | API? | Database Size | Free? |
|------|--------|------|--------------|-------|
| **WhatFontIs** | Image upload | Yes (REST) | 990K+ fonts | Personal free (200/day) |
| **WhatTheFont** (MyFonts) | Image upload | No public API | Large (MyFonts catalog) | Free web tool |
| **Fontspring Matcherator** | Image upload | No | ~900K (paid fonts) | Free web tool |
| **Font Squirrel Matcherator** | Image upload | No | Free fonts only | Free web tool |
| **Google Fonts** | Direct search | Yes (Google Fonts API) | 1700+ families | Free |
| **WhatFont** (extension) | Hover on live page | No | N/A (reads CSS) | Free |

---

## 4. Self-Hosted Font Detection

### 4.1 Common Font Paths by Framework

```
Next.js:      /_next/static/media/*.woff2
               /_next/static/css/*.css (contains @font-face)

Nuxt.js:      /_nuxt/fonts/*.woff2

Gatsby:       /static/*.woff2

WordPress:    /wp-content/themes/*/fonts/
               /wp-content/uploads/fonts/

Generic:      /fonts/
               /assets/fonts/
               /static/fonts/
               /webfonts/
```

### 4.2 Automated Self-Hosted Font Discovery

```javascript
const { chromium } = require('playwright');
const fs = require('fs');

async function discoverSelfHostedFonts(url) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const fontRequests = [];

  // Track all font requests
  page.on('request', (request) => {
    if (request.resourceType() === 'font') {
      const reqUrl = new URL(request.url());
      fontRequests.push({
        url: request.url(),
        path: reqUrl.pathname,
        host: reqUrl.host,
        isSameOrigin: reqUrl.host === new URL(url).host,
      });
    }
  });

  // Track font responses and download
  page.on('response', async (response) => {
    if (response.request().resourceType() === 'font') {
      const reqUrl = new URL(response.url());
      if (reqUrl.host === new URL(url).host) {
        // This is a self-hosted font
        try {
          const buffer = await response.body();
          const filename = reqUrl.pathname.split('/').pop();
          fs.mkdirSync('./fonts', { recursive: true });
          fs.writeFileSync(`./fonts/${filename}`, buffer);
          console.log(`Self-hosted font saved: ${filename}`);
        } catch (e) {
          console.error(`Error saving: ${e.message}`);
        }
      }
    }
  });

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  // Categorize fonts
  const selfHosted = fontRequests.filter(f => f.isSameOrigin);
  const thirdParty = fontRequests.filter(f => !f.isSameOrigin);

  console.log('\nSelf-hosted fonts:', selfHosted.map(f => f.path));
  console.log('Third-party fonts:', thirdParty.map(f => f.url));

  await browser.close();
  return { selfHosted, thirdParty };
}

discoverSelfHostedFonts('https://target-site.com');
```

### 4.3 DevTools Network Tab (Manual Method)

1. Open DevTools > Network tab
2. Reload the page
3. Filter by **Font** type (or type `woff2` in the filter bar)
4. All font files appear with their full URLs
5. Right-click any font > **Copy > Copy link address**
6. Paste URL in browser address bar to download

---

## 5. Variable Fonts

### 5.1 Detect Variable Font Axes with opentype.js

```javascript
import opentype from 'opentype.js';
import fs from 'fs';
import { decompress } from 'wawoff2';

async function inspectVariableFont(fontPath) {
  let font;

  if (fontPath.endsWith('.woff2')) {
    // Decompress woff2 to raw OpenType data
    const woff2Buffer = fs.readFileSync(fontPath);
    const ttfBuffer = await decompress(woff2Buffer);
    const arrayBuffer = ttfBuffer.buffer.slice(
      ttfBuffer.byteOffset,
      ttfBuffer.byteOffset + ttfBuffer.byteLength
    );
    font = opentype.parse(arrayBuffer);
  } else {
    font = opentype.loadSync(fontPath);
  }

  const info = {
    name: font.names.fontFamily?.en,
    unitsPerEm: font.unitsPerEm,
    ascender: font.ascender,
    descender: font.descender,
    isVariable: false,
    axes: [],
    namedInstances: [],
  };

  // Check fvar table for variable font data
  if (font.tables.fvar?.axes?.length > 0) {
    info.isVariable = true;
    info.axes = font.tables.fvar.axes.map(axis => ({
      tag:      axis.tag,          // 'wght', 'wdth', 'slnt', 'ital', 'opsz', or custom
      name:     axis.name?.en || axis.tag,
      min:      axis.minValue,
      default:  axis.defaultValue,
      max:      axis.maxValue,
    }));

    // Named instances (preset weight/width combos)
    if (font.tables.fvar.instances) {
      info.namedInstances = font.tables.fvar.instances.map(inst => ({
        name: inst.name?.en,
        coordinates: inst.coordinates, // e.g., { wght: 700, wdth: 100 }
      }));
    }
  }

  // OS/2 table metrics
  if (font.tables.os2) {
    info.capHeight = font.tables.os2.sCapHeight;
    info.xHeight = font.tables.os2.sxHeight;
  }

  return info;
}

// Usage
inspectVariableFont('./fonts/Inter.woff2').then(console.log);
// Output:
// {
//   name: "Inter",
//   isVariable: true,
//   axes: [
//     { tag: "slnt", name: "Slant", min: -10, default: 0, max: 0 },
//     { tag: "wght", name: "Weight", min: 100, default: 400, max: 900 }
//   ],
//   namedInstances: [
//     { name: "Thin", coordinates: { wght: 100, slnt: 0 } },
//     { name: "Regular", coordinates: { wght: 400, slnt: 0 } },
//     { name: "Bold", coordinates: { wght: 700, slnt: 0 } },
//   ]
// }
```

### 5.2 Detect Variable Font Axes with fontkit

```javascript
import fontkit from 'fontkit';

function inspectWithFontkit(fontPath) {
  const font = fontkit.openSync(fontPath);

  // variationAxes returns { tag: { name, min, default, max } }
  const axes = font.variationAxes;

  // namedVariations returns preset instances
  const instances = font.namedVariations;

  return {
    family: font.familyName,
    isVariable: Object.keys(axes).length > 0,
    axes: Object.entries(axes).map(([tag, axis]) => ({
      tag,
      name: axis.name,
      min: axis.min,
      default: axis.default,
      max: axis.max,
    })),
    namedInstances: Object.entries(instances || {}).map(([name, coords]) => ({
      name,
      coordinates: coords,
    })),
  };
}
```

### 5.3 Extract Variable Font Settings from a Live Page

```javascript
// In browser or via Puppeteer page.evaluate()
function getVariableFontSettings(element) {
  const cs = window.getComputedStyle(element);

  // font-variation-settings: "wght" 600, "wdth" 75
  const variationSettings = cs.fontVariationSettings;

  // Parse into structured data
  const parsed = {};
  if (variationSettings && variationSettings !== 'normal') {
    variationSettings.split(',').forEach(pair => {
      const match = pair.trim().match(/"(\w+)"\s+([\d.]+)/);
      if (match) {
        parsed[match[1]] = parseFloat(match[2]);
      }
    });
  }

  return {
    fontVariationSettings: variationSettings,
    parsed,
    // Also check CSS-level axis properties
    fontWeight:    cs.fontWeight,       // may map to wght axis
    fontStretch:   cs.fontStretch,      // may map to wdth axis
    fontStyle:     cs.fontStyle,        // may map to slnt/ital axes
    fontOpticalSizing: cs.fontOpticalSizing, // maps to opsz axis
  };
}
```

### 5.4 Registered Variable Font Axes

| Tag | CSS Property | Name | Range (typical) |
|-----|-------------|------|-----------------|
| `wght` | `font-weight` | Weight | 100-900 |
| `wdth` | `font-stretch` | Width | 75%-125% |
| `slnt` | `font-style: oblique Xdeg` | Slant | -90 to 90 |
| `ital` | `font-style: italic` | Italic | 0 or 1 |
| `opsz` | `font-optical-sizing` | Optical Size | varies |

Custom axes use UPPERCASE 4-letter tags (e.g., `GRAD` for grade, `CASL` for casual).

---

## 6. Font Rendering Comparison

### 6.1 Playwright Visual Regression Testing

```javascript
// playwright.config.ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  use: {
    // Consistent viewport for font rendering
    viewport: { width: 1280, height: 720 },
  },
  // Use Playwright Docker image for consistent font rendering
  // docker run --rm -v $(pwd):/work -w /work mcr.microsoft.com/playwright:v1.40.0 npx playwright test
});
```

```javascript
// tests/font-rendering.spec.ts
import { test, expect } from '@playwright/test';

test('heading font renders identically', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.evaluate(() => document.fonts.ready);

  // Full page comparison with tolerance
  await expect(page).toHaveScreenshot('full-page.png', {
    maxDiffPixelRatio: 0.01, // Allow 1% pixel difference
  });

  // Element-level comparison (more precise for fonts)
  const heading = page.locator('h1');
  await expect(heading).toHaveScreenshot('heading.png', {
    maxDiffPixels: 5,
  });
});

test('font metrics match original', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.evaluate(() => document.fonts.ready);

  const metrics = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const cs = window.getComputedStyle(h1);
    const rect = h1.getBoundingClientRect();
    return {
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      renderedWidth: rect.width,
      renderedHeight: rect.height,
    };
  });

  expect(metrics.fontFamily).toContain('Inter');
  expect(metrics.fontWeight).toBe('700');
});
```

### 6.2 Update Baselines

```bash
# Generate initial baselines
npx playwright test --update-snapshots

# Compare against baselines
npx playwright test
```

### 6.3 Consistent Rendering in CI

```yaml
# Use Playwright Docker image for identical font rendering across environments
# This ensures system fonts and font rendering libraries are identical
jobs:
  visual-test:
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.40.0-focal
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright test
```

### 6.4 Tools for Visual Comparison

| Tool | Type | Font Tolerance | Best For |
|------|------|---------------|----------|
| **Playwright** | Built-in | `maxDiffPixels`, `maxDiffPixelRatio`, `threshold` | CI/CD, element-level |
| **Chromatic** | SaaS (Storybook) | AI-powered diff | Component libraries |
| **Percy** (BrowserStack) | SaaS | AI Visual Review Agent (2025) | Cross-browser |
| **Applitools** | SaaS | Visual AI (layout-aware) | Enterprise, cross-platform |
| **pixelmatch** | npm library | Configurable threshold | Custom scripts |
| **Vitest** | Built-in | Snapshot support | Unit/component tests |

---

## 7. Next.js Font Integration

### 7.1 Google Fonts with `next/font/google`

```typescript
// app/fonts.ts
import { Inter, Playfair_Display } from 'next/font/google';

// Variable font -- no need to specify weights
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',  // CSS variable for Tailwind
});

// Specific weights
export const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-playfair',
});
```

```typescript
// app/layout.tsx
import { inter, playfair } from './fonts';

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
```

### 7.2 Local Fonts with `next/font/local` (Extracted Fonts)

This is what you use when you downloaded font files from a target website.

```typescript
// app/fonts.ts
import localFont from 'next/font/local';

// Single variable font file
export const targetFont = localFont({
  src: '../fonts/TargetFont-Variable.woff2',
  display: 'swap',
  variable: '--font-target',
});

// Multiple static font files (weight/style variants)
export const targetHeading = localFont({
  src: [
    {
      path: '../fonts/TargetHeading-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/TargetHeading-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/TargetHeading-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../fonts/TargetHeading-BoldItalic.woff2',
      weight: '700',
      style: 'italic',
    },
  ],
  display: 'swap',
  variable: '--font-heading',
});
```

### 7.3 Tailwind CSS Integration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-heading)', 'Georgia', 'serif'],
      },
    },
  },
};

export default config;
```

```tsx
// Usage in components
<h1 className="font-heading text-4xl font-bold">
  Pixel-perfect heading
</h1>
<p className="font-sans text-base font-normal">
  Body text using the exact extracted font
</p>
```

### 7.4 Variable Font with Axes in Next.js

```typescript
import localFont from 'next/font/local';

export const interVariable = localFont({
  src: '../fonts/Inter-Variable.woff2',
  display: 'swap',
  variable: '--font-inter',
  // Declare axes for variable fonts
  // Next.js auto-generates size-adjust for zero layout shift
});

// Use specific weight via CSS
// font-variation-settings: "wght" 550;
// or: font-weight: 550;
```

### 7.5 Font Organization Best Practice

```
project/
├── app/
│   ├── fonts.ts          # All font imports centralized
│   ├── layout.tsx        # Apply CSS variables at root
│   └── globals.css       # Tailwind + custom font utilities
├── fonts/                # Extracted font files
│   ├── Inter-Variable.woff2
│   ├── Heading-Regular.woff2
│   ├── Heading-Bold.woff2
│   └── Heading-BoldItalic.woff2
└── tailwind.config.ts    # Map CSS variables to Tailwind
```

### 7.6 Complete Extraction-to-Integration Pipeline

```bash
# Step 1: Extract fonts from target site
node extract-fonts.js https://target-site.com

# Step 2: Inspect extracted fonts for variable axes
node inspect-font.js ./extracted-fonts/TargetFont.woff2

# Step 3: Subset fonts to only needed glyphs (optional, reduces size)
glyphhanger http://localhost:3000 --subset=./extracted-fonts/*.woff2 \
  --formats=woff2 --output=./fonts/

# Step 4: Configure in Next.js (see 7.2 above)

# Step 5: Verify rendering matches
npx playwright test --update-snapshots  # create baseline from target
# ... build your clone ...
npx playwright test                      # compare against baseline
```

---

## Package Summary

| Package | Install | Purpose |
|---------|---------|---------|
| `playwright` | `npm i -D playwright` | Browser automation, font file interception, screenshots |
| `puppeteer` | `npm i puppeteer` | Browser automation, CDP access for platform fonts |
| `opentype.js` | `npm i opentype.js` | Parse font files, inspect axes, extract metadata |
| `fontkit` | `npm i fontkit` | Advanced font engine, variable font axis detection |
| `wawoff2` | `npm i wawoff2` | Decompress woff2 in JavaScript |
| `webfont-dl` | `npm i -g webfont-dl` | Download fonts from CSS @font-face URLs |
| `glyphhanger` | `npm i -g glyphhanger` | Subset fonts, detect used glyphs |
| `css-font-parser` | `npm i css-font-parser` | Parse CSS font shorthand values |
| `fonttools` (Python) | `pip install fonttools brotli` | Convert, subset, inspect fonts |
| `pixelmatch` | `npm i pixelmatch` | Pixel-level image comparison |
| `next/font` | Built into Next.js | Self-host and optimize fonts |

---

## Sources

- [MDN: Window.getComputedStyle()](https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle)
- [MDN: Document.fonts](https://developer.mozilla.org/en-US/docs/Web/API/Document/fonts)
- [MDN: FontFaceSet.check()](https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet/check)
- [MDN: Local Font Access API](https://developer.mozilla.org/en-US/docs/Web/API/Local_Font_Access_API)
- [MDN: CSS font-variation-settings](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-variation-settings)
- [MDN: Variable Fonts Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Fonts/Variable_fonts)
- [Chrome DevTools Protocol: CSS.getPlatformFontsForNode](https://chromedevtools.github.io/devtools-protocol/tot/CSS/#method-getPlatformFontsForNode)
- [Chrome: DevTools Answers - What Font Is That?](https://developer.chrome.com/blog/devtools-answers-what-font-is-that)
- [Chrome: Local Font Access API](https://developer.chrome.com/docs/capabilities/web-apis/local-fonts)
- [Playwright: Visual Comparisons](https://playwright.dev/docs/test-snapshots)
- [Playwright: Network Interception](https://playwright.dev/docs/network)
- [Next.js: Font Optimization](https://nextjs.org/docs/app/getting-started/fonts)
- [Next.js: Font Component API](https://nextjs.org/docs/app/api-reference/components/font)
- [Vercel Blog: Custom Fonts with next/font](https://vercel.com/blog/nextjs-next-font)
- [GitHub: webfont-dl](https://github.com/mmastrac/webfont-dl)
- [GitHub: glyphhanger](https://github.com/zachleat/glyphhanger)
- [GitHub: opentype.js](https://github.com/opentypejs/opentype.js)
- [GitHub: fontkit](https://github.com/foliojs/fontkit)
- [GitHub: font-scraper](https://github.com/elifitch/font-scraper)
- [WhatFontIs API Documentation](https://www.whatfontis.com/API-identify-fonts-from-image.html)
- [Fontspring Matcherator](https://www.fontspring.com/matcherator)
- [Font Squirrel Matcherator](https://www.fontsquirrel.com/matcherator)
- [Variable Fonts for Developers](https://variablefonts.dev/getting-started)
- [Creating a Font Inspector (opentype.js)](https://publishing-project.rivendellweb.net/creating-a-font-inspector/)
- [Peek Chrome Extension](https://peek.framer.ai/)
- [Bug0: Visual Regression Testing Tools 2026](https://bug0.com/knowledge-base/visual-regression-testing-tools)
- [Bug0: Playwright Visual Regression Testing 2026](https://bug0.com/knowledge-base/playwright-visual-regression-testing)
- [ExtractAssets: Font Extractor](https://extractassets.com/extract-fonts-from-website)

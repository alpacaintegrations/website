# Sprintsubsidie blogs implementatieplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Acht statische blog-pagina's onder `/blog/<slug>` publiceren via een lokale Node-build-pipeline die markdown opschoont van AI-detectie signalen, schoon HTML genereert, en alle SEO-eisen (canonical, Open Graph, Twitter Cards, Schema.org, sitemap) afdekt.

**Architectuur:** Markdown is de source of truth in `/content/blogs/*.md`. Een Node-script `scripts/build-blogs.js` orkestreert losse modules (text-cleaner, AI-signal-linter, link-mapper, external-link-marker, schema-generator, sitemap-generator) en schrijft HTML naar `/blog/<slug>.html`. Output wordt gecommit; Netlify doet pure static publish. Tests via Node's ingebouwde `node:test` runner — geen externe test-dependencies.

**Tech Stack:** Node.js 20+, `marked` (markdown → HTML, enige runtime-dep), `node:test` (built-in test runner), Netlify (static publish, geen build-step).

**Voorafgaand werk (geen task — context):** Spec `docs/superpowers/specs/2026-05-11-sprintsubsidie-blogs-design.md` is goedgekeurd. Markdown-bronbestanden staan in `c:\Users\hjemj\OneDrive - alpaca integrations\Ai\sprint subsidie\seo blog\`. OG-images (PNG 1200x630) staan in dezelfde folder.

---

## Bestandsstructuur (eindstaat)

```
website/
├── blog/                              [gecommit, output van build]
│   ├── sprintsubsidie-mkb-limburg-gids.html
│   ├── sprintsubsidie-voorwaarden-wat-komt-in-aanmerking.html
│   ├── ai-implementeren-sprintsubsidie.html
│   ├── bedrijfsprocessen-automatiseren-sprintsubsidie.html
│   ├── beste-processen-automatiseren-bedrijf.html
│   ├── sprintsubsidie-voorbeeld-administratie-automatiseren.html
│   ├── sprintsubsidie-voorbeeld-klantenservice-ai.html
│   ├── sprintsubsidie-aanvragen-stappenplan.html
│   └── embeds/                        [gecommit, iframe-bronnen]
│       ├── tafelgasten-voor.html
│       ├── tafelgasten-na.html
│       ├── ecommerce-voor.html
│       └── ecommerce-na.html
├── content/
│   └── blogs/                         [gecommit, markdown bron]
│       ├── sprintsubsidie-pillar-blog.md
│       ├── sprintsubsidie-voorwaarden-blog.md
│       ├── sprintsubsidie-ai-blog.md
│       ├── sprintsubsidie-automatisering-blog.md
│       ├── sprintsubsidie-processen-blog.md
│       ├── sprintsubsidie-tafelgasten-blog.md
│       ├── sprintsubsidie-ecommerce-blog.md
│       └── sprintsubsidie-aanvragen-blog.md
├── images/
│   └── og/                            [gecommit, 8 PNG bestanden]
├── scripts/
│   ├── build-blogs.js                 [orchestrator]
│   ├── blog-config.js                 [per-blog metadata + faq/howto data]
│   ├── clean-text.js                  [unicode-opschoning]
│   ├── ai-signals-check.js            [lint-waarschuwingen]
│   ├── link-mapper.js                 [placeholder → URL]
│   ├── external-link-marker.js        [target=_blank toevoegen]
│   ├── schema-generator.js            [Schema.org JSON-LD]
│   ├── sitemap-generator.js           [sitemap.xml]
│   ├── templates/
│   │   └── blog-template.html         [gedeelde HTML template]
│   └── tests/
│       ├── clean-text.test.js
│       ├── ai-signals-check.test.js
│       ├── link-mapper.test.js
│       ├── external-link-marker.test.js
│       ├── schema-generator.test.js
│       └── sitemap-generator.test.js
├── sitemap.xml                        [gecommit, output van build]
├── package.json                       [nieuw]
├── .gitignore                         [nieuw of aangevuld]
└── netlify.toml                       [aangevuld met /blog/ redirects]
```

**Belangrijk over commit-strategie:** Generated HTML in `/blog/` wordt **wel** gecommit. Bij elke markdown-wijziging: `npm run build` lokaal draaien, dan committen. Past bij bestaande site-pattern (alle HTML in repo) en houdt Netlify-deploy puur static.

---

## Task 1: Project setup — Node, package.json, folder skeleton

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `content/blogs/` (empty)
- Create: `scripts/` (empty)
- Create: `scripts/templates/` (empty)
- Create: `scripts/tests/` (empty)
- Create: `images/og/` (empty)
- Create: `blog/embeds/` (empty)

- [ ] **Step 1: Verifieer Node-versie ≥ 20**

Run: `node --version`
Expected: `v20.x.x` of hoger. `node:test` is stabiel vanaf Node 20.

- [ ] **Step 2: Maak `package.json`**

```json
{
  "name": "alpaca-website",
  "version": "1.0.0",
  "description": "Alpaca Integrations website + blog publish pipeline",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "node scripts/build-blogs.js",
    "test": "node --test scripts/tests/"
  },
  "dependencies": {
    "marked": "^14.0.0"
  },
  "engines": {
    "node": ">=20"
  }
}
```

- [ ] **Step 3: Maak `.gitignore`**

```
node_modules/
.DS_Store
*.log
```

- [ ] **Step 4: Maak lege folders**

Run vanuit website root:
```bash
mkdir -p content/blogs scripts/templates scripts/tests images/og blog/embeds
```

- [ ] **Step 5: Install marked**

Run: `npm install`
Expected: `node_modules/marked` aanwezig, geen errors.

- [ ] **Step 6: Verifieer test-runner werkt**

Maak tijdelijke `scripts/tests/_sanity.test.js`:
```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('sanity', () => {
  assert.equal(1 + 1, 2);
});
```

Run: `npm test`
Expected: 1 passed.

Verwijder daarna `scripts/tests/_sanity.test.js`.

- [ ] **Step 7: Commit**

```bash
git add package.json .gitignore content/ scripts/ images/og/ blog/
git commit -m "blog-pipeline: project setup met node 20 + marked"
```

---

## Task 2: Markdown en OG-images naar repo kopiëren

**Files:**
- Copy 8 markdown files into: `content/blogs/`
- Copy 8 PNG files into: `images/og/`
- Copy 4 diagram HTML files into: `blog/embeds/`

- [ ] **Step 1: Kopieer 8 markdown-bestanden**

Bron: `c:/Users/hjemj/OneDrive - alpaca integrations/Ai/sprint subsidie/seo blog/`
Doel: `content/blogs/`

Bestanden:
- `sprintsubsidie-pillar-blog.md`
- `sprintsubsidie-voorwaarden-blog.md`
- `sprintsubsidie-ai-blog.md`
- `sprintsubsidie-automatisering-blog.md`
- `sprintsubsidie-processen-blog.md`
- `sprintsubsidie-tafelgasten-blog.md`
- `sprintsubsidie-ecommerce-blog.md`
- `sprintsubsidie-aanvragen-blog.md`

Powershell-commando vanuit website-root:
```powershell
$src = "c:\Users\hjemj\OneDrive - alpaca integrations\Ai\sprint subsidie\seo blog"
Copy-Item "$src\sprintsubsidie-*-blog.md" -Destination "content\blogs\"
```

Verifieer: `ls content/blogs/` toont 8 .md bestanden.

- [ ] **Step 2: Kopieer 8 OG-images**

Bron: zelfde folder. Bestanden:
- `og-sprintsubsidie-mkb-limburg-gids.png`
- `og-sprintsubsidie-voorwaarden-wat-komt-in-aanmerking.png`
- `og-ai-implementeren-sprintsubsidie.png`
- `og-bedrijfsprocessen-automatiseren-sprintsubsidie.png`
- `og-beste-processen-automatiseren-bedrijf.png`
- `og-sprintsubsidie-voorbeeld-administratie-automatiseren.png`
- `og-sprintsubsidie-voorbeeld-klantenservice-ai.png`
- `og-sprintsubsidie-aanvragen-stappenplan.png`

Powershell:
```powershell
Copy-Item "$src\og-*.png" -Destination "images\og\"
```

Verifieer: `ls images/og/` toont 8 PNG-bestanden.

- [ ] **Step 3: Kopieer 4 diagram HTML-bestanden**

Bron: zelfde folder. Bestanden:
- `tafelgasten-voor-blog.html` → `blog/embeds/tafelgasten-voor.html`
- `tafelgasten-na-blog.html` → `blog/embeds/tafelgasten-na.html`
- `ecommerce-voor-blog.html` → `blog/embeds/ecommerce-voor.html`
- `ecommerce-na-blog.html` → `blog/embeds/ecommerce-na.html`

Powershell:
```powershell
Copy-Item "$src\tafelgasten-voor-blog.html" -Destination "blog\embeds\tafelgasten-voor.html"
Copy-Item "$src\tafelgasten-na-blog.html" -Destination "blog\embeds\tafelgasten-na.html"
Copy-Item "$src\ecommerce-voor-blog.html" -Destination "blog\embeds\ecommerce-voor.html"
Copy-Item "$src\ecommerce-na-blog.html" -Destination "blog\embeds\ecommerce-na.html"
```

- [ ] **Step 4: Commit**

```bash
git add content/blogs/ images/og/ blog/embeds/
git commit -m "blog-pipeline: 8 markdown blogs, 8 OG-images, 4 diagram embeds toegevoegd"
```

---

## Task 3: `clean-text.js` module — unicode opschoning (TDD)

**Files:**
- Create: `scripts/clean-text.js`
- Create: `scripts/tests/clean-text.test.js`

Functie: strip AI-detectie unicode signalen uit markdown-tekst.

- [ ] **Step 1: Schrijf failing tests**

`scripts/tests/clean-text.test.js`:
```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { cleanText } from '../clean-text.js';

describe('cleanText', () => {
  test('strips zero-width space U+200B', () => {
    const input = 'hello​world';
    assert.equal(cleanText(input), 'helloworld');
  });

  test('strips zero-width non-joiner U+200C', () => {
    assert.equal(cleanText('a‌b'), 'ab');
  });

  test('strips zero-width joiner U+200D', () => {
    assert.equal(cleanText('a‍b'), 'ab');
  });

  test('strips BOM U+FEFF', () => {
    assert.equal(cleanText('﻿hello'), 'hello');
  });

  test('strips word joiner U+2060', () => {
    assert.equal(cleanText('a⁠b'), 'ab');
  });

  test('strips soft hyphen U+00AD', () => {
    assert.equal(cleanText('a­b'), 'ab');
  });

  test('replaces non-breaking space U+00A0 with normal space', () => {
    assert.equal(cleanText('a b'), 'a b');
  });

  test('replaces left double quote U+201C with straight quote', () => {
    assert.equal(cleanText('“hello”'), '"hello"');
  });

  test('replaces left single quote U+2018 with straight quote', () => {
    assert.equal(cleanText('‘hello’'), "'hello'");
  });

  test('replaces ellipsis U+2026 with three dots', () => {
    assert.equal(cleanText('wait…'), 'wait...');
  });

  test('preserves em-dash U+2014 unchanged (flagged separately)', () => {
    assert.equal(cleanText('a—b'), 'a—b');
  });

  test('leaves clean text untouched', () => {
    const clean = 'Een normale zin zonder rare karakters.';
    assert.equal(cleanText(clean), clean);
  });

  test('handles empty string', () => {
    assert.equal(cleanText(''), '');
  });

  test('handles multiple invisible chars in one string', () => {
    const input = '﻿hello​world‌!';
    assert.equal(cleanText(input), 'helloworld!');
  });
});
```

- [ ] **Step 2: Run test om te zien dat ze falen**

Run: `npm test -- scripts/tests/clean-text.test.js`
Expected: FAIL — `Cannot find module '../clean-text.js'` of vergelijkbare error.

- [ ] **Step 3: Implementeer `clean-text.js`**

`scripts/clean-text.js`:
```javascript
const ZERO_WIDTH_PATTERN = /[​‌‍﻿⁠­]/g;
const NBSP_PATTERN = / /g;
const SMART_DOUBLE_OPEN = /“/g;
const SMART_DOUBLE_CLOSE = /”/g;
const SMART_SINGLE_OPEN = /‘/g;
const SMART_SINGLE_CLOSE = /’/g;
const ELLIPSIS = /…/g;

export function cleanText(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(ZERO_WIDTH_PATTERN, '')
    .replace(NBSP_PATTERN, ' ')
    .replace(SMART_DOUBLE_OPEN, '"')
    .replace(SMART_DOUBLE_CLOSE, '"')
    .replace(SMART_SINGLE_OPEN, "'")
    .replace(SMART_SINGLE_CLOSE, "'")
    .replace(ELLIPSIS, '...');
}
```

- [ ] **Step 4: Run test om te zien dat ze slagen**

Run: `npm test -- scripts/tests/clean-text.test.js`
Expected: 14 passed.

- [ ] **Step 5: Commit**

```bash
git add scripts/clean-text.js scripts/tests/clean-text.test.js
git commit -m "blog-pipeline: clean-text module strippt unicode AI-signalen"
```

---

## Task 4: `ai-signals-check.js` module — verdachte patronen lint (TDD)

**Files:**
- Create: `scripts/ai-signals-check.js`
- Create: `scripts/tests/ai-signals-check.test.js`

Functie: rapporteert verdachte tekstpatronen voor handmatige review (auto-fix niet — dit is een waarschuwing, geen fout).

- [ ] **Step 1: Schrijf failing tests**

`scripts/tests/ai-signals-check.test.js`:
```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { findAiSignals } from '../ai-signals-check.js';

describe('findAiSignals', () => {
  test('detects "Niet X, maar Y" patroon', () => {
    const text = 'Niet alleen handig, maar ook snel.';
    const signals = findAiSignals(text);
    assert.ok(signals.some(s => s.pattern === 'niet-x-maar-y'));
  });

  test('detects "Het korte antwoord:" opener', () => {
    const text = 'Het korte antwoord: ja.';
    const signals = findAiSignals(text);
    assert.ok(signals.some(s => s.pattern === 'korte-antwoord-opener'));
  });

  test('detects "Even kort" opener', () => {
    const text = 'Even kort voor wie de regeling niet kent.';
    const signals = findAiSignals(text);
    assert.ok(signals.some(s => s.pattern === 'even-kort-opener'));
  });

  test('detects "Het cruciale punt:" marker', () => {
    const text = 'Het cruciale punt: dit moet je weten.';
    const signals = findAiSignals(text);
    assert.ok(signals.some(s => s.pattern === 'cruciale-punt-marker'));
  });

  test('detects em-dash for review', () => {
    const text = 'Een zin—met em-dash.';
    const signals = findAiSignals(text);
    assert.ok(signals.some(s => s.pattern === 'em-dash'));
  });

  test('returns line number per match', () => {
    const text = 'regel een\nregel twee\nHet korte antwoord: hier.';
    const signals = findAiSignals(text);
    const match = signals.find(s => s.pattern === 'korte-antwoord-opener');
    assert.equal(match.line, 3);
  });

  test('returns empty array for clean text', () => {
    const text = 'Een gewone zin zonder verdachte patronen aanwezig.';
    const signals = findAiSignals(text);
    assert.deepEqual(signals, []);
  });

  test('reports match excerpt for context', () => {
    const text = 'Het korte antwoord: ja inderdaad.';
    const signals = findAiSignals(text);
    const match = signals[0];
    assert.ok(match.excerpt.includes('Het korte antwoord'));
  });
});
```

- [ ] **Step 2: Run test om te zien dat ze falen**

Run: `npm test -- scripts/tests/ai-signals-check.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implementeer `ai-signals-check.js`**

`scripts/ai-signals-check.js`:
```javascript
const PATTERNS = [
  { id: 'niet-x-maar-y', regex: /\bNiet\s+\w+[^.,;]*,\s*maar\s+/gi },
  { id: 'korte-antwoord-opener', regex: /\bHet\s+korte\s+antwoord:/gi },
  { id: 'even-kort-opener', regex: /\bEven\s+kort\b/gi },
  { id: 'cruciale-punt-marker', regex: /\bHet\s+cruciale\s+punt:/gi },
  { id: 'em-dash', regex: /—/g },
  { id: 'en-dash', regex: /–/g }
];

export function findAiSignals(text) {
  const lines = text.split('\n');
  const signals = [];

  for (const { id, regex } of PATTERNS) {
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      const matches = line.matchAll(new RegExp(regex.source, regex.flags));
      for (const match of matches) {
        signals.push({
          pattern: id,
          line: lineIdx + 1,
          excerpt: line.trim().slice(0, 120)
        });
      }
    }
  }

  return signals;
}

export function reportSignals(signals, filename) {
  if (signals.length === 0) {
    console.log(`  [ok] ${filename}: geen AI-signalen gevonden`);
    return;
  }
  console.log(`  [!] ${filename}: ${signals.length} AI-signaal-waarschuwing(en):`);
  for (const s of signals) {
    console.log(`      line ${s.line} [${s.pattern}]: ${s.excerpt}`);
  }
}
```

- [ ] **Step 4: Run test om te zien dat ze slagen**

Run: `npm test -- scripts/tests/ai-signals-check.test.js`
Expected: 8 passed.

- [ ] **Step 5: Commit**

```bash
git add scripts/ai-signals-check.js scripts/tests/ai-signals-check.test.js
git commit -m "blog-pipeline: ai-signals-check module rapporteert verdachte patronen"
```

---

## Task 5: `link-mapper.js` module — placeholder links vervangen (TDD)

**Files:**
- Create: `scripts/link-mapper.js`
- Create: `scripts/tests/link-mapper.test.js`

Functie: vervangt markdown-placeholder `[anchor tekst](link)` door echte URL op basis van substring-match in de anchor tekst. Mapping uit overdrachtsdocument.

- [ ] **Step 1: Schrijf failing tests**

`scripts/tests/link-mapper.test.js`:
```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mapPlaceholderLinks } from '../link-mapper.js';

describe('mapPlaceholderLinks', () => {
  test('vervangt link met "complete gids" naar pillar URL', () => {
    const input = 'Lees de [complete gids over de Sprintsubsidie MKB](link).';
    const out = mapPlaceholderLinks(input);
    assert.ok(out.includes('/blog/sprintsubsidie-mkb-limburg-gids'));
    assert.ok(!out.includes('](link)'));
  });

  test('vervangt link met "voorwaarden" naar voorwaarden blog', () => {
    const input = 'Bekijk [de voorwaarden van de Sprintsubsidie](link).';
    const out = mapPlaceholderLinks(input);
    assert.ok(out.includes('/blog/sprintsubsidie-voorwaarden-wat-komt-in-aanmerking'));
  });

  test('vervangt link met "AI implementeren" naar ai blog', () => {
    const input = '[hoe je AI kunt implementeren](link)';
    const out = mapPlaceholderLinks(input);
    assert.ok(out.includes('/blog/ai-implementeren-sprintsubsidie'));
  });

  test('vervangt link met "bedrijfsprocessen automatiseren" naar automatisering blog', () => {
    const input = '[bedrijfsprocessen automatiseren met de Sprintsubsidie](link)';
    const out = mapPlaceholderLinks(input);
    assert.ok(out.includes('/blog/bedrijfsprocessen-automatiseren-sprintsubsidie'));
  });

  test('vervangt link met "beste processen" naar processen blog', () => {
    const input = '[hoe je de beste processen vindt om te automatiseren](link)';
    const out = mapPlaceholderLinks(input);
    assert.ok(out.includes('/blog/beste-processen-automatiseren-bedrijf'));
  });

  test('vervangt link met "administratie van een zakelijke opleider" naar tafelgasten', () => {
    const input = '[administratie van een zakelijke opleider automatiseren](link)';
    const out = mapPlaceholderLinks(input);
    assert.ok(out.includes('/blog/sprintsubsidie-voorbeeld-administratie-automatiseren'));
  });

  test('vervangt link met "klantenservice automatiseren met AI" naar ecommerce', () => {
    const input = '[voorbeeldproject: klantenservice automatiseren met AI](link)';
    const out = mapPlaceholderLinks(input);
    assert.ok(out.includes('/blog/sprintsubsidie-voorbeeld-klantenservice-ai'));
  });

  test('vervangt link met "stappenplan" naar aanvragen blog', () => {
    const input = '[stappenplan voor het aanvragen](link)';
    const out = mapPlaceholderLinks(input);
    assert.ok(out.includes('/blog/sprintsubsidie-aanvragen-stappenplan'));
  });

  test('vervangt subsidie-assistent naar chatbot-anchor', () => {
    const input = '[Stel je vraag aan onze subsidie-assistent](link)';
    const out = mapPlaceholderLinks(input);
    assert.ok(out.includes('#chatbot'));
  });

  test('vervangt "plan een gesprek" naar Outlook booking', () => {
    const input = '[plan een vrijblijvend gesprek](link)';
    const out = mapPlaceholderLinks(input);
    assert.ok(out.includes('outlook.office365.com/book/Alpacaintegrations1'));
  });

  test('vervangt "AI quickscan" naar scorecard', () => {
    const input = '[doe de AI quickscan](link)';
    const out = mapPlaceholderLinks(input);
    assert.ok(out.includes('/scorecard'));
  });

  test('laat reeds volledige URLs ongemoeid', () => {
    const input = '[RVO](https://www.rvo.nl/onderwerpen/mit)';
    const out = mapPlaceholderLinks(input);
    assert.equal(out, input);
  });

  test('flagt onbekende placeholder-link met fout', () => {
    const input = '[iets totaal onbekends en niet gemapt](link)';
    assert.throws(() => mapPlaceholderLinks(input), /unmapped placeholder/i);
  });
});
```

- [ ] **Step 2: Run test om te zien dat ze falen**

Run: `npm test -- scripts/tests/link-mapper.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implementeer `link-mapper.js`**

`scripts/link-mapper.js`:
```javascript
const MAPPINGS = [
  { match: /complete gids/i, url: '/blog/sprintsubsidie-mkb-limburg-gids' },
  { match: /wel en niet in aanmerking|voorwaarden van de sprintsubsidie|de voorwaarden/i, url: '/blog/sprintsubsidie-voorwaarden-wat-komt-in-aanmerking' },
  { match: /ai implementeren|ai kunt implementeren|ai-project/i, url: '/blog/ai-implementeren-sprintsubsidie' },
  { match: /bedrijfsprocessen automatiseren|automatiseren met (de )?sprintsubsidie|automatisering zonder ai/i, url: '/blog/bedrijfsprocessen-automatiseren-sprintsubsidie' },
  { match: /beste processen|processen (om te automatiseren )?vindt/i, url: '/blog/beste-processen-automatiseren-bedrijf' },
  { match: /administratie van een zakelijke opleider|ander voorbeeldproject/i, url: '/blog/sprintsubsidie-voorbeeld-administratie-automatiseren' },
  { match: /klantenservice automatiseren met ai|voorbeeldproject: klantenservice/i, url: '/blog/sprintsubsidie-voorbeeld-klantenservice-ai' },
  { match: /stappenplan|aanvragen.*sprintsubsidie/i, url: '/blog/sprintsubsidie-aanvragen-stappenplan' },
  { match: /subsidie-assistent/i, url: '#chatbot' },
  { match: /plan een( vrijblijvend)? gesprek/i, url: 'https://outlook.office365.com/book/Alpacaintegrations1@alpacaintegrations.ai/' },
  { match: /ai quickscan/i, url: 'https://www.alpacaintegrations.ai/scorecard' }
];

const PLACEHOLDER_REGEX = /\[([^\]]+)\]\(link\)/g;

export function mapPlaceholderLinks(input) {
  return input.replace(PLACEHOLDER_REGEX, (full, anchorText) => {
    for (const { match, url } of MAPPINGS) {
      if (match.test(anchorText)) {
        return `[${anchorText}](${url})`;
      }
    }
    throw new Error(`unmapped placeholder link: [${anchorText}](link)`);
  });
}
```

- [ ] **Step 4: Run test om te zien dat ze slagen**

Run: `npm test -- scripts/tests/link-mapper.test.js`
Expected: 13 passed.

- [ ] **Step 5: Commit**

```bash
git add scripts/link-mapper.js scripts/tests/link-mapper.test.js
git commit -m "blog-pipeline: link-mapper vervangt placeholders door echte URLs"
```

---

## Task 6: `external-link-marker.js` module — target=_blank op externe links (TDD)

**Files:**
- Create: `scripts/external-link-marker.js`
- Create: `scripts/tests/external-link-marker.test.js`

Functie: bewerkt HTML output zodat alle externe `<a>` tags `target="_blank" rel="noopener"` krijgen. Werkt op HTML, niet op markdown — draait na marked-conversie.

- [ ] **Step 1: Schrijf failing tests**

`scripts/tests/external-link-marker.test.js`:
```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { markExternalLinks } from '../external-link-marker.js';

describe('markExternalLinks', () => {
  test('voegt target=_blank toe aan externe http link', () => {
    const html = '<a href="https://www.rvo.nl/mit">RVO</a>';
    const out = markExternalLinks(html);
    assert.ok(out.includes('target="_blank"'));
    assert.ok(out.includes('rel="noopener"'));
  });

  test('laat interne /blog/ link ongemoeid', () => {
    const html = '<a href="/blog/sprintsubsidie-mkb-limburg-gids">pillar</a>';
    const out = markExternalLinks(html);
    assert.ok(!out.includes('target="_blank"'));
  });

  test('laat anchor link #chatbot ongemoeid', () => {
    const html = '<a href="#chatbot">chat</a>';
    const out = markExternalLinks(html);
    assert.ok(!out.includes('target="_blank"'));
  });

  test('voegt geen dubbele target=_blank toe', () => {
    const html = '<a href="https://example.com" target="_blank">x</a>';
    const out = markExternalLinks(html);
    const matches = out.match(/target="_blank"/g);
    assert.equal(matches.length, 1);
  });

  test('werkt op meerdere links in één string', () => {
    const html = '<a href="https://a.com">a</a> en <a href="/blog/x">b</a> en <a href="https://c.com">c</a>';
    const out = markExternalLinks(html);
    const matches = out.match(/target="_blank"/g) || [];
    assert.equal(matches.length, 2);
  });

  test('herkent mailto: als extern', () => {
    const html = '<a href="mailto:test@example.com">mail</a>';
    const out = markExternalLinks(html);
    assert.ok(out.includes('target="_blank"'));
  });
});
```

- [ ] **Step 2: Run test om te zien dat ze falen**

Run: `npm test -- scripts/tests/external-link-marker.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implementeer `external-link-marker.js`**

`scripts/external-link-marker.js`:
```javascript
const ANCHOR_REGEX = /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*)>/gi;

function isExternal(href) {
  return /^(https?:|mailto:)/.test(href);
}

export function markExternalLinks(html) {
  return html.replace(ANCHOR_REGEX, (full, before, href, after) => {
    if (!isExternal(href)) return full;
    const combined = `${before} ${after}`;
    if (/target=/.test(combined)) return full;
    const trimmedBefore = before.trim();
    const beforeOut = trimmedBefore ? trimmedBefore + ' ' : '';
    const afterOut = after.trim() ? ' ' + after.trim() : '';
    return `<a ${beforeOut}href="${href}" target="_blank" rel="noopener"${afterOut}>`;
  });
}
```

- [ ] **Step 4: Run test om te zien dat ze slagen**

Run: `npm test -- scripts/tests/external-link-marker.test.js`
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add scripts/external-link-marker.js scripts/tests/external-link-marker.test.js
git commit -m "blog-pipeline: external-link-marker voegt target=_blank toe"
```

---

## Task 7: `schema-generator.js` module — Schema.org JSON-LD (TDD)

**Files:**
- Create: `scripts/schema-generator.js`
- Create: `scripts/tests/schema-generator.test.js`

Functie: genereert Schema.org JSON-LD strings. Output is een array van strings die het template kan injecteren.

- [ ] **Step 1: Schrijf failing tests**

`scripts/tests/schema-generator.test.js`:
```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateSchemas } from '../schema-generator.js';

const baseConfig = {
  slug: 'test-blog',
  title: 'Test blog titel',
  description: 'Test beschrijving',
  ogImage: 'og-test.png',
  datePublished: '2026-05-11T09:00:00+02:00',
  dateModified: '2026-05-11T09:00:00+02:00'
};

describe('generateSchemas', () => {
  test('genereert altijd BlogPosting', () => {
    const out = generateSchemas(baseConfig);
    assert.ok(out.some(s => s.includes('"@type": "BlogPosting"')));
  });

  test('BlogPosting bevat correcte URLs', () => {
    const out = generateSchemas(baseConfig);
    const blog = out.find(s => s.includes('BlogPosting'));
    assert.ok(blog.includes('https://alpacaintegrations.ai/blog/test-blog'));
    assert.ok(blog.includes('https://alpacaintegrations.ai/images/og/og-test.png'));
  });

  test('BlogPosting heeft author als Person', () => {
    const out = generateSchemas(baseConfig);
    const blog = out.find(s => s.includes('BlogPosting'));
    assert.ok(blog.includes('"@type": "Person"'));
    assert.ok(blog.includes('"name": "Rick"'));
  });

  test('voegt FAQPage toe als faqItems aanwezig', () => {
    const cfg = {
      ...baseConfig,
      faqItems: [
        { q: 'Wat is X?', a: 'X is Y.' },
        { q: 'Hoe doe je Z?', a: 'Door A te doen.' }
      ]
    };
    const out = generateSchemas(cfg);
    assert.ok(out.some(s => s.includes('"@type": "FAQPage"')));
    const faq = out.find(s => s.includes('FAQPage'));
    assert.ok(faq.includes('Wat is X?'));
    assert.ok(faq.includes('X is Y.'));
  });

  test('voegt HowTo toe als howToSteps aanwezig', () => {
    const cfg = {
      ...baseConfig,
      howToName: 'Hoe vraag je aan',
      howToSteps: [
        { name: 'Stap 1', text: 'Doe X.' },
        { name: 'Stap 2', text: 'Doe Y.' }
      ]
    };
    const out = generateSchemas(cfg);
    assert.ok(out.some(s => s.includes('"@type": "HowTo"')));
    const howto = out.find(s => s.includes('HowTo'));
    assert.ok(howto.includes('Stap 1'));
    assert.ok(howto.includes('Doe X.'));
  });

  test('voegt geen FAQ/HowTo toe als die data ontbreekt', () => {
    const out = generateSchemas(baseConfig);
    assert.equal(out.length, 1);
  });

  test('output is geldige JSON (per item)', () => {
    const out = generateSchemas(baseConfig);
    for (const jsonStr of out) {
      const cleaned = jsonStr.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '');
      assert.doesNotThrow(() => JSON.parse(cleaned));
    }
  });
});
```

- [ ] **Step 2: Run test om te zien dat ze falen**

Run: `npm test -- scripts/tests/schema-generator.test.js`
Expected: FAIL.

- [ ] **Step 3: Implementeer `schema-generator.js`**

`scripts/schema-generator.js`:
```javascript
const SITE = 'https://alpacaintegrations.ai';
const RICK_LINKEDIN = 'https://www.linkedin.com/in/rickalpacaintegrations';

function wrap(obj) {
  return `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n</script>`;
}

function blogPosting(cfg) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: cfg.title,
    description: cfg.description,
    author: {
      '@type': 'Person',
      name: 'Rick',
      url: RICK_LINKEDIN
    },
    publisher: {
      '@type': 'Organization',
      name: 'Alpaca Integrations',
      url: SITE
    },
    datePublished: cfg.datePublished,
    dateModified: cfg.dateModified,
    image: `${SITE}/images/og/${cfg.ogImage}`,
    mainEntityOfPage: `${SITE}/blog/${cfg.slug}`
  };
}

function faqPage(faqItems) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a }
    }))
  };
}

function howTo(name, steps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text
    }))
  };
}

export function generateSchemas(cfg) {
  const out = [wrap(blogPosting(cfg))];
  if (cfg.faqItems && cfg.faqItems.length > 0) {
    out.push(wrap(faqPage(cfg.faqItems)));
  }
  if (cfg.howToSteps && cfg.howToSteps.length > 0) {
    out.push(wrap(howTo(cfg.howToName || cfg.title, cfg.howToSteps)));
  }
  return out;
}
```

- [ ] **Step 4: Run test om te zien dat ze slagen**

Run: `npm test -- scripts/tests/schema-generator.test.js`
Expected: 7 passed.

- [ ] **Step 5: Commit**

```bash
git add scripts/schema-generator.js scripts/tests/schema-generator.test.js
git commit -m "blog-pipeline: schema-generator levert BlogPosting/FAQ/HowTo JSON-LD"
```

---

## Task 8: `sitemap-generator.js` module — sitemap.xml (TDD)

**Files:**
- Create: `scripts/sitemap-generator.js`
- Create: `scripts/tests/sitemap-generator.test.js`

Functie: genereert sitemap.xml string met gegeven entries.

- [ ] **Step 1: Schrijf failing tests**

`scripts/tests/sitemap-generator.test.js`:
```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateSitemap } from '../sitemap-generator.js';

describe('generateSitemap', () => {
  test('begint met XML declaration', () => {
    const out = generateSitemap([
      { loc: 'https://alpacaintegrations.ai/', lastmod: '2026-05-11' }
    ]);
    assert.ok(out.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  });

  test('bevat urlset met juiste namespace', () => {
    const out = generateSitemap([]);
    assert.ok(out.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
  });

  test('elke entry levert url-blok', () => {
    const out = generateSitemap([
      { loc: 'https://alpacaintegrations.ai/blog/a', lastmod: '2026-05-11' },
      { loc: 'https://alpacaintegrations.ai/blog/b', lastmod: '2026-05-12' }
    ]);
    const matches = out.match(/<url>/g);
    assert.equal(matches.length, 2);
    assert.ok(out.includes('<loc>https://alpacaintegrations.ai/blog/a</loc>'));
    assert.ok(out.includes('<lastmod>2026-05-12</lastmod>'));
  });

  test('sluit met urlset', () => {
    const out = generateSitemap([]);
    assert.ok(out.trim().endsWith('</urlset>'));
  });
});
```

- [ ] **Step 2: Run test om te zien dat ze falen**

Run: `npm test -- scripts/tests/sitemap-generator.test.js`
Expected: FAIL.

- [ ] **Step 3: Implementeer `sitemap-generator.js`**

`scripts/sitemap-generator.js`:
```javascript
export function generateSitemap(entries) {
  const urls = entries.map(({ loc, lastmod }) => (
    `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`
  )).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
```

- [ ] **Step 4: Run test om te zien dat ze slagen**

Run: `npm test -- scripts/tests/sitemap-generator.test.js`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add scripts/sitemap-generator.js scripts/tests/sitemap-generator.test.js
git commit -m "blog-pipeline: sitemap-generator levert sitemap.xml string"
```

---

## Task 9: `blog-config.js` — per-blog metadata

**Files:**
- Create: `scripts/blog-config.js`

Bevat de complete configuratie voor alle 8 blogs: titel, slug, meta-description, OG-image-bestandsnaam, datePublished (gespreid), en optioneel `faqItems` / `howToSteps`.

- [ ] **Step 1: Maak `blog-config.js`**

```javascript
export const BLOGS = [
  {
    sourceFile: 'sprintsubsidie-pillar-blog.md',
    slug: 'sprintsubsidie-mkb-limburg-gids',
    title: 'Sprintsubsidie MKB Limburg 2026-2027: alles wat je moet weten',
    description: 'Tot 24.500 euro subsidie op automatisering en digitalisering voor MKB-bedrijven in Limburg. Alles over de Sprintsubsidie MKB 2026-2027 in normale taal.',
    ogImage: 'og-sprintsubsidie-mkb-limburg-gids.png',
    datePublished: '2026-05-11T09:00:00+02:00',
    dateModified: '2026-05-11T09:00:00+02:00',
    embedsVideoPlaceholder: true
  },
  {
    sourceFile: 'sprintsubsidie-voorwaarden-blog.md',
    slug: 'sprintsubsidie-voorwaarden-wat-komt-in-aanmerking',
    title: 'Wat komt wel en niet in aanmerking voor de Sprintsubsidie?',
    description: 'Welke projecten komen in aanmerking voor de Sprintsubsidie? Concrete voorbeelden van wat wel past, wat niet past, en waar de grens ligt.',
    ogImage: 'og-sprintsubsidie-voorwaarden-wat-komt-in-aanmerking.png',
    datePublished: '2026-05-11T13:00:00+02:00',
    dateModified: '2026-05-11T13:00:00+02:00'
  },
  {
    sourceFile: 'sprintsubsidie-aanvragen-blog.md',
    slug: 'sprintsubsidie-aanvragen-stappenplan',
    title: 'Sprintsubsidie aanvragen: compleet stappenplan van voorbereiding tot indiening',
    description: 'Compleet stappenplan voor het aanvragen van de Sprintsubsidie MKB. Van voorbereiding tot indiening, vraag voor vraag uitgelegd.',
    ogImage: 'og-sprintsubsidie-aanvragen-stappenplan.png',
    datePublished: '2026-05-11T14:30:00+02:00',
    dateModified: '2026-05-11T14:30:00+02:00'
  },
  {
    sourceFile: 'sprintsubsidie-ai-blog.md',
    slug: 'ai-implementeren-sprintsubsidie',
    title: 'AI implementeren met de Sprintsubsidie: dit moet je weten',
    description: 'Welke AI-toepassingen zijn subsidiabel via de Sprintsubsidie? Dit moet je weten over AI implementeren met subsidie in Limburg.',
    ogImage: 'og-ai-implementeren-sprintsubsidie.png',
    datePublished: '2026-05-11T16:00:00+02:00',
    dateModified: '2026-05-11T16:00:00+02:00'
  },
  {
    sourceFile: 'sprintsubsidie-automatisering-blog.md',
    slug: 'bedrijfsprocessen-automatiseren-sprintsubsidie',
    title: 'Bedrijfsprocessen automatiseren met de Sprintsubsidie',
    description: 'Van handmatig werk naar automatische workflows met de Sprintsubsidie. Welke bedrijfsprocessen kun je automatiseren en wat levert het op?',
    ogImage: 'og-bedrijfsprocessen-automatiseren-sprintsubsidie.png',
    datePublished: '2026-05-11T17:00:00+02:00',
    dateModified: '2026-05-11T17:00:00+02:00'
  },
  {
    sourceFile: 'sprintsubsidie-processen-blog.md',
    slug: 'beste-processen-automatiseren-bedrijf',
    title: 'Hoe vind je de beste processen om te automatiseren in jouw bedrijf?',
    description: 'Hoe vind je de taken en processen in jouw bedrijf die het meest opleveren als je ze automatiseert? Het systeem dat wij gebruiken.',
    ogImage: 'og-beste-processen-automatiseren-bedrijf.png',
    datePublished: '2026-05-12T09:30:00+02:00',
    dateModified: '2026-05-12T09:30:00+02:00'
  },
  {
    sourceFile: 'sprintsubsidie-tafelgasten-blog.md',
    slug: 'sprintsubsidie-voorbeeld-administratie-automatiseren',
    title: 'Sprintsubsidie voorbeeld: de complete administratie van een zakelijke opleider automatiseren',
    description: 'Hoe we de complete administratie van een zakelijke opleider hebben geautomatiseerd. Van twee dagtaken naar minuten per week, zonder AI.',
    ogImage: 'og-sprintsubsidie-voorbeeld-administratie-automatiseren.png',
    datePublished: '2026-05-12T11:00:00+02:00',
    dateModified: '2026-05-12T11:00:00+02:00',
    diagrams: { voor: 'tafelgasten-voor', na: 'tafelgasten-na' }
  },
  {
    sourceFile: 'sprintsubsidie-ecommerce-blog.md',
    slug: 'sprintsubsidie-voorbeeld-klantenservice-ai',
    title: 'Sprintsubsidie voorbeeld: klantenservice automatiseren met AI voor een e-commerce verkoper',
    description: 'Hoe we de klantenservice van een e-commerce verkoper hebben geautomatiseerd met AI. 80% van de vragen automatisch, in de juiste toon per merk.',
    ogImage: 'og-sprintsubsidie-voorbeeld-klantenservice-ai.png',
    datePublished: '2026-05-12T14:00:00+02:00',
    dateModified: '2026-05-12T14:00:00+02:00',
    diagrams: { voor: 'ecommerce-voor', na: 'ecommerce-na' }
  }
];
```

- [ ] **Step 2: Commit**

```bash
git add scripts/blog-config.js
git commit -m "blog-pipeline: blog-config met metadata voor 8 blogs"
```

**Noot:** `faqItems` voor pillar/voorwaarden en `howToSteps` voor aanvragen worden in Task 13 toegevoegd, nadat de markdown-content visueel is doorgenomen en de juiste vraag-antwoord paren + stappen zijn vastgesteld. Tot dan publiceren we deze blogs zonder FAQ/HowTo schema — `BlogPosting` blijft het basisschema.

---

## Task 10: `blog-template.html` — gedeelde HTML template

**Files:**
- Create: `scripts/templates/blog-template.html`

Eén template-bestand met `{{placeholders}}` die het build-script invult. Styling consistent met bestaande site (kopie van [lm/rapportkaart-skill.html](lm/rapportkaart-skill.html) als basis, blog-specifieke aanpassingen).

- [ ] **Step 1: Maak template-bestand**

`scripts/templates/blog-template.html`:
```html
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}} | Alpaca Integrations</title>
    <meta name="description" content="{{DESCRIPTION}}">
    <link rel="canonical" href="https://alpacaintegrations.ai/blog/{{SLUG}}">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">

    <meta property="og:title" content="{{TITLE}}">
    <meta property="og:description" content="{{DESCRIPTION}}">
    <meta property="og:image" content="https://alpacaintegrations.ai/images/og/{{OG_IMAGE}}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://alpacaintegrations.ai/blog/{{SLUG}}">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{TITLE}}">
    <meta name="twitter:description" content="{{DESCRIPTION}}">
    <meta name="twitter:image" content="https://alpacaintegrations.ai/images/og/{{OG_IMAGE}}">

    {{SCHEMA_JSONLD}}

    <link rel="stylesheet" href="/css/style.css">
    <style>
        :root {
            --dark-bg: #0f0f23;
            --darker-bg: #0a0a16;
            --primary-blue: #3b82f6;
            --light-blue: #60a5fa;
            --purple: #a855f7;
            --pink: #ec4899;
            --text-light: #e2e8f0;
            --text-white: #ffffff;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--dark-bg);
            color: var(--text-light);
            min-height: 100vh;
            line-height: 1.7;
        }
        header {
            position: fixed;
            top: 0;
            width: 100%;
            background: rgba(15, 15, 35, 0.9);
            backdrop-filter: blur(10px);
            z-index: 1000;
            padding: 1rem 0;
            border-bottom: 1px solid rgba(168, 85, 247, 0.2);
        }
        nav {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        nav a.logo {
            color: var(--text-white);
            text-decoration: none;
            font-weight: 700;
            font-size: 1.1rem;
        }
        .blog-article {
            max-width: 760px;
            margin: 6rem auto 4rem;
            padding: 0 1.5rem;
        }
        .blog-meta {
            color: rgba(226, 232, 240, 0.6);
            font-size: 0.9rem;
            margin-bottom: 2rem;
        }
        .blog-article h1 {
            color: var(--text-white);
            font-size: 2.5rem;
            line-height: 1.2;
            margin-bottom: 1rem;
        }
        .blog-article h2 {
            color: var(--text-white);
            font-size: 1.8rem;
            margin: 2.5rem 0 1rem;
        }
        .blog-article h3 {
            color: var(--text-white);
            font-size: 1.3rem;
            margin: 2rem 0 0.75rem;
        }
        .blog-article p { margin-bottom: 1.2rem; }
        .blog-article ul, .blog-article ol {
            margin: 0 0 1.2rem 1.5rem;
        }
        .blog-article li { margin-bottom: 0.4rem; }
        .blog-article a {
            color: var(--light-blue);
            text-decoration: underline;
        }
        .blog-article table {
            border-collapse: collapse;
            width: 100%;
            margin: 1.5rem 0;
        }
        .blog-article th, .blog-article td {
            border: 1px solid rgba(168, 85, 247, 0.2);
            padding: 0.6rem 0.8rem;
            text-align: left;
        }
        .blog-article th {
            background: rgba(168, 85, 247, 0.1);
            color: var(--text-white);
        }
        .blog-article strong { color: var(--text-white); }
        .blog-article blockquote {
            border-left: 3px solid var(--primary-blue);
            padding-left: 1rem;
            margin: 1.5rem 0;
            color: rgba(226, 232, 240, 0.8);
            font-style: italic;
        }
        .blog-article iframe {
            display: block;
            width: 100%;
            min-height: 480px;
            border: 1px solid rgba(168, 85, 247, 0.2);
            border-radius: 8px;
            margin: 1.5rem 0;
        }
        .video-placeholder {
            background: var(--darker-bg);
            border: 1px dashed rgba(168, 85, 247, 0.3);
            border-radius: 8px;
            padding: 3rem 1rem;
            text-align: center;
            color: rgba(226, 232, 240, 0.5);
            margin: 1.5rem 0;
        }
        .author-bio {
            max-width: 760px;
            margin: 3rem auto;
            padding: 2rem 1.5rem;
            display: flex;
            gap: 1.5rem;
            align-items: center;
            border-top: 1px solid rgba(168, 85, 247, 0.2);
            border-bottom: 1px solid rgba(168, 85, 247, 0.2);
        }
        .author-bio img {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            object-fit: cover;
        }
        .author-bio strong { color: var(--text-white); }
        .author-bio a {
            color: var(--light-blue);
            text-decoration: none;
        }
        footer {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            text-align: center;
            color: rgba(226, 232, 240, 0.5);
            font-size: 0.9rem;
        }
        @media (max-width: 600px) {
            .blog-article h1 { font-size: 1.8rem; }
            .blog-article h2 { font-size: 1.4rem; }
            .author-bio { flex-direction: column; text-align: center; }
        }
    </style>
</head>
<body>
    <header>
        <nav>
            <a href="/" class="logo">Alpaca Integrations</a>
            <a href="https://outlook.office365.com/book/Alpacaintegrations1@alpacaintegrations.ai/" target="_blank" rel="noopener" style="color: var(--light-blue); text-decoration: none;">Plan een gesprek</a>
        </nav>
    </header>

    <article class="blog-article">
        <h1>{{TITLE}}</h1>
        <div class="blog-meta">
            Door Rick · <time datetime="{{DATE_ISO}}">{{DATE_DISPLAY}}</time>
        </div>
        {{BODY_HTML}}
    </article>

    <aside class="author-bio">
        <img src="/images/rick-avatar.jpg" alt="Rick van Alpaca Integrations">
        <div>
            <p><strong>Rick</strong> — Alpaca Integrations</p>
            <p>Helpt MKB-bedrijven met automatisering en AI-implementatie. Geen jargon, gewoon dingen die werken.</p>
            <a href="https://www.linkedin.com/in/rickalpacaintegrations" target="_blank" rel="noopener">LinkedIn →</a>
        </div>
    </aside>

    <footer>
        <p>&copy; Alpaca Integrations · <a href="mailto:letstalk@alpacaintegrations.ai" style="color: var(--light-blue);">letstalk@alpacaintegrations.ai</a></p>
    </footer>

    <!-- chatbot widget snippet komt hier in sub-project 2 -->
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add scripts/templates/blog-template.html
git commit -m "blog-pipeline: gedeelde HTML template met SEO meta tags en blog-styling"
```

**Open punten voor launch:**
- `/images/rick-avatar.jpg` moet aangeleverd worden door Rick (anders 404). Tot dan: tijdelijk een neutrale SVG placeholder. Task 16 voegt deze toe.
- LinkedIn-URL `https://www.linkedin.com/in/rickalpacaintegrations` is een gok — Rick moet de echte URL bevestigen.

---

## Task 11: `build-blogs.js` — orchestrator

**Files:**
- Create: `scripts/build-blogs.js`

Hoofdscript: leest config, doorloopt elk blog, schrijft HTML naar `/blog/<slug>.html`, schrijft `sitemap.xml`. Geen tests op deze module zelf — verifieer door eerste echte run.

- [ ] **Step 1: Schrijf de orchestrator**

`scripts/build-blogs.js`:
```javascript
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

import { BLOGS } from './blog-config.js';
import { cleanText } from './clean-text.js';
import { findAiSignals, reportSignals } from './ai-signals-check.js';
import { mapPlaceholderLinks } from './link-mapper.js';
import { markExternalLinks } from './external-link-marker.js';
import { generateSchemas } from './schema-generator.js';
import { generateSitemap } from './sitemap-generator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content', 'blogs');
const BLOG_OUT_DIR = path.join(ROOT, 'blog');
const TEMPLATE_PATH = path.join(__dirname, 'templates', 'blog-template.html');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');
const SITE = 'https://alpacaintegrations.ai';

function displayDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function injectDiagrams(html, diagrams) {
  if (!diagrams) return html;
  let out = html;
  out = out.replace(/<p><em>\[Voor-diagram hier\]<\/em><\/p>/g,
    `<iframe src="/blog/embeds/${diagrams.voor}.html" loading="lazy" title="Voor-diagram"></iframe>`);
  out = out.replace(/<p><em>\[Na-diagram hier\]<\/em><\/p>/g,
    `<iframe src="/blog/embeds/${diagrams.na}.html" loading="lazy" title="Na-diagram"></iframe>`);
  return out;
}

function injectVideoPlaceholder(html, hasPlaceholder) {
  if (!hasPlaceholder) return html;
  // Voeg placeholder in na de eerste paragraaf
  return html.replace(/(<\/p>)/, '$1\n<div class="video-placeholder" aria-label="Video volgt">Video volgt</div>');
}

function fillTemplate(template, vars) {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key}}}`, value);
  }
  return out;
}

async function buildBlog(blog, template) {
  const mdPath = path.join(CONTENT_DIR, blog.sourceFile);
  const rawMd = await fs.readFile(mdPath, 'utf8');

  // Opschoning
  const cleaned = cleanText(rawMd);

  // Lint-waarschuwingen
  const signals = findAiSignals(cleaned);
  reportSignals(signals, blog.sourceFile);

  // Link placeholders vervangen
  const linkedMd = mapPlaceholderLinks(cleaned);

  // Markdown → HTML
  let html = marked.parse(linkedMd);

  // Externe links markeren
  html = markExternalLinks(html);

  // Diagrammen injecteren (alleen tafelgasten/ecommerce)
  html = injectDiagrams(html, blog.diagrams);

  // Video-placeholder (alleen pillar)
  html = injectVideoPlaceholder(html, blog.embedsVideoPlaceholder);

  // Strip H1 uit body — komt al uit het template
  html = html.replace(/<h1[^>]*>[\s\S]*?<\/h1>/, '');

  // Schemas
  const schemaBlocks = generateSchemas(blog).join('\n');

  // Template invullen
  const finalHtml = fillTemplate(template, {
    TITLE: blog.title,
    DESCRIPTION: blog.description,
    SLUG: blog.slug,
    OG_IMAGE: blog.ogImage,
    DATE_ISO: blog.datePublished,
    DATE_DISPLAY: displayDate(blog.datePublished),
    SCHEMA_JSONLD: schemaBlocks,
    BODY_HTML: html
  });

  const outPath = path.join(BLOG_OUT_DIR, `${blog.slug}.html`);
  await fs.writeFile(outPath, finalHtml, 'utf8');
  console.log(`  [ok] ${blog.slug}.html geschreven`);
}

async function buildSitemap() {
  const entries = [
    { loc: `${SITE}/`, lastmod: '2026-05-11' }
  ];
  for (const blog of BLOGS) {
    entries.push({
      loc: `${SITE}/blog/${blog.slug}`,
      lastmod: blog.datePublished.slice(0, 10)
    });
  }
  const xml = generateSitemap(entries);
  await fs.writeFile(SITEMAP_PATH, xml, 'utf8');
  console.log(`  [ok] sitemap.xml geschreven (${entries.length} URLs)`);
}

async function main() {
  console.log('Build blogs starten...\n');
  const template = await fs.readFile(TEMPLATE_PATH, 'utf8');

  for (const blog of BLOGS) {
    await buildBlog(blog, template);
  }

  console.log('\nSitemap genereren...');
  await buildSitemap();

  console.log('\nBuild compleet.');
}

main().catch(err => {
  console.error('Build mislukt:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Run het script voor het eerst**

Run: `npm run build`
Expected: 8 HTML-bestanden in `/blog/`, plus `sitemap.xml` in root. Console toont per blog ofwel `[ok]` of `[!]` met AI-signaal-waarschuwingen.

Bij errors:
- "unmapped placeholder link": een `[anchor](link)` in een markdown-bestand matcht niet met `link-mapper.js` mappings. Lees foutmelding voor anchor-tekst, breid `MAPPINGS` in `link-mapper.js` uit met een matchende regex.
- "ENOENT" op een bestand: verifieer dat alle markdown-bestanden in `content/blogs/` staan.

- [ ] **Step 3: Inspecteer één output-bestand**

Open `blog/sprintsubsidie-mkb-limburg-gids.html` in een browser of editor. Verifieer:
- H1 toont correct
- Body-tekst leest soepel
- Meta tags hebben correcte slug + image
- Geen `[link]` placeholders meer zichtbaar
- Geen smart quotes of zero-width-tekens (visuele check; copy-paste in een tekst-editor met "show invisibles" als twijfel)
- Schema.org `<script>` block in head bevat valid JSON

- [ ] **Step 4: Commit script + output**

```bash
git add scripts/build-blogs.js blog/*.html sitemap.xml
git commit -m "blog-pipeline: build-blogs orchestrator + eerste output van 8 blogs"
```

---

## Task 12: Netlify config — clean URLs en redirects

**Files:**
- Modify: `netlify.toml`

- [ ] **Step 1: Update `netlify.toml`**

Vervang volledige inhoud met:
```toml
[[redirects]]
  from = "/scorecard"
  to = "/scorecard/index.html"
  status = 200

[[redirects]]
  from = "/scorecard/*"
  to = "/scorecard/:splat"
  status = 200

# Clean URLs voor blog-pagina's: /blog/slug → /blog/slug.html
[[redirects]]
  from = "/blog/:slug"
  to = "/blog/:slug.html"
  status = 200
```

- [ ] **Step 2: Verifieer config syntax**

Run: `npx -y @netlify/cli@latest validate` (alleen als je Netlify CLI hebt) of skip — Netlify zelf weigert een deploy bij ongeldige toml.

- [ ] **Step 3: Commit**

```bash
git add netlify.toml
git commit -m "blog-pipeline: netlify redirects voor /blog/:slug clean URLs"
```

---

## Task 13: FAQ + HowTo content voor pillar, voorwaarden, aanvragen

**Files:**
- Modify: `scripts/blog-config.js`

De pillar en voorwaarden blogs bevatten secties die geschikt zijn voor FAQ schema. De aanvragen blog bevat een stappenplan dat geschikt is voor HowTo schema. We dragen deze content expliciet aan in de config (geen auto-detectie — te fragiel).

- [ ] **Step 1: Lees pillar-blog en extract FAQ-secties**

Lees `content/blogs/sprintsubsidie-pillar-blog.md`. Identificeer 4-6 H2/H3 secties die een duidelijke vraag-antwoord vorm hebben. Verkort het antwoord tot 1-2 zinnen (Google FAQ schema mag, maar lang antwoord werkt minder goed). Vraag-formulering: maak het een echte vraag eindigend op vraagteken.

- [ ] **Step 2: Voeg `faqItems` toe aan pillar-entry**

In `scripts/blog-config.js`, breid de pillar-entry uit:
```javascript
{
  sourceFile: 'sprintsubsidie-pillar-blog.md',
  // ...bestaande velden...
  faqItems: [
    { q: 'Wat is de Sprintsubsidie?', a: 'Een subsidie van de Provincie Limburg waarmee MKB-bedrijven in Limburg tot 24.500 euro kunnen krijgen voor het implementeren van bewezen technologie die nieuw is voor hun bedrijf.' },
    { q: 'Hoeveel subsidie kan ik krijgen?', a: 'Minimaal 5.000 en maximaal 24.500 euro, met een maximum van 50% van de projectkosten. De rest financier je zelf.' },
    { q: 'Wie kan de Sprintsubsidie aanvragen?', a: 'MKB-bedrijven in Limburg. Niet voor zzp\'ers en niet voor agrarische ondernemingen.' },
    { q: 'Wanneer kan ik aanvragen?', a: 'In 2026 tussen 11 mei - 11 juni en tussen 21 september - 21 oktober. In 2027 tussen 4 januari - 4 februari en 3 mei - 3 juni.' },
    { q: 'Mag ik meerdere keren aanvragen?', a: 'Nee. Je mag maar één keer aanvragen gedurende de looptijd van de regeling. Kies dus zorgvuldig welk project je indient.' }
  ]
}
```

- [ ] **Step 3: Lees voorwaarden-blog en extract FAQ-secties**

Lees `content/blogs/sprintsubsidie-voorwaarden-blog.md`. Identificeer 4-5 vraag-antwoord paren over wat wel/niet in aanmerking komt.

- [ ] **Step 4: Voeg `faqItems` toe aan voorwaarden-entry**

In `scripts/blog-config.js`, breid voorwaarden-entry uit:
```javascript
{
  sourceFile: 'sprintsubsidie-voorwaarden-blog.md',
  // ...bestaande velden...
  faqItems: [
    { q: 'Wat komt in aanmerking voor de Sprintsubsidie?', a: 'Implementatie van bewezen technologie die nieuw is voor jouw bedrijf en je processen meetbaar verbetert. Binnen de thema\'s digitalisering, verduurzaming, circulariteit of arbeidsproductiviteit.' },
    { q: 'Wat komt niet in aanmerking?', a: 'Eigen ontwikkeling, experimenten, proof-of-concepts zonder daadwerkelijke ingebruikname, en productontwikkeling. De regeling is voor implementatie, niet voor onderzoek of innovatie.' },
    { q: 'Tellen trainingskosten mee?', a: 'Ja. De training van je team om met de nieuwe tools te leren werken is subsidiabel, zolang het direct samenhangt met de implementatie.' },
    { q: 'Moet de oplossing al ergens anders draaien?', a: 'Ja. Het moet gaan om bewezen technologie die al bij andere bedrijven succesvol in gebruik is. Niet om iets dat nog ontwikkeld of getest moet worden.' }
  ]
}
```

- [ ] **Step 5: Lees aanvragen-blog en extract stappenplan**

Lees `content/blogs/sprintsubsidie-aanvragen-blog.md`. Identificeer de hoofdstappen van het aanvraagproces (waarschijnlijk H2 secties).

- [ ] **Step 6: Voeg `howToName` en `howToSteps` toe aan aanvragen-entry**

In `scripts/blog-config.js`, breid aanvragen-entry uit:
```javascript
{
  sourceFile: 'sprintsubsidie-aanvragen-blog.md',
  // ...bestaande velden...
  howToName: 'Sprintsubsidie aanvragen',
  howToSteps: [
    { name: 'Voorbereiding', text: 'Verzamel KvK-gegevens, MKB-verklaring, de-minimisverklaring en een concrete projectomschrijving met meetbare doelen.' },
    { name: 'Begroting opstellen', text: 'Vul het officiele begrotingsformat in met alle subsidiabele kosten en je eigen bijdrage van minimaal 25%.' },
    { name: 'Aanvraagformulier invullen', text: 'Beantwoord de 11 vragen van het aanvraagformulier. Beschrijf het probleem, de gekozen oplossing en het verwachte resultaat in meetbare termen.' },
    { name: 'Digitaal indienen via eHerkenning', text: 'Log in op het klantportaal van de Provincie Limburg met eHerkenning en dien de aanvraag in. Per post mag ook, maar digitaal heeft de voorkeur.' },
    { name: 'Wachten op beoordeling', text: 'De Provincie beslist binnen 12 weken (kan met 12 weken verlengd worden). Na goedkeuring krijg je een beschikking en kun je starten met het project.' }
  ]
}
```

Let op: vervang de exacte tekst van stappen door wat in het aanvraagblog staat — bovenstaande is een richting.

- [ ] **Step 7: Run build opnieuw**

Run: `npm run build`
Expected: alle 8 blogs opnieuw gebouwd, geen errors. De pillar, voorwaarden, en aanvragen HTML bevatten nu extra `<script type="application/ld+json">` blokken met respectievelijk FAQPage en HowTo data.

- [ ] **Step 8: Valideer schema's**

Open `blog/sprintsubsidie-mkb-limburg-gids.html` en kopieer ALLE JSON-LD blokken (er moeten er twee zijn: BlogPosting + FAQPage).
Plak in [Google Rich Results Test](https://search.google.com/test/rich-results) → "Code" tab → plak HTML → Run.
Expected: 2 valid items gedetecteerd.

Doe hetzelfde voor `sprintsubsidie-voorwaarden-wat-komt-in-aanmerking.html` (2 items) en `sprintsubsidie-aanvragen-stappenplan.html` (2 items: BlogPosting + HowTo).

- [ ] **Step 9: Commit**

```bash
git add scripts/blog-config.js blog/*.html
git commit -m "blog-pipeline: FAQ-schema voor pillar/voorwaarden, HowTo voor aanvragen"
```

---

## Task 14: Author-bio placeholder avatar

**Files:**
- Create: `images/rick-avatar.jpg` of fallback SVG

`/images/rick-avatar.jpg` wordt door het template gerefereerd. Tot Rick een echte foto aanlevert, gebruiken we een neutrale placeholder zodat geen 404 verschijnt.

- [ ] **Step 1: Maak placeholder avatar SVG**

`images/rick-avatar.jpg` kan tijdelijk een SVG zijn. Maak `images/rick-avatar.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <circle cx="40" cy="40" r="40" fill="#1a1a2e"/>
  <circle cx="40" cy="32" r="13" fill="#a855f7"/>
  <path d="M 40 50 Q 22 50 22 70 L 58 70 Q 58 50 40 50" fill="#a855f7"/>
</svg>
```

- [ ] **Step 2: Update template om SVG te gebruiken**

In `scripts/templates/blog-template.html`, vervang:
```html
<img src="/images/rick-avatar.jpg" alt="Rick van Alpaca Integrations">
```
Door:
```html
<img src="/images/rick-avatar.svg" alt="Rick van Alpaca Integrations">
```

- [ ] **Step 3: Rebuild en commit**

Run: `npm run build`

```bash
git add images/rick-avatar.svg scripts/templates/blog-template.html blog/*.html
git commit -m "blog-pipeline: placeholder avatar tot Rick een foto aanlevert"
```

**Voor launch:** Rick levert echte foto aan; vervang `rick-avatar.svg` door `rick-avatar.jpg`, pas template aan, rebuild. En LinkedIn-URL `https://www.linkedin.com/in/rickalpacaintegrations` verifiëren in template — kan zijn dat de echte URL anders is.

---

## Task 15: Eerste end-to-end review — handmatige check per blog

**Files:** geen wijzigingen (review-taak)

Geen code-werk. Deze stap is een mens-met-ogen check voordat we naar Netlify-preview gaan.

- [ ] **Step 1: Open elk blog-bestand lokaal in een browser**

Open `blog/<slug>.html` direct vanaf disk in browser (of start lokale server: `npx -y http-server . -p 8000` en open `http://localhost:8000/blog/sprintsubsidie-mkb-limburg-gids.html`).

Per blog, check:
- H1 en titel kloppen
- Alle interne links wijzen naar `/blog/...` (geen `link` als href)
- Externe links openen in nieuw tabblad
- Tabellen renderen netjes
- Bij tafelgasten/ecommerce: iframes zijn zichtbaar en bevatten de diagrammen
- Bij pillar: video-placeholder zichtbaar
- Mobile view OK (responsive check via browser devtools)

- [ ] **Step 2: Visuele scan op AI-signalen**

Per blog: open in browser, gebruik Ctrl+F om naar verdachte tekenen te zoeken:
- Em-dash `—` — kijk waar het staat, bepaal of het natuurlijk leest of vervangen moet worden
- Drie puntjes op rij `...` — meestal OK
- Smart quotes `"` `"` — zouden weg moeten zijn (check via "view source")

Bekijk ook console-output van laatste `npm run build` voor AI-signaal-waarschuwingen. Doorloop ze één voor één en beslis: laten staan of markdown editen.

- [ ] **Step 3: Run AI-signaal lint en alle tests opnieuw**

Run: `npm test`
Expected: alle tests slagen.

Run: `npm run build`
Expected: build slaagt, AI-signaal-rapport verschijnt. Doorloop output.

- [ ] **Step 4: Indien markdown-edits nodig**

Edit markdown in `content/blogs/`, run `npm run build` opnieuw, herhaal tot je tevreden bent.

- [ ] **Step 5: Commit eventuele edits**

```bash
git add content/blogs/ blog/*.html
git commit -m "blog-pipeline: markdown edits na first-pass review"
```

---

## Task 16: Feature-branch en Netlify branch-preview

**Files:** geen — workflow-taak

Tot nu toe is alles op `main` gecommit voor snelheid. Vóór launch verhuizen we de chatbot-werk naar een feature-branch zodat blogs + chatbot samen kunnen worden gemerged.

**Update bij uitvoering:** als alle werk tot hier op `main` staat, hoeven we voor sub-project 1 geen branch te maken. De chatbot (sub-project 2) krijgt zijn eigen branch. Blogs zijn dan al "live-klaar" op main — branch-preview was nodig geweest voor isolatie, maar als gebruiker akkoord ging op de approach kan dit overgeslagen worden.

- [ ] **Step 1: Beslis launch-strategie**

Kies een van:

**A. Alles op main, chatbot in feature-branch (vereenvoudigd):**
- Blogs zijn klaar op main maar **nog niet gepubliceerd** (Netlify deploy gebeurt automatisch bij push, dus alleen NIET pushen tot chatbot klaar is). Geen branch nodig.
- Chatbot wordt gebouwd in `feature/chatbot-widget`.
- Op launch: merge chatbot-branch → main → push → alles live.

**B. Blogs ook op feature-branch (zoals oorspronkelijk gepland):**
- Maak `feature/sprintsubsidie-blogs`, verplaats alle blog-commits daarheen via rebase. Meer werk.

Aanbevolen: **A**. Push wordt uitgesteld; main staat klaar maar wordt niet gepubliceerd.

- [ ] **Step 2: Verifieer dat niets is gepusht**

Run: `git -C "c:\Users\hjemj\OneDrive - alpaca integrations\Ai\alpaca intern\website" status`
Expected: "Your branch is ahead of 'origin/main' by N commits" — N is het aantal blog-commits.

**Niet pushen.** Wacht tot chatbot-launch.

- [ ] **Step 3: Klaar voor sub-project 2**

Blog-publicatie is technisch compleet. Volgende stap: brainstorm + plan voor chatbot (sub-project 2). Bij chatbot-launch worden beide tegelijk gepushed.

---

## Task 17: Pre-launch validatie checklist

**Files:** geen — checklist voor launch dag

- [ ] **Step 1: Run alle tests een laatste keer**

```bash
npm test
```
Expected: alles groen.

- [ ] **Step 2: Run build en check console output**

```bash
npm run build
```
Verifieer:
- 8x `[ok] <slug>.html geschreven`
- `[ok] sitemap.xml geschreven`
- AI-signaal-waarschuwingen doorlopen en geaccepteerd of opgelost

- [ ] **Step 3: Spot-check 3 willekeurige blogs**

Open in browser, controleer:
- Pillar (`/blog/sprintsubsidie-mkb-limburg-gids.html`) — heeft video-placeholder, FAQ schema
- Tafelgasten (`/blog/sprintsubsidie-voorbeeld-administratie-automatiseren.html`) — heeft 2 iframes
- Aanvragen (`/blog/sprintsubsidie-aanvragen-stappenplan.html`) — heeft HowTo schema

- [ ] **Step 4: Verifieer canonical en OG voor één blog**

Voor `blog/sprintsubsidie-mkb-limburg-gids.html`, view source en check:
```
<link rel="canonical" href="https://alpacaintegrations.ai/blog/sprintsubsidie-mkb-limburg-gids">
<meta property="og:image" content="https://alpacaintegrations.ai/images/og/og-sprintsubsidie-mkb-limburg-gids.png">
```

- [ ] **Step 5: Test alle JSON-LD schemas via Google Rich Results Test**

[https://search.google.com/test/rich-results](https://search.google.com/test/rich-results) — voor pillar, voorwaarden, aanvragen (degenen met extra schema's).

- [ ] **Step 6: Test OG-images**

[https://www.opengraph.xyz/](https://www.opengraph.xyz/) of [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) — alleen bruikbaar na live deploy. Voor lokale check: open de PNG-bestanden in `/images/og/` en verifieer dat ze 1200x630 zijn.

- [ ] **Step 7: Klaar voor merge + push**

Blogs sub-project is volledig klaar. Verdere stappen (push, Search Console submission, Schema test op live URLs, OG inspection op live URLs) horen bij de gezamenlijke launch met sub-project 2.

---

## Self-review samenvatting

**Spec coverage:**
- URL pattern `/blog/<slug>`: ✅ Task 11 template, Task 12 redirects
- Build-pipeline opschoning + AI-lint: ✅ Tasks 3 + 4
- Linkmapping uit overdrachtsdocument: ✅ Task 5
- Externe links target=_blank: ✅ Task 6
- Schema.org BlogPosting + FAQ + HowTo: ✅ Tasks 7 + 13
- Sitemap met gespreide lastmod: ✅ Tasks 8, 11
- Per-blog metadata config: ✅ Task 9 + 13
- HTML template met meta tags / OG / Twitter / canonical: ✅ Task 10
- Diagrammen als iframe: ✅ Task 11 (injectDiagrams)
- Video-placeholder in pillar: ✅ Task 11 (injectVideoPlaceholder)
- Author-bio: ✅ Task 10 template + Task 14 avatar
- Netlify clean URLs: ✅ Task 12
- Pre-launch checks: ✅ Tasks 15 + 17

**Placeholder scan:** Geen "TBD" of "implement later" in concrete steps. Open punten (Rick's foto, LinkedIn-URL, FAQ-tekst exact uit blogs) zijn als concrete tasks behandeld met fallback-waarden en duidelijke instructies om bij launch te verifiëren.

**Type consistency:** Alle module-exports gebruiken dezelfde namen als hun importeers (`cleanText`, `findAiSignals`, `mapPlaceholderLinks`, `markExternalLinks`, `generateSchemas`, `generateSitemap`, `BLOGS`). Geen mismatches.

**Scope check:** Plan dekt sub-project 1 (blogs). Sub-project 2 (chatbot) heeft eigen brainstorm-traject. Task 16 maakt de overgang expliciet.

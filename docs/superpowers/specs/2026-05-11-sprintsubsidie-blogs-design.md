# Sprintsubsidie blogs — publicatie design

**Datum:** 2026-05-11
**Status:** Goedgekeurd door gebruiker, klaar voor implementatieplan
**Sub-project:** 1 van 2 (volgend: chatbot-widget, apart spec-traject)

## Context

Alpaca Integrations heeft 8 SEO-blogs geschreven over de Sprintsubsidie MKB Limburg 2026-2027. Tranche 1 is open van 11 mei tot 11 juni 2026 (vandaag is dag 1). De blogs moeten zo snel mogelijk live, samen met een chatbot-widget die als sub-project 2 wordt gebouwd. Beide gaan in één gecoördineerde launch live — geen tussenfase met tijdelijke CTA's.

Dit document specificeert sub-project 1: de blog-publicatie pipeline en de 8 statische pagina's.

## Doel

Een herhaalbare publicatie-pipeline neerzetten die:
1. De 8 bestaande markdown-blogs omzet naar 8 statische HTML-pagina's onder `/blog/<slug>`
2. Compleet voldoet aan SEO-eisen (canonical, OG, Twitter, Schema.org, sitemap)
3. Géén AI-detectie signalen achterlaat in tekst, HTML of publicatie-metadata
4. Herbruikbaar is voor toekomstige blogs zonder herontwerp

## Scope

**In scope:**
- Build-script (Node.js) dat markdown → HTML genereert via één gedeelde template
- 8 blog-pagina's onder `/blog/<slug>`
- OG-images upload naar `/images/og/`
- Sitemap.xml (alle blogs + bestaande pagina's)
- Netlify build-config aanpassing
- AI-signaal opschoon- en lint-pipeline
- Schema.org markup per blog (BlogPosting + waar relevant FAQPage/HowTo)
- Iframe-embedding van bestaande voor/na-diagrammen
- Plek voor video-embed in pillar (placeholder)
- Author-bio component (Rick + LinkedIn)
- Feature-branch + Netlify branch-preview als staging-omgeving

**Niet in scope (apart sub-project):**
- Chatbot-widget zelf (UI, backend, Claude API, lead capture, knowledge retrieval, opslag)
- De chatbot-CTA blokken in de blogs blijven exact zoals in de markdown; ze worden bij chatbot-launch automatisch werkend doordat de widget-snippet pas dan wordt ingeladen
- Video-content (komt later toe in plaats van placeholder)
- Aanvraag-screenshots in aanvragen-blog (komt later)

## Architectuur en bestandsstructuur

```
website/
├── blog/                          ← NIEUWE FOLDER (output van build)
│   ├── sprintsubsidie-mkb-limburg-gids.html             (pillar)
│   ├── sprintsubsidie-voorwaarden-wat-komt-in-aanmerking.html
│   ├── ai-implementeren-sprintsubsidie.html
│   ├── bedrijfsprocessen-automatiseren-sprintsubsidie.html
│   ├── beste-processen-automatiseren-bedrijf.html
│   ├── sprintsubsidie-voorbeeld-administratie-automatiseren.html
│   ├── sprintsubsidie-voorbeeld-klantenservice-ai.html
│   └── sprintsubsidie-aanvragen-stappenplan.html
├── images/
│   └── og/                        ← NIEUWE FOLDER (8 OG images, 1200x630 PNG)
├── scripts/                       ← NIEUWE FOLDER
│   ├── build-blogs.js             (Node: markdown → HTML pipeline)
│   ├── blog-config.js             (per-blog metadata)
│   ├── ai-signals-check.js        (lint-stap)
│   ├── clean-text.js              (opschoning unicode/quotes)
│   ├── link-mapper.js             (placeholder → URL replacement)
│   └── templates/
│       └── blog-template.html     (één gedeelde HTML template)
├── content/
│   └── blogs/                     ← NIEUWE FOLDER (markdown bron)
│       └── *.md                   (8 markdown bestanden uit "seo blog" folder)
├── sitemap.xml                    ← NIEUWE
├── package.json                   ← NIEUWE (dep: marked)
└── netlify.toml                   ← AANGEVULD (build command + redirects)
```

**Stack:** Node.js script met één dependency: `marked` (markdown → HTML). Netlify draait `node scripts/build-blogs.js` bij elke deploy. Output is pure statische HTML — geen runtime impact.

**Markdown-bron:** de 8 markdown-bestanden komen uit `c:\Users\hjemj\OneDrive - alpaca integrations\Ai\sprint subsidie\seo blog\`. Worden gekopieerd naar `/content/blogs/` in de repo zodat de build self-contained is. Bij content-update: vervang het bestand, run script, commit & deploy.

## URL pattern en interne linking

URL-pattern: `/blog/<slug>` — vastgelegd in het overdrachtsdocument, alle interne link-mapping is hierop gebaseerd.

**Slug-mapping (uit overdrachtsdocument):**

| # | Bron-bestand | URL slug | Schema-extras |
|---|---|---|---|
| 1 | sprintsubsidie-pillar-blog.md | /blog/sprintsubsidie-mkb-limburg-gids | + FAQPage |
| 2 | sprintsubsidie-voorwaarden-blog.md | /blog/sprintsubsidie-voorwaarden-wat-komt-in-aanmerking | + FAQPage |
| 3 | sprintsubsidie-ai-blog.md | /blog/ai-implementeren-sprintsubsidie | — |
| 4 | sprintsubsidie-automatisering-blog.md | /blog/bedrijfsprocessen-automatiseren-sprintsubsidie | — |
| 5 | sprintsubsidie-processen-blog.md | /blog/beste-processen-automatiseren-bedrijf | — |
| 6 | sprintsubsidie-tafelgasten-blog.md | /blog/sprintsubsidie-voorbeeld-administratie-automatiseren | — |
| 7 | sprintsubsidie-ecommerce-blog.md | /blog/sprintsubsidie-voorbeeld-klantenservice-ai | — |
| 8 | sprintsubsidie-aanvragen-blog.md | /blog/sprintsubsidie-aanvragen-stappenplan | + HowTo |

**Anchor-tekst → URL mapping** (in `scripts/link-mapper.js`):
Conform overdrachtsdocument. Placeholder-link `[anchor tekst](link)` wordt vervangen op basis van substring-match op de anchor tekst. Speciale gevallen:
- `subsidie-assistent` → URL chatbot widget (TBD in sub-project 2; tijdelijk `#chatbot` anchor + JS hook die door widget-snippet wordt overgenomen)
- `AI quickscan` → `/scorecard` (op basis van bestaande site-structuur)
- `plan een vrijblijvend gesprek` / `plan een gesprek` → bestaande Outlook-booking URL uit index.html

**Externe links:** `target="_blank" rel="noopener"` toegevoegd door build-script op alle non-relatieve URLs.

## Build pipeline

Stappenplan van `build-blogs.js`:

1. Lees `blog-config.js` (definieert per blog: titel, slug, meta-description, OG-image filename, schema-extras, datePublished)
2. Voor elke blog:
   a. Lees markdown uit `/content/blogs/<bron-bestand>.md`
   b. **Opschoonstap** via `clean-text.js`:
      - Strip zero-width characters: U+200B, U+200C, U+200D, U+FEFF, U+2060, U+00AD
      - Vervang non-breaking spaces (U+00A0) door normale spaties
      - Vervang smart quotes (“, ”, ‘, ’) door straight quotes
      - Vervang ellipsis-character (U+2026) door drie losse puntjes
      - Flag em-dashes (—) en en-dashes (–) voor review — niet automatisch vervangen
   c. **AI-signaal lint** via `ai-signals-check.js`:
      - Detecteer verdachte patronen en log waarschuwingen (build faalt niet, maar rapporteert)
      - Patronen: "Niet X, maar Y"-constructies, triplet-opsommingen, "Het korte antwoord:" / "Even kort", overmatige "Het cruciale punt:" / "Belangrijkste is" markers
      - Output: console-waarschuwing per match met regelnummer voor handmatige review
   d. Converteer markdown → HTML via `marked`
   e. Vervang `[link]`-placeholders → echte URLs via `link-mapper.js`
   f. Voeg `target="_blank" rel="noopener"` toe aan externe links
   g. **Speciale embeds:**
      - In tafelgasten/ecommerce: vervang `*[Voor-diagram hier]*` / `*[Na-diagram hier]*` door `<iframe src="/blog/embeds/<diagram>.html" loading="lazy">` — diagram-bestanden worden gekopieerd naar `/blog/embeds/`
      - In pillar: laat video-placeholder staan als lege `<div class="video-placeholder">` met aria-label
   h. Vul template met: H1, body HTML, OG meta tags, Schema.org JSON-LD, author bio
   i. Schrijf naar `/blog/<slug>.html`
3. Genereer `sitemap.xml` met `<lastmod>` gespreid over 1-2 dagen (gebaseerd op publicatievolgorde uit overdrachtsdocument)
4. Output samenvatting: aantal blogs gebouwd, aantal AI-signaal-waarschuwingen, totale bestandsgrootte

## AI-detectie signalen voorkomen

Eerste-klas ontwerpeis. Drie lagen:

### Laag 1 — Tekstuele opschoning (auto-fix in build)
- Zero-width characters strippen (zie opschoonstap hierboven)
- Non-breaking spaces normaliseren
- Smart quotes → straight quotes
- Ellipsis-character → drie puntjes

### Laag 2 — HTML/meta hygiene (auto-correct in build)
- Geen `<meta name="generator">` tag in output
- Geen klassennamen of HTML-comments die naar AI-tools verwijzen
- Geen achtergebleven prompt/instructie-comments in output
- HTML-output indentatie en attribute-volgorde consistent met bestaande site (geen "AI smell" in markup)
- Schema.org `author` is een echte persoon ("Rick", met `Person` type), géén `softwareApplication`
- Geen `dateModified` die met de seconde overeenkomt met `datePublished` (kleine offset toegestaan)

### Laag 3 — Publicatie-metadata (handmatig + script-output)
- Sitemap `<lastmod>` per blog gespreid in tijd (publicatievolgorde uit overdrachtsdocument)
- 8 blogs niet exact gelijktijdig submitten naar Google Search Console — spreid over 1-2 dagen
- Author-bio op echte persoon, geen AI-disclaimer
- Geen "Powered by …", geen build-tool credits in footer

### Laag 4 — Lint-waarschuwingen (handmatige review, geen auto-fix)
`ai-signals-check.js` rapporteert verdachte patronen. Auteur (mens) beslist per match of het blijft of wijzigt. Patronen worden door de tijd uitgebreid op basis van ervaring. Initiële set:
- "Niet X, maar Y" / "Het gaat niet om X, het gaat om Y"
- Triplet-opsommingen ("X, Y en Z")
- Openers: "Het korte antwoord:", "Even kort", "Het cruciale punt:"
- "Niet alleen X, maar ook Y"
- Em/en-dashes (review of vervanging door komma/streepje gewenst is)

## Per-blog template inhoud

```html
<head>
  <title>{titel} | Alpaca Integrations</title>
  <meta name="description" content="{meta-description}">
  <link rel="canonical" href="https://alpacaintegrations.ai/blog/{slug}">

  <!-- Open Graph -->
  <meta property="og:title" content="{titel}">
  <meta property="og:description" content="{meta-description}">
  <meta property="og:image" content="https://alpacaintegrations.ai/images/og/{og-image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://alpacaintegrations.ai/blog/{slug}">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{titel}">
  <meta name="twitter:description" content="{meta-description}">
  <meta name="twitter:image" content="https://alpacaintegrations.ai/images/og/{og-image}">

  <!-- Favicon en styling, consistent met rest van site -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">

  <!-- Schema.org JSON-LD: BlogPosting + evt. FAQPage/HowTo -->
  <script type="application/ld+json">{...}</script>
</head>

<body>
  <!-- Header met logo + nav, identiek aan rest van site -->

  <article class="blog-article">
    <h1>{titel}</h1>
    <div class="blog-meta">
      <span>Door Rick</span> · <time datetime="{ISO}">{display-datum}</time>
    </div>

    {body-html}

    <!-- Chatbot-CTA blokken blijven inline zoals in markdown -->
  </article>

  <aside class="author-bio">
    <img src="/images/rick.jpg" alt="Rick van Alpaca Integrations">
    <div>
      <p><strong>Rick</strong> — Alpaca Integrations</p>
      <p>Korte bio-zin.</p>
      <a href="{linkedin-url}" target="_blank" rel="noopener">LinkedIn</a>
    </div>
  </aside>

  <!-- Footer identiek aan rest van site -->

  <!-- Plek voor chatbot-widget snippet — toegevoegd bij sub-project 2 launch -->
</body>
```

**Styling:** consistent met bestaande site (zie `/lm/*.html` en `/css/style.css`). Tabellen, code-blokken, blockquotes, FAQ-secties krijgen reeds-bestaande of nieuwe klassen.

## Schema.org markup

Elke blog krijgt `BlogPosting` als basis:

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "{titel}",
  "description": "{meta-description}",
  "author": {
    "@type": "Person",
    "name": "Rick",
    "url": "{linkedin-url}"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Alpaca Integrations",
    "url": "https://alpacaintegrations.ai"
  },
  "datePublished": "{ISO}",
  "dateModified": "{ISO}",
  "image": "https://alpacaintegrations.ai/images/og/{og-image}",
  "mainEntityOfPage": "https://alpacaintegrations.ai/blog/{slug}"
}
```

**Extra schema's:**
- **Pillar + Voorwaarden:** `FAQPage` schema. De vraag-antwoord paren worden expliciet aangedragen in `blog-config.js` (geen auto-detectie uit markdown — te fragiel). Bijv. een `faqItems: [{ q: "...", a: "..." }]` array per blog.
- **Aanvragen:** `HowTo` schema. De stappen worden expliciet aangedragen in `blog-config.js` als geordende array `howToSteps: [{ name: "...", text: "..." }]`.
- Build-script injecteert deze als JSON-LD `<script>` blokken naast het basis `BlogPosting` schema.

## Sitemap

`sitemap.xml` in root, gegenereerd door build-script. Bevat:
- Bestaande pagina's (homepage, /scorecard, /rapport, /training, /lm/*, etc.) — verzameld door de directory te scannen
- 8 nieuwe blog-URLs
- `<lastmod>` per blog gespreid over 1-2 dagen volgens publicatievolgorde uit overdrachtsdocument:
  - Dag 1 ochtend: pillar (alle clusters linken hiernaartoe, dus eerste)
  - Dag 1 middag: voorwaarden + aanvragen (subsidie-info cluster)
  - Dag 1 eind: ai + automatisering (implementatie cluster)
  - Dag 2 ochtend: processen (brug tussen subsidie en praktijk)
  - Dag 2 middag: tafelgasten + ecommerce (voorbeeldprojecten)
- Realistische timestamps (doordeweeks, kantooruren)

## Deploy strategie

**Tijdens bouw:**
- Branch: `feature/sprintsubsidie-blogs`
- Netlify maakt automatisch branch-preview URL — niet geïndexeerd, alleen Rick + jij hebben de link
- Iteraties: commit → push → preview update → review → herhaal

**netlify.toml uitbreiden:**
```toml
[build]
  command = "node scripts/build-blogs.js"
  publish = "."

[[redirects]]
  from = "/blog/:slug"
  to = "/blog/:slug.html"
  status = 200

# Bestaande scorecard redirects blijven staan
```

**Launch dag (= dag van merge naar `main`):**
1. Sub-project 2 (chatbot widget-snippet) is op deze branch toegevoegd
2. Merge `feature/sprintsubsidie-blogs` → `main`
3. Netlify deploy → alles tegelijk live op alpacaintegrations.ai
4. Post-publicatie checks (zie volgende sectie)

## Post-publicatie checks

Uit overdrachtsdocument, deze blijven handwerk:

**Direct na live:**
- Bekijk broncode van elke live pagina (verifieer meta tags, schema, canonical)
- Test schema markup via [Google Rich Results Test](https://search.google.com/test/rich-results)
- Test OG-images via LinkedIn Post Inspector / opengraph.xyz
- Test mobiele weergave
- Check laadsnelheid via PageSpeed Insights

**Search Console:**
- Submit sitemap.xml
- Submit elke URL handmatig — gespreid, niet alle 8 in één minuut
- Check na 3-5 dagen of pagina's geïndexeerd zijn

**Monitoring (na 2-4 weken):**
- Check rankings per zoekwoord
- Noteer onverwacht verkeer leverende zoektermen
- Beoordeel of blogs aanpassing nodig hebben

## Open vragen / later

- **Hero-afbeelding bovenaan blog:** OG-image als hero gebruiken? Visueel zwaarder, maar consistent met OG-preview. Beslissen tijdens implementatie zodra we het eerste blog visueel zien.
- **Rick's foto + LinkedIn URL:** moet aangeleverd worden voor author-bio
- **Video-embed in pillar:** komt later — voor nu placeholder-div
- **Aanvraag-screenshots:** komt later — niet blokkerend voor launch
- **Leestijd weergeven:** auto-bereken in build-script of overslaan tot later? Overslaan voor launch.

## Volgende stappen

1. Spec self-review (placeholders, contradicties, ambiguïteit, scope)
2. Gebruiker reviewt spec
3. Bij akkoord: invoke `writing-plans` skill voor stap-voor-stap implementatieplan
4. Implementatie via test-driven development waar van toepassing
5. Na sub-project 1 oplevering: nieuw brainstorm-traject voor sub-project 2 (chatbot)

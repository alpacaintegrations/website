# Chatbot widget — design

**Datum:** 2026-05-11
**Status:** Goedgekeurd door gebruiker, klaar voor implementatieplan
**Sub-project:** 2 van 2 (volgend op sprintsubsidie-blogs spec)

## Context

De 8 Sprintsubsidie blog-pagina's zijn klaar (sub-project 1, lokaal op `main`, niet gepusht). Op alle 8 pagina's komt een chatbot widget die:
1. Vragen beantwoordt over de Sprintsubsidie MKB Limburg 2026-2027
2. Meedenkt over automatiseren van taken en processen (Alpaca-expertise)
3. Leads vangt en die direct naar Rick mailt met chathistorie

Sub-project 1 en sub-project 2 worden samen live gezet in één deploy. Tot dan blijft alles lokaal op `main` (13 commits ahead van origin).

## Doel

Een werkende chat-widget die:
- Op alle 8 blog-pagina's beschikbaar is als floating button + inline CTA-blok onderaan
- Met Claude Opus 4.7 antwoordt, met de complete kennisbank in de gecachte system prompt
- Lead-capture doet via een `lead_capture` tool die naar Supabase schrijft en Rick mailt
- Chathistorie persistent houdt via `localStorage` (sessie overleeft refresh)
- Consistent is met de bestaande stack (n8n + Supabase, zoals de scorecard)

## Scope

**In scope:**
- Frontend widget (vanilla JS + CSS, geen framework)
- Floating button (roze, pill-shape met tekst) — rechtsonder, alle blogs
- Inline CTA-blok onderaan elke blog (toegevoegd door het bestaande build-script)
- Chat-venster (400×600 desktop, full-screen mobile)
- Welkomst-message, conversation flow, lead-capture flow
- n8n workflow (importklare JSON)
- Supabase schema (3 tabellen + SQL migration)
- Email-template voor leadmelding naar `rick@alpacaintegrations.ai`
- Documentatie + runbook voor Rick (credentials inrichten in externe tools)

**Niet in scope:**
- Streaming responses (we volgen het scorecard polling-pattern)
- Vector retrieval / chunked kennisbank (alles in gecachte system prompt)
- `zoek_kennisbank` of `web_search` tool (kan later toegevoegd worden, niet nodig voor MVP)
- Chatbot op niet-blog pagina's (alleen op `/blog/*`)
- Multi-language support (alleen NL)
- Authenticatie / login (anonieme sessies)

## Architectuur

```
[Blog pagina + chat widget (vanilla JS + CSS)]
        |
        | POST /webhook/chatbot
        | { session_id, blog_slug, user_message, history[] }
        v
[n8n webhook handler]
        |
        |-- 1. Supabase INSERT chatbot_messages (role='user')
        |-- 2. Anthropic API call:
        |      model: claude-opus-4-7
        |      system: <cached> AI subsidie assistent persoonlijkheid
        |              + complete kennisbank (~30k tokens)
        |              + tone-regels
        |              [cache_control: ephemeral]
        |      messages: history + new user message
        |      tools: [lead_capture, verwijs_blog]
        |-- 3. Bij tool_use=lead_capture:
        |      a. Supabase INSERT chatbot_leads
        |      b. Email-node: leadmelding naar rick@alpacaintegrations.ai
        |         (met volledige chathistorie embedded)
        |      c. Tool-result terugsturen naar Anthropic voor afsluitend bericht
        |-- 4. Supabase INSERT chatbot_messages (role='assistant')
        |-- 5. Return { assistant_message } naar widget
        |
        v
[Widget rendert antwoord + bewaart in localStorage]
```

## Componenten

### Frontend (in `/js/chatbot/`)

```
/js/chatbot/
  widget.js          - de chat-widget zelf, mount op alle blogs
  api.js             - praat met n8n webhook
  state.js           - localStorage session + history
  cta-block.html     - template snippet voor inline CTA-blok onderaan blogs
/css/chatbot.css     - alle styling, met --pink color token
```

Het build-script (`scripts/build-blogs.js`) wordt aangepast om:
- Het CTA-blok onderaan elke blog te injecteren (boven de author-bio)
- De `<script src="/js/chatbot/widget.js" defer>` en CSS-link in elke blog op te nemen

### Backend (n8n)

Eén workflow, geïmporteerd via JSON. Bevat 7 nodes:

1. **Webhook node** — endpoint `/webhook/chatbot` (POST)
2. **Supabase node** — INSERT user message
3. **HTTP Request node** — Anthropic API call (POST `/v1/messages`)
4. **IF node** — splitst op `stop_reason == 'tool_use'`
5. **Lead-capture branch** (alleen bij tool_use):
   - Supabase node — INSERT lead
   - SMTP node — leadmelding naar Rick
   - HTTP Request node — Anthropic API met tool_result voor afsluitend bericht
6. **Supabase node** — INSERT assistant message
7. **Respond to webhook node** — return JSON naar widget

Credentials in n8n (door Rick eenmalig in te richten):
- Anthropic API key (header `x-api-key`)
- Supabase service role key (service-role JWT)
- SMTP credentials voor leadmelding

### Database (Supabase)

Drie nieuwe tabellen:

```sql
CREATE TABLE chatbot_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz DEFAULT now(),
  blog_slug text,
  user_agent text
);

CREATE TABLE chatbot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chatbot_sessions(id) ON DELETE CASCADE,
  role text CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  tool_use_json jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE chatbot_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chatbot_sessions(id),
  naam text NOT NULL,
  contact_voorkeur text CHECK (contact_voorkeur IN ('email', 'telefoon')),
  email text,
  telefoon text,
  beste_moment text,
  context text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_messages_session ON chatbot_messages(session_id, created_at);
CREATE INDEX idx_leads_created ON chatbot_leads(created_at DESC);
```

## Chat-widget UI

### Floating button (rechtsonder, altijd zichtbaar)

**Desktop:** pill-shape, roze (`#ec4899`), witte tekst, soft shadow. Tekst:
> 💬 Vragen over de subsidie of je project? Vraag het de AI →

**Mobiel:** compactere variant, alleen "💬 Vraag" of de pill in kleinere maat.

**Hover:** lichte schaal-animatie (1.03×) + iets sterkere shadow.

### Open chat-venster

**Desktop:** 400 × 600 px overlay rechtsonder, met soft shadow en afgeronde hoeken. Boven sluitknop, midden scrollbare berichten, onder input.

**Mobiel:** full-screen bottom-sheet animatie (sleeft van onderaan omhoog).

**Bericht-bubbles:**
- Gebruiker: rechts, blauw-tinted, witte tekst
- Bot: links, donker met roze accent-rand
- Typing indicator wanneer bot bezig is

**Input:** textarea met send-knop, Enter = verstuur, Shift+Enter = nieuwe regel.

### Welkomst-message (eerste bericht als widget opent)

> Hoi! Ik ben de AI subsidie assistent. Ik weet alles over de Sprintsubsidie MKB en het automatiseren van taken en processen. Vertel wat je wilt weten of beschrijf je situatie — dan ga ik het voor je regelen.

### Inline CTA-blok onderaan elke blog

```
+-----------------------------------------+
| Vragen over de Sprintsubsidie of jouw   |
| project?                                 |
| Praat nu met de AI subsidie assistent.   |
|                                          |
| [ Start gesprek ]  <- roze button        |
+-----------------------------------------+
```

Roze accent-rand links, donkere achtergrond consistent met blog-styling. Button opent het chat-venster (zelfde widget als de floating button).

## System prompt

Hergebruik van het `chatbot-overdracht-claude-code.md` document met deze aanpassingen:

1. **Naam:** overal "AI subsidie assistent" (geen "Rick's assistent", geen "subsidie-assistent")
2. **Expertise-framing:** behoud de twee gebieden (Sprintsubsidie + automatiseren van taken en processen), maar pas tone aan
3. **Tone:** "dan ga ik het voor je regelen" (proactief), niet "ik denk met je mee"
4. **Behoudt onveranderd:**
   - Alle kernfeiten (bedragen, deadlines, voorwaarden)
   - Drie gesprekstypen (subsidievragen, projectbeoordeling, projectverkenning)
   - Lead-capture flow met twee triggers
   - "NOOIT prijzen geven" regel
   - "NOOIT tools/jargon noemen" regel (geen n8n, Airtable, etc.)
   - Spiegel-niveau-van-gebruiker regel
   - Doorverwijzingen naar de 8 blogs
   - Privacy-regels (geen KvK/financiele data opslaan)

Compleet system prompt (met de drie aanpassingen) wordt opgenomen in de n8n workflow JSON als de `system`-parameter, met `cache_control: ephemeral` zodat Anthropic prompt caching werkt.

## Tools

Twee tools, gedefinieerd in de Anthropic API call:

### 1. `lead_capture`

Aangeroepen wanneer de gebruiker expliciet contact wil.

```json
{
  "name": "lead_capture",
  "description": "Sla contactgegevens op van een potentiele lead. Gebruik alleen nadat de gebruiker expliciet heeft aangegeven dat ze contact willen.",
  "input_schema": {
    "type": "object",
    "properties": {
      "naam": { "type": "string" },
      "contact_voorkeur": { "type": "string", "enum": ["email", "telefoon"] },
      "email": { "type": "string" },
      "telefoon": { "type": "string" },
      "beste_moment": { "type": "string" },
      "context": { "type": "string", "description": "Korte samenvatting van wat de persoon wil bespreken" }
    },
    "required": ["naam", "contact_voorkeur", "context"]
  }
}
```

**Handler in n8n:**
1. INSERT in `chatbot_leads`
2. Email naar `rick@alpacaintegrations.ai` met chathistorie
3. Tool_result terug naar Anthropic: `"Lead opgeslagen, Rick neemt contact op."`

### 2. `verwijs_blog`

Aangeroepen wanneer bot naar specifieke blog wil verwijzen.

```json
{
  "name": "verwijs_blog",
  "description": "Verwijs de gebruiker naar een relevante blogpost voor meer informatie.",
  "input_schema": {
    "type": "object",
    "properties": {
      "blog": {
        "type": "string",
        "enum": ["pillar", "voorwaarden", "ai", "automatisering", "processen", "tafelgasten", "ecommerce", "aanvragen"]
      }
    },
    "required": ["blog"]
  }
}
```

**Handler in n8n:** mapt blog-enum naar URL en geeft tool_result terug zodat bot in z'n antwoord de markdown-link plakt.

## Email-template (leadmelding)

```
To: rick@alpacaintegrations.ai
Subject: Nieuwe lead via AI subsidie assistent: {naam}

NIEUWE LEAD
-----------
Naam:         {naam}
Contact via:  {email|telefoon}
{indien email}    E-mail:       {email}
{indien telefoon} Telefoon:     {telefoon}
                  Beste moment: {beste_moment}

CONTEXT (samengevat door bot):
{context}

VOLLEDIGE CHATHISTORIE:
-----------------------
[{tijdstip}] Gebruiker: {bericht}
[{tijdstip}] Assistent: {bericht}
...

Lead bekijken in Supabase:
https://supabase.com/dashboard/project/{project-id}/editor → chatbot_leads → id={lead_id}
```

HTML-versie wordt mooier opgemaakt, plain-text als fallback.

## Conversation state

**Frontend (localStorage):**
- `chatbot_session_id` — UUID, gegenereerd op eerste interactie
- `chatbot_messages` — JSON array van alle berichten in deze sessie
- `chatbot_session_expires` — timestamp, sessie reset na 24 uur inactiviteit

Bij elke API-call stuurt de widget de volledige history mee, dus n8n is stateless m.b.t. conversatie (de Supabase opslag is voor analytics, niet voor state-recovery).

## Privacy en veiligheid

- Anthropic API key staat **alleen in n8n credentials**, nooit in de frontend
- Supabase service role key alleen in n8n, frontend praat alleen met n8n (CORS open voor `alpacaintegrations.ai`)
- Geen KvK-nummers, BSN, of financiele data opslaan — bot weigert deze in het `context`-veld op te nemen
- Chatlogs bevatten alleen wat de gebruiker zelf in het venster typt
- Sessies zijn anoniem, geen IP-opslag (Supabase logs op netwerk-niveau zijn server-side)

## Werkverdeling

### Wat Claude Code genereert (en commit)

- Frontend chat-widget code (`/js/chatbot/*.js`, `/css/chatbot.css`)
- Aanpassing aan `scripts/build-blogs.js` voor CTA-blok-injectie
- n8n workflow JSON (`docs/chatbot/n8n-workflow.json`)
- Supabase SQL migration (`docs/chatbot/supabase-migration.sql`)
- Email-template (`docs/chatbot/email-lead-notification.html`)
- Setup-runbook (`docs/chatbot/SETUP.md`) met stap-voor-stap instructies

### Wat Rick handmatig doet (eenmalig, voor launch)

1. **Supabase:** SQL editor openen, migration plakken, Run
2. **Anthropic:** API key aanmaken op console.anthropic.com (als nog niet bestaat)
3. **n8n:** workflow importeren (Import from File), 3 credentials inrichten:
   - Anthropic (header `x-api-key`)
   - Supabase service role
   - SMTP (Office 365 met letstalk@... of Resend/Postmark)
4. **n8n:** workflow activeren → krijgt een productie webhook URL
5. **Webhook URL doorgeven** aan Claude Code → wordt gezet in `js/chatbot/api.js`
6. **Lokaal testen:** widget openen op een blog-pagina, gesprek voeren, leadflow doorlopen
7. **Push** beide sub-projecten naar `origin/main` → live op alpacaintegrations.ai

## Open punten

- **SMTP provider:** keuze tussen Office 365 (letstalk@... als sender) of een transactionele service (Resend/Postmark). Office 365 werkt out-of-the-box als de mailbox al SMTP-aan heeft staan; Resend is robuuster voor transactional. Beslissen bij Rick's setup.
- **Rate limiting:** voor MVP geen rate-limit op de webhook. Als bot misbruikt wordt (bv. iemand pompt 1000 messages), is dat zichtbaar in Supabase en n8n logs. Latere toevoeging: rate-limit per session_id.
- **Cost monitoring:** Anthropic biedt usage logs, maar geen alerting bij thresholds. Optie later: daily summary email met token usage.

## Volgende stappen

1. Spec self-review
2. Gebruiker reviewt spec
3. Bij akkoord: `writing-plans` skill invoken voor stap-voor-stap implementatieplan
4. Implementatie via inline execution
5. Setup-runbook doorlopen met Rick → eerste live test
6. Beide sub-projecten samen pushen → launch

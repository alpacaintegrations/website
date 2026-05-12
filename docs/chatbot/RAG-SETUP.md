# RAG-kennisbank setup — runbook

Eenmalige inrichting om van "alles in system prompt" naar echte retrieval te gaan. Bespaart ~75% aan tokens en houdt de bot synchroon met de bronnen.

## Stap 1 — Supabase pgvector aanzetten

1. Open je Supabase dashboard → **Database** → **Extensions**
2. Zoek **`vector`** en klik **Enable** (of klik op de toggle)
3. Open daarna **SQL Editor → New query**
4. Open lokaal `docs/chatbot/supabase-pgvector-migration.sql`, kopieer de hele inhoud, plak en klik **Run**
5. Verifieer in **Table Editor**: nieuwe tabel `chatbot_knowledge` bestaat met `embedding`-kolom

## Stap 2 — OpenAI API key

1. Ga naar [platform.openai.com](https://platform.openai.com) → log in / maak account
2. **API Keys** → **Create new key** (naam: `chatbot-embeddings`)
3. Kopieer de key meteen (sk-...)
4. **Billing** → koppel betaalmethode + zet usage limit op bijv. $5/maand. Embedding is ~$0.02/M tokens — je zult dat niet snel halen.

## Stap 3 — Kennisbank embedden en uploaden (eenmalig + telkens als bronnen veranderen)

In je terminal (vanuit de website-folder):

```bash
OPENAI_API_KEY=sk-jouw-key \
SUPABASE_URL=https://jouw-project.supabase.co \
SUPABASE_SERVICE_KEY=jouw-service-role-key \
node scripts/build-knowledge-base.js
```

Het script:
- Extract tekst uit alle .md, .docx en .pdf in `docs/chatbot/knowledge/`
- Chunkt in ~500-token blokken
- Embed elke chunk via OpenAI (text-embedding-3-small)
- Uploadt naar Supabase `chatbot_knowledge`-tabel

Verwachte duur: 1-2 minuten. Verwachte kosten: een paar cent.

Verifieer achteraf in Supabase Table Editor → `chatbot_knowledge` → zo'n 60-100 rijen.

## Stap 4 — n8n workflow herimporteren (of handmatig 2 nodes toevoegen)

### Optie A — Herimporteren (verlies van handmatige config)

1. Open de bestaande chatbot workflow in n8n
2. Workflow menu → **Import from File** → kies de bijgewerkte `docs/chatbot/n8n-workflow.json`
3. Credentials (Anthropic, Supabase, SMTP) opnieuw selecteren per node
4. Stappen 5 + 6 hieronder uitvoeren

### Optie B — Bestaande workflow uitbreiden (behoud config)

1. **Voeg twee nieuwe Code-nodes toe** tussen `Webhook` en `System Prompt`:

   **Node "Embed Query"** (Code-node):
   ```javascript
   const openaiKey = 'YOUR_OPENAI_KEY'; // Vervang met je OpenAI key
   const userMessage = $('Webhook').first().json.body.user_message;

   const response = await this.helpers.httpRequest({
     method: 'POST',
     url: 'https://api.openai.com/v1/embeddings',
     headers: {
       'Authorization': `Bearer ${openaiKey}`,
       'Content-Type': 'application/json'
     },
     body: {
       input: userMessage,
       model: 'text-embedding-3-small'
     },
     json: true
   });

   const embedding = response.data[0].embedding;
   return [{ json: { embedding, userMessage } }];
   ```

   **Node "Retrieve Knowledge"** (HTTP Request-node):
   - Method: POST
   - URL: `https://JOUW-PROJECT.supabase.co/rest/v1/rpc/match_chunks` (vervang met jouw Supabase URL)
   - Headers:
     - `apikey`: jouw service role key
     - `Authorization`: `Bearer jouw-service-role-key`
     - `Content-Type`: `application/json`
   - Body Content Type: **Raw**
   - Content Type: `application/json`
   - Body (expression mode, met `=` prefix):
     ```
     =JSON.stringify({ query_embedding: $('Embed Query').first().json.embedding, match_count: 5 })
     ```

2. **Connect**: Webhook → Embed Query → Retrieve Knowledge → System Prompt

3. **Update de "System Prompt" Code-node**: vervang de huidige code met de nieuwe versie uit `docs/chatbot/system-prompt-node.js` (zie GitHub raw). De nieuwe versie haalt de retrieved chunks op uit `Retrieve Knowledge` en injecteert ze als context-bericht.

## Stap 5 — Test

1. Save de workflow en activeer 'm
2. Open een blog op alpacaintegrations.ai (of lokaal via http-server)
3. Stel een specifieke subsidievraag: *"wat is het minimumbedrag?"*
4. Verifieer dat de bot een correct antwoord geeft (€5.000)
5. Check in n8n Executions tab: in de "Retrieve Knowledge" node-output moeten 5 chunks met similarity scores staan

## Stap 6 — Onderhoud

**Wanneer kennisbank updaten:**
- Provincie wijzigt regeltekst → vervang `docs/chatbot/knowledge/sprint-subsidie-regels.docx` met de nieuwe versie → run `node scripts/build-knowledge-base.js`
- Nieuwe FAQ's toevoegen → edit `docs/chatbot/knowledge/sprintsubsidie-ruwe-kennisbank.md` → run script
- Het script wist altijd eerst de oude data, dus geen dubbele entries

**Wanneer system prompt updaten** (persona, tone, basis-feiten):
- Edit `scripts/build-system-prompt.js`
- Run `node scripts/build-system-prompt.js && node scripts/build-n8n-workflow.js`
- Plak de nieuwe inhoud van `docs/chatbot/system-prompt-node.js` in de System Prompt Code-node in n8n

## Kosten-overzicht

| Onderdeel | Per chatbot-vraag |
|---|---|
| OpenAI embed query (text-embedding-3-small) | ~$0.0001 |
| Anthropic Claude Opus 4.7 input (basis prompt + retrieved chunks ~7k tokens cached) | ~$0.01 |
| Anthropic Claude Opus 4.7 output (~500 tokens) | ~$0.04 |
| **Totaal per vraag** | **~$0.05** |

Per gesprek van 5 vragen: ~$0.25. Voorheen (alles in prompt): ~$1.30. **80% kostenreductie.**

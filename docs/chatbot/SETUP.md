# Chatbot setup — runbook voor Rick

Eenmalige inrichting. Hierna draait de chatbot live op alle 8 blog-pagina's.

## Vooraf

Je hebt nodig:
- Toegang tot je Supabase project (dezelfde waar de scorecard ook in zit)
- Toegang tot je n8n instance (`alpacaintegrations.n8p1.hostingsecure.com`)
- Een Anthropic API key (zie stap 2 als je die nog niet hebt)
- SMTP-toegang voor `letstalk@alpacaintegrations.ai` (Office 365 met app-wachtwoord)

## Stap 1 — Supabase tabellen aanmaken

1. Open je Supabase dashboard → SQL Editor → New query
2. Open `docs/chatbot/supabase-migration.sql` in dit project
3. Kopieer de volledige inhoud, plak in de SQL editor, klik **Run**
4. Verifieer: ga naar Table Editor, je ziet nu drie nieuwe tabellen: `chatbot_sessions`, `chatbot_messages`, `chatbot_leads`

## Stap 2 — Anthropic API key

Als je nog geen API key hebt:
1. Ga naar [console.anthropic.com](https://console.anthropic.com)
2. Maak een account / log in
3. Settings → API Keys → Create Key, naam zoals `chatbot-prod`
4. Kopieer de key meteen (je ziet hem maar één keer)
5. Bewaar 'm veilig — straks zet je hem in n8n

**Tip:** zet bij Settings → Billing een lage daily-limit (bv. $5) om afwijkingen vroeg te zien. Een normaal gesprek kost ~5-15 cent.

## Stap 3 — n8n workflow importeren

1. Open je n8n instance
2. **Workflows → Add workflow → Import from File**
3. Kies `docs/chatbot/n8n-workflow.json` uit dit project
4. De workflow verschijnt met 9 nodes en rode credentials-icoontjes

De system prompt zit al **inline** in de "System Prompt"-node (een Code-node). Geen file-upload of SSH nodig. Wil je de bot later aanpassen? Open die node en edit de string daar.

## Stap 4 — Credentials in n8n inrichten

Drie credentials nodig. Per node klik je op het rode icoontje en richt je hem in.

### Anthropic API key
- **Op de "Anthropic API"-node** → Credential to connect with → **+ Create new**
- Type: **HTTP Header Auth** (niet de built-in Anthropic credential — die werkt niet in alle n8n-versies)
- Naam: `Anthropic API key`
- Header Name: `x-api-key`
- Header Value: jouw Anthropic API key uit stap 2

(Let op: de workflow stuurt `x-api-key` als header al via `headerParameters` in de node-config. Het credential is een fallback voor n8n-versies die de inline-header niet pakken. Werkt het niet, plak de key dan rechtstreeks in de "Header Parameters → x-api-key → Value"-veld op de Anthropic-node.)

### Supabase service role
- **Op een Supabase-node** → **+ Create new credential**
- Type: **Supabase**
- Naam: `Supabase service role`
- Host: jouw Supabase project URL (`https://<project-id>.supabase.co`)
- Service Role Secret: vind je in Supabase **Settings → API → service_role key** (NIET de anon key)
- Bewaar.

### SMTP (voor leadmelding)
- **Op de "Send lead email"-node** → **+ Create new credential**
- Type: **SMTP**
- Naam: `Office 365 SMTP`
- User: `letstalk@alpacaintegrations.ai`
- Password: een **app-wachtwoord** (genereer via Microsoft 365 account → Security → App passwords; gewoon login-wachtwoord werkt niet met MFA)
- Host: `smtp.office365.com`
- Port: `587`
- Secure: STARTTLS (niet TLS direct)

## Stap 5 — Workflow activeren

1. Klik bovenin op de **Active**-toggle (grijs → groen)
2. n8n geeft je nu een productie-webhook URL — kopieer die. Ziet er ongeveer zo uit:
   ```
   https://alpacaintegrations.n8p1.hostingsecure.com/webhook/abc123-def456-...
   ```

## Stap 6 — Webhook URL doorgeven

Geef de webhook URL door (plak 'm in een nieuw chatbericht naar Claude Code).

Ik update dan `js/chatbot/config.js`:
```javascript
export const WEBHOOK_URL = 'https://alpacaintegrations.n8p1.hostingsecure.com/webhook/...';
```

Run `npm run build` om de blogs opnieuw te bouwen, en commit.

## Stap 7 — Lokale eind-test (echte n8n)

1. Start de lokale server:
   ```bash
   npx http-server -p 8000 -c-1
   ```
2. Open `http://localhost:8000/blog/sprintsubsidie-mkb-limburg-gids.html`
3. Klik rechtsonder op de roze chat-button
4. Stel een testvraag, bijv. *"Wat is het minimumbedrag voor de Sprintsubsidie?"*
5. Verifieer: bot antwoordt binnen 5-10 seconden met correct bedrag (€5.000)
6. Test lead-capture: typ *"ik wil dat iemand contact opneemt"*
7. Vul de gegevens in die de bot vraagt
8. Verifieer:
   - **Supabase Table Editor → `chatbot_leads`** toont jouw test-lead
   - **E-mail komt aan op `rick@alpacaintegrations.ai`** met chathistorie
   - **Supabase Table Editor → `chatbot_messages`** toont alle berichten

Als één van deze stappen faalt, zie Troubleshooting onderaan.

## Stap 8 — Live zetten

Beide sub-projecten (blogs + chatbot) zijn nu klaar.

```bash
git push origin main
```

Netlify deployt automatisch. Na ±2 minuten staat alles live op alpacaintegrations.ai.

## Stap 9 — Post-launch checks

Eenmalig na live deploy:

1. Open `https://alpacaintegrations.ai/blog/sprintsubsidie-mkb-limburg-gids` in een privé-venster
2. Klik op de chat-button, check of het werkt op productie
3. Submit `https://alpacaintegrations.ai/sitemap.xml` in Google Search Console
4. Submit elke blog-URL handmatig in Search Console — gespreid over 1-2 dagen
5. Test schema markup via [Google Rich Results Test](https://search.google.com/test/rich-results) voor pillar, voorwaarden, aanvragen (degenen met extra schema's)
6. Test een OG-image via [opengraph.xyz](https://www.opengraph.xyz) om te zien hoe het deelt op LinkedIn/WhatsApp

---

## Troubleshooting

### "Sorry, er ging iets mis" in de chat
Check n8n **Executions** tab in de workflow. Eerste failing execution toont de exacte fout. Vaakste oorzaken:
- Anthropic API key fout of niet ingevuld → check stap 4
- Supabase credentials fout → check service_role key, niet anon

### Chat opent maar reageert niet
- Browser DevTools → Network tab → kijk of er een POST naar de webhook URL gaat
- Zo niet: `WEBHOOK_URL` in `js/chatbot/config.js` is leeg → ga terug naar stap 6
- Zo wel maar krijg je 404: workflow is niet **Active** in n8n → toggle activeren

### E-mail komt niet aan op rick@alpacaintegrations.ai
- Check spam/ongewenste-folder
- Check de SMTP-node execution: vaakste fout is gewoon wachtwoord ipv app-wachtwoord, of poort 25 ipv 587
- Check je Office 365 → admin → message trace voor de outgoing email

### Bot geeft verkeerde info
- De system prompt zit inline in de "System Prompt" Code-node in de n8n workflow
- Quick fix: open die node in n8n, edit de string, save de workflow — direct actief
- Voor structurele updates uit de kennisbank-bronnen: pas `docs/chatbot/knowledge/*.md` aan, run lokaal `node scripts/build-system-prompt.js && node scripts/build-n8n-workflow.js`, en herimporteer de nieuwe `n8n-workflow.json` in n8n (let op: opnieuw credentials inrichten)

### Lokale UI testen zonder n8n
Zet in `js/chatbot/config.js`:
```javascript
export const ENABLE_MOCK = true;
```
Run `npm run build`, open lokaal — widget gebruikt nu nep-responses. Goed voor visuele check zonder echte API-kosten.

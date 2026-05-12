import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SYSTEM_PROMPT_PATH = path.join(ROOT, 'docs', 'chatbot', 'system-prompt.md');
const OUTPUT_PATH = path.join(ROOT, 'docs', 'chatbot', 'n8n-workflow.json');

async function build() {
  const systemPrompt = await fs.readFile(SYSTEM_PROMPT_PATH, 'utf8');

  // Code-node returnt de system prompt als JS string. We JSON-stringify hem
  // zodat n8n hem als geldige JavaScript string-literal accepteert (escape
  // quotes, newlines, etc.). Het backtick-wrapper-trucje werkt niet betrouwbaar
  // omdat de prompt zelf backticks kan bevatten.
  const promptJson = JSON.stringify(systemPrompt);

  const workflow = {
    "name": "chatbot-flow",
    "nodes": [
      {
        "parameters": {
          "httpMethod": "POST",
          "path": "chatbot",
          "responseMode": "responseNode",
          "options": {
            "allowedOrigins": "https://alpacaintegrations.ai,http://localhost:8000"
          }
        },
        "name": "Webhook",
        "type": "n8n-nodes-base.webhook",
        "typeVersion": 1.1,
        "position": [240, 300],
        "id": "node-webhook"
      },
      {
        "parameters": {
          "jsCode": `// System prompt voor de AI subsidie assistent.\nconst systemPrompt = ${promptJson};\n\n// Retrieved kennisbank-chunks van Retrieve Knowledge node (Supabase RPC).\n// De response is een JSON-array van chunks met { id, source, title, content, similarity }.\nconst retrieveResp = $('Retrieve Knowledge').first().json;\nconst retrievedChunks = Array.isArray(retrieveResp) ? retrieveResp : [];\nconst contextBlocks = retrievedChunks\n  .filter(c => c && c.content)\n  .map((c, i) => \`[Chunk \${i + 1}] Bron: \${c.source || 'onbekend'}\${c.title ? ' - ' + c.title : ''}\\n\${c.content}\`)\n  .join('\\n\\n---\\n\\n');\n\nconst kennisbankContext = contextBlocks\n  ? \`Hier zijn de meest relevante stukken uit de officiele kennisbank voor deze vraag. Gebruik deze als primaire bron:\\n\\n\${contextBlocks}\`\n  : 'Geen specifieke kennisbank-context gevonden voor deze vraag. Antwoord op basis van basis-feiten en bied aan om door te verwijzen.';\n\nconst history = $('Webhook').first().json.body.history || [];\nconst userMessage = $('Webhook').first().json.body.user_message;\n\n// Injecteer kennisbank als extra user message vlak voor de echte vraag\nconst messages = [\n  ...history,\n  { role: 'user', content: \`<kennisbank>\\n\${kennisbankContext}\\n</kennisbank>\\n\\n\${userMessage}\` }\n];\n\nconst requestBody = {\n  model: 'claude-opus-4-7',\n  max_tokens: 1024,\n  system: [{\n    type: 'text',\n    text: systemPrompt,\n    cache_control: { type: 'ephemeral' }\n  }],\n  messages,\n  tools: [\n    {\n      name: 'lead_capture',\n      description: 'Sla contactgegevens op van een potentiele lead. Gebruik alleen nadat de gebruiker expliciet heeft aangegeven dat ze contact willen.',\n      input_schema: {\n        type: 'object',\n        properties: {\n          naam: { type: 'string' },\n          contact_voorkeur: { type: 'string', enum: ['email', 'telefoon'] },\n          email: { type: 'string' },\n          telefoon: { type: 'string' },\n          beste_moment: { type: 'string' },\n          context: { type: 'string' }\n        },\n        required: ['naam', 'contact_voorkeur', 'context']\n      }\n    },\n    {\n      name: 'verwijs_blog',\n      description: 'Verwijs de gebruiker naar een relevante blogpost voor meer informatie.',\n      input_schema: {\n        type: 'object',\n        properties: {\n          blog: { type: 'string', enum: ['pillar', 'voorwaarden', 'ai', 'automatisering', 'processen', 'tafelgasten', 'ecommerce', 'aanvragen'] }\n        },\n        required: ['blog']\n      }\n    }\n  ]\n};\n\nreturn [{ json: { systemPrompt, requestBody } }];`
        },
        "name": "System Prompt",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [900, 300],
        "id": "node-system-prompt"
      },
      {
        "parameters": {
          "jsCode": "// Embed user message via OpenAI text-embedding-3-small.\n// Vereist OpenAI credential met API key (zie SETUP).\nconst openaiKey = 'YOUR_OPENAI_KEY';\n\nconst userMessage = $('Webhook').first().json.body.user_message;\n\nconst response = await this.helpers.httpRequest({\n  method: 'POST',\n  url: 'https://api.openai.com/v1/embeddings',\n  headers: {\n    'Authorization': `Bearer ${openaiKey}`,\n    'Content-Type': 'application/json'\n  },\n  body: {\n    input: userMessage,\n    model: 'text-embedding-3-small'\n  },\n  json: true\n});\n\nconst embedding = response.data[0].embedding;\nreturn [{ json: { embedding, userMessage } }];"
        },
        "name": "Embed Query",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [460, 300],
        "id": "node-embed-query"
      },
      {
        "parameters": {
          "method": "POST",
          "url": "={{ $vars.SUPABASE_URL }}/rest/v1/rpc/match_chunks",
          "sendHeaders": true,
          "headerParameters": {
            "parameters": [
              { "name": "apikey", "value": "={{ $vars.SUPABASE_SERVICE_KEY }}" },
              { "name": "Authorization", "value": "=Bearer {{ $vars.SUPABASE_SERVICE_KEY }}" },
              { "name": "Content-Type", "value": "application/json" }
            ]
          },
          "sendBody": true,
          "contentType": "raw",
          "rawContentType": "application/json",
          "body": "=JSON.stringify({ query_embedding: $('Embed Query').first().json.embedding, match_count: 5 })",
          "options": {}
        },
        "name": "Retrieve Knowledge",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [680, 300],
        "id": "node-retrieve"
      },
      {
        "parameters": {
          "operation": "insert",
          "table": "chatbot_messages",
          "columns": "session_id,role,content",
          "additionalFields": {}
        },
        "name": "Save user message",
        "type": "n8n-nodes-base.supabase",
        "typeVersion": 1,
        "position": [680, 300],
        "id": "node-save-user",
        "credentials": {
          "supabaseApi": {
            "name": "Supabase service role"
          }
        }
      },
      {
        "parameters": {
          "jsCode": "// Vervang YOUR_KEY_HERE met je daadwerkelijke Anthropic API key.\nconst apiKey = 'YOUR_KEY_HERE';\n\nconst requestBody = $('System Prompt').first().json.requestBody;\n\n// Retry-logica voor tijdelijke Anthropic-fouten (529 overloaded, 503, 429 rate limit, 5xx).\n// Wacht 1s, dan 3s, dan 8s tussen pogingen. Max 3 pogingen.\nconst MAX_ATTEMPTS = 3;\nconst BACKOFF_MS = [1000, 3000, 8000];\n\nfunction getStatusCode(err) {\n  if (err.httpCode) return Number(err.httpCode);\n  if (err.statusCode) return Number(err.statusCode);\n  if (err.response?.status) return Number(err.response.status);\n  if (err.cause?.response?.status) return Number(err.cause.response.status);\n  const match = String(err.message || '').match(/status code (\\d+)/i);\n  return match ? Number(match[1]) : null;\n}\n\nlet data;\nlet lastError;\nfor (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {\n  try {\n    data = await this.helpers.httpRequest({\n      method: 'POST',\n      url: 'https://api.anthropic.com/v1/messages',\n      headers: {\n        'x-api-key': apiKey,\n        'anthropic-version': '2023-06-01',\n        'content-type': 'application/json'\n      },\n      body: requestBody,\n      json: true\n    });\n    break;\n  } catch (err) {\n    lastError = err;\n    const status = getStatusCode(err);\n    if (status !== null && status >= 400 && status < 500 && status !== 429) {\n      throw err;\n    }\n    if (attempt < MAX_ATTEMPTS - 1) {\n      console.log(`Anthropic API poging ${attempt + 1} gefaald (status: ${status}). Opnieuw over ${BACKOFF_MS[attempt]}ms...`);\n      await new Promise(r => setTimeout(r, BACKOFF_MS[attempt]));\n    }\n  }\n}\nif (!data) throw lastError;\n\n// Anthropic geeft bij tool_use vaak GEEN afsluitende tekst. Voeg er zelf een toe\n// zodat de bot na lead_capture netjes afsluit ipv te zwijgen.\nconst hasText = data.content?.some(c => c.type === 'text' && c.text?.trim());\nconst leadTool = data.content?.find(c => c.type === 'tool_use' && c.name === 'lead_capture');\n\nif (leadTool && !hasText) {\n  data.content.push({\n    type: 'text',\n    text: 'Top, ik heb je gegevens genoteerd. Een van onze experts neemt binnenkort contact met je op. Heb je verder nog vragen waar ik je mee kan helpen?'\n  });\n}\n\nreturn [{ json: data }];"
        },
        "name": "Anthropic API",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [900, 300],
        "id": "node-anthropic"
      },
      {
        "parameters": {
          "conditions": {
            "string": [
              {
                "value1": "={{$json.stop_reason}}",
                "operation": "equal",
                "value2": "tool_use"
              }
            ]
          }
        },
        "name": "Is tool_use?",
        "type": "n8n-nodes-base.if",
        "typeVersion": 1,
        "position": [1120, 300],
        "id": "node-if-tool"
      },
      {
        "parameters": {
          "operation": "insert",
          "table": "chatbot_leads",
          "columns": "session_id,naam,contact_voorkeur,email,telefoon,beste_moment,context",
          "additionalFields": {}
        },
        "name": "Save lead",
        "type": "n8n-nodes-base.supabase",
        "typeVersion": 1,
        "position": [1340, 200],
        "id": "node-save-lead",
        "credentials": {
          "supabaseApi": {
            "name": "Supabase service role"
          }
        }
      },
      {
        "parameters": {
          "jsCode": "// Bouw de lead-melding email: lead-info + volledige chathistorie\nconst leadData = $('Anthropic API').first().json.content.find(c => c.type === 'tool_use' && c.name === 'lead_capture')?.input || {};\nconst sessionId = $('Webhook').first().json.body.session_id || '';\nconst blogSlug = $('Webhook').first().json.body.blog_slug || 'onbekend';\nconst history = $('Webhook').first().json.body.history || [];\nconst currentUserMessage = $('Webhook').first().json.body.user_message || '';\n\nfunction esc(s) {\n  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\n/g, '<br>');\n}\n\n// Alle messages = oude history + zojuist binnengekomen user message\nconst allMessages = [...history, { role: 'user', content: currentUserMessage }];\n\nconst historyHtml = allMessages.map(m => {\n  const role = m.role === 'user' ? 'Bezoeker' : 'AI assistent';\n  const color = m.role === 'user' ? '#1e40af' : '#4b5563';\n  const border = m.role === 'user' ? '' : 'padding-left: 12px; border-left: 2px solid #ec4899;';\n  return `<div style=\"color: ${color}; margin-bottom: 12px; ${border}\"><strong>${role}:</strong> ${esc(m.content)}</div>`;\n}).join('\\n');\n\nconst leadRows = [\n  `<strong>Naam:</strong> ${esc(leadData.naam || '-')}`,\n  `<strong>Voorkeur:</strong> ${esc(leadData.contact_voorkeur || '-')}`,\n  leadData.email ? `<strong>E-mail:</strong> <a href=\"mailto:${esc(leadData.email)}\">${esc(leadData.email)}</a>` : null,\n  leadData.telefoon ? `<strong>Telefoon:</strong> <a href=\"tel:${esc(leadData.telefoon)}\">${esc(leadData.telefoon)}</a>` : null,\n  leadData.beste_moment ? `<strong>Beste moment:</strong> ${esc(leadData.beste_moment)}` : null\n].filter(Boolean).join('<br>');\n\nconst html = `<!DOCTYPE html>\n<html><head><meta charset=\"UTF-8\"></head>\n<body style=\"font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #1a1a2e; max-width: 600px; margin: 0 auto; padding: 20px;\">\n  <h1 style=\"color: #ec4899; font-size: 20px;\">Nieuwe lead via AI subsidie assistent</h1>\n\n  <div style=\"background: #f9fafb; border-left: 4px solid #ec4899; padding: 16px; margin: 16px 0; border-radius: 4px;\">\n    ${leadRows}\n  </div>\n\n  <div style=\"background: #f9fafb; border-left: 4px solid #ec4899; padding: 16px; margin: 16px 0; border-radius: 4px;\">\n    <strong>Context (samengevat door bot):</strong><br>\n    ${esc(leadData.context || '-')}\n  </div>\n\n  <h2 style=\"color: #1a1a2e; font-size: 16px; margin-top: 24px;\">Volledige chathistorie</h2>\n  <div style=\"background: #ffffff; border: 1px solid #e5e7eb; border-radius: 4px; padding: 16px; font-size: 14px; line-height: 1.6;\">\n    ${historyHtml}\n  </div>\n\n  <div style=\"font-size: 12px; color: #6b7280; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;\">\n    Sessie-ID: ${esc(sessionId)}<br>\n    Blog: ${esc(blogSlug)}\n  </div>\n</body></html>`;\n\nconst subject = `Nieuwe lead via AI subsidie assistent: ${leadData.naam || 'naamloos'}`;\n\nreturn [{ json: { html, subject } }];"
        },
        "name": "Build Lead Email",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [1340, 100],
        "id": "node-build-email"
      },
      {
        "parameters": {
          "fromEmail": "letstalk@alpacaintegrations.ai",
          "toEmail": "rick@alpacaintegrations.ai",
          "subject": "={{ $json.subject }}",
          "emailFormat": "html",
          "html": "={{ $json.html }}",
          "options": {}
        },
        "name": "Send lead email",
        "type": "n8n-nodes-base.emailSend",
        "typeVersion": 2.1,
        "position": [1560, 200],
        "id": "node-email",
        "credentials": {
          "smtp": {
            "name": "Office 365 SMTP"
          }
        }
      },
      {
        "parameters": {
          "operation": "insert",
          "table": "chatbot_messages",
          "columns": "session_id,role,content,tool_use_json",
          "additionalFields": {}
        },
        "name": "Save assistant message",
        "type": "n8n-nodes-base.supabase",
        "typeVersion": 1,
        "position": [1560, 400],
        "id": "node-save-assistant",
        "credentials": {
          "supabaseApi": {
            "name": "Supabase service role"
          }
        }
      },
      {
        "parameters": {
          "respondWith": "json",
          "responseBody": "={ \"assistant_message\": $json.content && $json.content[0] && $json.content[0].text ? $json.content[0].text : '', \"tool_results\": $json.tool_results || [] }",
          "options": {}
        },
        "name": "Respond",
        "type": "n8n-nodes-base.respondToWebhook",
        "typeVersion": 1,
        "position": [1780, 300],
        "id": "node-respond"
      }
    ],
    "connections": {
      "Webhook": {
        "main": [[{ "node": "Embed Query", "type": "main", "index": 0 }]]
      },
      "Embed Query": {
        "main": [[{ "node": "Retrieve Knowledge", "type": "main", "index": 0 }]]
      },
      "Retrieve Knowledge": {
        "main": [[{ "node": "System Prompt", "type": "main", "index": 0 }]]
      },
      "System Prompt": {
        "main": [[{ "node": "Save user message", "type": "main", "index": 0 }]]
      },
      "Save user message": {
        "main": [[{ "node": "Anthropic API", "type": "main", "index": 0 }]]
      },
      "Anthropic API": {
        "main": [[{ "node": "Is tool_use?", "type": "main", "index": 0 }]]
      },
      "Is tool_use?": {
        "main": [
          [{ "node": "Save lead", "type": "main", "index": 0 }],
          [{ "node": "Save assistant message", "type": "main", "index": 0 }]
        ]
      },
      "Save lead": {
        "main": [[{ "node": "Build Lead Email", "type": "main", "index": 0 }]]
      },
      "Build Lead Email": {
        "main": [[{ "node": "Send lead email", "type": "main", "index": 0 }]]
      },
      "Send lead email": {
        "main": [[{ "node": "Save assistant message", "type": "main", "index": 0 }]]
      },
      "Save assistant message": {
        "main": [[{ "node": "Respond", "type": "main", "index": 0 }]]
      }
    },
    "settings": {
      "executionOrder": "v1"
    },
    "active": false,
    "versionId": "2"
  };

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(workflow, null, 2) + '\n', 'utf8');

  const sizeKB = (Buffer.byteLength(JSON.stringify(workflow), 'utf8') / 1024).toFixed(1);
  console.log(`n8n-workflow.json geschreven (${sizeKB} KB, system prompt inline)`);

  // Genereer ook een leesbaar .js bestand dat 1-op-1 in de n8n System Prompt
  // Code-node kan worden geplakt. Bevat exact dezelfde code als in de workflow,
  // alleen geformatteerd als plain JS (geen JSON-escapes).
  const nodeJsPath = path.join(ROOT, 'docs', 'chatbot', 'system-prompt-node.js');
  const codeNodeContent = workflow.nodes.find(n => n.name === 'System Prompt').parameters.jsCode;
  const header = '// VOLLEDIGE CODE VOOR DE "System Prompt" CODE-NODE IN N8N\n' +
                 '// Kopieer dit hele bestand (Cmd+A, Cmd+C) en plak in de Code-node\n' +
                 '// (vervang wat daar nu staat).\n' +
                 '// Gegenereerd door scripts/build-n8n-workflow.js — niet handmatig editen.\n\n';
  await fs.writeFile(nodeJsPath, header + codeNodeContent + '\n', 'utf8');
  const nodeKB = (Buffer.byteLength(codeNodeContent, 'utf8') / 1024).toFixed(1);
  console.log(`system-prompt-node.js geschreven (${nodeKB} KB)`);
}

build().catch(err => {
  console.error('Build mislukt:', err);
  process.exit(1);
});

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
          "jsCode": `// System prompt voor de AI subsidie assistent.\n// Pas hier de tekst aan als je de bot wil herprogrammeren.\nconst systemPrompt = ${promptJson};\n\n// Bouw het volledige Anthropic request-body hier zodat de HTTP Request\n// node geen JSON-string-escaping hoeft te doen voor de $() calls.\nconst history = $('Webhook').first().json.body.history || [];\nconst userMessage = $('Webhook').first().json.body.user_message;\n\nconst requestBody = {\n  model: 'claude-opus-4-7',\n  max_tokens: 1024,\n  system: [{\n    type: 'text',\n    text: systemPrompt,\n    cache_control: { type: 'ephemeral' }\n  }],\n  messages: history.concat([{ role: 'user', content: userMessage }]),\n  tools: [\n    {\n      name: 'lead_capture',\n      description: 'Sla contactgegevens op van een potentiele lead. Gebruik alleen nadat de gebruiker expliciet heeft aangegeven dat ze contact willen.',\n      input_schema: {\n        type: 'object',\n        properties: {\n          naam: { type: 'string' },\n          contact_voorkeur: { type: 'string', enum: ['email', 'telefoon'] },\n          email: { type: 'string' },\n          telefoon: { type: 'string' },\n          beste_moment: { type: 'string' },\n          context: { type: 'string' }\n        },\n        required: ['naam', 'contact_voorkeur', 'context']\n      }\n    },\n    {\n      name: 'verwijs_blog',\n      description: 'Verwijs de gebruiker naar een relevante blogpost voor meer informatie.',\n      input_schema: {\n        type: 'object',\n        properties: {\n          blog: { type: 'string', enum: ['pillar', 'voorwaarden', 'ai', 'automatisering', 'processen', 'tafelgasten', 'ecommerce', 'aanvragen'] }\n        },\n        required: ['blog']\n      }\n    }\n  ]\n};\n\nreturn [{ json: { systemPrompt, requestBody } }];`
        },
        "name": "System Prompt",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [460, 300],
        "id": "node-system-prompt"
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
          "jsCode": "// Vervang YOUR_KEY_HERE met je daadwerkelijke Anthropic API key.\nconst apiKey = 'YOUR_KEY_HERE';\n\nconst requestBody = $('System Prompt').first().json.requestBody;\n\n// Retry-logica voor tijdelijke Anthropic-fouten (overloaded, rate limit, etc).\n// Wacht 1s, dan 3s, dan 8s tussen pogingen. Max 3 pogingen.\nconst RETRYABLE_STATUS = [529, 503, 429, 502, 504];\nconst MAX_ATTEMPTS = 3;\nconst BACKOFF_MS = [1000, 3000, 8000];\n\nlet lastError;\nfor (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {\n  try {\n    const data = await this.helpers.httpRequest({\n      method: 'POST',\n      url: 'https://api.anthropic.com/v1/messages',\n      headers: {\n        'x-api-key': apiKey,\n        'anthropic-version': '2023-06-01',\n        'content-type': 'application/json'\n      },\n      body: requestBody,\n      json: true\n    });\n    return [{ json: data }];\n  } catch (err) {\n    lastError = err;\n    const status = err.httpCode || err.statusCode || err.response?.status || err.cause?.response?.status;\n    if (!RETRYABLE_STATUS.includes(Number(status))) {\n      throw err;\n    }\n    if (attempt < MAX_ATTEMPTS - 1) {\n      await new Promise(r => setTimeout(r, BACKOFF_MS[attempt]));\n    }\n  }\n}\n\nthrow lastError;"
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
          "fromEmail": "letstalk@alpacaintegrations.ai",
          "toEmail": "rick@alpacaintegrations.ai",
          "subject": "=Nieuwe lead via AI subsidie assistent: {{$json.naam}}",
          "emailFormat": "html",
          "html": "={{$json.email_html}}",
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

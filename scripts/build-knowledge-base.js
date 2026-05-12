// Chunkt alle kennisbank-bronnen (md, docx, pdf), embed elke chunk via OpenAI,
// en upload naar Supabase chatbot_knowledge tabel via REST API.
//
// Gebruik:
//   OPENAI_API_KEY=sk-... SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=eyJ... \
//     node scripts/build-knowledge-base.js
//
// Bronbestanden staan in: docs/chatbot/knowledge/
//   *.md  -> direct als tekst
//   *.docx -> extracted via mammoth
//   *.pdf  -> extracted via pdf-parse

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mammoth from 'mammoth';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const KNOWLEDGE_DIR = path.join(ROOT, 'docs', 'chatbot', 'knowledge');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// Normaliseer SUPABASE_URL: strip trailing slashes + /rest/v1 suffix.
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missende env vars. Run zo:');
  console.error('  OPENAI_API_KEY=sk-... SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=eyJ... node scripts/build-knowledge-base.js');
  process.exit(1);
}

// Verifieer dat de Supabase key een service_role is (niet anon)
try {
  const payload = JSON.parse(Buffer.from(SUPABASE_SERVICE_KEY.split('.')[1], 'base64').toString());
  console.log(`Supabase key role: ${payload.role}`);
  if (payload.role !== 'service_role') {
    console.error(`!! FOUT: SUPABASE_SERVICE_KEY heeft role "${payload.role}", maar moet "service_role" zijn.`);
    console.error('   Anon key heeft geen INSERT-rechten. Kopieer de service_role key uit Supabase:');
    console.error('   Dashboard → Project Settings → API → service_role secret');
    process.exit(1);
  }
} catch (e) {
  console.error('Kon SUPABASE_SERVICE_KEY niet decoden als JWT:', e.message);
  process.exit(1);
}

// Ongeveer 500 tokens per chunk = ~2000 karakters. Overlap 200 karakters
// voor context-continuiteit tussen chunks.
const CHUNK_SIZE = 2000;
const CHUNK_OVERLAP = 200;

async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const filename = path.basename(filePath);

  if (ext === '.md') {
    return await fs.readFile(filePath, 'utf8');
  }
  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
  if (ext === '.pdf') {
    const buffer = await fs.readFile(filePath);
    const result = await pdfParse(buffer);
    return result.text;
  }
  throw new Error(`Unsupported extension: ${ext} for ${filename}`);
}

function splitIntoChunks(text, source) {
  // Probeer eerst te splitsen op natuurlijke grenzen: dubbele newlines (paragrafen).
  // Dan combineer paragrafen tot we bij CHUNK_SIZE komen.
  const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  const chunks = [];
  let current = '';
  let currentTitle = null;

  for (const para of paragraphs) {
    // Detect kop: regel die begint met # of die kort is en in caps
    const titleMatch = para.match(/^#+\s+(.+)$/);
    if (titleMatch) {
      currentTitle = titleMatch[1].trim();
    }

    if (current.length + para.length + 2 < CHUNK_SIZE) {
      current += (current ? '\n\n' : '') + para;
    } else {
      if (current) {
        chunks.push({ source, title: currentTitle, content: current });
      }
      // Start nieuwe chunk met overlap van laatste deel
      const overlapStart = Math.max(0, current.length - CHUNK_OVERLAP);
      current = current.slice(overlapStart) + (current ? '\n\n' : '') + para;
    }
  }
  if (current.trim()) {
    chunks.push({ source, title: currentTitle, content: current });
  }

  return chunks;
}

async function embed(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-3-small'
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI embedding error ${response.status}: ${errorText}`);
  }
  const data = await response.json();
  return data.data[0].embedding;
}

async function clearKnowledgeTable() {
  console.log('  Bestaande kennisbank wissen...');
  // PostgREST vereist een where-clause voor DELETE; "id is not null" matcht alles.
  const response = await fetch(`${SUPABASE_URL}/rest/v1/chatbot_knowledge?id=not.is.null`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': 'return=minimal'
    }
  });
  if (!response.ok) {
    const text = await response.text();
    console.log(`  Wissen overslaan (${response.status}): ${text || '(leeg, geen probleem als tabel al leeg was)'}`);
    return;
  }
}

async function insertChunk({ source, title, content, embedding, metadata }) {
  const url = `${SUPABASE_URL}/rest/v1/chatbot_knowledge`;
  const body = JSON.stringify({ source, title, content, embedding, metadata });
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body
  });
  if (!response.ok) {
    const text = await response.text();
    console.error('\n--- Debug info ---');
    console.error('URL:', url);
    console.error('Status:', response.status, response.statusText);
    console.error('Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
    console.error('Response body:', text || '(leeg)');
    console.error('Body size sent:', body.length, 'chars');
    console.error('Service key length:', SUPABASE_SERVICE_KEY.length, 'chars');
    console.error('Service key starts with:', SUPABASE_SERVICE_KEY.substring(0, 10) + '...');
    throw new Error(`Supabase insert error ${response.status}: ${text}`);
  }
}

async function main() {
  console.log('Knowledge base building...\n');

  const files = (await fs.readdir(KNOWLEDGE_DIR))
    .filter(f => /\.(md|docx|pdf)$/i.test(f));

  console.log(`${files.length} bronbestanden gevonden\n`);

  // Eerst alles chunken (zonder embedden) voor token-count voorvertoning.
  const allChunks = [];
  for (const file of files) {
    const filePath = path.join(KNOWLEDGE_DIR, file);
    console.log(`Extracten: ${file}`);
    const text = await extractText(filePath);
    const chunks = splitIntoChunks(text, file);
    allChunks.push(...chunks);
    console.log(`  ${chunks.length} chunks (${text.length} chars)`);
  }

  const totalChars = allChunks.reduce((sum, c) => sum + c.content.length, 0);
  const estTokens = Math.round(totalChars / 4);
  console.log(`\nTotaal: ${allChunks.length} chunks, ~${estTokens.toLocaleString()} tokens`);
  console.log(`Geschatte OpenAI embedding kosten: $${(estTokens / 1_000_000 * 0.02).toFixed(4)}\n`);

  // Wis oude data voor schone re-upload
  await clearKnowledgeTable();

  // Embed + insert per chunk
  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i];
    process.stdout.write(`  [${i + 1}/${allChunks.length}] embedden + insert: ${chunk.source} :: ${chunk.title || '(no title)'} `);
    try {
      const embedding = await embed(chunk.content);
      await insertChunk({
        source: chunk.source,
        title: chunk.title,
        content: chunk.content,
        embedding,
        metadata: { length: chunk.content.length }
      });
      console.log('OK');
    } catch (err) {
      console.error('\n  FOUT:', err.message);
      throw err;
    }
  }

  console.log(`\nKlaar! ${allChunks.length} chunks geupload naar chatbot_knowledge.`);
}

main().catch(err => {
  console.error('Build mislukt:', err);
  process.exit(1);
});

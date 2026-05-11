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

  const cleaned = cleanText(rawMd);

  const renamed = cleaned.replace(/subsidie-assistent/g, 'AI subsidie assistent');

  const signals = findAiSignals(renamed);
  reportSignals(signals, blog.sourceFile);

  const linkedMd = mapPlaceholderLinks(renamed);

  let html = marked.parse(linkedMd);

  html = markExternalLinks(html);

  html = injectDiagrams(html, blog.diagrams);

  html = injectVideoPlaceholder(html, blog.embedsVideoPlaceholder);

  html = html.replace(/<h1[^>]*>[\s\S]*?<\/h1>/, '');

  const schemaBlocks = generateSchemas(blog).join('\n');

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

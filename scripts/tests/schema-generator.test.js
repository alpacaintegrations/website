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

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

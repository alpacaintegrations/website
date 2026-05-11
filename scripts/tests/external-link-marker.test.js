import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { markExternalLinks } from '../external-link-marker.js';

describe('markExternalLinks', () => {
  test('voegt target=_blank toe aan externe http link', () => {
    const html = '<a href="https://www.rvo.nl/mit">RVO</a>';
    const out = markExternalLinks(html);
    assert.ok(out.includes('target="_blank"'));
    assert.ok(out.includes('rel="noopener"'));
  });

  test('laat interne /blog/ link ongemoeid', () => {
    const html = '<a href="/blog/sprintsubsidie-mkb-limburg-gids">pillar</a>';
    const out = markExternalLinks(html);
    assert.ok(!out.includes('target="_blank"'));
  });

  test('laat anchor link #chatbot ongemoeid', () => {
    const html = '<a href="#chatbot">chat</a>';
    const out = markExternalLinks(html);
    assert.ok(!out.includes('target="_blank"'));
  });

  test('voegt geen dubbele target=_blank toe', () => {
    const html = '<a href="https://example.com" target="_blank">x</a>';
    const out = markExternalLinks(html);
    const matches = out.match(/target="_blank"/g);
    assert.equal(matches.length, 1);
  });

  test('werkt op meerdere links in één string', () => {
    const html = '<a href="https://a.com">a</a> en <a href="/blog/x">b</a> en <a href="https://c.com">c</a>';
    const out = markExternalLinks(html);
    const matches = out.match(/target="_blank"/g) || [];
    assert.equal(matches.length, 2);
  });

  test('herkent mailto: als extern', () => {
    const html = '<a href="mailto:test@example.com">mail</a>';
    const out = markExternalLinks(html);
    assert.ok(out.includes('target="_blank"'));
  });
});

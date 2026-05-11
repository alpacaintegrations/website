import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { findAiSignals } from '../ai-signals-check.js';

describe('findAiSignals', () => {
  test('detects "Niet X, maar Y" patroon', () => {
    const text = 'Niet alleen handig, maar ook snel.';
    const signals = findAiSignals(text);
    assert.ok(signals.some(s => s.pattern === 'niet-x-maar-y'));
  });

  test('detects "Het korte antwoord:" opener', () => {
    const text = 'Het korte antwoord: ja.';
    const signals = findAiSignals(text);
    assert.ok(signals.some(s => s.pattern === 'korte-antwoord-opener'));
  });

  test('detects "Even kort" opener', () => {
    const text = 'Even kort voor wie de regeling niet kent.';
    const signals = findAiSignals(text);
    assert.ok(signals.some(s => s.pattern === 'even-kort-opener'));
  });

  test('detects "Het cruciale punt:" marker', () => {
    const text = 'Het cruciale punt: dit moet je weten.';
    const signals = findAiSignals(text);
    assert.ok(signals.some(s => s.pattern === 'cruciale-punt-marker'));
  });

  test('detects em-dash for review', () => {
    const text = 'Een zin—met em-dash.';
    const signals = findAiSignals(text);
    assert.ok(signals.some(s => s.pattern === 'em-dash'));
  });

  test('returns line number per match', () => {
    const text = 'regel een\nregel twee\nHet korte antwoord: hier.';
    const signals = findAiSignals(text);
    const match = signals.find(s => s.pattern === 'korte-antwoord-opener');
    assert.equal(match.line, 3);
  });

  test('returns empty array for clean text', () => {
    const text = 'Een gewone zin zonder verdachte patronen aanwezig.';
    const signals = findAiSignals(text);
    assert.deepEqual(signals, []);
  });

  test('reports match excerpt for context', () => {
    const text = 'Het korte antwoord: ja inderdaad.';
    const signals = findAiSignals(text);
    const match = signals[0];
    assert.ok(match.excerpt.includes('Het korte antwoord'));
  });
});

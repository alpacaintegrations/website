import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { cleanText } from '../clean-text.js';

describe('cleanText', () => {
  test('strips zero-width space U+200B', () => {
    const input = 'hello​world';
    assert.equal(cleanText(input), 'helloworld');
  });

  test('strips zero-width non-joiner U+200C', () => {
    assert.equal(cleanText('a‌b'), 'ab');
  });

  test('strips zero-width joiner U+200D', () => {
    assert.equal(cleanText('a‍b'), 'ab');
  });

  test('strips BOM U+FEFF', () => {
    assert.equal(cleanText('﻿hello'), 'hello');
  });

  test('strips word joiner U+2060', () => {
    assert.equal(cleanText('a⁠b'), 'ab');
  });

  test('strips soft hyphen U+00AD', () => {
    assert.equal(cleanText('a­b'), 'ab');
  });

  test('replaces non-breaking space U+00A0 with normal space', () => {
    assert.equal(cleanText('a b'), 'a b');
  });

  test('replaces left double quote U+201C with straight quote', () => {
    assert.equal(cleanText('“hello”'), '"hello"');
  });

  test('replaces left single quote U+2018 with straight quote', () => {
    assert.equal(cleanText('‘hello’'), "'hello'");
  });

  test('replaces ellipsis U+2026 with three dots', () => {
    assert.equal(cleanText('wait…'), 'wait...');
  });

  test('preserves em-dash U+2014 unchanged (flagged separately)', () => {
    assert.equal(cleanText('a—b'), 'a—b');
  });

  test('leaves clean text untouched', () => {
    const clean = 'Een normale zin zonder rare karakters.';
    assert.equal(cleanText(clean), clean);
  });

  test('handles empty string', () => {
    assert.equal(cleanText(''), '');
  });

  test('handles multiple invisible chars in one string', () => {
    const input = '﻿hello​world‌!';
    assert.equal(cleanText(input), 'helloworld!');
  });
});

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const storage = new Map();
globalThis.localStorage = {
  getItem: (k) => storage.has(k) ? storage.get(k) : null,
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear()
};
// Node 24 heeft crypto.randomUUID() native beschikbaar, geen mock nodig.

const { createState } = await import('../../js/chatbot/state.js');

describe('chatbot state', () => {
  beforeEach(() => {
    storage.clear();
  });

  test('genereert nieuwe session_id bij eerste gebruik', () => {
    const s = createState();
    const id = s.getSessionId();
    assert.match(id, /^[0-9a-f-]+$/);
  });

  test('hergebruikt session_id binnen 24h', () => {
    const s1 = createState();
    const id1 = s1.getSessionId();
    const s2 = createState();
    const id2 = s2.getSessionId();
    assert.equal(id1, id2);
  });

  test('genereert nieuwe session_id na expiry', () => {
    const s1 = createState();
    const id1 = s1.getSessionId();
    const past = Date.now() - 25 * 60 * 60 * 1000;
    storage.set('chatbot_session_started', String(past));
    const s2 = createState();
    const id2 = s2.getSessionId();
    assert.notEqual(id1, id2);
  });

  test('start met lege messages array', () => {
    const s = createState();
    assert.deepEqual(s.getMessages(), []);
  });

  test('voegt user message toe', () => {
    const s = createState();
    s.addMessage('user', 'hallo');
    const msgs = s.getMessages();
    assert.equal(msgs.length, 1);
    assert.equal(msgs[0].role, 'user');
    assert.equal(msgs[0].content, 'hallo');
  });

  test('messages persisteren over instances', () => {
    const s1 = createState();
    s1.addMessage('user', 'eerste');
    s1.addMessage('assistant', 'antwoord');
    const s2 = createState();
    assert.equal(s2.getMessages().length, 2);
    assert.equal(s2.getMessages()[1].content, 'antwoord');
  });

  test('reset() wist sessie en berichten', () => {
    const s = createState();
    s.addMessage('user', 'x');
    s.reset();
    assert.deepEqual(s.getMessages(), []);
    assert.equal(storage.get('chatbot_session_id'), undefined);
  });

  test('addMessage bewaart timestamp', () => {
    const s = createState();
    s.addMessage('user', 'hi');
    const m = s.getMessages()[0];
    assert.ok(m.timestamp);
    assert.ok(new Date(m.timestamp).getTime() > 0);
  });
});

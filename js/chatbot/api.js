import { WEBHOOK_URL, ENABLE_MOCK } from './config.js';
import { mockSendMessage } from './mock.js';

export async function sendMessage(opts) {
  if (ENABLE_MOCK) return mockSendMessage(opts);

  if (!WEBHOOK_URL) {
    throw new Error('Chatbot WEBHOOK_URL niet geconfigureerd. Zie SETUP.md stap 7.');
  }

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: opts.sessionId,
      blog_slug: opts.blogSlug,
      user_message: opts.userMessage,
      history: opts.history.map(m => ({ role: m.role, content: m.content }))
    })
  });

  if (!response.ok) {
    throw new Error(`Chatbot API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

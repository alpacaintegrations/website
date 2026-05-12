import { createState } from './state.js';
import { sendMessage } from './api.js';
import {
  createFab, createPanel, appendMessage, showTyping, hideTyping,
  showPanel, hidePanel, buildCtaBlock
} from './ui.js';
import { WELCOME_MESSAGE } from './config.js';

function getBlogSlug() {
  const m = window.location.pathname.match(/\/blog\/([^/.]+)/);
  return m ? m[1] : null;
}

function init() {
  const state = createState();
  const slug = getBlogSlug();

  let fab, panel;

  function openPanel() {
    if (fab) fab.setAttribute('hidden', '');
    showPanel(panel);

    const messagesContainer = panel.querySelector('.chatbot-messages');
    if (messagesContainer.children.length === 0) {
      const existing = state.getMessages();
      if (existing.length === 0) {
        appendMessage(panel, 'assistant', WELCOME_MESSAGE, handleSend);
      } else {
        existing.forEach(m => appendMessage(panel, m.role, m.content, handleSend));
      }
    }
    panel.querySelector('.chatbot-input').focus();
  }

  function closePanel() {
    hidePanel(panel);
    if (fab) fab.removeAttribute('hidden');
  }

  async function handleSend(text) {
    appendMessage(panel, 'user', text);
    state.addMessage('user', text);
    showTyping(panel);

    try {
      const result = await sendMessage({
        sessionId: state.getSessionId(),
        blogSlug: slug,
        userMessage: text,
        history: state.getMessages().slice(0, -1)
      });
      hideTyping(panel);
      appendMessage(panel, 'assistant', result.assistant_message, handleSend);
      state.addMessage('assistant', result.assistant_message);
    } catch (err) {
      hideTyping(panel);
      appendMessage(panel, 'assistant',
        'Sorry, er ging iets mis. Probeer het zo nog eens — of stuur een mailtje naar [letstalk@alpacaintegrations.ai](mailto:letstalk@alpacaintegrations.ai).',
        handleSend
      );
      console.error('Chatbot error:', err);
    }
  }

  fab = createFab(openPanel);
  panel = createPanel({ onClose: closePanel, onSend: handleSend });

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  document.querySelectorAll('[data-chatbot-cta-mount]').forEach(mount => {
    mount.replaceWith(buildCtaBlock(openPanel));
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

import {
  FAB_TEXT_LONG, FAB_TEXT_SHORT,
  CTA_TITLE, CTA_SUBTITLE, CTA_BUTTON
} from './config.js';

// Robot-hoofd SVG — duidelijker signaal dan een emoji
const ROBOT_SVG = `<svg class="chatbot-robot" viewBox="0 0 32 32" width="28" height="28" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="16" y1="3" x2="16" y2="7"/>
  <circle cx="16" cy="2" r="1.2" fill="currentColor"/>
  <rect x="5" y="9" width="22" height="17" rx="3"/>
  <circle cx="11" cy="16" r="1.8" fill="currentColor" stroke="none"/>
  <circle cx="21" cy="16" r="1.8" fill="currentColor" stroke="none"/>
  <line x1="12" y1="21" x2="20" y2="21"/>
  <line x1="3" y1="14" x2="5" y2="14"/>
  <line x1="27" y1="14" x2="29" y2="14"/>
</svg>`;

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function createFab(onClick) {
  const btn = document.createElement('button');
  btn.className = 'chatbot-fab';
  btn.setAttribute('aria-label', 'Open chat met AI subsidie assistent');
  btn.type = 'button';
  btn.innerHTML = `
    ${ROBOT_SVG}
    <span class="chatbot-fab-text-long">${escapeHtml(FAB_TEXT_LONG)}</span>
    <span class="chatbot-fab-text-short">${escapeHtml(FAB_TEXT_SHORT)}</span>
  `;
  btn.addEventListener('click', onClick);
  return btn;
}

export function createPanel({ onClose, onSend }) {
  const panel = document.createElement('div');
  panel.className = 'chatbot-panel';
  panel.setAttribute('hidden', '');
  panel.innerHTML = `
    <div class="chatbot-header">
      <span>AI subsidie assistent</span>
      <button class="chatbot-close" type="button" aria-label="Sluit chat">✕</button>
    </div>
    <div class="chatbot-messages" role="log" aria-live="polite"></div>
    <form class="chatbot-input-wrap">
      <textarea class="chatbot-input" rows="1" placeholder="Typ je bericht..." aria-label="Typ je bericht"></textarea>
      <button type="submit" class="chatbot-send" aria-label="Verstuur">→</button>
    </form>
  `;

  panel.querySelector('.chatbot-close').addEventListener('click', onClose);
  const form = panel.querySelector('form');
  const textarea = panel.querySelector('.chatbot-input');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = textarea.value.trim();
    if (text) {
      onSend(text);
      textarea.value = '';
    }
  });
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  return panel;
}

function renderInline(text) {
  return text
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (full, txt, url) => {
      const isInternal = url.startsWith('/') || url.startsWith('#');
      const attrs = isInternal ? '' : ' target="_blank" rel="noopener"';
      return `<a href="${url}"${attrs}>${txt}</a>`;
    });
}

function extractQuickReplies(content) {
  const match = content.match(/\[QUICK_REPLIES:\s*([^\]]+)\]/);
  if (!match) return { text: content, replies: null };
  const replies = match[1].split('|').map(r => r.trim()).filter(Boolean);
  const text = content.replace(match[0], '').trim();
  return { text, replies };
}

function renderMessage(content) {
  const escaped = escapeHtml(content);
  const lines = escaped.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    if (/^[-*]\s+/.test(lines[i])) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(`<li>${renderInline(lines[i].replace(/^[-*]\s+/, ''))}</li>`);
        i++;
      }
      blocks.push(`<ul>${items.join('')}</ul>`);
    } else {
      const paraLines = [];
      while (i < lines.length && !/^[-*]\s+/.test(lines[i])) {
        paraLines.push(renderInline(lines[i]));
        i++;
      }
      if (paraLines.length > 0) {
        blocks.push(paraLines.join('<br>'));
      }
    }
  }

  return blocks.join('');
}

export function appendMessage(panel, role, content, onQuickReply) {
  const messages = panel.querySelector('.chatbot-messages');
  const div = document.createElement('div');
  div.className = `chatbot-msg chatbot-msg-${role}`;

  // Strip quick-replies markup uit assistant berichten; toon ze als knoppen
  let textPart = content;
  let replies = null;
  if (role === 'assistant') {
    const extracted = extractQuickReplies(content);
    textPart = extracted.text;
    replies = extracted.replies;
  }

  div.innerHTML = renderMessage(textPart);
  messages.appendChild(div);

  if (replies && replies.length > 0 && onQuickReply) {
    const wrap = document.createElement('div');
    wrap.className = 'chatbot-quick-replies';
    for (const r of replies) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chatbot-quick-reply-btn';
      btn.textContent = r;
      btn.addEventListener('click', () => {
        // Verwijder de knoppen na klik (eenmalig)
        wrap.remove();
        onQuickReply(r);
      });
      wrap.appendChild(btn);
    }
    messages.appendChild(wrap);
  }

  messages.scrollTop = messages.scrollHeight;
}

export function showTyping(panel) {
  const messages = panel.querySelector('.chatbot-messages');
  const t = document.createElement('div');
  t.className = 'chatbot-typing';
  t.setAttribute('data-typing-indicator', '');
  t.innerHTML = '<span></span><span></span><span></span>';
  messages.appendChild(t);
  messages.scrollTop = messages.scrollHeight;
}

export function hideTyping(panel) {
  const t = panel.querySelector('[data-typing-indicator]');
  if (t) t.remove();
}

export function showPanel(panel) { panel.removeAttribute('hidden'); }
export function hidePanel(panel) { panel.setAttribute('hidden', ''); }

export function buildCtaBlock(onClick) {
  const block = document.createElement('div');
  block.className = 'chatbot-cta-block';
  block.innerHTML = `
    <p><strong>${escapeHtml(CTA_TITLE)}</strong><br>${escapeHtml(CTA_SUBTITLE)}</p>
    <div class="chatbot-cta-actions">
      <button class="chatbot-cta-btn" type="button">${escapeHtml(CTA_BUTTON)}</button>
      <p class="chatbot-cta-alt">Of liever direct contact?
        <a href="https://outlook.office365.com/book/Alpacaintegrations1@alpacaintegrations.ai/" target="_blank" rel="noopener">Plan een gesprek</a>
        of <a href="mailto:letstalk@alpacaintegrations.ai">stuur een mailtje</a>.
      </p>
    </div>
  `;
  block.querySelector('.chatbot-cta-btn').addEventListener('click', onClick);
  return block;
}

const SESSION_KEY = 'chatbot_session_id';
const STARTED_KEY = 'chatbot_session_started';
const MESSAGES_KEY = 'chatbot_messages';
const EXPIRY_MS = 24 * 60 * 60 * 1000;

function isExpired() {
  const started = parseInt(localStorage.getItem(STARTED_KEY) || '0', 10);
  if (!started) return false;
  return (Date.now() - started) > EXPIRY_MS;
}

export function createState() {
  if (isExpired()) {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(STARTED_KEY);
    localStorage.removeItem(MESSAGES_KEY);
  }

  function getSessionId() {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
      localStorage.setItem(STARTED_KEY, String(Date.now()));
    }
    return id;
  }

  function getMessages() {
    const raw = localStorage.getItem(MESSAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  function addMessage(role, content) {
    const msgs = getMessages();
    msgs.push({ role, content, timestamp: new Date().toISOString() });
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));
  }

  function reset() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(STARTED_KEY);
    localStorage.removeItem(MESSAGES_KEY);
  }

  return { getSessionId, getMessages, addMessage, reset };
}

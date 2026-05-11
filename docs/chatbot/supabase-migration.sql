-- Chatbot widget data: sessions, messages, leads
-- Voer eenmalig uit in Supabase SQL editor

CREATE TABLE IF NOT EXISTS chatbot_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  blog_slug text,
  user_agent text
);

CREATE TABLE IF NOT EXISTS chatbot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES chatbot_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  tool_use_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chatbot_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chatbot_sessions(id),
  naam text NOT NULL,
  contact_voorkeur text NOT NULL CHECK (contact_voorkeur IN ('email', 'telefoon')),
  email text,
  telefoon text,
  beste_moment text,
  context text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_session ON chatbot_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_leads_created ON chatbot_leads(created_at DESC);

-- RLS uitgeschakeld voor service role; n8n draait met service role key
ALTER TABLE chatbot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_leads   ENABLE ROW LEVEL SECURITY;

-- Service role bypasst RLS automatisch, geen public policies nodig

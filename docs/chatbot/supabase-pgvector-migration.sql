-- Chatbot knowledge base via pgvector retrieval
-- Voer eenmalig uit in Supabase SQL editor

-- 1. Enable pgvector extension (1 keer per project)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Tabel voor de chunked kennisbank met OpenAI text-embedding-3-small (1536 dim)
CREATE TABLE IF NOT EXISTS chatbot_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  title text,
  content text NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Index voor snelle similarity-search (cosine distance via ivfflat)
CREATE INDEX IF NOT EXISTS chatbot_knowledge_embedding_idx
  ON chatbot_knowledge
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

ALTER TABLE chatbot_knowledge ENABLE ROW LEVEL SECURITY;

-- 4. RPC: match_chunks(query_embedding, match_count) — geeft top-K chunks terug
-- gesorteerd op cosine similarity. Aanroepbaar via Supabase RPC vanuit n8n.
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(1536),
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  source text,
  title text,
  content text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    chatbot_knowledge.id,
    chatbot_knowledge.source,
    chatbot_knowledge.title,
    chatbot_knowledge.content,
    1 - (chatbot_knowledge.embedding <=> query_embedding) AS similarity
  FROM chatbot_knowledge
  ORDER BY chatbot_knowledge.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

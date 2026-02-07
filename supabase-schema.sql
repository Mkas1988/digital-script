-- Digitales Skript - Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sections table (extracted chapters/sections from PDFs)
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  page_start INTEGER,
  page_end INTEGER
);

-- Annotations table (highlights, notes, bookmarks)
CREATE TABLE IF NOT EXISTS annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('highlight', 'note', 'bookmark')),
  content TEXT,
  text_selection TEXT,
  position_start INTEGER,
  position_end INTEGER,
  color TEXT DEFAULT '#ffeb3b',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  difficulty INTEGER DEFAULT 0,
  next_review TIMESTAMPTZ,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progress table (reading progress tracking)
CREATE TABLE IF NOT EXISTS progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  time_spent_seconds INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, section_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_sections_document_id ON sections(document_id);
CREATE INDEX IF NOT EXISTS idx_annotations_user_id ON annotations(user_id);
CREATE INDEX IF NOT EXISTS idx_annotations_section_id ON annotations(section_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_document_id ON flashcards(document_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_document_id ON progress(document_id);

-- Row Level Security (RLS) Policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- Documents policies
CREATE POLICY "Users can view their own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON documents FOR DELETE
  USING (auth.uid() = user_id);

-- Sections policies (accessible via document ownership)
CREATE POLICY "Users can view sections of their documents"
  ON sections FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = sections.document_id
    AND documents.user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage sections"
  ON sections FOR ALL
  USING (true)
  WITH CHECK (true);

-- Annotations policies
CREATE POLICY "Users can view their own annotations"
  ON annotations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own annotations"
  ON annotations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own annotations"
  ON annotations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own annotations"
  ON annotations FOR DELETE
  USING (auth.uid() = user_id);

-- Flashcards policies
CREATE POLICY "Users can view their own flashcards"
  ON flashcards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own flashcards"
  ON flashcards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcards"
  ON flashcards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flashcards"
  ON flashcards FOR DELETE
  USING (auth.uid() = user_id);

-- Progress policies
CREATE POLICY "Users can view their own progress"
  ON progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload their own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Service role has full access for PDF parsing
CREATE POLICY "Service role full access"
  ON storage.objects FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

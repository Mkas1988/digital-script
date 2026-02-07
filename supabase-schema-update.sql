-- ===========================================
-- PREMIUM DIGITALES SKRIPT - DATABASE UPDATE
-- Run this SQL in your Supabase SQL Editor
-- ===========================================

-- 1. Add new columns to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS total_pages integer;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS has_images boolean DEFAULT false;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_summary text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS processing_status text DEFAULT 'pending';

-- 2. Add new columns to sections table
ALTER TABLE sections ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]';
ALTER TABLE sections ADD COLUMN IF NOT EXISTS ai_summary text;
ALTER TABLE sections ADD COLUMN IF NOT EXISTS formatting jsonb DEFAULT '{}';

-- 3. Create document_images table for extracted images
CREATE TABLE IF NOT EXISTS document_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  section_id uuid REFERENCES sections(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  alt_text text,
  caption text,
  page_number integer,
  position_in_section integer,
  width integer,
  height integer,
  created_at timestamptz DEFAULT now()
);

-- 4. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_document_images_document ON document_images(document_id);
CREATE INDEX IF NOT EXISTS idx_document_images_section ON document_images(section_id);
CREATE INDEX IF NOT EXISTS idx_documents_processing_status ON documents(processing_status);

-- 5. Enable RLS for document_images
ALTER TABLE document_images ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for document_images
CREATE POLICY "Users can view their document images" ON document_images
  FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their document images" ON document_images
  FOR INSERT
  WITH CHECK (
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their document images" ON document_images
  FOR DELETE
  USING (
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()
    )
  );

-- 7. Create storage bucket for document images (run in Storage settings)
-- Note: Create a bucket named 'document-images' with public access in Supabase Dashboard
-- Storage > Create new bucket > Name: document-images > Public: Yes

-- ===========================================
-- VERIFICATION QUERY
-- Run this to verify the schema was updated
-- ===========================================
-- SELECT
--   table_name,
--   column_name,
--   data_type
-- FROM information_schema.columns
-- WHERE table_name IN ('documents', 'sections', 'document_images')
-- ORDER BY table_name, ordinal_position;

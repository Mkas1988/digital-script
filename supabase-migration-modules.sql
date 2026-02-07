-- Modul-Management System - Database Migration
-- Run this in your Supabase SQL Editor after the initial schema

-- ============================================
-- 1. MODULES (Kursmodule als Ordner)
-- ============================================
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  sequence_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. MODULE_MEMBERS (Rollen-System)
-- ============================================
CREATE TABLE IF NOT EXISTS module_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module_id, user_id)
);

-- ============================================
-- 3. MODULE_DOCUMENTS (Zuordnung Modul -> Dokumente)
-- ============================================
CREATE TABLE IF NOT EXISTS module_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  sequence_order INTEGER DEFAULT 0,
  UNIQUE(module_id, document_id)
);

-- ============================================
-- 4. LEARNING_UNITS (Lerneinheiten)
-- ============================================
CREATE TABLE IF NOT EXISTS learning_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  learning_objectives TEXT[],
  sequence_order INTEGER DEFAULT 0,
  estimated_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. LEARNING_UNIT_SECTIONS (Zuordnung Lerneinheit -> Sektionen)
-- ============================================
CREATE TABLE IF NOT EXISTS learning_unit_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  learning_unit_id UUID NOT NULL REFERENCES learning_units(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  sequence_order INTEGER DEFAULT 0,
  UNIQUE(learning_unit_id, section_id)
);

-- ============================================
-- 6. EXERCISE_SOLUTIONS (Aufgaben-Losungen Verknupfung)
-- ============================================
CREATE TABLE IF NOT EXISTS exercise_solutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  solution_section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exercise_section_id, solution_section_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_modules_owner_id ON modules(owner_id);
CREATE INDEX IF NOT EXISTS idx_modules_is_published ON modules(is_published);
CREATE INDEX IF NOT EXISTS idx_module_members_module_id ON module_members(module_id);
CREATE INDEX IF NOT EXISTS idx_module_members_user_id ON module_members(user_id);
CREATE INDEX IF NOT EXISTS idx_module_documents_module_id ON module_documents(module_id);
CREATE INDEX IF NOT EXISTS idx_module_documents_document_id ON module_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_learning_units_document_id ON learning_units(document_id);
CREATE INDEX IF NOT EXISTS idx_learning_unit_sections_learning_unit_id ON learning_unit_sections(learning_unit_id);
CREATE INDEX IF NOT EXISTS idx_learning_unit_sections_section_id ON learning_unit_sections(section_id);
CREATE INDEX IF NOT EXISTS idx_exercise_solutions_exercise ON exercise_solutions(exercise_section_id);
CREATE INDEX IF NOT EXISTS idx_exercise_solutions_solution ON exercise_solutions(solution_section_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_unit_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_solutions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- MODULES POLICIES
-- ============================================

-- Users can view modules they own or are members of
CREATE POLICY "Users can view accessible modules"
  ON modules FOR SELECT
  USING (
    owner_id = auth.uid()
    OR id IN (
      SELECT module_id FROM module_members WHERE user_id = auth.uid()
    )
  );

-- Users can create their own modules
CREATE POLICY "Users can create modules"
  ON modules FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Owners and editors can update modules
CREATE POLICY "Owners and editors can update modules"
  ON modules FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR id IN (
      SELECT module_id FROM module_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

-- Only owners can delete modules
CREATE POLICY "Only owners can delete modules"
  ON modules FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================
-- MODULE_MEMBERS POLICIES
-- ============================================

-- Users can view members of modules they have access to
CREATE POLICY "Users can view module members"
  ON module_members FOR SELECT
  USING (
    module_id IN (
      SELECT id FROM modules WHERE owner_id = auth.uid()
      UNION
      SELECT module_id FROM module_members WHERE user_id = auth.uid()
    )
  );

-- Only owners can add members
CREATE POLICY "Owners can add members"
  ON module_members FOR INSERT
  WITH CHECK (
    module_id IN (
      SELECT id FROM modules WHERE owner_id = auth.uid()
    )
  );

-- Only owners can update member roles
CREATE POLICY "Owners can update members"
  ON module_members FOR UPDATE
  USING (
    module_id IN (
      SELECT id FROM modules WHERE owner_id = auth.uid()
    )
  );

-- Only owners can remove members
CREATE POLICY "Owners can remove members"
  ON module_members FOR DELETE
  USING (
    module_id IN (
      SELECT id FROM modules WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- MODULE_DOCUMENTS POLICIES
-- ============================================

-- Users can view documents in modules they have access to
CREATE POLICY "Users can view module documents"
  ON module_documents FOR SELECT
  USING (
    module_id IN (
      SELECT id FROM modules WHERE owner_id = auth.uid()
      UNION
      SELECT module_id FROM module_members WHERE user_id = auth.uid()
    )
  );

-- Owners and editors can add documents
CREATE POLICY "Editors can add documents"
  ON module_documents FOR INSERT
  WITH CHECK (
    module_id IN (
      SELECT id FROM modules WHERE owner_id = auth.uid()
      UNION
      SELECT module_id FROM module_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

-- Owners and editors can update document order
CREATE POLICY "Editors can update document order"
  ON module_documents FOR UPDATE
  USING (
    module_id IN (
      SELECT id FROM modules WHERE owner_id = auth.uid()
      UNION
      SELECT module_id FROM module_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

-- Owners and editors can remove documents
CREATE POLICY "Editors can remove documents"
  ON module_documents FOR DELETE
  USING (
    module_id IN (
      SELECT id FROM modules WHERE owner_id = auth.uid()
      UNION
      SELECT module_id FROM module_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

-- ============================================
-- LEARNING_UNITS POLICIES
-- ============================================

-- Users can view learning units in their documents or module documents
CREATE POLICY "Users can view learning units"
  ON learning_units FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()
      UNION
      SELECT document_id FROM module_documents WHERE module_id IN (
        SELECT id FROM modules WHERE owner_id = auth.uid()
        UNION
        SELECT module_id FROM module_members WHERE user_id = auth.uid()
      )
    )
  );

-- Document owners and editors can create learning units
CREATE POLICY "Editors can create learning units"
  ON learning_units FOR INSERT
  WITH CHECK (
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()
      UNION
      SELECT document_id FROM module_documents WHERE module_id IN (
        SELECT id FROM modules WHERE owner_id = auth.uid()
        UNION
        SELECT module_id FROM module_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
      )
    )
  );

-- Document owners and editors can update learning units
CREATE POLICY "Editors can update learning units"
  ON learning_units FOR UPDATE
  USING (
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()
      UNION
      SELECT document_id FROM module_documents WHERE module_id IN (
        SELECT id FROM modules WHERE owner_id = auth.uid()
        UNION
        SELECT module_id FROM module_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
      )
    )
  );

-- Document owners and editors can delete learning units
CREATE POLICY "Editors can delete learning units"
  ON learning_units FOR DELETE
  USING (
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()
      UNION
      SELECT document_id FROM module_documents WHERE module_id IN (
        SELECT id FROM modules WHERE owner_id = auth.uid()
        UNION
        SELECT module_id FROM module_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
      )
    )
  );

-- ============================================
-- LEARNING_UNIT_SECTIONS POLICIES
-- ============================================

-- Users can view learning unit sections if they can view the learning unit
CREATE POLICY "Users can view learning unit sections"
  ON learning_unit_sections FOR SELECT
  USING (
    learning_unit_id IN (
      SELECT id FROM learning_units WHERE document_id IN (
        SELECT id FROM documents WHERE user_id = auth.uid()
        UNION
        SELECT document_id FROM module_documents WHERE module_id IN (
          SELECT id FROM modules WHERE owner_id = auth.uid()
          UNION
          SELECT module_id FROM module_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Editors can add sections to learning units
CREATE POLICY "Editors can add learning unit sections"
  ON learning_unit_sections FOR INSERT
  WITH CHECK (
    learning_unit_id IN (
      SELECT id FROM learning_units WHERE document_id IN (
        SELECT id FROM documents WHERE user_id = auth.uid()
        UNION
        SELECT document_id FROM module_documents WHERE module_id IN (
          SELECT id FROM modules WHERE owner_id = auth.uid()
          UNION
          SELECT module_id FROM module_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
      )
    )
  );

-- Editors can update section order
CREATE POLICY "Editors can update learning unit sections"
  ON learning_unit_sections FOR UPDATE
  USING (
    learning_unit_id IN (
      SELECT id FROM learning_units WHERE document_id IN (
        SELECT id FROM documents WHERE user_id = auth.uid()
        UNION
        SELECT document_id FROM module_documents WHERE module_id IN (
          SELECT id FROM modules WHERE owner_id = auth.uid()
          UNION
          SELECT module_id FROM module_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
      )
    )
  );

-- Editors can remove sections from learning units
CREATE POLICY "Editors can delete learning unit sections"
  ON learning_unit_sections FOR DELETE
  USING (
    learning_unit_id IN (
      SELECT id FROM learning_units WHERE document_id IN (
        SELECT id FROM documents WHERE user_id = auth.uid()
        UNION
        SELECT document_id FROM module_documents WHERE module_id IN (
          SELECT id FROM modules WHERE owner_id = auth.uid()
          UNION
          SELECT module_id FROM module_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
      )
    )
  );

-- ============================================
-- EXERCISE_SOLUTIONS POLICIES
-- ============================================

-- Users can view exercise solutions in their documents
CREATE POLICY "Users can view exercise solutions"
  ON exercise_solutions FOR SELECT
  USING (
    exercise_section_id IN (
      SELECT id FROM sections WHERE document_id IN (
        SELECT id FROM documents WHERE user_id = auth.uid()
        UNION
        SELECT document_id FROM module_documents WHERE module_id IN (
          SELECT id FROM modules WHERE owner_id = auth.uid()
          UNION
          SELECT module_id FROM module_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Editors can create exercise solutions
CREATE POLICY "Editors can create exercise solutions"
  ON exercise_solutions FOR INSERT
  WITH CHECK (
    exercise_section_id IN (
      SELECT id FROM sections WHERE document_id IN (
        SELECT id FROM documents WHERE user_id = auth.uid()
        UNION
        SELECT document_id FROM module_documents WHERE module_id IN (
          SELECT id FROM modules WHERE owner_id = auth.uid()
          UNION
          SELECT module_id FROM module_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
      )
    )
  );

-- Editors can delete exercise solutions
CREATE POLICY "Editors can delete exercise solutions"
  ON exercise_solutions FOR DELETE
  USING (
    exercise_section_id IN (
      SELECT id FROM sections WHERE document_id IN (
        SELECT id FROM documents WHERE user_id = auth.uid()
        UNION
        SELECT document_id FROM module_documents WHERE module_id IN (
          SELECT id FROM modules WHERE owner_id = auth.uid()
          UNION
          SELECT module_id FROM module_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
      )
    )
  );

-- ============================================
-- HELPER FUNCTION: Get user role for a module
-- ============================================
CREATE OR REPLACE FUNCTION get_module_role(p_module_id UUID, p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Check if owner
  SELECT 'owner' INTO v_role
  FROM modules
  WHERE id = p_module_id AND owner_id = p_user_id;

  IF v_role IS NOT NULL THEN
    RETURN v_role;
  END IF;

  -- Check membership
  SELECT role INTO v_role
  FROM module_members
  WHERE module_id = p_module_id AND user_id = p_user_id;

  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Auto-update updated_at on modules
-- ============================================
CREATE OR REPLACE FUNCTION update_module_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER modules_updated_at
  BEFORE UPDATE ON modules
  FOR EACH ROW
  EXECUTE FUNCTION update_module_timestamp();

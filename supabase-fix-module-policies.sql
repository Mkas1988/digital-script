-- ============================================
-- FIX: Fehlende RLS Policies für Module und Module-Dokumente
-- ============================================
-- Führen Sie dieses Script im Supabase SQL Editor aus

-- ============================================
-- 1. MODULE UPDATE POLICY
-- ============================================

-- Löschen der alten Policy falls vorhanden
DROP POLICY IF EXISTS "modules_update_own" ON modules;
DROP POLICY IF EXISTS "Owners and editors can update modules" ON modules;

-- Neue UPDATE Policy: Nur Owner kann updaten
CREATE POLICY "modules_update_own" ON modules FOR UPDATE
  USING (owner_id = auth.uid());

-- ============================================
-- 2. MODULE DELETE POLICY
-- ============================================

-- Löschen der alten Policy falls vorhanden
DROP POLICY IF EXISTS "modules_delete_own" ON modules;
DROP POLICY IF EXISTS "Only owners can delete modules" ON modules;

-- Neue DELETE Policy: Nur Owner kann löschen
CREATE POLICY "modules_delete_own" ON modules FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================
-- 3. MODULE_DOCUMENTS POLICIES
-- ============================================

-- Alte Policies löschen
DROP POLICY IF EXISTS "module_documents_select" ON module_documents;
DROP POLICY IF EXISTS "module_documents_insert" ON module_documents;
DROP POLICY IF EXISTS "module_documents_update" ON module_documents;
DROP POLICY IF EXISTS "module_documents_delete" ON module_documents;
DROP POLICY IF EXISTS "Users can view module documents" ON module_documents;
DROP POLICY IF EXISTS "Editors can add documents" ON module_documents;
DROP POLICY IF EXISTS "Editors can update document order" ON module_documents;
DROP POLICY IF EXISTS "Editors can remove documents" ON module_documents;

-- SELECT: Jeder kann seine eigenen Modul-Dokument-Zuordnungen sehen
-- (Modul gehört dem User ODER User ist Eigentümer des Dokuments)
CREATE POLICY "module_documents_select" ON module_documents FOR SELECT
  USING (
    module_id IN (SELECT id FROM modules WHERE owner_id = auth.uid())
    OR
    document_id IN (SELECT id FROM documents WHERE user_id = auth.uid())
  );

-- INSERT: User kann Dokumente zu eigenen Modulen hinzufügen
-- ODER eigene Dokumente zu Modulen (wenn er Owner des Dokuments ist)
CREATE POLICY "module_documents_insert" ON module_documents FOR INSERT
  WITH CHECK (
    module_id IN (SELECT id FROM modules WHERE owner_id = auth.uid())
    OR
    document_id IN (SELECT id FROM documents WHERE user_id = auth.uid())
  );

-- UPDATE: User kann Zuordnungen in eigenen Modulen updaten
CREATE POLICY "module_documents_update" ON module_documents FOR UPDATE
  USING (
    module_id IN (SELECT id FROM modules WHERE owner_id = auth.uid())
    OR
    document_id IN (SELECT id FROM documents WHERE user_id = auth.uid())
  );

-- DELETE: User kann Dokumente aus eigenen Modulen entfernen
-- ODER eigene Dokumente aus Modulen entfernen
CREATE POLICY "module_documents_delete" ON module_documents FOR DELETE
  USING (
    module_id IN (SELECT id FROM modules WHERE owner_id = auth.uid())
    OR
    document_id IN (SELECT id FROM documents WHERE user_id = auth.uid())
  );

-- ============================================
-- 4. VERIFIZIERUNG
-- ============================================

-- Prüfen ob alle Policies erstellt wurden
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('modules', 'module_documents')
ORDER BY tablename, policyname;

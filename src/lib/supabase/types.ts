export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Section types for Studienbrief elements
export type SectionType =
  | 'chapter'             // Hauptkapitel
  | 'subchapter'          // Unterkapitel
  | 'learning_objectives' // Lernziele
  | 'task'                // Aufgabe
  | 'practice_impulse'    // Praxisimpuls
  | 'reflection'          // Reflexionsfrage
  | 'tip'                 // Hinweis/Tipp
  | 'summary'             // Zusammenfassung
  | 'definition'          // Begriffsdefinition
  | 'example'             // Beispiel
  | 'important'           // Wichtig (rot)
  | 'exercise'            // Übungsaufgabe
  | 'solution'            // Lösung zu Übungsaufgabe
  | 'reference'           // Verweis/Link

export interface SectionMetadata {
  task_number?: string
  keywords?: string[]
  page_number?: number
  level?: number           // 0 = top-level chapter, 1 = subchapter, 2 = element within subchapter
  chapter_number?: string  // e.g., "1", "2", "3" - groups related sections together
  solution_id?: string     // ID der zugehörigen Lösung (für Übungsaufgaben)
  exercise_id?: string     // ID der zugehörigen Aufgabe (für Lösungen)
  external_link?: string   // Externer Link (z.B. NotebookLM)
  external_link_label?: string // Label für externen Link
}

export interface SectionFormatting {
  hasBold?: boolean
  hasItalic?: boolean
  hasList?: boolean
  hasTable?: boolean
}

export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string
          user_id: string
          title: string
          original_filename: string
          storage_path: string
          total_pages: number | null
          has_images: boolean
          ai_summary: string | null
          processing_status: 'pending' | 'processing' | 'completed' | 'error'
          author: string | null
          institution: string | null
          notebooklm_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          original_filename: string
          storage_path: string
          total_pages?: number | null
          has_images?: boolean
          ai_summary?: string | null
          processing_status?: 'pending' | 'processing' | 'completed' | 'error'
          author?: string | null
          institution?: string | null
          notebooklm_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          original_filename?: string
          storage_path?: string
          total_pages?: number | null
          has_images?: boolean
          ai_summary?: string | null
          processing_status?: 'pending' | 'processing' | 'completed' | 'error'
          author?: string | null
          institution?: string | null
          notebooklm_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sections: {
        Row: {
          id: string
          document_id: string
          title: string
          content: string
          order_index: number
          page_start: number | null
          page_end: number | null
          images: Json
          ai_summary: string | null
          formatting: Json
          section_type: SectionType
          metadata: Json
        }
        Insert: {
          id?: string
          document_id: string
          title: string
          content: string
          order_index: number
          page_start?: number | null
          page_end?: number | null
          images?: Json
          ai_summary?: string | null
          formatting?: Json
          section_type?: SectionType
          metadata?: Json
        }
        Update: {
          id?: string
          document_id?: string
          title?: string
          content?: string
          order_index?: number
          page_start?: number | null
          page_end?: number | null
          images?: Json
          ai_summary?: string | null
          formatting?: Json
          section_type?: SectionType
          metadata?: Json
        }
      }
      document_images: {
        Row: {
          id: string
          document_id: string
          section_id: string | null
          storage_path: string
          alt_text: string | null
          caption: string | null
          page_number: number | null
          position_in_section: number | null
          width: number | null
          height: number | null
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          section_id?: string | null
          storage_path: string
          alt_text?: string | null
          caption?: string | null
          page_number?: number | null
          position_in_section?: number | null
          width?: number | null
          height?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          section_id?: string | null
          storage_path?: string
          alt_text?: string | null
          caption?: string | null
          page_number?: number | null
          position_in_section?: number | null
          width?: number | null
          height?: number | null
          created_at?: string
        }
      }
      annotations: {
        Row: {
          id: string
          user_id: string
          section_id: string
          type: 'highlight' | 'note' | 'bookmark'
          content: string | null
          text_selection: string | null
          position_start: number | null
          position_end: number | null
          color: string | null
          for_review: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          section_id: string
          type: 'highlight' | 'note' | 'bookmark'
          content?: string | null
          text_selection?: string | null
          position_start?: number | null
          position_end?: number | null
          color?: string | null
          for_review?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          section_id?: string
          type?: 'highlight' | 'note' | 'bookmark'
          content?: string | null
          text_selection?: string | null
          position_start?: number | null
          position_end?: number | null
          color?: string | null
          for_review?: boolean | null
          created_at?: string
        }
      }
      flashcards: {
        Row: {
          id: string
          user_id: string
          document_id: string
          section_id: string | null
          question: string
          answer: string
          difficulty: number
          next_review: string | null
          review_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          document_id: string
          section_id?: string | null
          question: string
          answer: string
          difficulty?: number
          next_review?: string | null
          review_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          document_id?: string
          section_id?: string | null
          question?: string
          answer?: string
          difficulty?: number
          next_review?: string | null
          review_count?: number
          created_at?: string
        }
      }
      progress: {
        Row: {
          id: string
          user_id: string
          document_id: string
          section_id: string
          completed: boolean
          time_spent_seconds: number
          last_accessed: string
        }
        Insert: {
          id?: string
          user_id: string
          document_id: string
          section_id: string
          completed?: boolean
          time_spent_seconds?: number
          last_accessed?: string
        }
        Update: {
          id?: string
          user_id?: string
          document_id?: string
          section_id?: string
          completed?: boolean
          time_spent_seconds?: number
          last_accessed?: string
        }
      }
      modules: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string | null
          cover_image_url: string | null
          sequence_order: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          description?: string | null
          cover_image_url?: string | null
          sequence_order?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          description?: string | null
          cover_image_url?: string | null
          sequence_order?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      module_members: {
        Row: {
          id: string
          module_id: string
          user_id: string
          role: 'owner' | 'editor' | 'viewer'
          invited_at: string
        }
        Insert: {
          id?: string
          module_id: string
          user_id: string
          role: 'owner' | 'editor' | 'viewer'
          invited_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          user_id?: string
          role?: 'owner' | 'editor' | 'viewer'
          invited_at?: string
        }
      }
      module_documents: {
        Row: {
          id: string
          module_id: string
          document_id: string
          sequence_order: number
        }
        Insert: {
          id?: string
          module_id: string
          document_id: string
          sequence_order?: number
        }
        Update: {
          id?: string
          module_id?: string
          document_id?: string
          sequence_order?: number
        }
      }
      learning_units: {
        Row: {
          id: string
          document_id: string
          title: string
          description: string | null
          learning_objectives: string[] | null
          sequence_order: number
          estimated_minutes: number | null
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          title: string
          description?: string | null
          learning_objectives?: string[] | null
          sequence_order?: number
          estimated_minutes?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          title?: string
          description?: string | null
          learning_objectives?: string[] | null
          sequence_order?: number
          estimated_minutes?: number | null
          created_at?: string
        }
      }
      learning_unit_sections: {
        Row: {
          id: string
          learning_unit_id: string
          section_id: string
          sequence_order: number
        }
        Insert: {
          id?: string
          learning_unit_id: string
          section_id: string
          sequence_order?: number
        }
        Update: {
          id?: string
          learning_unit_id?: string
          section_id?: string
          sequence_order?: number
        }
      }
      exercise_solutions: {
        Row: {
          id: string
          exercise_section_id: string
          solution_section_id: string
          created_at: string
        }
        Insert: {
          id?: string
          exercise_section_id: string
          solution_section_id: string
          created_at?: string
        }
        Update: {
          id?: string
          exercise_section_id?: string
          solution_section_id?: string
          created_at?: string
        }
      }
    }
  }
}

// Basic types
export type Document = Database['public']['Tables']['documents']['Row']
export type Section = Database['public']['Tables']['sections']['Row']
export type DocumentImage = Database['public']['Tables']['document_images']['Row']
export type Annotation = Database['public']['Tables']['annotations']['Row']
export type Flashcard = Database['public']['Tables']['flashcards']['Row']
export type Progress = Database['public']['Tables']['progress']['Row']

// Extended types with relations
export interface SectionWithImages extends Omit<Section, 'images' | 'formatting' | 'metadata'> {
  images: DocumentImage[]
  formatting: SectionFormatting
  section_type: SectionType
  metadata: SectionMetadata
}

export interface DocumentWithSections extends Document {
  sections: Section[]
}

export interface DocumentWithProgress extends Document {
  progress?: number // Calculated progress percentage
  sectionsCount?: number
}

// ============================================
// MODULE MANAGEMENT TYPES
// ============================================

// Roles for module access control
export type ModuleRole = 'owner' | 'editor' | 'viewer'

// Module (Kursmodul als Ordner)
export interface Module {
  id: string
  owner_id: string
  title: string
  description: string | null
  cover_image_url: string | null
  sequence_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}

// Module Member (Mitgliedschaft mit Rolle)
export interface ModuleMember {
  id: string
  module_id: string
  user_id: string
  role: ModuleRole
  invited_at: string
}

// Module Document (Zuordnung Modul → Dokument)
export interface ModuleDocument {
  id: string
  module_id: string
  document_id: string
  sequence_order: number
}

// Learning Unit (Lerneinheit)
export interface LearningUnit {
  id: string
  document_id: string
  title: string
  description: string | null
  learning_objectives: string[] | null
  sequence_order: number
  estimated_minutes: number | null
  created_at: string
}

// Learning Unit Section (Zuordnung Lerneinheit → Sektion)
export interface LearningUnitSection {
  id: string
  learning_unit_id: string
  section_id: string
  sequence_order: number
}

// Exercise Solution (Verknüpfung Aufgabe ↔ Lösung)
export interface ExerciseSolution {
  id: string
  exercise_section_id: string
  solution_section_id: string
  created_at: string
}

// Extended Module types with relations
export interface ModuleWithDocuments extends Module {
  documents: (ModuleDocument & { document: Document })[]
}

export interface ModuleWithMembers extends Module {
  members: (ModuleMember & { user?: { email: string } })[]
}

export interface ModuleWithAll extends Module {
  documents: (ModuleDocument & { document: Document })[]
  members: ModuleMember[]
  role?: ModuleRole // Current user's role
}

export interface LearningUnitWithSections extends LearningUnit {
  sections: (LearningUnitSection & { section: Section })[]
}

export interface DocumentWithLearningUnits extends Document {
  learning_units: LearningUnit[]
}

# Digitales Skript

Ein webbasiertes Tool für Studenten, um PDFs als interaktive Webseiten zu lesen, mit Text-to-Speech, Notizen und Lernkarten.

## Features (MVP)

- **PDF Upload** - Drag & Drop Upload mit Fortschrittsanzeige
- **PDF zu Webseite** - Automatische Textextraktion und Kapitelstrukturierung
- **Document Reader** - Übersichtliches Lesen mit Inhaltsverzeichnis
- **Text-to-Speech** - Lass dir deine Skripte vorlesen (mit Geschwindigkeits- und Stimmauswahl)

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, Database, Storage)
- **PDF Parsing**: pdf-parse

## Setup

### 1. Supabase Projekt erstellen

1. Erstelle ein neues Projekt auf [supabase.com](https://supabase.com)
2. Gehe zu **SQL Editor** und führe das Schema aus `supabase-schema.sql` aus
3. Gehe zu **Storage** und stelle sicher, dass der `documents` Bucket erstellt wurde

### 2. Environment Variables

Kopiere `.env.local.example` zu `.env.local` und fülle die Werte aus:

```bash
cp .env.local.example .env.local
```

Hole die Werte aus deinem Supabase Dashboard unter **Settings > API**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Installation

```bash
npm install
```

### 4. Development Server

```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000) im Browser.

## Projektstruktur

```
src/
├── app/                    # Next.js App Router
│   ├── api/parse/         # PDF Parsing API
│   ├── auth/callback/     # Auth Callback
│   ├── documents/         # Dokument-Übersicht & Reader
│   ├── login/             # Login-Seite
│   └── signup/            # Registrierung
├── components/
│   ├── documents/         # Dokument-Komponenten
│   ├── layout/            # Layout-Komponenten
│   ├── reader/            # Reader-Komponenten
│   └── ui/                # shadcn/ui Komponenten
└── lib/
    ├── pdf/               # PDF Parsing Logic
    └── supabase/          # Supabase Client & Types
```

## Nächste Schritte (Post-MVP)

- [ ] Notizen & Markierungen (Phase 5)
- [ ] Lernkarten mit KI-Generierung (Phase 6)
- [ ] Fortschritts-Tracking (Phase 7)
- [ ] Dark Mode & Polish (Phase 8)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

Make sure to add all environment variables in the Vercel project settings.

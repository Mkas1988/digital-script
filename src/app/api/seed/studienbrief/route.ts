import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import type { SectionType } from '@/lib/supabase/types'

// Use crypto.randomUUID for UUID generation
const uuidv4 = () => randomUUID()

// Lazy initialization of Supabase client for service role access
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase environment variables not configured')
  }

  return createClient(url, key)
}

interface SectionData {
  id: string
  title: string
  content: string
  section_type: SectionType
  level: number
  chapter_number: string
  page_start: number
  page_end: number
  ai_summary: string
  keywords: string[]
  task_number?: string
  solution_id?: string
  exercise_id?: string
}

// Generate UUIDs for exercises and solutions to link them
const EXERCISE_1_ID = uuidv4()
const EXERCISE_2_ID = uuidv4()
const EXERCISE_3_ID = uuidv4()
const EXERCISE_4_ID = uuidv4()
const SOLUTION_1_ID = uuidv4()
const SOLUTION_2_ID = uuidv4()
const SOLUTION_3_ID = uuidv4()
const SOLUTION_4_ID = uuidv4()

const STUDIENBRIEF_SECTIONS: SectionData[] = [
  // === EINFÜHRUNG (INTRO) ===
  {
    id: uuidv4(),
    title: 'Einführung in diesen Studienbrief',
    content: `Herzlich willkommen zu Ihrem Studienbrief „Rechtsmethoden"!

Dieser Studienbrief führt Sie in die grundlegenden Methoden der juristischen Arbeit ein. Die Rechtsmethodik bildet das Fundament für Ihr gesamtes Jurastudium und Ihre spätere berufliche Praxis.

**Warum ist die Rechtsmethodik so wichtig?**

Das Recht ist ein komplexes System aus Gesetzen, Verordnungen, Rechtsprechung und Lehrmeinungen. Um dieses System zu verstehen und anzuwenden, benötigen Sie methodische Werkzeuge. Diese Werkzeuge – die Rechtsmethoden – ermöglichen es Ihnen:

- Rechtliche Probleme systematisch zu analysieren
- Gesetze korrekt auszulegen
- Rechtliche Argumente überzeugend zu formulieren
- Gutachten und Urteile professionell zu verfassen

**Aufbau des Studienbriefs**

Der Studienbrief gliedert sich in zwei Hauptkapitel:

1. **Einführung in die Rechtsmethoden**: Hier lernen Sie die grundlegenden Konzepte wie Subsumtion, Syllogismus und die klassischen Auslegungsmethoden kennen.

2. **Jura richtig lernen**: In diesem Kapitel erfahren Sie, wie Sie juristische Inhalte effektiv lernen und die Methoden in Ihrem Studium anwenden können.

Am Ende finden Sie Übungsaufgaben mit Lösungen, die Ihnen helfen, das Gelernte zu festigen.`,
    section_type: 'chapter',
    level: 0,
    chapter_number: 'intro',
    page_start: 4,
    page_end: 4,
    ai_summary: 'Einführung in den Studienbrief Rechtsmethoden mit Überblick über Aufbau und Bedeutung der juristischen Methodik.',
    keywords: ['Rechtsmethodik', 'Studienbrief', 'Einführung', 'Jurastudium'],
  },
  {
    id: uuidv4(),
    title: 'Lernziele',
    content: `**Nach dem Studium dieses Studienbriefs können Sie:**

• Den juristischen Syllogismus und seine Bedeutung für die Rechtsanwendung erklären

• Die Subsumtionstechnik auf einfache Rechtsfälle anwenden

• Die vier klassischen Auslegungsmethoden (grammatisch, systematisch, historisch, teleologisch) unterscheiden und anwenden

• Den Unterschied zwischen Gutachtenstil und Urteilsstil erkennen und beide Stile korrekt anwenden

• Rechtliche Probleme strukturiert analysieren und lösen

• Effektive Lernstrategien für das Jurastudium entwickeln und umsetzen`,
    section_type: 'learning_objectives',
    level: 1,
    chapter_number: 'intro',
    page_start: 5,
    page_end: 5,
    ai_summary: 'Auflistung der Lernziele des Studienbriefs: Syllogismus, Subsumtion, Auslegungsmethoden, Gutachten-/Urteilsstil.',
    keywords: ['Lernziele', 'Syllogismus', 'Subsumtion', 'Auslegung', 'Gutachtenstil'],
  },
  {
    id: uuidv4(),
    title: 'Tipp: So arbeiten Sie mit diesem Studienbrief',
    content: `**Empfehlung für Ihr Selbststudium:**

1. **Lesen Sie aktiv**: Markieren Sie wichtige Stellen und machen Sie sich Notizen am Rand.

2. **Bearbeiten Sie alle Übungsaufgaben**: Die Aufgaben sind so konzipiert, dass sie Ihr Verständnis vertiefen. Versuchen Sie, sie zunächst selbstständig zu lösen, bevor Sie die Lösungen lesen.

3. **Nutzen Sie die Zusammenfassungen**: Am Ende jedes Kapitels finden Sie eine Zusammenfassung der wichtigsten Punkte.

4. **Wiederholen Sie regelmäßig**: Juristische Methoden müssen verinnerlicht werden. Planen Sie regelmäßige Wiederholungen ein.

5. **Wenden Sie das Gelernte an**: Versuchen Sie, die Methoden auch bei anderen Fällen und in anderen Vorlesungen anzuwenden.`,
    section_type: 'tip',
    level: 1,
    chapter_number: 'intro',
    page_start: 5,
    page_end: 5,
    ai_summary: 'Praktische Tipps zur effektiven Arbeit mit dem Studienbrief: aktives Lesen, Übungen bearbeiten, regelmäßig wiederholen.',
    keywords: ['Lerntipp', 'Selbststudium', 'Übungsaufgaben', 'Wiederholung'],
  },

  // === KAPITEL 1: EINFÜHRUNG IN DIE RECHTSMETHODEN ===
  {
    id: uuidv4(),
    title: '1. Einführung in die Rechtsmethoden',
    content: `Die Rechtsmethodik ist die Wissenschaft von den Methoden der Rechtsanwendung und Rechtsgewinnung. Sie beantwortet die Frage: Wie wendet man das Recht richtig an?

**1.1 Der juristische Syllogismus**

Der Syllogismus ist das logische Grundgerüst der Rechtsanwendung. Er besteht aus drei Elementen:

**Obersatz** (Rechtsnorm): Wer eine fremde bewegliche Sache wegnimmt, macht sich des Diebstahls schuldig.

**Untersatz** (Sachverhalt): A hat dem B dessen Fahrrad weggenommen.

**Schlusssatz** (Rechtsfolge): A hat sich des Diebstahls schuldig gemacht.

Der Syllogismus verbindet abstrakte Rechtsnormen mit konkreten Lebenssachverhalten und ermöglicht so die Rechtsanwendung im Einzelfall.

**1.2 Die Subsumtion**

Die Subsumtion ist der Kern der juristischen Arbeit. Sie bezeichnet den Vorgang, bei dem geprüft wird, ob ein konkreter Sachverhalt unter eine abstrakte Rechtsnorm „passt".

Der Begriff kommt vom lateinischen „subsumere" = unterordnen. Bei der Subsumtion ordnen wir den Sachverhalt unter die Tatbestandsmerkmale der Norm ein.

**Schritte der Subsumtion:**

1. **Normidentifikation**: Welche Rechtsnorm könnte einschlägig sein?
2. **Tatbestandsmerkmale**: Welche Voraussetzungen enthält die Norm?
3. **Definition**: Wie sind die einzelnen Merkmale definiert?
4. **Subsumtion im engeren Sinne**: Erfüllt der Sachverhalt die definierten Merkmale?
5. **Ergebnis**: Liegt die Rechtsfolge vor oder nicht?`,
    section_type: 'chapter',
    level: 0,
    chapter_number: '1',
    page_start: 6,
    page_end: 7,
    ai_summary: 'Einführung in die Rechtsmethodik mit Erklärung des juristischen Syllogismus (Obersatz, Untersatz, Schlusssatz) und der Subsumtionstechnik.',
    keywords: ['Rechtsmethodik', 'Syllogismus', 'Obersatz', 'Untersatz', 'Subsumtion'],
  },
  {
    id: uuidv4(),
    title: 'Wichtig: Der Unterschied zwischen Ober- und Untersatz',
    content: `**Merken Sie sich:**

Der **Obersatz** enthält immer die abstrakte Rechtsnorm – er beschreibt, WAS das Gesetz regelt.

Der **Untersatz** enthält immer den konkreten Sachverhalt – er beschreibt, WAS tatsächlich passiert ist.

**Häufiger Fehler:**
Studierende verwechseln oft Obersatz und Untersatz oder vermischen beide. Achten Sie stets auf eine klare Trennung!

**Beispiel für einen korrekten Aufbau:**

*Obersatz:* Gemäß § 823 Abs. 1 BGB ist zum Schadensersatz verpflichtet, wer vorsätzlich oder fahrlässig das Eigentum eines anderen widerrechtlich verletzt.

*Untersatz:* A hat den PKW des B mit einem Stein beworfen und dabei die Windschutzscheibe beschädigt.

*Schlusssatz:* A ist dem B zum Schadensersatz verpflichtet.`,
    section_type: 'important',
    level: 1,
    chapter_number: '1',
    page_start: 7,
    page_end: 7,
    ai_summary: 'Wichtige Unterscheidung zwischen Obersatz (abstrakte Norm) und Untersatz (konkreter Sachverhalt) mit Beispiel.',
    keywords: ['Obersatz', 'Untersatz', 'Unterscheidung', 'Fehler vermeiden'],
  },
  {
    id: uuidv4(),
    title: '1.3 Die Auslegungsmethoden',
    content: `Gesetze sind in abstrakter Sprache verfasst und müssen für den konkreten Fall ausgelegt werden. Die Jurisprudenz kennt vier klassische Auslegungsmethoden, die auf Friedrich Carl von Savigny zurückgehen:

**1. Grammatische (wörtliche) Auslegung**

Diese Methode fragt nach dem Wortsinn der Norm. Was bedeuten die verwendeten Begriffe nach dem allgemeinen Sprachgebrauch?

*Beispiel:* Was ist eine „Sache" im Sinne des § 90 BGB? Nach dem Wortlaut sind Sachen „körperliche Gegenstände".

**2. Systematische Auslegung**

Diese Methode betrachtet die Stellung der Norm im Gesamtsystem der Rechtsordnung. Wie fügt sich die Norm in den Zusammenhang mit anderen Normen ein?

*Beispiel:* Die Bedeutung des § 433 BGB (Kaufvertrag) ergibt sich auch aus seiner Stellung im Abschnitt über „Besondere Schuldverhältnisse".

**3. Historische Auslegung**

Diese Methode fragt nach dem Willen des historischen Gesetzgebers. Was wollte der Gesetzgeber bei Erlass der Norm regeln?

*Beispiel:* Die Gesetzesbegründung und Protokolle der Beratungen geben Aufschluss über den historischen Regelungszweck.

**4. Teleologische Auslegung**

Diese Methode fragt nach dem Sinn und Zweck der Norm. Welches Ziel verfolgt die Regelung?

*Beispiel:* Der Zweck des Mieterschutzes erklärt die Auslegung von Kündigungsvorschriften zugunsten des Mieters.`,
    section_type: 'subchapter',
    level: 1,
    chapter_number: '1',
    page_start: 8,
    page_end: 9,
    ai_summary: 'Die vier klassischen Auslegungsmethoden nach Savigny: grammatisch, systematisch, historisch und teleologisch mit Beispielen.',
    keywords: ['Auslegung', 'grammatisch', 'systematisch', 'historisch', 'teleologisch', 'Savigny'],
  },
  {
    id: uuidv4(),
    title: 'Beispiel: Anwendung der Auslegungsmethoden',
    content: `**Fall:**
In einem Café hängt ein Schild: „Hunde müssen draußen bleiben." Frau M. möchte mit ihrem Papagei das Café betreten. Der Inhaber verweist auf das Schild.

**Frage:** Ist das Verbot auch auf den Papagei anwendbar?

**Lösung mit den vier Auslegungsmethoden:**

**1. Grammatische Auslegung:**
Das Wort „Hunde" bezeichnet nach dem allgemeinen Sprachgebrauch ausschließlich Tiere der Gattung Canis lupus familiaris. Ein Papagei ist eindeutig kein Hund.
→ Nach dem Wortlaut: Papagei nicht erfasst.

**2. Systematische Auslegung:**
Hausordnungen in Gaststätten dienen typischerweise dem geordneten Betrieb und dem Schutz anderer Gäste. Im System gastronomischer Regelungen sind tierische Mitbringer oft problematisch.
→ Papagei könnte erfasst sein.

**3. Historische Auslegung:**
Der Wirt wollte vermutlich bei Aufhängen des Schildes verhindern, dass bellende, haarende oder beißende Tiere seinen Betrieb stören. Er dachte wohl primär an Hunde als häufigste Begleittiere.
→ Papagei eher nicht erfasst.

**4. Teleologische Auslegung:**
Sinn und Zweck des Verbots ist die Vermeidung von Störungen durch Tiere (Lärm, Geruch, Hygiene, Angst anderer Gäste). Ein Papagei kann durchaus laut sein und andere Gäste stören.
→ Papagei könnte erfasst sein.

**Ergebnis:**
Die Auslegungsmethoden führen zu unterschiedlichen Ergebnissen. In der Praxis würde man dem Wortlaut (grammatische Auslegung) besonderes Gewicht beimessen, aber auch den Normzweck (teleologische Auslegung) berücksichtigen. Eine analoge Anwendung auf den Papagei wäre vertretbar.`,
    section_type: 'example',
    level: 1,
    chapter_number: '1',
    page_start: 9,
    page_end: 10,
    ai_summary: 'Praxisbeispiel zur Anwendung aller vier Auslegungsmethoden am Fall "Hunde müssen draußen bleiben" mit Papagei.',
    keywords: ['Auslegung', 'Beispiel', 'Praxis', 'Hunde', 'Analogie'],
  },
  {
    id: uuidv4(),
    title: '1.4 Gutachtenstil vs. Urteilsstil',
    content: `In der juristischen Ausbildung und Praxis werden zwei grundlegende Darstellungsstile unterschieden:

**Der Gutachtenstil**

Der Gutachtenstil ist der typische Stil für Klausuren und Hausarbeiten im Studium. Er zeichnet sich durch seine ergebnisoffene, prüfende Struktur aus:

**Aufbau im Gutachtenstil:**
1. Obersatz (Hypothese): „A könnte sich wegen Diebstahls gemäß § 242 StGB strafbar gemacht haben."
2. Definition: „Diebstahl begeht, wer eine fremde bewegliche Sache einem anderen wegnimmt..."
3. Subsumtion: „Hier hat A das Fahrrad des B, mithin eine fremde bewegliche Sache..."
4. Ergebnis: „Folglich hat A sich des Diebstahls schuldig gemacht."

**Merkmale:**
- Beginnt mit einer Frage/Hypothese
- Prüft ergebnisoffen
- Begründung vor Ergebnis
- Konjunktiv in der Fragestellung

**Der Urteilsstil**

Der Urteilsstil ist der Stil von Gerichtsurteilen und Bescheiden. Er stellt das Ergebnis an den Anfang:

**Aufbau im Urteilsstil:**
1. Ergebnis: „A hat sich des Diebstahls gemäß § 242 StGB schuldig gemacht."
2. Begründung: „Er hat nämlich das Fahrrad des B, eine fremde bewegliche Sache, weggenommen..."

**Merkmale:**
- Beginnt mit dem Ergebnis
- Begründung folgt
- Indikativ (feststehend)
- Knapper, ergebnisorientiert`,
    section_type: 'subchapter',
    level: 1,
    chapter_number: '1',
    page_start: 10,
    page_end: 11,
    ai_summary: 'Gegenüberstellung von Gutachtenstil (ergebnisoffen, für Studium) und Urteilsstil (ergebnisorientiert, für Gerichte).',
    keywords: ['Gutachtenstil', 'Urteilsstil', 'Klausur', 'Aufbau', 'Schema'],
  },
  {
    id: uuidv4(),
    title: 'Wichtig: Wann welcher Stil?',
    content: `**Verwenden Sie den Gutachtenstil:**
- In Klausuren
- In Hausarbeiten
- Bei Übungsaufgaben
- Wenn das Ergebnis noch offen/umstritten ist
- Wenn ausdrücklich verlangt

**Verwenden Sie den Urteilsstil:**
- Bei Hilfsgutachten (wenn das Ergebnis feststeht)
- In Anwaltsschriftsätzen (teilweise)
- Wenn das Ergebnis eindeutig ist
- Um Platz zu sparen bei unproblematischen Punkten

**Achtung:**
In Klausuren wird fast ausschließlich der Gutachtenstil erwartet! Ein Wechsel zum Urteilsstil ist nur bei völlig unproblematischen Punkten zulässig und sollte die Ausnahme bleiben.`,
    section_type: 'important',
    level: 1,
    chapter_number: '1',
    page_start: 11,
    page_end: 11,
    ai_summary: 'Übersicht wann Gutachtenstil (Klausuren, Hausarbeiten) und wann Urteilsstil (Gerichte, unproblematische Punkte) zu verwenden ist.',
    keywords: ['Gutachtenstil', 'Urteilsstil', 'Klausur', 'Anwendung'],
  },
  {
    id: EXERCISE_1_ID,
    title: 'Übungsaufgabe 1',
    content: `**Aufgabe:**

Herr Müller geht in ein Kaufhaus und steckt eine DVD in seine Jackentasche. An der Kasse zahlt er nur für andere Artikel und verlässt das Geschäft.

**Fragen:**

a) Formulieren Sie den juristischen Syllogismus für eine mögliche Strafbarkeit wegen Diebstahls (§ 242 StGB).

b) Subsumieren Sie den Sachverhalt unter die Tatbestandsmerkmale des § 242 StGB im Gutachtenstil.

**Hinweis:** § 242 StGB lautet: „Wer eine fremde bewegliche Sache einem anderen in der Absicht wegnimmt, die Sache sich oder einem Dritten rechtswidrig zuzueignen, wird mit Freiheitsstrafe bis zu fünf Jahren oder mit Geldstrafe bestraft."`,
    section_type: 'exercise',
    level: 1,
    chapter_number: '1',
    page_start: 12,
    page_end: 12,
    ai_summary: 'Übungsaufgabe zum Diebstahl (§ 242 StGB): Syllogismus formulieren und Subsumtion im Gutachtenstil durchführen.',
    keywords: ['Übung', 'Diebstahl', 'Syllogismus', 'Subsumtion'],
    task_number: '1',
    solution_id: SOLUTION_1_ID,
  },
  {
    id: EXERCISE_2_ID,
    title: 'Übungsaufgabe 2',
    content: `**Aufgabe:**

§ 1 eines fiktiven „Parkordnungsgesetzes" lautet: „Das Befahren des Stadtparks mit Fahrzeugen ist verboten."

Prüfen Sie mittels der vier Auslegungsmethoden, ob folgende Fortbewegungsmittel unter das Verbot fallen:

a) Ein Elektro-Tretroller (E-Scooter)
b) Ein Kinderwagen
c) Ein Rollstuhl
d) Ein ferngesteuertes Modellauto

**Begründen Sie Ihre Ergebnisse jeweils mit allen vier Auslegungsmethoden.**`,
    section_type: 'exercise',
    level: 1,
    chapter_number: '1',
    page_start: 13,
    page_end: 13,
    ai_summary: 'Übungsaufgabe zu den vier Auslegungsmethoden am Beispiel eines Parkverbots für verschiedene Fahrzeugtypen.',
    keywords: ['Übung', 'Auslegung', 'Fahrzeug', 'Park'],
    task_number: '2',
    solution_id: SOLUTION_2_ID,
  },
  {
    id: uuidv4(),
    title: 'Zusammenfassung Kapitel 1',
    content: `**Die wichtigsten Punkte aus Kapitel 1:**

**1. Juristischer Syllogismus:**
- Obersatz: abstrakte Rechtsnorm
- Untersatz: konkreter Sachverhalt
- Schlusssatz: Rechtsfolge für den Einzelfall

**2. Subsumtion:**
- Unterordnung des Sachverhalts unter die Norm
- Schritte: Norm → Merkmale → Definition → Subsumtion → Ergebnis

**3. Vier Auslegungsmethoden:**
- Grammatisch: Wortlaut/Wortsinn
- Systematisch: Stellung im Rechtssystem
- Historisch: Wille des Gesetzgebers
- Teleologisch: Sinn und Zweck der Norm

**4. Gutachtenstil vs. Urteilsstil:**
- Gutachtenstil: Hypothese → Prüfung → Ergebnis (für Klausuren)
- Urteilsstil: Ergebnis → Begründung (für Urteile)

**Kernaussage:**
Die Rechtsmethodik gibt uns das Werkzeug an die Hand, um Recht systematisch und nachvollziehbar anzuwenden. Der Syllogismus verbindet Norm und Fall, die Auslegungsmethoden erschließen den Norminhalt, und der Gutachtenstil strukturiert die Darstellung.`,
    section_type: 'summary',
    level: 1,
    chapter_number: '1',
    page_start: 13,
    page_end: 13,
    ai_summary: 'Zusammenfassung von Kapitel 1: Syllogismus, Subsumtion, vier Auslegungsmethoden und Gutachtenstil.',
    keywords: ['Zusammenfassung', 'Syllogismus', 'Subsumtion', 'Auslegung', 'Gutachtenstil'],
  },

  // === KAPITEL 2: JURA RICHTIG LERNEN ===
  {
    id: uuidv4(),
    title: '2. Jura richtig lernen',
    content: `Das Jurastudium stellt besondere Anforderungen an Ihre Lern- und Arbeitstechniken. Anders als in vielen anderen Studiengängen geht es nicht primär um das Auswendiglernen von Fakten, sondern um das Verstehen und Anwenden von Methoden.

**2.1 Die Besonderheiten des Jurastudiums**

Das juristische Lernen unterscheidet sich fundamental von anderen Disziplinen:

**Verständnis statt Auswendiglernen:**
Juristische Normen müssen verstanden, nicht nur memoriert werden. Ein Gesetzestext, den Sie auswendig können, aber nicht anwenden können, ist wertlos.

**Methodenkompetenz:**
Das Ziel ist nicht das Wissen über Rechtsnormen, sondern die Fähigkeit, sie anzuwenden. Die Methoden aus Kapitel 1 sind Ihr wichtigstes Werkzeug.

**Fallbezogenes Denken:**
Juristen denken vom konkreten Fall her. Jede theoretische Regel muss sich an praktischen Sachverhalten bewähren.

**Argumentation:**
Im Recht gibt es oft mehrere vertretbare Lösungen. Entscheidend ist die Qualität Ihrer Argumentation.

**2.2 Effektive Lernstrategien**

**a) Aktives Lernen:**
- Lesen Sie nicht nur passiv, sondern arbeiten Sie mit dem Text
- Formulieren Sie Definitionen in eigenen Worten
- Erklären Sie Konzepte anderen (oder sich selbst)

**b) Fallorientiertes Üben:**
- Bearbeiten Sie regelmäßig Fälle
- Beginnen Sie mit einfachen Fällen
- Steigern Sie die Komplexität schrittweise

**c) Wiederholung:**
- Planen Sie feste Wiederholungszeiten ein
- Nutzen Sie Karteikarten für Definitionen
- Wiederholen Sie in steigenden Intervallen`,
    section_type: 'chapter',
    level: 0,
    chapter_number: '2',
    page_start: 14,
    page_end: 15,
    ai_summary: 'Einführung ins juristische Lernen: Verständnis statt Auswendiglernen, Methodenkompetenz, fallbezogenes Denken und Argumentieren.',
    keywords: ['Lernen', 'Jurastudium', 'Lernstrategien', 'Methoden'],
  },
  {
    id: uuidv4(),
    title: 'Tipp: Die Pomodoro-Technik für Juristen',
    content: `**Die Pomodoro-Technik hilft Ihnen, konzentriert zu lernen:**

**So funktioniert es:**
1. Wählen Sie eine Aufgabe (z.B. einen Fall bearbeiten)
2. Stellen Sie einen Timer auf 25 Minuten
3. Arbeiten Sie konzentriert bis der Timer klingelt
4. Machen Sie 5 Minuten Pause
5. Nach 4 „Pomodoros" machen Sie 15-30 Minuten Pause

**Warum funktioniert das im Jurastudium besonders gut?**

- Ein Fall lässt sich gut in 25-Minuten-Einheiten bearbeiten
- Die Pausen verhindern Ermüdung bei komplexen Gedankengängen
- Sie können Ihre Produktivität messen (z.B. „2 Pomodoros pro Fall")
- Es hilft gegen Prokrastination

**Praktischer Tipp:**
Nutzen Sie die Pausen für kurze Bewegung. Das fördert die Durchblutung und damit die Denkfähigkeit.`,
    section_type: 'tip',
    level: 1,
    chapter_number: '2',
    page_start: 15,
    page_end: 16,
    ai_summary: 'Die Pomodoro-Technik (25 Min. Arbeit, 5 Min. Pause) als effektive Lernmethode für das Jurastudium.',
    keywords: ['Pomodoro', 'Lerntechnik', 'Konzentration', 'Produktivität'],
  },
  {
    id: uuidv4(),
    title: '2.3 Der Umgang mit Gesetzestexten',
    content: `Gesetze sind Ihr wichtigstes Arbeitsmittel. Der professionelle Umgang damit will gelernt sein.

**Das Gesetz als Ausgangspunkt:**

Jede juristische Prüfung beginnt mit dem Gesetz. Bevor Sie in Kommentare oder Lehrbücher schauen, lesen Sie immer zuerst den Gesetzestext!

**Techniken für die Arbeit mit Gesetzen:**

**1. Strukturiertes Lesen:**
- Lesen Sie die Norm vollständig
- Identifizieren Sie Tatbestandsmerkmale
- Beachten Sie Verweisungen auf andere Normen

**2. Normzerlegung:**
Zerlegen Sie komplexe Normen in ihre Bestandteile:
- Tatbestand: Was sind die Voraussetzungen?
- Rechtsfolge: Was ist die Konsequenz?
- Ausnahmen: Gibt es Einschränkungen?

**3. Definitionen finden:**
Definitionen finden Sie in:
- Legaldefinitionen im Gesetz selbst
- Kommentaren
- Lehrbüchern
- Ständiger Rechtsprechung

**4. Systematik verstehen:**
Verstehen Sie die Stellung der Norm:
- In welchem Abschnitt steht sie?
- Welche Normen stehen davor/danach?
- Gibt es allgemeine Vorschriften, die gelten?`,
    section_type: 'subchapter',
    level: 1,
    chapter_number: '2',
    page_start: 16,
    page_end: 17,
    ai_summary: 'Professioneller Umgang mit Gesetzestexten: strukturiertes Lesen, Normzerlegung, Definitionen finden, Systematik verstehen.',
    keywords: ['Gesetzestexte', 'Normzerlegung', 'Definitionen', 'Systematik'],
  },
  {
    id: uuidv4(),
    title: 'Hinweis: Die richtigen Hilfsmittel',
    content: `**Empfohlene Hilfsmittel für Ihr Studium:**

**1. Gesetzessammlungen (unverzichtbar):**
- Für das Zivilrecht: BGB, HGB (z.B. dtv-Ausgaben)
- Für das Strafrecht: StGB, StPO
- Für das öffentliche Recht: GG, VwVfG, VwGO

**2. Lehrbücher:**
- Wählen Sie ein Lehrbuch pro Rechtsgebiet
- Lesen Sie es systematisch durch
- Ergänzen Sie mit Skripten für den Überblick

**3. Fallsammlungen:**
- Klausurenkurse der Verlage (Alpmann, Hemmer, etc.)
- Examensreport-Sammlungen
- Übungsbücher mit Lösungen

**4. Kommentare:**
- Für vertiefte Recherche
- Im Studium: Kurzkommentare (z.B. Palandt, heute Grüneberg)
- Nicht zum Durchlesen, sondern zum Nachschlagen

**5. Karteikarten/Lernprogramme:**
- Für Definitionen und Schemata
- Digital (Anki, etc.) oder klassisch auf Papier`,
    section_type: 'tip',
    level: 1,
    chapter_number: '2',
    page_start: 17,
    page_end: 17,
    ai_summary: 'Übersicht empfohlener Hilfsmittel: Gesetzessammlungen, Lehrbücher, Fallsammlungen, Kommentare und Karteikarten.',
    keywords: ['Hilfsmittel', 'Gesetzessammlung', 'Lehrbuch', 'Kommentar'],
  },
  {
    id: uuidv4(),
    title: '2.4 Klausurvorbereitung',
    content: `Die Klausur ist die zentrale Prüfungsform im Jurastudium. Eine gute Vorbereitung ist entscheidend.

**Phasen der Klausurvorbereitung:**

**Phase 1: Stofferarbeitung (semesterbegleitend)**
- Vorlesungen nachbereiten
- Lehrbuch parallel lesen
- Wichtige Definitionen lernen

**Phase 2: Wiederholung (4-6 Wochen vor der Klausur)**
- Stoff systematisch wiederholen
- Schemata einprägen
- Definitionen festigen

**Phase 3: Falltraining (2-4 Wochen vor der Klausur)**
- Alte Klausuren unter Zeitdruck lösen
- Musterlösungen studieren
- Schwächen identifizieren und nacharbeiten

**Phase 4: Feinschliff (letzte Woche)**
- Nur noch wiederholen, nichts Neues lernen
- Formalia üben (Zeiteinteilung, Schriftbild)
- Ausreichend schlafen!

**Zeitmanagement in der Klausur:**

Für eine 2-stündige Klausur:
- 15 Min: Sachverhalt lesen und gliedern
- 15 Min: Lösungsskizze erstellen
- 80 Min: Ausformulieren
- 10 Min: Korrekturlesen

**Goldene Regel:** Nie ohne Lösungsskizze anfangen zu schreiben!`,
    section_type: 'subchapter',
    level: 1,
    chapter_number: '2',
    page_start: 18,
    page_end: 19,
    ai_summary: 'Systematische Klausurvorbereitung in 4 Phasen: Stofferarbeitung, Wiederholung, Falltraining, Feinschliff. Zeitmanagement-Tipps.',
    keywords: ['Klausur', 'Vorbereitung', 'Zeitmanagement', 'Phasen'],
  },
  {
    id: uuidv4(),
    title: 'Wichtig: Die häufigsten Klausurfehler',
    content: `**Vermeiden Sie diese typischen Fehler:**

**1. Fehlende Struktur**
- Problem: Chaotischer Aufbau, kein roter Faden
- Lösung: Immer nach Schema vorgehen, Gliederung erstellen

**2. Falscher Stil**
- Problem: Urteilsstil statt Gutachtenstil verwenden
- Lösung: Konsequent hypothetisch formulieren („könnte", „fraglich ist")

**3. Fehlende Subsumtion**
- Problem: Nur Definition und Ergebnis, keine Subsumtion
- Lösung: Jedes Merkmal einzeln am Sachverhalt prüfen

**4. Schwerpunktsetzung**
- Problem: Unproblematisches ausführlich, Probleme kurz
- Lösung: Probleme erkennen und vertiefen, Offensichtliches kurz halten

**5. Sachverhalt ignorieren**
- Problem: Nicht alle Informationen des Sachverhalts verwerten
- Lösung: Jede Information hat einen Sinn – fragen Sie sich warum!

**6. Zeitprobleme**
- Problem: Nicht fertig werden
- Lösung: Zeitplan erstellen und einhalten, notfalls kürzen

**7. Unlesbare Schrift**
- Problem: Korrektor kann Text nicht lesen
- Lösung: Langsamer und deutlicher schreiben, üben!`,
    section_type: 'important',
    level: 1,
    chapter_number: '2',
    page_start: 19,
    page_end: 19,
    ai_summary: 'Die 7 häufigsten Klausurfehler: fehlende Struktur, falscher Stil, fehlende Subsumtion, Schwerpunkte, Sachverhalt, Zeit, Schrift.',
    keywords: ['Klausurfehler', 'Vermeiden', 'Struktur', 'Stil', 'Subsumtion'],
  },
  {
    id: EXERCISE_3_ID,
    title: 'Übungsaufgabe 3',
    content: `**Aufgabe:**

Sie haben folgende Klausuraufgabe vor sich (Bearbeitungszeit: 2 Stunden):

„Der Student S leiht sich von seinem Kommilitonen K ein wertvolles Lehrbuch. Als S das Buch zurückgeben soll, behauptet er, er habe es verloren. Tatsächlich hat S das Buch behalten und seiner Freundin F geschenkt, weil diese sich das Buch nicht leisten kann. K verlangt Schadensersatz."

**Aufgaben:**

a) Erstellen Sie eine Lösungsskizze (Gliederung) für diese Klausur.

b) Formulieren Sie den Obersatz für einen möglichen Anspruch aus § 280 Abs. 1 BGB im Gutachtenstil.

c) Welche Probleme erkennen Sie im Sachverhalt, die besonders vertieft werden sollten?`,
    section_type: 'exercise',
    level: 1,
    chapter_number: '2',
    page_start: 20,
    page_end: 20,
    ai_summary: 'Übungsaufgabe zur Klausurtechnik: Lösungsskizze erstellen, Obersatz formulieren, Probleme identifizieren (Leihvertrag/Schadensersatz).',
    keywords: ['Übung', 'Klausurtechnik', 'Lösungsskizze', 'Schadensersatz'],
    task_number: '3',
    solution_id: SOLUTION_3_ID,
  },
  {
    id: EXERCISE_4_ID,
    title: 'Übungsaufgabe 4',
    content: `**Aufgabe:**

Formulieren Sie für die folgenden Sachverhalte jeweils:
- Den Obersatz im Gutachtenstil
- Eine vollständige Subsumtion
- Das Ergebnis

**Fall a):**
A schlägt B mit der Faust ins Gesicht. B erleidet einen Bluterguss.
(Prüfen Sie § 223 StGB – Körperverletzung)

**Fall b):**
Verkäufer V und Käufer K einigen sich mündlich über den Kauf eines Gebrauchtwagens für 5.000 €.
(Prüfen Sie, ob ein wirksamer Kaufvertrag gem. § 433 BGB zustande gekommen ist)

**Fall c):**
Mieter M zahlt seit zwei Monaten keine Miete. Vermieter V möchte das Mietverhältnis beenden.
(Nennen Sie die einschlägige Norm und formulieren Sie den Prüfungsansatz)`,
    section_type: 'exercise',
    level: 1,
    chapter_number: '2',
    page_start: 20,
    page_end: 20,
    ai_summary: 'Übungsaufgabe zu Gutachtenstil: Drei Fälle (Körperverletzung, Kaufvertrag, Mietrecht) mit Obersatz, Subsumtion und Ergebnis.',
    keywords: ['Übung', 'Gutachtenstil', 'Körperverletzung', 'Kaufvertrag', 'Mietrecht'],
    task_number: '4',
    solution_id: SOLUTION_4_ID,
  },
  {
    id: uuidv4(),
    title: 'Zusammenfassung Kapitel 2',
    content: `**Die wichtigsten Punkte aus Kapitel 2:**

**1. Besonderheiten des Jurastudiums:**
- Verständnis wichtiger als Auswendiglernen
- Methodenkompetenz als Kernziel
- Fallbezogenes und argumentatives Denken

**2. Effektive Lernstrategien:**
- Aktives statt passives Lernen
- Regelmäßiges Üben an Fällen
- Systematische Wiederholung

**3. Arbeit mit Gesetzestexten:**
- Gesetz als Ausgangspunkt jeder Prüfung
- Strukturiertes Lesen und Normzerlegung
- Systematik verstehen

**4. Klausurvorbereitung:**
- Vier Phasen: Erarbeitung → Wiederholung → Falltraining → Feinschliff
- Zeitmanagement ist entscheidend
- Lösungsskizze vor dem Schreiben

**5. Häufige Fehler vermeiden:**
- Struktur und Gutachtenstil beachten
- Subsumtion nicht vergessen
- Schwerpunkte richtig setzen

**Kernaussage:**
Erfolgreiches juristisches Lernen erfordert eine Kombination aus theoretischem Verständnis und praktischer Übung. Die Methoden müssen so verinnerlicht werden, dass sie in der Klausur automatisch abrufbar sind.`,
    section_type: 'summary',
    level: 1,
    chapter_number: '2',
    page_start: 21,
    page_end: 21,
    ai_summary: 'Zusammenfassung Kapitel 2: Lernbesonderheiten, Strategien, Gesetzesarbeit, Klausurvorbereitung und Fehlervermeidung.',
    keywords: ['Zusammenfassung', 'Lernen', 'Klausur', 'Strategien'],
  },

  // === ABSCHLUSS/ZUSAMMENFASSUNG ===
  {
    id: uuidv4(),
    title: 'Abschließende Zusammenfassung',
    content: `**Zusammenfassung des gesamten Studienbriefs:**

Dieser Studienbrief hat Sie in die Grundlagen der juristischen Methodik eingeführt. Die hier vermittelten Werkzeuge bilden das Fundament für Ihr gesamtes Jurastudium und Ihre spätere berufliche Praxis.

**Die zentralen Erkenntnisse:**

**1. Der Syllogismus als Grundstruktur**
Der juristische Syllogismus (Obersatz – Untersatz – Schlusssatz) ist das logische Grundgerüst jeder Rechtsanwendung. Er verbindet abstrakte Normen mit konkreten Fällen.

**2. Die Subsumtion als Kernkompetenz**
Die Fähigkeit, Sachverhalte unter Rechtsnormen zu subsumieren, ist die zentrale juristische Kompetenz. Sie erfordert präzise Definitionen und sorgfältige Prüfung.

**3. Auslegung erschließt den Norminhalt**
Die vier Auslegungsmethoden (grammatisch, systematisch, historisch, teleologisch) helfen, den Inhalt von Rechtsnormen zu ermitteln.

**4. Der Gutachtenstil strukturiert die Darstellung**
Der Gutachtenstil ist die Form, in der juristische Prüfungen durchgeführt und dargestellt werden. Seine Beherrschung ist für den Studienerfolg unerlässlich.

**5. Juristische Methodik muss geübt werden**
Die Methoden können nicht nur theoretisch gelernt, sondern müssen praktisch geübt werden. Regelmäßiges Falltraining ist der Schlüssel zum Erfolg.

**Ausblick:**
In den folgenden Studienbriefen werden Sie diese Grundlagen vertiefen und auf spezifische Rechtsgebiete anwenden. Die hier gelegten Fundamente werden Sie dabei ständig begleiten.

Viel Erfolg bei Ihrem weiteren Studium!`,
    section_type: 'summary',
    level: 0,
    chapter_number: 'outro',
    page_start: 21,
    page_end: 22,
    ai_summary: 'Abschließende Gesamtzusammenfassung: Syllogismus, Subsumtion, Auslegung, Gutachtenstil und die Bedeutung von Übung.',
    keywords: ['Zusammenfassung', 'Fazit', 'Ausblick', 'Grundlagen'],
  },

  // === LÖSUNGEN ===
  {
    id: uuidv4(),
    title: 'Lösungen zu den Übungsaufgaben',
    content: `Im Folgenden finden Sie die Musterlösungen zu den Übungsaufgaben dieses Studienbriefs.

**Hinweis zur Nutzung:**

Versuchen Sie immer zuerst, die Aufgaben selbstständig zu lösen, bevor Sie die Lösungen lesen. Nur so können Sie überprüfen, ob Sie die Methoden wirklich verstanden haben.

Die Musterlösungen zeigen einen möglichen Lösungsweg. In vielen Fällen sind auch andere Aufbauten oder Argumentationen vertretbar, solange sie methodisch korrekt sind.`,
    section_type: 'chapter',
    level: 0,
    chapter_number: 'solutions',
    page_start: 25,
    page_end: 25,
    ai_summary: 'Einleitung zum Lösungsteil mit Hinweisen zur selbstständigen Bearbeitung vor dem Lesen der Musterlösungen.',
    keywords: ['Lösungen', 'Musterlösung', 'Hinweis'],
  },
  {
    id: SOLUTION_1_ID,
    title: 'Lösung zu Übungsaufgabe 1',
    content: `**Lösung zu Aufgabe 1 (Diebstahl im Kaufhaus):**

**a) Juristischer Syllogismus:**

*Obersatz (Rechtsnorm):*
Gemäß § 242 Abs. 1 StGB wird wegen Diebstahls bestraft, wer eine fremde bewegliche Sache einem anderen in der Absicht wegnimmt, die Sache sich oder einem Dritten rechtswidrig zuzueignen.

*Untersatz (Sachverhalt):*
Herr Müller hat eine DVD, die dem Kaufhaus gehörte (fremde bewegliche Sache), in seine Jackentasche gesteckt und das Geschäft verlassen (Wegnahme), ohne dafür zu bezahlen, mit der Absicht, die DVD zu behalten (Zueignungsabsicht).

*Schlusssatz (Rechtsfolge):*
Herr Müller hat sich des Diebstahls gemäß § 242 Abs. 1 StGB schuldig gemacht.

**b) Subsumtion im Gutachtenstil:**

*Obersatz:*
Herr Müller könnte sich wegen Diebstahls gemäß § 242 Abs. 1 StGB strafbar gemacht haben.

*Tatbestandsmerkmale und Definitionen:*

1. **Fremde Sache:**
Fremd ist eine Sache, wenn sie im Eigentum eines anderen steht.
Die DVD stand im Eigentum des Kaufhauses und war damit für Müller fremd.

2. **Bewegliche Sache:**
Beweglich ist eine Sache, wenn sie fortbewegt werden kann.
Eine DVD kann ohne Weiteres fortbewegt werden.

3. **Wegnahme:**
Wegnahme ist der Bruch fremden und die Begründung neuen Gewahrsams.
Müller hat den Gewahrsam des Kaufhauses an der DVD gebrochen, indem er sie in seine Jackentasche steckte und das Geschäft verließ. Damit hat er eigenen Gewahrsam begründet.

4. **Zueignungsabsicht:**
Zueignungsabsicht liegt vor, wenn der Täter die Sache sich oder einem Dritten zumindest vorübergehend aneignen und den Eigentümer dauerhaft enteignen will.
Müller wollte die DVD behalten und nicht bezahlen. Er hatte Zueignungsabsicht.

5. **Rechtswidrigkeit der Zueignung:**
Die Zueignung ist rechtswidrig, wenn kein Anspruch auf die Sache besteht.
Müller hatte keinen Anspruch auf die unbezahlte DVD. Die Zueignung war rechtswidrig.

*Ergebnis:*
Müller hat sich des Diebstahls gemäß § 242 Abs. 1 StGB strafbar gemacht.`,
    section_type: 'solution',
    level: 1,
    chapter_number: 'solutions',
    page_start: 25,
    page_end: 25,
    ai_summary: 'Musterlösung zu Übungsaufgabe 1: Vollständiger Syllogismus und Subsumtion im Gutachtenstil zum Kaufhausdiebstahl.',
    keywords: ['Lösung', 'Diebstahl', 'Syllogismus', 'Gutachtenstil'],
    exercise_id: EXERCISE_1_ID,
  },
  {
    id: SOLUTION_2_ID,
    title: 'Lösung zu Übungsaufgabe 2',
    content: `**Lösung zu Aufgabe 2 (Parkverbot für Fahrzeuge):**

**a) Elektro-Tretroller (E-Scooter):**

*Grammatisch:* Ein E-Scooter ist nach dem allgemeinen Sprachgebrauch ein Fahrzeug (motorisiert, zur Fortbewegung). → Erfasst

*Systematisch:* Im Straßenverkehrsrecht werden E-Scooter als Kraftfahrzeuge behandelt (eKFV). → Erfasst

*Historisch:* E-Scooter gab es bei Erlass der Norm vermutlich noch nicht. Der Gesetzgeber konnte sie nicht bedenken. → Unklar

*Teleologisch:* Der Zweck (Schutz des Parks/der Fußgänger) spricht für ein Verbot auch von E-Scootern. → Erfasst

**Ergebnis:** E-Scooter fallen unter das Verbot.

**b) Kinderwagen:**

*Grammatisch:* Ein Kinderwagen ist nach dem Sprachgebrauch kein „Fahrzeug". Er dient dem Schieben, nicht dem Fahren. → Nicht erfasst

*Systematisch:* Kinderwagen sind verkehrsrechtlich Fußgängern gleichgestellt. → Nicht erfasst

*Historisch:* Der Gesetzgeber wollte den Park für Fußgänger erhalten. Eltern mit Kinderwagen sind Fußgänger. → Nicht erfasst

*Teleologisch:* Der Normzweck würde verfehlt, wenn Familien ausgeschlossen würden. → Nicht erfasst

**Ergebnis:** Kinderwagen fallen nicht unter das Verbot.

**c) Rollstuhl:**

*Grammatisch:* Sprachlich könnte ein Rollstuhl als Fahrzeug angesehen werden. → Grenzfall

*Systematisch:* Rollstuhlfahrer sind rechtlich Fußgängern gleichgestellt (§ 24 StVO). → Nicht erfasst

*Historisch:* Der Gesetzgeber wollte vermutlich nicht Menschen mit Behinderung ausschließen. → Nicht erfasst

*Teleologisch:* Ein Ausschluss von Rollstuhlfahrern wäre diskriminierend und widerspräche dem Normzweck. → Nicht erfasst

**Ergebnis:** Rollstühle fallen nicht unter das Verbot.

**d) Ferngesteuertes Modellauto:**

*Grammatisch:* Ein Modellauto ist sprachlich ein „Fahrzeug" (Verkleinerungsform). → Tendenziell erfasst

*Systematisch:* Spielzeug wird rechtlich anders behandelt als echte Fahrzeuge. → Nicht erfasst

*Historisch:* Der Gesetzgeber dachte wohl an echte Fahrzeuge, nicht an Spielzeug. → Nicht erfasst

*Teleologisch:* Der Schutzzweck (keine Gefährdung durch fahrende Fahrzeuge) trifft auf Spielzeug weniger zu. → Nicht erfasst

**Ergebnis:** Ferngesteuerte Modellautos fallen nicht unter das Verbot.`,
    section_type: 'solution',
    level: 1,
    chapter_number: 'solutions',
    page_start: 25,
    page_end: 26,
    ai_summary: 'Musterlösung zu Übungsaufgabe 2: Anwendung aller vier Auslegungsmethoden auf E-Scooter, Kinderwagen, Rollstuhl und Modellauto.',
    keywords: ['Lösung', 'Auslegung', 'Fahrzeug', 'Park'],
    exercise_id: EXERCISE_2_ID,
  },
  {
    id: SOLUTION_3_ID,
    title: 'Lösung zu Übungsaufgabe 3',
    content: `**Lösung zu Aufgabe 3 (Lehrbuch-Fall):**

**a) Lösungsskizze:**

I. Anspruch K gegen S auf Schadensersatz aus § 280 Abs. 1, 3, 283 BGB (Schadensersatz statt der Leistung wegen nachträglicher Unmöglichkeit)

1. Schuldverhältnis
   - Leihvertrag, § 598 BGB (+)

2. Pflichtverletzung
   - Rückgabepflicht aus § 604 BGB
   - Nichterfüllung der Rückgabepflicht (+)

3. Unmöglichkeit, § 275 Abs. 1 BGB
   - S hat das Buch weggegeben → Unmöglichkeit (+)

4. Vertretenmüssen, § 280 Abs. 1 S. 2 BGB
   - Vorsätzliche Weitergabe → Verschulden (+)

5. Schaden
   - Wert des Buches

6. Ergebnis: Anspruch (+)

II. Ggf. weitere Ansprüche
- § 823 Abs. 1 BGB (Eigentumsverletzung)
- § 812 Abs. 1 S. 1 Alt. 2 BGB (Eingriffskondiktion gegen F)

**b) Obersatz im Gutachtenstil:**

„K könnte gegen S einen Anspruch auf Schadensersatz statt der Leistung aus §§ 280 Abs. 1, 3, 283 BGB haben."

**c) Probleme zur Vertiefung:**

1. **Unmöglichkeit vs. Verzug:**
   Ist die Rückgabe wirklich unmöglich geworden? S könnte das Buch theoretisch von F zurückfordern. Problem der subjektiven vs. objektiven Unmöglichkeit.

2. **Vertretenmüssen:**
   S hat vorsätzlich gehandelt. Aber liegt auch Verschulden vor, wenn er glaubte, das Buch ersetzen zu können?

3. **Schadensberechnung:**
   Wie bemisst sich der Schaden? Anschaffungskosten für ein neues Buch? Zeitwert? Besonderer persönlicher Wert?

4. **Verhältnis zu anderen Ansprüchen:**
   Kann K auch F direkt in Anspruch nehmen? Welche Ansprüche bestehen nebeneinander?`,
    section_type: 'solution',
    level: 1,
    chapter_number: 'solutions',
    page_start: 26,
    page_end: 26,
    ai_summary: 'Musterlösung zu Übungsaufgabe 3: Lösungsskizze zum Schadensersatz bei Leihvertrag, Obersatz und Problemschwerpunkte.',
    keywords: ['Lösung', 'Schadensersatz', 'Leihvertrag', 'Lösungsskizze'],
    exercise_id: EXERCISE_3_ID,
  },
  {
    id: SOLUTION_4_ID,
    title: 'Lösung zu Übungsaufgabe 4',
    content: `**Lösung zu Aufgabe 4 (Gutachtenstil-Übungen):**

**Fall a) Körperverletzung:**

*Obersatz:*
A könnte sich wegen Körperverletzung gemäß § 223 Abs. 1 StGB strafbar gemacht haben.

*Subsumtion:*
§ 223 Abs. 1 StGB erfordert eine körperliche Misshandlung oder Gesundheitsschädigung einer anderen Person.

Eine körperliche Misshandlung ist jede üble, unangemessene Behandlung, die das körperliche Wohlbefinden mehr als nur unerheblich beeinträchtigt. A hat B mit der Faust ins Gesicht geschlagen. Ein Faustschlag ins Gesicht stellt eine üble, unangemessene Behandlung dar, die das körperliche Wohlbefinden erheblich beeinträchtigt. Eine körperliche Misshandlung liegt vor.

Eine Gesundheitsschädigung ist das Hervorrufen oder Steigern eines pathologischen Zustandes. Der Bluterguss ist ein pathologischer Zustand, der durch den Schlag hervorgerufen wurde. Eine Gesundheitsschädigung liegt ebenfalls vor.

B ist eine andere Person als A.

*Ergebnis:*
A hat sich wegen Körperverletzung gemäß § 223 Abs. 1 StGB strafbar gemacht.

**Fall b) Kaufvertrag:**

*Obersatz:*
Es könnte ein wirksamer Kaufvertrag zwischen V und K gemäß § 433 BGB zustande gekommen sein.

*Subsumtion:*
Ein Kaufvertrag setzt zwei übereinstimmende Willenserklärungen (Angebot und Annahme) über den Kauf einer Sache zu einem bestimmten Preis voraus.

V und K haben sich mündlich über den Kauf des Gebrauchtwagens für 5.000 € geeinigt. Damit liegen zwei übereinstimmende Willenserklärungen über den Kaufgegenstand (Gebrauchtwagen) und den Kaufpreis (5.000 €) vor.

Ein Kaufvertrag über bewegliche Sachen bedarf keiner besonderen Form. Die mündliche Einigung ist ausreichend.

*Ergebnis:*
Ein wirksamer Kaufvertrag gemäß § 433 BGB ist zustande gekommen.

**Fall c) Mietrecht:**

*Einschlägige Norm:*
§ 543 Abs. 2 S. 1 Nr. 3 BGB (außerordentliche fristlose Kündigung wegen Zahlungsverzugs)

*Prüfungsansatz (Obersatz):*
V könnte das Mietverhältnis gemäß § 543 Abs. 2 S. 1 Nr. 3 BGB außerordentlich fristlos kündigen.

*Voraussetzungen:*
- Mietverhältnis (+)
- Zahlungsverzug mit zwei aufeinanderfolgenden Terminen (+, da zwei Monate)
- Rückstand erreicht erheblichen Teil (eine Monatsmiete) (+)
- Kündigung erforderlich

*Ergebnis bei Bejahung aller Voraussetzungen:*
V kann das Mietverhältnis außerordentlich fristlos kündigen.`,
    section_type: 'solution',
    level: 1,
    chapter_number: 'solutions',
    page_start: 26,
    page_end: 26,
    ai_summary: 'Musterlösung zu Übungsaufgabe 4: Vollständige Gutachten zu Körperverletzung, Kaufvertrag und Mietkündigung.',
    keywords: ['Lösung', 'Gutachtenstil', 'Körperverletzung', 'Kaufvertrag', 'Mietrecht'],
    exercise_id: EXERCISE_4_ID,
  },

  // === LITERATURVERZEICHNIS (AM ENDE) ===
  {
    id: uuidv4(),
    title: 'Literaturverzeichnis',
    content: `**Empfohlene Literatur zur Vertiefung:**

**Zur juristischen Methodenlehre:**

• **Zippelius, Reinhold:** Juristische Methodenlehre, 12. Auflage, München 2021
  - Standardwerk zur juristischen Methodenlehre
  - Besonders empfehlenswert: Kapitel 3 und 4 zur Auslegung

• **Larenz, Karl / Canaris, Claus-Wilhelm:** Methodenlehre der Rechtswissenschaft, 3. Auflage, Berlin 1995
  - Klassiker der Methodenlehre
  - Umfassend und wissenschaftlich

• **Schwacke, Peter:** Juristische Methodik, 5. Auflage, Stuttgart 2011
  - Praxisorientierte Einführung
  - Gut für Studienanfänger geeignet

**Zur juristischen Arbeitstechnik:**

• **Möllers, Thomas M.J.:** Juristische Arbeitstechnik und wissenschaftliches Arbeiten, 10. Auflage, München 2022
  - Praktische Anleitungen
  - Kapitel zum Gutachtenstil besonders hilfreich

• **Valerius, Brian:** Einführung in den Gutachtenstil, 5. Auflage, Berlin 2021
  - Kompakte Einführung
  - Viele Übungsbeispiele

**Weiterführende Kommentare:**

• **Grüneberg (ehemals Palandt):** Bürgerliches Gesetzbuch, 83. Auflage, München 2024
  - Der klassische Kurzkommentar zum BGB

• **Schönke/Schröder:** Strafgesetzbuch Kommentar, 30. Auflage, München 2019
  - Standardkommentar zum StGB`,
    section_type: 'reference',
    level: 0,
    chapter_number: 'appendix',
    page_start: 27,
    page_end: 27,
    ai_summary: 'Literaturverzeichnis mit Empfehlungen zur juristischen Methodenlehre, Arbeitstechnik und wichtigen Kommentaren.',
    keywords: ['Literatur', 'Vertiefung', 'Methodenlehre', 'Kommentare', 'Empfehlung'],
  },
]

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient()

    // Get user ID from request body or fetch from existing document
    const body = await request.json().catch(() => ({}))
    let userId = body.userId

    // If no userId provided, try to get from existing documents
    if (!userId) {
      const { data: existingDoc } = await supabase
        .from('documents')
        .select('user_id')
        .limit(1)
        .single()

      if (existingDoc) {
        userId = existingDoc.user_id
      } else {
        return NextResponse.json(
          { message: 'Kein userId angegeben und keine existierenden Dokumente gefunden' },
          { status: 400 }
        )
      }
    }

    // Check if document already exists
    const { data: existingDoc } = await supabase
      .from('documents')
      .select('id')
      .eq('title', 'Rechtsmethoden - Studienbrief 1')
      .single()

    if (existingDoc) {
      return NextResponse.json(
        { message: 'Studienbrief bereits vorhanden', documentId: existingDoc.id },
        { status: 200 }
      )
    }

    // Create document
    const documentId = uuidv4()
    const { error: docError } = await supabase
      .from('documents')
      .insert({
        id: documentId,
        user_id: userId,
        title: 'Rechtsmethoden - Studienbrief 1',
        original_filename: 'Studienbrief 1_Rechtsmethoden.pdf',
        storage_path: `${userId}/studienbrief-rechtsmethoden.pdf`,
        total_pages: 27,
        has_images: false,
        ai_summary: 'Dieser Studienbrief führt in die Grundlagen der juristischen Methodik ein: Syllogismus, Subsumtion, Auslegungsmethoden und Gutachtenstil. Er vermittelt die fundamentalen Werkzeuge für das Jurastudium und die juristische Praxis.',
        processing_status: 'completed',
      })

    if (docError) {
      console.error('Document insert error:', docError)
      return NextResponse.json(
        { message: 'Fehler beim Erstellen des Dokuments', error: docError.message },
        { status: 500 }
      )
    }

    // Insert all sections
    const sectionsToInsert = STUDIENBRIEF_SECTIONS.map((section, index) => ({
      id: section.id,
      document_id: documentId,
      title: section.title,
      content: section.content,
      order_index: index,
      page_start: section.page_start,
      page_end: section.page_end,
      ai_summary: section.ai_summary,
      section_type: section.section_type,
      metadata: {
        level: section.level,
        chapter_number: section.chapter_number,
        keywords: section.keywords,
        task_number: section.task_number,
        solution_id: section.solution_id,
        exercise_id: section.exercise_id,
      },
      images: [],
      formatting: {
        hasBold: section.content.includes('**'),
        hasItalic: section.content.includes('*') && !section.content.includes('**'),
        hasList: section.content.includes('- ') || section.content.includes('• '),
        hasTable: false,
      },
    }))

    const { error: sectionsError } = await supabase
      .from('sections')
      .insert(sectionsToInsert)

    if (sectionsError) {
      console.error('Sections insert error:', sectionsError)
      // Rollback: delete the document
      await supabase.from('documents').delete().eq('id', documentId)
      return NextResponse.json(
        { message: 'Fehler beim Erstellen der Abschnitte', error: sectionsError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      documentId,
      title: 'Rechtsmethoden - Studienbrief 1',
      sectionsCount: sectionsToInsert.length,
      message: 'Studienbrief erfolgreich erstellt',
    })

  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Fehler beim Seeden des Studienbriefs' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve info about the seeded document
export async function GET() {
  try {
    const supabase = getSupabaseClient()

    const { data: doc, error } = await supabase
      .from('documents')
      .select(`
        id,
        title,
        total_pages,
        processing_status,
        sections (
          id,
          title,
          section_type,
          metadata
        )
      `)
      .eq('title', 'Rechtsmethoden - Studienbrief 1')
      .single()

    if (error) {
      return NextResponse.json(
        { message: 'Studienbrief nicht gefunden', exists: false },
        { status: 404 }
      )
    }

    return NextResponse.json({
      exists: true,
      document: doc,
    })

  } catch (error) {
    console.error('Get error:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Fehler beim Abrufen' },
      { status: 500 }
    )
  }
}

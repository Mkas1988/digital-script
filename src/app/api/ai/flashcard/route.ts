import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `Du bist ein Experte für das Erstellen von Lernkarten. Generiere aus dem gegebenen Text eine prägnante Frage und Antwort.

STRIKTE Regeln:
- Die Frage soll das Kernkonzept des Textes abfragen
- Die Antwort soll kurz und präzise sein (1-2 Sätze)
- Deutsch
- Keine Einleitungen oder Erklärungen
- Antworte NUR im JSON Format

Beispiel:
Text: "Die Photosynthese ist der Prozess, bei dem Pflanzen Lichtenergie nutzen, um aus Kohlendioxid und Wasser Glucose und Sauerstoff zu produzieren."
Antwort: {"question": "Was ist Photosynthese und welche Stoffe werden dabei produziert?", "answer": "Photosynthese ist der Prozess, bei dem Pflanzen Lichtenergie nutzen, um aus CO2 und Wasser Glucose und Sauerstoff herzustellen."}`

export async function POST(request: NextRequest) {
  try {
    const { selectedText, context } = await request.json()

    if (!selectedText) {
      return NextResponse.json(
        { error: 'Ausgewählter Text ist erforderlich' },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY ist nicht konfiguriert' },
        { status: 500 }
      )
    }

    const userPrompt = context
      ? `Kontext: ${context}\n\nText für Lernkarte: ${selectedText}`
      : `Text für Lernkarte: ${selectedText}`

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('OpenAI API error:', errorData)
      return NextResponse.json(
        {
          error:
            errorData.error?.message ||
            `API Fehler: ${response.status}`,
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'Keine Antwort von der KI erhalten' },
        { status: 500 }
      )
    }

    try {
      const parsed = JSON.parse(content)
      return NextResponse.json({
        question: parsed.question,
        answer: parsed.answer,
      })
    } catch {
      return NextResponse.json(
        { error: 'Fehler beim Parsen der KI-Antwort' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('AI flashcard error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Ein unerwarteter Fehler ist aufgetreten',
      },
      { status: 500 }
    )
  }
}

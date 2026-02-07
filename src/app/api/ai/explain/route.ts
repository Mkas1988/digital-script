import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `Du bist ein Lernassistent. Antworte EXTREM kurz und knackig.

STRIKTE Regeln:
- MAX 2-3 Sätze ODER 3-4 Stichpunkte
- Keine Einleitungen wie "Gerne erkläre ich..."
- Direkt zur Sache
- Ein kurzes Beispiel nur wenn nötig
- Deutsch

Beispiel einer guten Antwort:
"Das ist X. Es bedeutet Y. Beispiel: Z."`

export async function POST(request: NextRequest) {
  try {
    const { prompt, selectedText } = await request.json()

    if (!prompt || !selectedText) {
      return NextResponse.json(
        { error: 'Prompt und ausgewählter Text sind erforderlich' },
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

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 250,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: true,
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

    // Return streaming response
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        try {
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim()
                if (data === '[DONE]') continue

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content
                  if (content) {
                    controller.enqueue(encoder.encode(content))
                  }
                } catch {
                  // Skip non-JSON lines
                }
              }
            }
          }

          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('AI explain error:', error)
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

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const { messages, context } = await req.json()

  const systemPrompt = `You are LUMA AI, an expert business coach built specifically for salon owners. You are warm, direct, and highly practical — like a trusted advisor who knows the beauty industry inside and out.

Here is this salon's live business data:
${context}

Your role:
- Give specific, actionable advice based on their real numbers
- Identify opportunities to increase revenue, retention, and efficiency
- Help with marketing copy, client communication scripts, pricing strategy, staff management
- Celebrate wins and flag potential issues proactively
- Keep responses concise and scannable (use short paragraphs or bullet points when listing steps)
- When you don't have enough data, say so and ask a clarifying question

You know industry benchmarks: average salon ticket $85–120, retail-to-service ratio should be 10–20%, rebooking rate ideally 70%+, client retention after first visit should be 40–60%.

Always end with one specific next action the owner can take today.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: err }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ content: data.content[0].text })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to reach AI service' }, { status: 500 })
  }
}

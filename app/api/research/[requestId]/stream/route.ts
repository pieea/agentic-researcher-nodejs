import { NextRequest } from 'next/server'

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8080'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params

    const response = await fetch(
      `${BACKEND_API_URL}/api/research/${requestId}/stream`,
      {
        headers: {
          Accept: 'text/event-stream',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.statusText}`)
    }

    // Pass through the SSE stream from backend
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('API stream error:', error)
    return new Response(
      `data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })}\n\n`,
      {
        status: 500,
        headers: {
          'Content-Type': 'text/event-stream',
        },
      }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getWorkflowState } from '@/lib/storage'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params

    const state = getWorkflowState(requestId)

    if (!state) {
      return NextResponse.json(
        { error: 'Research request not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      request_id: requestId,
      query: state.query,
      status: state.status,
      raw_results: state.raw_results || [],
      clusters: state.clusters || [],
      insights: state.insights || {},
      error: state.error,
    })
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

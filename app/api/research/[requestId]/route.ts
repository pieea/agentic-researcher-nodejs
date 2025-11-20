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

    console.log(`[${requestId}] Returning final state:`, {
      status: state.status,
      raw_results_count: state.raw_results?.length || 0,
      clusters_count: state.clusters?.length || 0,
      insights_available: !!state.insights
    })

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

import { NextRequest } from 'next/server'
import { getWorkflowState } from '@/lib/storage'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        let lastStatus: string | null = null

        // Poll for updates
        const interval = setInterval(() => {
          const state = getWorkflowState(requestId)

          if (!state) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ status: 'not_found' })}\n\n`)
            )
            controller.close()
            clearInterval(interval)
            return
          }

          const status = state.status

          // Only send update if status changed or has useful information
          if (status !== lastStatus) {
            const progressData: any = {
              status,
              query: state.query,
            }

            // Add status-specific details
            if (status === 'initialized') {
              progressData.message = '분석 준비 중...'
              progressData.node = 'search'
            } else if (status === 'searching') {
              progressData.message = '검색 중...'
              progressData.node = 'search'
            } else if (status === 'search_completed') {
              const resultsCount = state.raw_results?.length || 0
              progressData.message = `검색 완료 (${resultsCount}개 결과)`
              progressData.node = 'search'
              progressData.results_count = resultsCount
            } else if (status === 'analyzing') {
              progressData.message = '데이터 분석 중...'
              progressData.node = 'analysis'
            } else if (status === 'clustering_completed' || status === 'clustering_skipped') {
              const clustersCount = state.clusters?.length || 0
              progressData.message = `클러스터링 완료 (${clustersCount}개 주제)`
              progressData.node = 'analysis'
              progressData.clusters_count = clustersCount
            } else if (status === 'generating_insights') {
              progressData.message = '인사이트 생성 중...'
              progressData.node = 'insight'
            } else if (status === 'completed') {
              progressData.message = '분석 완료'
              progressData.node = 'insight'
              progressData.clusters_count = state.clusters?.length || 0
              progressData.insights_count = state.insights?.insights?.length || 0
            } else if (status === 'failed') {
              progressData.message = '오류 발생'
              progressData.error = state.error || 'Unknown error'
            }

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(progressData)}\n\n`)
            )
            lastStatus = status
          }

          // Close stream if completed or failed
          if (status === 'completed' || status === 'failed') {
            controller.close()
            clearInterval(interval)
          }
        }, 100) // Poll every 100ms

        // Cleanup on abort
        request.signal.addEventListener('abort', () => {
          clearInterval(interval)
          controller.close()
        })
      },
    })

    return new Response(stream, {
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

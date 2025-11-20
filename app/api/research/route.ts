import { NextRequest, NextResponse } from 'next/server'
import { createResearchWorkflow } from '@/lib/workflow/graph'
import { ResearchState } from '@/lib/workflow/state'
import { setWorkflowState } from '@/lib/storage'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Generate request ID
    const requestId = randomUUID()

    // Initialize state
    const initialState: ResearchState = {
      query,
      raw_results: [],
      clusters: [],
      insights: {},
      status: 'initialized',
    }

    // Store initial state
    setWorkflowState(requestId, initialState)

    // Execute workflow in background (don't await)
    executeWorkflow(requestId, query).catch((error) => {
      console.error(`Workflow execution failed for ${requestId}:`, error)
    })

    return NextResponse.json({
      request_id: requestId,
      status: 'processing',
    })
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function executeWorkflow(requestId: string, query: string) {
  try {
    const workflow = createResearchWorkflow({
      tavily_api_key: process.env.TAVILY_API_KEY!,
      openai_api_key: process.env.OPENAI_API_KEY!,
      max_search_results: 30,
    })

    const initialState: ResearchState = {
      query,
      raw_results: [],
      clusters: [],
      insights: {},
      status: 'initialized',
    }

    console.log(`[${requestId}] Starting workflow execution`)

    // Execute workflow with streaming to capture intermediate states
    for await (const output of await workflow.stream(initialState)) {
      // LangGraph stream returns dict with node name as key
      for (const [nodeName, nodeState] of Object.entries(output)) {
        const currentStatus = (nodeState as ResearchState).status || 'unknown'
        console.log(`[${requestId}] Node '${nodeName}' completed with status: ${currentStatus}`)

        // Update workflow state in real-time
        setWorkflowState(requestId, nodeState as ResearchState)

        // Small delay to ensure SSE can catch the update
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    console.log(`[${requestId}] Workflow completed`)
  } catch (error) {
    console.error(`Workflow execution failed for ${requestId}:`, error)

    // Update state with error
    const errorState = {
      query,
      raw_results: [],
      clusters: [],
      insights: {},
      status: 'failed' as const,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
    setWorkflowState(requestId, errorState)
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to submit research queries',
    status: 'ready',
  })
}

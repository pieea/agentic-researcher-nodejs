import { StateGraph, END } from '@langchain/langgraph'
import { ResearchState } from './state'
import { SearchAgent } from '../agents/search-agent'
import { AnalysisAgent } from '../agents/analysis-agent'
import { InsightAgent, ClusterInfo } from '../agents/insight-agent'

interface Settings {
  tavily_api_key: string
  openai_api_key: string
  embedding_model?: string
  max_search_results?: number
}

export function createResearchWorkflow(settings: Settings) {
  // Initialize agents
  const searchAgent = new SearchAgent(settings.tavily_api_key)
  const analysisAgent = new AnalysisAgent(
    settings.openai_api_key,
    settings.embedding_model || 'text-embedding-3-small'
  )
  const insightAgent = new InsightAgent(settings.openai_api_key)

  const maxSearchResults = settings.max_search_results || 30

  // Define node functions
  async function searchNode(state: ResearchState): Promise<Partial<ResearchState>> {
    console.log(`Search node: querying '${state.query}'`)

    try {
      const results = await searchAgent.search(state.query, maxSearchResults)

      // Check if we got any results
      if (!results || results.length === 0) {
        console.warn(`No search results found for query: '${state.query}'`)
        return {
          raw_results: [],
          status: 'failed',
          error: '검색 결과를 찾을 수 없습니다. 다른 키워드로 다시 시도해주세요.',
        }
      }

      console.log(`Found ${results.length} results`)
      return {
        raw_results: results,
        status: 'search_completed',
      }
    } catch (error: any) {
      console.error(`Search failed: ${error.message}`)
      return {
        status: 'failed',
        error: error.message,
      }
    }
  }

  async function analysisNode(state: ResearchState): Promise<Partial<ResearchState>> {
    console.log('Analysis node: generating embeddings')

    try {
      // Check if we have results to analyze
      if (!state.raw_results || state.raw_results.length === 0) {
        console.error('No search results to analyze')
        return {
          status: 'failed',
          error: '분석할 검색 결과가 없습니다.',
        }
      }

      // Combine title and content for embedding
      const texts = state.raw_results.map((r) => `${r.title}. ${r.content}`)

      // Generate embeddings
      const embeddings = await analysisAgent.generateEmbeddings(texts)

      let clusters: ClusterInfo[] = []
      let clusterLabels: number[] = []
      let status: ResearchState['status'] = 'clustering_completed'

      // Cluster embeddings
      if (embeddings.length >= 5) {
        // Need minimum documents for clustering
        const labels = analysisAgent.clusterEmbeddings(embeddings, 2)
        clusterLabels = labels

        // Get unique cluster IDs
        const uniqueClusters = [...new Set(labels)].filter((label) => label !== -1).sort()

        // Check if we have any valid clusters
        if (uniqueClusters.length === 0) {
          // All points are noise, treat as single cluster
          console.warn('All documents classified as noise, creating single cluster')
          clusters = [
            {
              id: 0,
              name: state.query,
              size: state.raw_results.length,
              keywords: [],
              documents: state.raw_results.slice(0, 3),
            },
          ]
          status = 'clustering_skipped'
        } else {
          // Extract keywords per cluster
          const keywordsMap = analysisAgent.extractClusterKeywords(texts, labels, 5)

          // Generate cluster names only for existing clusters
          const keywordsList = uniqueClusters.map((id) => keywordsMap[id] || [])
          const clusterNames = await insightAgent.generateClusterNames(keywordsList)

          // Build cluster info
          for (let idx = 0; idx < uniqueClusters.length; idx++) {
            const clusterId = uniqueClusters[idx]
            const clusterDocs = state.raw_results.filter((_, i) => labels[i] === clusterId)

            // Only add clusters that have documents
            if (clusterDocs.length > 0) {
              clusters.push({
                id: clusterId,
                name: clusterNames[idx] || `주제 ${clusterId}`,
                size: clusterDocs.length,
                keywords: keywordsMap[clusterId] || [],
                documents: clusterDocs.slice(0, 3), // Top 3 representative docs
              })
            }
          }

          console.log(`Created ${clusters.length} clusters from ${uniqueClusters.length} unique labels`)
        }
      } else {
        // Too few results, skip clustering
        clusters = [
          {
            id: 0,
            name: state.query,
            size: state.raw_results.length,
            keywords: [],
            documents: state.raw_results.slice(0, 3),
          },
        ]
        status = 'clustering_skipped'
      }

      return {
        embeddings,
        cluster_labels: clusterLabels,
        clusters,
        status,
      }
    } catch (error: any) {
      console.error(`Analysis failed: ${error.message}`)
      return {
        status: 'failed',
        error: error.message,
      }
    }
  }

  async function insightNode(state: ResearchState): Promise<Partial<ResearchState>> {
    console.log('Insight node: generating insights')

    try {
      const insights = await insightAgent.generateInsights(
        state.query,
        state.clusters,
        state.raw_results
      )

      return {
        insights,
        status: 'completed',
      }
    } catch (error: any) {
      console.error(`Insight generation failed: ${error.message}`)
      return {
        status: 'failed',
        error: error.message,
      }
    }
  }

  // Define conditional routing function
  function shouldContinueAfterSearch(state: ResearchState): string {
    if (state.status === 'failed') {
      console.log('Search failed, skipping analysis and insight generation')
      return 'end'
    }
    return 'continue'
  }

  // Build graph
  const workflow = new StateGraph<ResearchState>({
    channels: {
      query: null,
      raw_results: null,
      embeddings: null,
      cluster_labels: null,
      clusters: null,
      insights: null,
      status: null,
      error: null,
    },
  })

  // Add nodes
  workflow.addNode('search', searchNode)
  workflow.addNode('analysis', analysisNode)
  workflow.addNode('insight', insightNode)

  // Define edges with conditional routing
  workflow.setEntryPoint('search')
  workflow.addConditionalEdges('search', shouldContinueAfterSearch, {
    continue: 'analysis',
    end: END,
  })
  workflow.addEdge('analysis', 'insight')
  workflow.addEdge('insight', END)

  return workflow.compile()
}

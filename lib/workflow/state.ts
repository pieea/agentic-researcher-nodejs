import { SearchResult } from '../agents/search-agent'
import { ClusterInfo, InsightResult } from '../agents/insight-agent'

export type ResearchStatus =
  | 'initialized'
  | 'searching'
  | 'search_completed'
  | 'analyzing'
  | 'clustering_completed'
  | 'clustering_skipped'
  | 'generating_insights'
  | 'insights_completed'
  | 'completed'
  | 'failed'

export interface ResearchState {
  query: string
  raw_results: SearchResult[]
  embeddings?: number[][]
  cluster_labels?: number[]
  clusters: ClusterInfo[]
  insights: Partial<InsightResult>
  status: ResearchStatus
  error?: string
}

export interface ResearchRequest {
  query: string
}

export interface ResearchResponse {
  request_id: string
  status: string
}

export interface ClusterInfo {
  id: number
  name: string
  size: number
  keywords: string[]
  documents: Document[]
}

export interface Document {
  title: string
  url: string
  content?: string
  score?: number
  published_date?: string
  source?: string
}

export interface InsightInfo {
  insights: string[]
  success_cases: string[]
  failure_cases: string[]
  market_outlook: string[]
  summary: string
  cluster_count: number
  total_documents: number
}

export interface SearchResult {
  title: string
  url: string
  content: string
  score: number
  published_date?: string
  source: string
}

export interface ResearchResult {
  request_id: string
  query: string
  status: string
  raw_results: SearchResult[]
  clusters: ClusterInfo[]
  insights?: InsightInfo
  created_at: string
  completed_at?: string
}

export type ResearchStatus =
  | 'idle'
  | 'searching'
  | 'search_completed'
  | 'analyzing'
  | 'clustering_completed'
  | 'clustering_skipped'
  | 'generating_insights'
  | 'insights_completed'
  | 'completed'
  | 'failed'

export interface ProgressUpdate {
  status: ResearchStatus
  query?: string
  message?: string
  node?: 'search' | 'analysis' | 'insight'
  results_count?: number
  clusters_count?: number
  insights_count?: number
  error?: string
}

// Legacy types for visualization components
export interface TrendData {
  date: string
  value: number
  topic: string
}

export interface ClusterNode {
  id: string
  label: string
  group: number
  value: number
}

export interface ClusterLink {
  source: string
  target: string
  value: number
}

export interface ClusterData {
  nodes: ClusterNode[]
  links: ClusterLink[]
}

export interface ApiResponse<T> {
  data?: T
  error?: string
}

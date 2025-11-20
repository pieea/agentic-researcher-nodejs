import { TavilyClient } from 'tavily'

export interface SearchResult {
  title: string
  url: string
  content: string
  score: number
  published_date?: string
  source: string
}

export class SearchAgent {
  private client: TavilyClient

  constructor(apiKey: string) {
    this.client = new TavilyClient({ apiKey })
  }

  async search(query: string, maxResults: number = 30): Promise<SearchResult[]> {
    try {
      const response = await this.client.search({
        query,
        max_results: maxResults,
        search_depth: 'advanced',
        include_domains: [],
        exclude_domains: []
      })

      const results: SearchResult[] = []

      for (const item of response.results || []) {
        // Parse score (Tavily returns string)
        const score = parseFloat(item.score) || 0.0

        // Note: Tavily API doesn't provide published_date in basic response
        // We'll use undefined for now
        const publishedDate = undefined
        const recencyBoost = this.calculateRecencyBoost(publishedDate)

        results.push({
          title: item.title || '',
          url: item.url || '',
          content: item.content || '',
          score: score * recencyBoost,
          published_date: publishedDate,
          source: this.extractDomain(item.url || '')
        })
      }

      // Sort by adjusted score
      results.sort((a, b) => b.score - a.score)

      // Diversify sources to avoid over-representation from single domains
      const diversifiedResults = this.diversifySources(results, 5)

      console.log(`Search completed: ${diversifiedResults.length} results for query '${query}' (diversified from ${results.length} total)`)

      return diversifiedResults
    } catch (error) {
      console.error(`Search failed for query '${query}':`, error)
      throw error
    }
  }

  private calculateRecencyBoost(publishedDate?: string): number {
    if (!publishedDate) {
      return 1.0
    }

    try {
      const pubDate = new Date(publishedDate.replace('Z', '+00:00'))
      const now = new Date()
      const daysAgo = Math.floor((now.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysAgo <= 2) {
        return 1.5  // Last 2 days: 50% boost
      } else if (daysAgo <= 7) {
        return 1.2  // Last week: 20% boost
      } else {
        return 1.0  // Older: no boost
      }
    } catch (error) {
      console.debug(`Failed to parse date '${publishedDate}':`, error)
      return 1.0
    }
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch (error) {
      console.debug(`Failed to extract domain from '${url}':`, error)
      return 'unknown'
    }
  }

  private diversifySources(results: SearchResult[], maxPerDomain: number = 5): SearchResult[] {
    const domainCount: Record<string, number> = {}
    const diversified: SearchResult[] = []

    for (const result of results) {
      const domain = result.source || 'unknown'

      // Check if we've already included max results from this domain
      if ((domainCount[domain] || 0) < maxPerDomain) {
        diversified.push(result)
        domainCount[domain] = (domainCount[domain] || 0) + 1
      }
    }

    if (Object.keys(domainCount).length > 0) {
      const maxCount = Math.max(...Object.values(domainCount))
      console.log(`Source diversity: ${Object.keys(domainCount).length} unique domains, max ${maxCount} per domain`)
    }

    return diversified
  }
}

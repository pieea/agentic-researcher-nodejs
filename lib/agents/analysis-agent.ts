import { OpenAI } from 'openai'
import { kmeans } from 'ml-kmeans'
import * as natural from 'natural'

const TfIdf = natural.TfIdf

export class AnalysisAgent {
  private openai: OpenAI
  private embeddingModel: string

  constructor(apiKey: string, embeddingModel: string = 'text-embedding-3-small') {
    this.openai = new OpenAI({ apiKey })
    this.embeddingModel = embeddingModel
    console.log(`Initialized AnalysisAgent with embedding model: ${embeddingModel}`)
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    console.log(`Generating embeddings for ${texts.length} texts`)

    try {
      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: texts,
      })

      const embeddings = response.data.map(item => item.embedding)
      return embeddings
    } catch (error) {
      console.error('Failed to generate embeddings:', error)
      throw error
    }
  }

  clusterEmbeddings(embeddings: number[][], minClusterSize: number = 2): number[] {
    console.log(`Clustering ${embeddings.length} embeddings`)

    const nDocs = embeddings.length

    // Use K-means with dynamic cluster count
    // Use sqrt(n) as a heuristic for number of clusters
    const nClusters = Math.max(2, Math.min(5, Math.floor(Math.sqrt(nDocs))))
    console.log(`Using K-means with ${nClusters} clusters`)

    try {
      const result = kmeans(embeddings, nClusters, {
        initialization: 'kmeans++',
        seed: 42
      })

      const labels = result.clusters
      console.log(`K-means created ${Math.max(...labels) + 1} clusters`)

      return labels
    } catch (error) {
      console.error('Clustering failed:', error)
      // Fallback: assign all to single cluster
      return new Array(nDocs).fill(0)
    }
  }

  extractClusterKeywords(
    texts: string[],
    labels: number[],
    topK: number = 5
  ): Record<number, string[]> {
    const clusterKeywords: Record<number, string[]> = {}
    const uniqueLabels = [...new Set(labels)]

    for (const label of uniqueLabels) {
      if (label === -1) {
        // Skip noise
        continue
      }

      // Get texts for this cluster
      const clusterTexts = texts.filter((_, i) => labels[i] === label)

      if (clusterTexts.length === 0) {
        continue
      }

      // Extract keywords using TF-IDF
      try {
        const tfidf = new TfIdf()

        // Add documents to TF-IDF
        clusterTexts.forEach(text => tfidf.addDocument(text))

        // Get top terms across all documents in this cluster
        const termScores: Record<string, number> = {}

        clusterTexts.forEach((_, docIndex) => {
          tfidf.listTerms(docIndex).forEach((item: any) => {
            if (item.term.length > 2) {  // Filter out very short words
              termScores[item.term] = (termScores[item.term] || 0) + item.tfidf
            }
          })
        })

        // Sort by TF-IDF score and get top K
        const keywords = Object.entries(termScores)
          .sort((a, b) => b[1] - a[1])
          .slice(0, topK)
          .map(([term]) => term)

        clusterKeywords[label] = keywords
      } catch (error) {
        console.error(`Failed to extract keywords for cluster ${label}:`, error)
        clusterKeywords[label] = []
      }
    }

    return clusterKeywords
  }
}

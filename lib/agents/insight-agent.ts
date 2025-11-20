import { ChatOpenAI } from '@langchain/openai'
import { ChatPromptTemplate } from '@langchain/core/prompts'

export interface ClusterInfo {
  id: number
  name: string
  size: number
  keywords: string[]
  documents: any[]
}

export interface InsightResult {
  insights: string[]
  success_cases: string[]
  failure_cases: string[]
  market_outlook: string[]
  summary: string
  cluster_count: number
  total_documents: number
}

export class InsightAgent {
  private llm: ChatOpenAI

  constructor(apiKey: string, model: string = 'gpt-4') {
    this.llm = new ChatOpenAI({
      apiKey,
      modelName: model,
      temperature: 0.7,
    })
    console.log(`Initialized InsightAgent with model: ${model}`)
  }

  async generateInsights(
    query: string,
    clusters: ClusterInfo[]
  ): Promise<InsightResult> {
    console.log(`Generating insights for query: ${query}`)

    // Prepare cluster summary
    const clusterSummary = clusters
      .map(
        (c) =>
          `- ${c.name}: ${c.size} documents, keywords: ${c.keywords.slice(0, 5).join(', ')}`
      )
      .join('\n')

    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are an expert market research analyst.
Analyze the following research clusters and provide comprehensive market insights.
Be specific, data-driven, and actionable.`,
      ],
      [
        'user',
        `Query: {query}

Clusters found:
{clusters}

Please provide a comprehensive analysis in the following format:

## 핵심 인사이트
(3-5 key insights as numbered list)

## 성공 사례
(2-3 success stories or best practices)

## 실패 사례
(2-3 failure cases or lessons learned)

## 향후 시장 전망
(Market outlook and future trends in 2-3 points)

Use Korean for all sections. Be specific and concise.`,
      ],
    ])

    try {
      const response = await this.llm.invoke(
        await prompt.formatMessages({ query, clusters: clusterSummary })
      )

      // Parse response into sections
      const content = response.content as string
      const sections = {
        insights: [] as string[],
        success_cases: [] as string[],
        failure_cases: [] as string[],
        market_outlook: [] as string[],
      }

      let currentSection: keyof typeof sections | null = null

      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed) continue

        // Detect section headers
        if (trimmed.includes('핵심 인사이트') || trimmed.includes('Key Insights')) {
          currentSection = 'insights'
        } else if (
          trimmed.includes('성공 사례') ||
          trimmed.includes('성공사례') ||
          trimmed.includes('Success')
        ) {
          currentSection = 'success_cases'
        } else if (
          trimmed.includes('실패 사례') ||
          trimmed.includes('실패사례') ||
          trimmed.includes('Failure')
        ) {
          currentSection = 'failure_cases'
        } else if (
          trimmed.includes('향후 시장 전망') ||
          trimmed.includes('시장 전망') ||
          trimmed.includes('Market Outlook')
        ) {
          currentSection = 'market_outlook'
        }
        // Add content to current section
        else if (
          currentSection &&
          (trimmed[0]?.match(/[0-9]/) ||
            trimmed.startsWith('-') ||
            trimmed.startsWith('•'))
        ) {
          // Remove numbering and bullets
          const cleanLine = trimmed.replace(/^[0-9.-•*)\s]+/, '').trim()
          if (cleanLine) {
            sections[currentSection].push(cleanLine)
          }
        }
      }

      // Ensure we have at least some content
      if (sections.insights.length === 0) {
        sections.insights = [
          `'${query}' 관련 ${clusters.length}개의 주요 주제 발견`,
          `총 ${clusters.reduce((sum, c) => sum + c.size, 0)}개 문서 분석`,
          `가장 큰 주제: ${clusters.reduce((max, c) => (c.size > max.size ? c : max), clusters[0]).name}`,
        ]
      }

      return {
        insights: sections.insights,
        success_cases: sections.success_cases,
        failure_cases: sections.failure_cases,
        market_outlook: sections.market_outlook,
        summary: content,
        cluster_count: clusters.length,
        total_documents: clusters.reduce((sum, c) => sum + c.size, 0),
      }
    } catch (error) {
      console.error('Failed to generate insights:', error)

      // Fallback to basic statistics
      return {
        insights: [
          `'${query}' 관련 ${clusters.length}개의 주요 주제 발견`,
          `총 ${clusters.reduce((sum, c) => sum + c.size, 0)}개 문서 분석`,
          `가장 큰 주제: ${clusters.reduce((max, c) => (c.size > max.size ? c : max), clusters[0]).name}`,
        ],
        success_cases: ['상세 분석을 위해서는 LLM이 필요합니다'],
        failure_cases: ['상세 분석을 위해서는 LLM이 필요합니다'],
        market_outlook: ['상세 분석을 위해서는 LLM이 필요합니다'],
        summary: 'Basic statistical summary (LLM unavailable)',
        cluster_count: clusters.length,
        total_documents: clusters.reduce((sum, c) => sum + c.size, 0),
      }
    }
  }

  async generateClusterNames(keywordsList: string[][]): Promise<string[]> {
    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        '당신은 주제 명명 전문가입니다. 키워드를 바탕으로 간결하고 명확한 한국어 주제명(2-4단어)을 만드세요.',
      ],
      [
        'user',
        '키워드: {keywords}\n\n위 키워드들을 대표하는 간결한 한국어 주제명을 생성하세요:',
      ],
    ])

    const names: string[] = []

    for (const keywords of keywordsList) {
      try {
        const response = await this.llm.invoke(
          await prompt.formatMessages({ keywords: keywords.join(', ') })
        )
        const name = (response.content as string).trim().replace(/["']/g, '')
        names.push(name)
      } catch {
        // Fallback to simple name
        names.push(`주제: ${keywords[0] || '미분류'}`)
      }
    }

    return names
  }
}

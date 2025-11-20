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
  insights_refs?: number[]
  success_refs?: number[]
  failure_refs?: number[]
  outlook_refs?: number[]
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
    clusters: ClusterInfo[],
    rawResults?: any[]
  ): Promise<InsightResult> {
    console.log(`Generating insights for query: ${query}`)

    // Prepare cluster summary
    const clusterSummary = clusters
      .map(
        (c) =>
          `- ${c.name}: ${c.size} documents, keywords: ${c.keywords.slice(0, 5).join(', ')}`
      )
      .join('\n')

    // Prepare document details from raw results
    let documentDetails = ''
    if (rawResults && rawResults.length > 0) {
      documentDetails = '\n\n## 검색 결과 상세 내용\n\n' + rawResults
        .map((doc, idx) => {
          return `### [${idx + 1}] ${doc.title}
출처: ${doc.source || doc.url}
내용: ${doc.content}
---`
        })
        .join('\n\n')
    }

    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are an expert market research analyst.
Analyze the following research clusters and search results to provide comprehensive market insights.
Be specific, data-driven, and actionable. Use the actual search result content to support your insights.

IMPORTANT:
1. Write clean, concise insights WITHOUT including source citations in the text itself.
2. After each section, add a line "참고: [list of document numbers]" to indicate which documents you referenced.
3. Document numbers refer to the numbered search results (e.g., [1], [2], [3], etc.)`,
      ],
      [
        'user',
        `Query: {query}

Clusters found:
{clusters}
{documentDetails}

Please provide a comprehensive analysis in the following format:

## 핵심 인사이트
1. First insight
2. Second insight
...
참고: [1, 2, 5]

## 성공 사례
1. First success case
2. Second success case
...
참고: [3, 7]

## 실패 사례
1. First failure case
2. Second failure case
...
참고: [4, 8]

## 향후 시장 전망
1. First outlook point
2. Second outlook point
...
참고: [2, 6, 9]

Use Korean for all sections. After each section, add a line starting with "참고: " followed by the document numbers in brackets that you referenced for that section.`,
      ],
    ])

    try {
      const response = await this.llm.invoke(
        await prompt.formatMessages({
          query,
          clusters: clusterSummary,
          documentDetails
        })
      )

      // Parse response into sections
      const content = response.content as string
      const sections = {
        insights: [] as string[],
        success_cases: [] as string[],
        failure_cases: [] as string[],
        market_outlook: [] as string[],
      }
      const refs = {
        insights_refs: [] as number[],
        success_refs: [] as number[],
        failure_refs: [] as number[],
        outlook_refs: [] as number[],
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
        // Extract references
        else if (trimmed.startsWith('참고:') || trimmed.startsWith('참고 :')) {
          const refMatch = trimmed.match(/\[([\d,\s]+)\]/)
          if (refMatch && currentSection) {
            const numbers = refMatch[1].split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
            if (currentSection === 'insights') refs.insights_refs = numbers
            else if (currentSection === 'success_cases') refs.success_refs = numbers
            else if (currentSection === 'failure_cases') refs.failure_refs = numbers
            else if (currentSection === 'market_outlook') refs.outlook_refs = numbers
          }
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
        insights_refs: refs.insights_refs,
        success_refs: refs.success_refs,
        failure_refs: refs.failure_refs,
        outlook_refs: refs.outlook_refs,
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

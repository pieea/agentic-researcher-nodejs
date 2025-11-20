'use client'

import { Search, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/client/ui/button'
import { Input } from '@/components/client/ui/input'
import { Card, CardContent } from '@/components/client/ui/card'

interface SearchFormProps {
  query: string
  onQueryChange: (query: string) => void
  onSearch: () => void
  isLoading: boolean
}

export function SearchForm({ query, onQueryChange, onSearch, isLoading }: SearchFormProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      onSearch()
    }
  }

  return (
    <Card className="shadow-lg max-w-3xl mx-auto">
      <CardContent className="pt-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="조사할 주제를 입력하세요 (예: 'AI 에이전트', '지속가능 기술')..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="pl-10 h-12 text-base"
            />
          </div>
          <Button
            onClick={onSearch}
            disabled={isLoading || !query.trim()}
            size="lg"
            className="px-10 h-12 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                분석 중
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                분석 시작
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

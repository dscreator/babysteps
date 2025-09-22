import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { EssayEditor } from './EssayEditor'
import { EssayPromptCard } from './EssayPromptCard'
import { Button } from '../../common/Button'
import { Card } from '../../common/Card'
import { LoadingSpinner } from '../../common/LoadingSpinner'
import { essayService } from '../../../services/essayService'
import { queryKeys } from '../../../lib/queryClient'
import { useAuth } from '../../../contexts/AuthContext'
import type { EssayPrompt, PracticeSessionResponse } from '../../../types/api'

interface EssayPracticeProps {
  onSessionComplete?: (session: PracticeSessionResponse) => void
}

type PracticeView = 'select' | 'writing' | 'submitted'

type PromptTypeFilter = 'all' | 'narrative' | 'expository' | 'persuasive'

type GradeFilter = 'all' | 6 | 7 | 8

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function countWords(html: string): number {
  const plain = stripHtml(html)
  if (!plain) return 0
  return plain.split(' ').length
}

function formatTime(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const minuteText = minutes.toString().padStart(2, '0')
  const secondText = seconds.toString().padStart(2, '0')
  return minuteText + ':' + secondText
}

export function EssayPractice({ onSessionComplete }: EssayPracticeProps) {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const [view, setView] = useState<PracticeView>('select')
  const [typeFilter, setTypeFilter] = useState<PromptTypeFilter>('all')
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('all')
  const [selectedPrompt, setSelectedPrompt] = useState<EssayPrompt | null>(null)
  const [session, setSession] = useState<PracticeSessionResponse | null>(null)
  const [draft, setDraft] = useState<string>('')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const sessionStartRef = useRef<number | null>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const promptFilters = useMemo(() => {
    return {
      type: typeFilter === 'all' ? undefined : typeFilter,
      gradeLevel: gradeFilter === 'all' ? undefined : gradeFilter,
      limit: 6,
    }
  }, [typeFilter, gradeFilter])

  const { data: prompts, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.practice.essay.prompts(promptFilters),
    queryFn: () => essayService.getPrompts(promptFilters),
    staleTime: 2 * 60 * 1000,
  })

  const timeLimitSeconds = useMemo(() => {
    if (!selectedPrompt) return 30 * 60
    const limit = selectedPrompt.timeLimit || 30
    return limit * 60
  }, [selectedPrompt])

  const wordCount = useMemo(() => countWords(draft), [draft])

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!session || !selectedPrompt) {
        throw new Error('Session is not active')
      }
      return essayService.submitEssay(session.id, {
        content: draft,
        wordCount,
        promptId: selectedPrompt.id,
        timeSpentSeconds: elapsedSeconds,
      })
    },
    onSuccess: (completedSession) => {
      setSession(completedSession)
      setView('submitted')
      if (selectedPrompt) {
        clearDraftFromStorage(selectedPrompt.id)
      }
      onSessionComplete?.(completedSession)
      toast.success('Essay submitted!')
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.dashboard })
    },
  })

  useEffect(() => {
    if (view !== 'writing') {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      sessionStartRef.current = null
      setElapsedSeconds(0)
      return
    }

    if (!sessionStartRef.current) {
      sessionStartRef.current = Date.now()
    }

    const interval = setInterval(() => {
      if (!sessionStartRef.current) return
      const diff = Math.floor((Date.now() - sessionStartRef.current) / 1000)
      setElapsedSeconds(diff)
    }, 1000)

    return () => clearInterval(interval)
  }, [view])

  useEffect(() => {
    if (view !== 'writing' || !selectedPrompt) return

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      const key = buildDraftStorageKey(selectedPrompt.id, user?.id)
      const payload = {
        content: draft,
        updatedAt: new Date().toISOString(),
      }
      try {
        localStorage.setItem(key, JSON.stringify(payload))
        setLastSavedAt(new Date())
      } catch (error) {
        console.error('Failed to auto-save essay draft', error)
      }
    }, 800)

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [draft, view, selectedPrompt, user])

  const buildDraftStorageKey = (promptId: string, userId?: string | null) => {
    const owner = userId || 'guest'
    return 'essayDraft_' + owner + '_' + promptId
  }

  const loadDraftFromStorage = (promptId: string) => {
    try {
      const key = buildDraftStorageKey(promptId, user?.id)
      const raw = localStorage.getItem(key)
      if (!raw) return null
      const data = JSON.parse(raw)
      if (typeof data.content === 'string') {
        if (data.updatedAt) {
          setLastSavedAt(new Date(data.updatedAt))
        }
        return data.content as string
      }
      return null
    } catch (error) {
      console.warn('Unable to load saved draft', error)
      return null
    }
  }

  const clearDraftFromStorage = (promptId: string) => {
    const key = buildDraftStorageKey(promptId, user?.id)
    localStorage.removeItem(key)
    setLastSavedAt(null)
  }

  const handlePromptSelect = async (prompt: EssayPrompt) => {
    try {
      const newSession = await essayService.createEssaySession({
        promptId: prompt.id,
        gradeLevel: prompt.gradeLevel,
        type: prompt.type,
        timeLimit: prompt.timeLimit,
      })

      setSession(newSession)
      setSelectedPrompt(prompt)
      setView('writing')
      setElapsedSeconds(0)
      sessionStartRef.current = Date.now()

      const savedDraft = loadDraftFromStorage(prompt.id)
      setDraft(savedDraft || '')
      if (!savedDraft) {
        setLastSavedAt(null)
      }

      toast.success('Essay session started')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to start essay session')
    }
  }

  const handleDraftChange = (value: string) => {
    setDraft(value)
  }

  const handleExitToPrompts = () => {
    setView('select')
    setSelectedPrompt(null)
    setSession(null)
    setDraft('')
    setElapsedSeconds(0)
  }

  const handleSubmitEssay = () => {
    if (!draft || countWords(draft) < 10) {
      toast.error('Write at least 10 words before submitting your essay')
      return
    }

    submitMutation.mutate()
  }

  const timeRemaining = timeLimitSeconds - elapsedSeconds
  const rawSessionData = session ? (session as any).sessionData || (session as any).session_data : null
  const essayData = rawSessionData ? rawSessionData.essay : null

  if (view === 'writing' && selectedPrompt) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Essay Practice</h1>
            <p className="text-gray-600">Respond to the prompt and submit your essay when you are ready.</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div>Time elapsed: {formatTime(elapsedSeconds)}</div>
            <div>
              Time remaining: <span className={timeRemaining <= 60 ? 'text-red-600 font-semibold' : ''}>{formatTime(timeRemaining)}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-500">Prompt</div>
              <div className="text-sm text-gray-600 capitalize">{selectedPrompt.type} • Grade {selectedPrompt.gradeLevel}</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-800 whitespace-pre-line max-h-[340px] overflow-y-auto">
              {selectedPrompt.prompt}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-gray-200 p-3 text-center">
                <div className="text-xs text-gray-500">Words</div>
                <div className="text-xl font-semibold text-gray-900">{wordCount}</div>
              </div>
              <div className="rounded-lg border border-gray-200 p-3 text-center">
                <div className="text-xs text-gray-500">Recommended time</div>
                <div className="text-xl font-semibold text-gray-900">{selectedPrompt.timeLimit || 30} min</div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-500">
              {lastSavedAt ? (
                <div>Last auto-save: {lastSavedAt.toLocaleTimeString()}</div>
              ) : (
                <div>Draft auto-saves every few seconds.</div>
              )}
            </div>
            <Button variant="outline" onClick={handleExitToPrompts}>
              Exit without submitting
            </Button>
          </Card>

          <div className="lg:col-span-2 space-y-4">
            <EssayEditor value={draft} onChange={handleDraftChange} placeholder="Write your essay response here." />
            <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm sm:flex-row sm:items-center">
              <div>
                <div className="font-medium text-gray-900">Essay progress</div>
                <div className="text-gray-500">{wordCount} words • {formatTime(elapsedSeconds)} elapsed</div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setDraft('')}>
                  Clear Draft
                </Button>
                <Button onClick={handleSubmitEssay} loading={submitMutation.isLoading}>
                  Submit Essay
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'submitted' && session && selectedPrompt) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Great work!</h1>
            <p className="text-gray-600">Your essay has been saved. You can start another essay whenever you like.</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div>Total time: {formatTime(elapsedSeconds)}</div>
            <div>Words: {wordCount}</div>
          </div>
        </div>

        <Card className="space-y-4">
          <div>
            <div className="text-sm font-medium text-gray-500">Prompt</div>
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-800 whitespace-pre-line">
              {selectedPrompt.prompt}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-500">Your submission</div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-800 whitespace-pre-line">
              {essayData?.content ? stripHtml(essayData.content) : stripHtml(draft)}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 text-sm text-gray-600">
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">Word count</div>
              <div className="text-xl font-semibold text-gray-900">{essayData?.wordCount || wordCount}</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">Time spent</div>
              <div className="text-xl font-semibold text-gray-900">{formatTime(essayData?.timeSpentSeconds || elapsedSeconds)}</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">Session ID</div>
              <div className="text-xs font-medium text-gray-900 break-all">{session.id}</div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => window.print()}>
              Print Essay
            </Button>
            <Button onClick={() => {
              setView('select')
              setSelectedPrompt(null)
              setSession(null)
              setDraft('')
              setElapsedSeconds(0)
            }}>
              Choose another prompt
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Essay Practice</h1>
          <p className="text-gray-600">Select a prompt and start writing. Your drafts auto-save while you work.</p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-2">
            <label className="text-gray-600">Prompt type</label>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as PromptTypeFilter)}
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="all">All</option>
              <option value="narrative">Narrative</option>
              <option value="expository">Expository</option>
              <option value="persuasive">Persuasive</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-gray-600">Grade level</label>
            <select
              value={gradeFilter}
              onChange={(event) => {
                const value = event.target.value
                if (value === 'all') {
                  setGradeFilter('all')
                } else {
                  setGradeFilter(parseInt(value, 10) as GradeFilter)
                }
              }}
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="all">All</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
            </select>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {isError && (
        <Card className="p-6 text-center text-gray-600">
          <p>Unable to load essay prompts at the moment.</p>
          <Button className="mt-4" onClick={() => refetch()}>
            Try again
          </Button>
        </Card>
      )}

      {!isLoading && !isError && prompts && prompts.length === 0 && (
        <Card className="p-6 text-center text-gray-600">
          <p>No prompts found for the selected filters. Try adjusting your filters.</p>
        </Card>
      )}

      {!isLoading && !isError && prompts && prompts.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {prompts.map((prompt) => (
            <EssayPromptCard key={prompt.id} prompt={prompt} onSelect={handlePromptSelect} />
          ))}
        </div>
      )}
    </div>
  )
}

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { contentService } from '../services/content/contentService'

// Mock Supabase
vi.mock('../config/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      const mockData = {
        math_problems: [
          {
            id: 'problem-1',
            topic: 'algebra',
            difficulty: 3,
            question: 'Solve for x: 2x + 3 = 7',
            options: null,
            correct_answer: 'x = 2',
            explanation: 'Subtract 3 from both sides, then divide by 2',
            hints: ['Start by isolating the variable'],
            grade_level: 7,
            created_at: new Date().toISOString()
          }
        ],
        reading_passages: [
          {
            id: 'passage-1',
            title: 'The Solar System',
            content: 'The solar system consists of the Sun and the objects that orbit it...',
            grade_level: 7,
            subject_area: 'science',
            word_count: 250,
            created_at: new Date().toISOString()
          }
        ],
        vocabulary_words: [
          {
            id: 'word-1',
            word: 'magnificent',
            definition: 'extremely beautiful, elaborate, or impressive',
            part_of_speech: 'adjective',
            difficulty_level: 3,
            example_sentence: 'The magnificent castle stood on the hill.',
            synonyms: ['beautiful', 'impressive', 'grand'],
            antonyms: ['ugly', 'plain'],
            grade_level: 7,
            created_at: new Date().toISOString()
          }
        ],
        essay_prompts: [
          {
            id: 'prompt-1',
            prompt: 'Write about a time when you overcame a challenge.',
            type: 'narrative',
            grade_level: 7,
            time_limit: 30,
            rubric: { structure: 25, content: 25, grammar: 25, creativity: 25 },
            created_at: new Date().toISOString()
          }
        ]
      }

      return {
        select: vi.fn(() => ({
          range: vi.fn(() => ({
            order: vi.fn(() => ({
              eq: vi.fn(() => ({
                data: mockData[table as keyof typeof mockData] || [],
                error: null
              })),
              data: mockData[table as keyof typeof mockData] || [],
              error: null
            })),
            eq: vi.fn(() => ({
              data: mockData[table as keyof typeof mockData] || [],
              error: null
            })),
            data: mockData[table as keyof typeof mockData] || [],
            error: null
          })),
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: mockData[table as keyof typeof mockData]?.[0] || null,
              error: null
            })),
            order: vi.fn(() => ({
              data: mockData[table as keyof typeof mockData] || [],
              error: null
            })),
            data: mockData[table as keyof typeof mockData] || [],
            error: null
          })),
          order: vi.fn(() => ({
            data: mockData[table as keyof typeof mockData] || [],
            error: null
          })),
          limit: vi.fn(() => ({
            data: mockData[table as keyof typeof mockData] || [],
            error: null
          })),
          count: 10,
          data: mockData[table as keyof typeof mockData] || [],
          error: null
        }))
      }
    })
  }
}))

describe('ContentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getMathProblems', () => {
    it('should fetch math problems with default parameters', async () => {
      const problems = await contentService.getMathProblems()

      expect(problems).toBeDefined()
      expect(Array.isArray(problems)).toBe(true)
      expect(problems.length).toBeGreaterThan(0)
      expect(problems[0]).toHaveProperty('id')
      expect(problems[0]).toHaveProperty('topic')
      expect(problems[0]).toHaveProperty('difficulty')
    })

    it('should fetch math problems with filtering', async () => {
      const params = {
        topic: 'algebra',
        difficulty: 3,
        gradeLevel: 7,
        limit: 5
      }

      const problems = await contentService.getMathProblems(params)

      expect(problems).toBeDefined()
      expect(Array.isArray(problems)).toBe(true)
    })
  })

  describe('getMathProblemById', () => {
    it('should fetch a specific math problem', async () => {
      const problemId = 'problem-1'
      const problem = await contentService.getMathProblemById(problemId)

      expect(problem).toBeDefined()
      expect(problem?.id).toBe(problemId)
      expect(problem?.topic).toBe('algebra')
    })
  })

  describe('getReadingPassages', () => {
    it('should fetch reading passages', async () => {
      const passages = await contentService.getReadingPassages()

      expect(passages).toBeDefined()
      expect(Array.isArray(passages)).toBe(true)
      expect(passages.length).toBeGreaterThan(0)
      expect(passages[0]).toHaveProperty('title')
      expect(passages[0]).toHaveProperty('content')
    })
  })

  describe('getVocabularyWords', () => {
    it('should fetch vocabulary words', async () => {
      const words = await contentService.getVocabularyWords()

      expect(words).toBeDefined()
      expect(Array.isArray(words)).toBe(true)
      expect(words.length).toBeGreaterThan(0)
      expect(words[0]).toHaveProperty('word')
      expect(words[0]).toHaveProperty('definition')
    })
  })

  describe('getEssayPrompts', () => {
    it('should fetch essay prompts', async () => {
      const prompts = await contentService.getEssayPrompts()

      expect(prompts).toBeDefined()
      expect(Array.isArray(prompts)).toBe(true)
      expect(prompts.length).toBeGreaterThan(0)
      expect(prompts[0]).toHaveProperty('prompt')
      expect(prompts[0]).toHaveProperty('type')
    })
  })

  describe('getContentStats', () => {
    it('should return content statistics', async () => {
      const stats = await contentService.getContentStats()

      expect(stats).toBeDefined()
      expect(stats).toHaveProperty('mathProblems')
      expect(stats).toHaveProperty('readingPassages')
      expect(stats).toHaveProperty('vocabularyWords')
      expect(stats).toHaveProperty('essayPrompts')
      expect(typeof stats.mathProblems).toBe('number')
    })
  })
})
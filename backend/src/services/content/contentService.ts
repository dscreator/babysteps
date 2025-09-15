import { supabase } from '../../config/supabase'
import {
  MathProblem,
  ReadingPassage,
  ReadingQuestion,
  VocabularyWord,
  EssayPrompt,
  GetProblemsRequest,
  GetPassagesRequest,
  GetVocabularyRequest,
  GetPromptsRequest
} from '../../types/practice'

export class ContentService {
  /**
   * Get math problems with optional filtering
   */
  async getMathProblems(params: GetProblemsRequest = {}): Promise<MathProblem[]> {
    const {
      topic,
      difficulty,
      gradeLevel,
      limit = 10,
      offset = 0
    } = params

    let query = supabase
      .from('math_problems')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (topic) {
      query = query.eq('topic', topic)
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }

    if (gradeLevel) {
      query = query.eq('grade_level', gradeLevel)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch math problems: ${error.message}`)
    }

    return data?.map(this.mapMathProblem) || []
  }

  /**
   * Get a specific math problem by ID
   */
  async getMathProblemById(id: string): Promise<MathProblem | null> {
    const { data, error } = await supabase
      .from('math_problems')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to fetch math problem: ${error.message}`)
    }

    return this.mapMathProblem(data)
  }

  /**
   * Get reading passages with optional filtering
   */
  async getReadingPassages(params: GetPassagesRequest = {}): Promise<ReadingPassage[]> {
    const {
      gradeLevel,
      subjectArea,
      limit = 10,
      offset = 0
    } = params

    let query = supabase
      .from('reading_passages')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (gradeLevel) {
      query = query.eq('grade_level', gradeLevel)
    }

    if (subjectArea) {
      query = query.eq('subject_area', subjectArea)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch reading passages: ${error.message}`)
    }

    return data?.map(this.mapReadingPassage) || []
  }

  /**
   * Get reading questions for a specific passage
   */
  async getReadingQuestions(passageId: string): Promise<ReadingQuestion[]> {
    const { data, error } = await supabase
      .from('reading_questions')
      .select('*')
      .eq('passage_id', passageId)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch reading questions: ${error.message}`)
    }

    return data?.map(this.mapReadingQuestion) || []
  }

  /**
   * Get a reading passage with its questions
   */
  async getReadingPassageWithQuestions(passageId: string): Promise<{
    passage: ReadingPassage
    questions: ReadingQuestion[]
  } | null> {
    const { data: passageData, error: passageError } = await supabase
      .from('reading_passages')
      .select('*')
      .eq('id', passageId)
      .single()

    if (passageError) {
      if (passageError.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to fetch reading passage: ${passageError.message}`)
    }

    const questions = await this.getReadingQuestions(passageId)

    return {
      passage: this.mapReadingPassage(passageData),
      questions
    }
  }

  /**
   * Get vocabulary words with optional filtering
   */
  async getVocabularyWords(params: GetVocabularyRequest = {}): Promise<VocabularyWord[]> {
    const {
      difficultyLevel,
      gradeLevel,
      limit = 20,
      offset = 0
    } = params

    let query = supabase
      .from('vocabulary_words')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('word', { ascending: true })

    if (difficultyLevel) {
      query = query.eq('difficulty_level', difficultyLevel)
    }

    if (gradeLevel) {
      query = query.eq('grade_level', gradeLevel)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch vocabulary words: ${error.message}`)
    }

    return data?.map(this.mapVocabularyWord) || []
  }

  /**
   * Get essay prompts with optional filtering
   */
  async getEssayPrompts(params: GetPromptsRequest = {}): Promise<EssayPrompt[]> {
    const {
      type,
      gradeLevel,
      limit = 10,
      offset = 0
    } = params

    let query = supabase
      .from('essay_prompts')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (type) {
      query = query.eq('type', type)
    }

    if (gradeLevel) {
      query = query.eq('grade_level', gradeLevel)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch essay prompts: ${error.message}`)
    }

    return data?.map(this.mapEssayPrompt) || []
  }

  /**
   * Get a specific essay prompt by ID
   */
  async getEssayPromptById(id: string): Promise<EssayPrompt | null> {
    const { data, error } = await supabase
      .from('essay_prompts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to fetch essay prompt: ${error.message}`)
    }

    return this.mapEssayPrompt(data)
  }

  /**
   * Get random content for mixed practice
   */
  async getRandomMathProblems(count: number, gradeLevel?: number): Promise<MathProblem[]> {
    let query = supabase
      .from('math_problems')
      .select('*')
      .limit(count * 3) // Get more to randomize from

    if (gradeLevel) {
      query = query.eq('grade_level', gradeLevel)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch random math problems: ${error.message}`)
    }

    // Shuffle and take requested count
    const shuffled = data?.sort(() => 0.5 - Math.random()) || []
    return shuffled.slice(0, count).map(this.mapMathProblem)
  }

  /**
   * Get random reading passage with questions and vocabulary
   */
  async getRandomReadingPassage(gradeLevel?: number): Promise<{
    passage: ReadingPassage
    questions: ReadingQuestion[]
    vocabulary: VocabularyWord[]
  }> {
    // Get random passage
    let passageQuery = supabase
      .from('reading_passages')
      .select('*')
      .limit(10) // Get multiple to randomize from

    if (gradeLevel) {
      passageQuery = passageQuery.eq('grade_level', gradeLevel)
    }

    const { data: passages, error: passageError } = await passageQuery

    if (passageError) {
      throw new Error(`Failed to fetch reading passages: ${passageError.message}`)
    }

    if (!passages || passages.length === 0) {
      throw new Error('No reading passages available')
    }

    // Select random passage
    const randomPassage = passages[Math.floor(Math.random() * passages.length)]
    const passage = this.mapReadingPassage(randomPassage)

    // Get questions for this passage
    const questions = await this.getReadingQuestions(passage.id)

    // Get vocabulary words for this grade level
    const vocabulary = await this.getVocabularyWords({
      gradeLevel,
      limit: 15 // Get 15 vocabulary words for highlighting
    })

    return {
      passage,
      questions,
      vocabulary
    }
  }

  /**
   * Get content statistics for dashboard
   */
  async getContentStats(): Promise<{
    mathProblems: number
    readingPassages: number
    vocabularyWords: number
    essayPrompts: number
  }> {
    const [mathCount, passageCount, vocabCount, essayCount] = await Promise.all([
      supabase.from('math_problems').select('id', { count: 'exact', head: true }),
      supabase.from('reading_passages').select('id', { count: 'exact', head: true }),
      supabase.from('vocabulary_words').select('id', { count: 'exact', head: true }),
      supabase.from('essay_prompts').select('id', { count: 'exact', head: true })
    ])

    return {
      mathProblems: mathCount.count || 0,
      readingPassages: passageCount.count || 0,
      vocabularyWords: vocabCount.count || 0,
      essayPrompts: essayCount.count || 0
    }
  }

  // Private mapping methods
  private mapMathProblem(data: any): MathProblem {
    return {
      id: data.id,
      topic: data.topic,
      difficulty: data.difficulty,
      question: data.question,
      options: data.options,
      correctAnswer: data.correct_answer,
      explanation: data.explanation,
      hints: data.hints || [],
      gradeLevel: data.grade_level,
      createdAt: data.created_at
    }
  }

  private mapReadingPassage(data: any): ReadingPassage {
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      gradeLevel: data.grade_level,
      subjectArea: data.subject_area,
      wordCount: data.word_count,
      createdAt: data.created_at
    }
  }

  private mapReadingQuestion(data: any): ReadingQuestion {
    return {
      id: data.id,
      passageId: data.passage_id,
      question: data.question,
      options: data.options,
      correctAnswer: data.correct_answer,
      explanation: data.explanation,
      questionType: data.question_type,
      createdAt: data.created_at
    }
  }

  private mapVocabularyWord(data: any): VocabularyWord {
    return {
      id: data.id,
      word: data.word,
      definition: data.definition,
      partOfSpeech: data.part_of_speech,
      difficultyLevel: data.difficulty_level,
      exampleSentence: data.example_sentence,
      synonyms: data.synonyms || [],
      antonyms: data.antonyms || [],
      gradeLevel: data.grade_level,
      createdAt: data.created_at
    }
  }

  private mapEssayPrompt(data: any): EssayPrompt {
    return {
      id: data.id,
      prompt: data.prompt,
      type: data.type,
      gradeLevel: data.grade_level,
      timeLimit: data.time_limit,
      rubric: data.rubric,
      createdAt: data.created_at
    }
  }
}

export const contentService = new ContentService()
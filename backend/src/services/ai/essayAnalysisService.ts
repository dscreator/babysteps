import { supabase } from '../../config/supabase'
import { openaiService } from './openaiService'
import { 
  EssaySubmission, 
  EssayAnalysis, 
  SubmitEssayRequest, 
  EssayAnalysisResponse,
  EssayPrompt 
} from '../../types/practice'

class EssayAnalysisService {
  async submitEssay(userId: string, request: SubmitEssayRequest): Promise<EssaySubmission> {
    const { promptId, content, timeSpent } = request

    // Validate essay content
    if (!content || content.trim().length < 50) {
      throw new Error('Essay must be at least 50 characters long')
    }

    if (content.length > 10000) {
      throw new Error('Essay exceeds maximum length of 10,000 characters')
    }

    // Get the essay prompt to validate
    const { data: prompt, error: promptError } = await supabase
      .from('essay_prompts')
      .select('*')
      .eq('id', promptId)
      .single()

    if (promptError || !prompt) {
      throw new Error('Invalid essay prompt')
    }

    // Calculate word count
    const wordCount = content.trim().split(/\s+/).length

    // Insert essay submission
    const { data: submission, error } = await supabase
      .from('essay_submissions')
      .insert({
        user_id: userId,
        prompt_id: promptId,
        content: content.trim(),
        word_count: wordCount,
        time_spent: timeSpent,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error submitting essay:', error)
      throw new Error('Failed to submit essay')
    }

    return {
      id: submission.id,
      userId: submission.user_id,
      promptId: submission.prompt_id,
      content: submission.content,
      wordCount: submission.word_count,
      timeSpent: submission.time_spent,
      submittedAt: submission.submitted_at
    }
  }

  async analyzeEssay(userId: string, submissionId: string): Promise<EssayAnalysisResponse> {
    // Check rate limiting
    await openaiService.checkRateLimit(userId)

    // Get the essay submission with prompt
    const { data: submissionData, error: submissionError } = await supabase
      .from('essay_submissions')
      .select(`
        *,
        essay_prompts (*)
      `)
      .eq('id', submissionId)
      .eq('user_id', userId)
      .single()

    if (submissionError || !submissionData) {
      throw new Error('Essay submission not found')
    }

    // Check if analysis already exists
    const { data: existingAnalysis } = await supabase
      .from('essay_analyses')
      .select('*')
      .eq('submission_id', submissionId)
      .single()

    if (existingAnalysis) {
      return this.formatAnalysisResponse(existingAnalysis, submissionData)
    }

    const prompt = submissionData.essay_prompts as EssayPrompt
    
    try {
      // Analyze essay using OpenAI
      const aiAnalysis = await openaiService.analyzeEssay(
        submissionData.content,
        prompt.prompt,
        prompt.rubric
      )

      // Store analysis in database
      const { data: analysis, error: analysisError } = await supabase
        .from('essay_analyses')
        .insert({
          submission_id: submissionId,
          overall_score: aiAnalysis.overallScore,
          structure_score: aiAnalysis.structureScore,
          grammar_score: aiAnalysis.grammarScore,
          content_score: aiAnalysis.contentScore,
          vocabulary_score: aiAnalysis.vocabularyScore,
          feedback: aiAnalysis.feedback,
          rubric_breakdown: aiAnalysis.rubricBreakdown,
          analyzed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (analysisError) {
        console.error('Error storing essay analysis:', analysisError)
        throw new Error('Failed to store essay analysis')
      }

      // Update user progress
      await this.updateUserProgress(userId, aiAnalysis.overallScore, prompt.type)

      // Record AI interaction
      await this.recordAIInteraction(userId, submissionId, aiAnalysis)

      return this.formatAnalysisResponse(analysis, submissionData)

    } catch (error) {
      console.error('Essay analysis error:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Failed to analyze essay')
    }
  }

  private async updateUserProgress(userId: string, score: number, essayType: string): Promise<void> {
    try {
      // Get current progress
      const { data: currentProgress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('subject', 'essay')
        .single()

      if (currentProgress) {
        // Update existing progress
        const topicScores = currentProgress.topic_scores || {}
        topicScores[essayType] = score

        const overallScore = Object.values(topicScores).reduce((sum: number, s: any) => sum + s, 0) / Object.keys(topicScores).length

        await supabase
          .from('user_progress')
          .update({
            overall_score: overallScore,
            topic_scores: topicScores,
            last_practice_date: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('subject', 'essay')
      } else {
        // Create new progress record
        await supabase
          .from('user_progress')
          .insert({
            user_id: userId,
            subject: 'essay',
            overall_score: score,
            topic_scores: { [essayType]: score },
            last_practice_date: new Date().toISOString().split('T')[0]
          })
      }
    } catch (error) {
      console.error('Error updating user progress:', error)
      // Don't throw error here as it's not critical to the main flow
    }
  }

  private async recordAIInteraction(userId: string, submissionId: string, analysis: any): Promise<void> {
    try {
      await supabase
        .from('ai_interactions')
        .insert({
          user_id: userId,
          interaction_type: 'feedback',
          content: `Essay analysis completed with overall score: ${analysis.overallScore}`,
          context: {
            submission_id: submissionId,
            scores: {
              overall: analysis.overallScore,
              structure: analysis.structureScore,
              grammar: analysis.grammarScore,
              content: analysis.contentScore,
              vocabulary: analysis.vocabularyScore
            }
          }
        })
    } catch (error) {
      console.error('Error recording AI interaction:', error)
      // Don't throw error here as it's not critical to the main flow
    }
  }

  private formatAnalysisResponse(analysis: any, submission: any): EssayAnalysisResponse {
    const analysisData: EssayAnalysis = {
      id: analysis.id,
      submissionId: analysis.submission_id,
      overallScore: analysis.overall_score,
      structureScore: analysis.structure_score,
      grammarScore: analysis.grammar_score,
      contentScore: analysis.content_score,
      vocabularyScore: analysis.vocabulary_score,
      feedback: analysis.feedback,
      rubricBreakdown: analysis.rubric_breakdown,
      analyzedAt: analysis.analyzed_at
    }

    // Generate suggestions based on scores
    const suggestions = this.generateSuggestions(analysisData)

    return {
      analysis: analysisData,
      suggestions
    }
  }

  private generateSuggestions(analysis: EssayAnalysis): { nextSteps: string[]; practiceAreas: string[] } {
    const nextSteps: string[] = []
    const practiceAreas: string[] = []

    // Analyze scores and provide targeted suggestions
    if (analysis.structureScore < 70) {
      nextSteps.push('Focus on creating a clear introduction, body paragraphs, and conclusion')
      practiceAreas.push('essay-structure')
    }

    if (analysis.grammarScore < 70) {
      nextSteps.push('Review grammar rules and practice sentence construction')
      practiceAreas.push('grammar-mechanics')
    }

    if (analysis.contentScore < 70) {
      nextSteps.push('Work on developing ideas with specific examples and details')
      practiceAreas.push('content-development')
    }

    if (analysis.vocabularyScore < 70) {
      nextSteps.push('Expand vocabulary and practice using varied sentence structures')
      practiceAreas.push('vocabulary-enhancement')
    }

    // Add general suggestions if overall score is good
    if (analysis.overallScore >= 80) {
      nextSteps.push('Great work! Try more challenging prompts to continue improving')
    } else if (analysis.overallScore >= 60) {
      nextSteps.push('Good progress! Focus on the areas highlighted in the feedback')
    } else {
      nextSteps.push('Keep practicing! Break down essay writing into smaller steps')
    }

    return { nextSteps, practiceAreas }
  }

  async getUserEssayHistory(userId: string, limit: number = 10): Promise<{
    submissions: EssaySubmission[]
    analyses: EssayAnalysis[]
  }> {
    const { data: submissions, error } = await supabase
      .from('essay_submissions')
      .select(`
        *,
        essay_analyses (*)
      `)
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching essay history:', error)
      throw new Error('Failed to fetch essay history')
    }

    const submissionData: EssaySubmission[] = submissions.map(sub => ({
      id: sub.id,
      userId: sub.user_id,
      promptId: sub.prompt_id,
      content: sub.content,
      wordCount: sub.word_count,
      timeSpent: sub.time_spent,
      submittedAt: sub.submitted_at
    }))

    const analysisData: EssayAnalysis[] = submissions
      .filter(sub => sub.essay_analyses && sub.essay_analyses.length > 0)
      .map(sub => {
        const analysis = sub.essay_analyses[0]
        return {
          id: analysis.id,
          submissionId: analysis.submission_id,
          overallScore: analysis.overall_score,
          structureScore: analysis.structure_score,
          grammarScore: analysis.grammar_score,
          contentScore: analysis.content_score,
          vocabularyScore: analysis.vocabulary_score,
          feedback: analysis.feedback,
          rubricBreakdown: analysis.rubric_breakdown,
          analyzedAt: analysis.analyzed_at
        }
      })

    return {
      submissions: submissionData,
      analyses: analysisData
    }
  }
}

export const essayAnalysisService = new EssayAnalysisService()
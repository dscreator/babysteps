# AI Tutor System

This directory contains the AI-powered tutoring system for the ISEE AI Tutor application.

## Overview

The AI tutor system provides personalized, contextual help to students preparing for the ISEE exam. It includes:

- **Contextual Hints**: AI-generated hints based on the current problem and user performance
- **Concept Explanations**: Detailed explanations of mathematical and verbal concepts
- **Contextual Help**: Support for stuck, confused, or discouraged students
- **Learning Analytics**: Analysis of user learning patterns and preferences
- **Personalized Recommendations**: Adaptive suggestions for study topics and difficulty

## Components

### TutorService (`tutorService.ts`)

The main service that handles AI tutor interactions:

- `generateHint()`: Creates contextual hints for specific problems
- `generateExplanation()`: Provides detailed concept explanations
- `generateContextualHelp()`: Offers support based on student state
- Rate limiting and caching for cost optimization
- Age-appropriate language adaptation for middle school students

### ContextService (`contextService.ts`)

Builds context for AI interactions by analyzing:

- User performance history
- Recent practice sessions
- Previous AI interactions
- Learning pattern recognition
- Personalized recommendations

### OpenAIService (`openaiService.ts`)

Handles communication with OpenAI API:

- Contextual response generation
- Personalized hint creation
- Step-by-step explanations
- Rate limiting and error handling
- Response caching

### EssayAnalysisService (`essayAnalysisService.ts`)

Specialized service for essay analysis:

- AI-powered essay evaluation
- ISEE rubric-based scoring
- Detailed feedback generation
- Revision tracking

## API Endpoints

### POST `/api/tutor/hint`
Generate a contextual hint for a specific problem.

**Request:**
```json
{
  "question": "Solve for x: 2x + 5 = 15",
  "subject": "math",
  "currentProblemId": "problem123",
  "userAnswer": "10",
  "attemptCount": 2
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": "Try isolating the term with x by moving the constant to the other side.",
    "type": "hint",
    "followUpSuggestions": ["Draw a diagram", "Check your work"],
    "relatedConcepts": ["algebra", "equations"]
  }
}
```

### POST `/api/tutor/explain`
Get a detailed explanation of a concept.

**Request:**
```json
{
  "concept": "linear equations",
  "subject": "math",
  "question": "Solve for x: 2x + 5 = 15",
  "userAnswer": "10",
  "isIncorrect": true
}
```

### POST `/api/tutor/help`
Get contextual help based on student state.

**Request:**
```json
{
  "subject": "math",
  "helpType": "stuck",
  "currentProblemId": "problem123"
}
```

### GET `/api/tutor/recommendations?subject=math`
Get personalized study recommendations.

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": {
      "nextTopics": ["algebra", "geometry"],
      "reviewTopics": ["fractions"],
      "difficultyAdjustment": "maintain",
      "studyTips": ["Practice daily", "Review mistakes"]
    },
    "learningPatterns": {
      "learningStyle": "analytical",
      "preferredHintType": "conceptual",
      "strugglingAreas": ["fractions"],
      "improvingAreas": ["algebra"],
      "recommendedDifficulty": 5
    }
  }
}
```

### GET `/api/tutor/analytics?subject=math`
Get learning analytics for a subject.

### GET `/api/tutor/status`
Check AI service availability and features.

## Features

### Rate Limiting
- Global rate limiting for OpenAI API calls
- User-specific rate limiting for tutor interactions
- Graceful error handling with retry suggestions

### Caching
- Explanation caching to reduce API costs
- 24-hour cache duration with automatic cleanup
- Cache key generation based on concept and context

### Personalization
- Age-appropriate language for middle school students
- Learning style detection (visual, analytical, trial-and-error)
- Adaptive difficulty recommendations
- Performance-based hint generation

### Context Awareness
- Current problem context
- User performance history
- Previous interaction patterns
- Subject-specific guidance

### Learning Analytics
- Learning pattern recognition
- Struggling area identification
- Improvement tracking
- Study tip generation

## Configuration

### Environment Variables
- `OPENAI_API_KEY`: Required for AI functionality
- Rate limiting and caching settings are configured in the service files

### Rate Limits
- **Tutor interactions**: 20 per hour per user
- **OpenAI API**: 10 requests per minute globally
- **Essay analysis**: 3 per hour per user

## Error Handling

The system includes comprehensive error handling:

- OpenAI API failures with fallback responses
- Rate limiting with clear retry instructions
- Network errors with graceful degradation
- Input validation with detailed error messages

## Testing

Tests are included for:

- Service functionality with mocked dependencies
- API endpoint validation and responses
- Error handling scenarios
- Rate limiting behavior

Run tests with:
```bash
npm test -- tutorService.test.ts
npm test -- tutorRoutes.test.ts
```

## Advanced Personalization Features (Task 8.2 - Completed)

### PersonalizationEngine (`personalizationEngine.ts`)

Comprehensive personalization system that combines learning patterns and styles:

- `generatePersonalizedRecommendations()`: Creates complete personalization profiles
- `adaptContentForUser()`: Adapts content based on learning style and patterns
- `generateLearningInsights()`: Provides actionable insights about learning progress
- `updatePersonalizationFromFeedback()`: Updates personalization based on user feedback

### AdaptiveLearningService (`adaptiveLearningService.ts`)

Advanced learning pattern recognition and difficulty adjustment:

- `analyzeUserLearningPatterns()`: Identifies learning styles, attention spans, and error patterns
- `adjustDifficulty()`: Dynamically adjusts content difficulty based on performance
- `generateContentRecommendations()`: Suggests prioritized practice content
- `createPersonalizationProfile()`: Builds comprehensive user learning profiles

### LearningStyleService (`learningStyleService.ts`)

Detailed learning style analysis and content adaptation:

- `analyzeLearningStyle()`: Determines primary and secondary learning styles (visual, auditory, kinesthetic, reading-writing)
- `adaptContentForUser()`: Adapts content presentation based on learning preferences
- `updateLearningStyleFromInteraction()`: Refines learning style analysis based on user interactions

## New API Endpoints (Task 8.2)

### GET `/api/tutor/insights?subject=math`
Get learning insights for a user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "strength",
      "subject": "math",
      "topic": "algebra",
      "description": "Showing consistent improvement in algebra",
      "confidence": 0.8,
      "actionable": true,
      "suggestedActions": ["Continue practicing algebra", "Try more challenging problems"]
    }
  ]
}
```

### POST `/api/tutor/adjust-difficulty`
Adjust difficulty based on performance.

**Request:**
```json
{
  "subject": "math",
  "currentDifficulty": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "currentDifficulty": 5,
    "recommendedDifficulty": 6,
    "adjustmentReason": "High accuracy indicates readiness for increased difficulty",
    "confidence": 0.8
  }
}
```

### POST `/api/tutor/feedback`
Provide feedback on personalization effectiveness.

**Request:**
```json
{
  "subject": "math",
  "feedbackType": "helpful",
  "context": {
    "problemId": "problem-123",
    "difficulty": 5
  }
}
```

### GET `/api/tutor/content-recommendations?subject=math`
Get personalized content recommendations.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "topics": ["fractions"],
      "difficultyLevel": 4,
      "practiceType": "review",
      "estimatedTime": 15,
      "priority": "high",
      "reasoning": "Focused review needed for struggling area"
    }
  ]
}
```

### POST `/api/tutor/adapt-content`
Adapt content for user's learning style.

**Request:**
```json
{
  "content": {
    "id": "problem-123",
    "question": "Solve for x: 2x + 5 = 15",
    "subject": "math"
  },
  "contentType": "problem"
}
```

## Personalization Features

### Learning Pattern Recognition
- **Learning Style Detection**: Visual, auditory, kinesthetic, reading-writing preferences
- **Attention Span Analysis**: Short, medium, long session preferences
- **Error Pattern Identification**: Common mistake types and recovery strategies
- **Mastery Level Tracking**: Topic-specific competency levels (0-1 scale)
- **Improvement Rate Calculation**: Rate of learning progress over time

### Adaptive Content Delivery
- **Difficulty Adjustment**: Dynamic difficulty based on recent performance
- **Content Adaptation**: Presentation style adapted to learning preferences
- **Hint Progression**: Gradual, direct, or discovery-based hint delivery
- **Feedback Style**: Immediate, detailed, or encouraging feedback approaches

### Personalized Recommendations
- **Next Topics**: Suggested areas for new learning based on readiness
- **Review Topics**: Areas needing reinforcement based on performance
- **Study Tips**: Personalized advice based on learning style and patterns
- **Session Optimization**: Optimal session length and timing recommendations

### Learning Insights
- **Strength Identification**: Areas of consistent improvement and mastery
- **Weakness Detection**: Topics requiring focused attention
- **Pattern Recognition**: Learning behavior and preference insights
- **Actionable Recommendations**: Specific steps for improvement

## Future Enhancements (Task 8.3)

- **Chat Interface**: Real-time conversational tutoring
- **Multi-modal Support**: Image and diagram understanding
- **Advanced Analytics**: Deeper learning pattern analysis
- **Predictive Modeling**: Performance prediction and intervention
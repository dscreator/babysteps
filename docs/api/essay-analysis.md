# Essay Analysis API

The Essay Analysis API provides AI-powered essay evaluation and feedback for ISEE preparation.

## Endpoints

### Submit Essay

Submit an essay for storage and potential analysis.

**POST** `/api/practice/essay/submit`

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "promptId": "550e8400-e29b-41d4-a716-446655440000",
  "content": "Essay content here...",
  "timeSpent": 15
}
```

**Response:**
```json
{
  "submission": {
    "id": "submission-id",
    "userId": "user-id",
    "promptId": "prompt-id",
    "content": "Essay content...",
    "wordCount": 150,
    "timeSpent": 15,
    "submittedAt": "2024-01-01T10:00:00Z"
  }
}
```

**Validation Rules:**
- `promptId`: Must be a valid UUID
- `content`: 50-10,000 characters
- `timeSpent`: 0-300 minutes (optional)

### Analyze Essay

Analyze a submitted essay using AI.

**POST** `/api/practice/essay/analyze`

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "submissionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "analysis": {
    "id": "analysis-id",
    "submissionId": "submission-id",
    "overallScore": 85,
    "structureScore": 80,
    "grammarScore": 90,
    "contentScore": 85,
    "vocabularyScore": 85,
    "feedback": {
      "strengths": [
        "Clear thesis statement",
        "Good use of examples"
      ],
      "improvements": [
        "Add more transition words",
        "Vary sentence structure"
      ],
      "specific": [
        "Consider using 'however' instead of 'but'",
        "Expand on the second example"
      ]
    },
    "rubricBreakdown": {
      "structure": {
        "score": 80,
        "feedback": "Well organized with clear introduction and conclusion"
      },
      "grammar": {
        "score": 90,
        "feedback": "Excellent grammar with minor punctuation issues"
      },
      "content": {
        "score": 85,
        "feedback": "Good ideas with relevant examples"
      },
      "vocabulary": {
        "score": 85,
        "feedback": "Appropriate word choice for grade level"
      }
    },
    "analyzedAt": "2024-01-01T10:30:00Z"
  },
  "suggestions": {
    "nextSteps": [
      "Great work! Try more challenging prompts to continue improving"
    ],
    "practiceAreas": []
  }
}
```

### Get Essay History

Retrieve user's essay submission and analysis history.

**GET** `/api/practice/essay/history?limit=10`

**Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `limit`: Number of essays to retrieve (1-50, default: 10)

**Response:**
```json
{
  "submissions": [
    {
      "id": "submission-id",
      "userId": "user-id",
      "promptId": "prompt-id",
      "content": "Essay content...",
      "wordCount": 150,
      "timeSpent": 15,
      "submittedAt": "2024-01-01T10:00:00Z"
    }
  ],
  "analyses": [
    {
      "id": "analysis-id",
      "submissionId": "submission-id",
      "overallScore": 85,
      "structureScore": 80,
      "grammarScore": 90,
      "contentScore": 85,
      "vocabularyScore": 85,
      "feedback": { /* ... */ },
      "rubricBreakdown": { /* ... */ },
      "analyzedAt": "2024-01-01T10:30:00Z"
    }
  ]
}
```

## Rate Limiting

- **Essay Analysis**: 3 analyses per user per hour
- **Global API**: 10 requests per minute

Rate limit exceeded responses return HTTP 429 with:
```json
{
  "error": "Rate limit exceeded",
  "message": "Rate limit exceeded. Try again in 30 seconds."
}
```

## Error Responses

### Validation Errors (400)
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "content",
      "message": "Essay must be at least 50 characters long"
    }
  ]
}
```

### Authentication Errors (401)
```json
{
  "error": "User not authenticated"
}
```

### Not Found Errors (404)
```json
{
  "error": "Essay submission not found"
}
```

### Server Errors (500)
```json
{
  "error": "Failed to analyze essay",
  "message": "AI analysis failed: OpenAI API error"
}
```

## Scoring System

All scores are on a 0-100 scale:

- **Overall Score**: Average of all component scores
- **Structure Score**: Organization, introduction, body, conclusion
- **Grammar Score**: Grammar, spelling, punctuation, mechanics
- **Content Score**: Relevance, depth, examples, creativity
- **Vocabulary Score**: Word choice, sentence variety, sophistication

## ISEE Rubric Integration

The analysis uses ISEE-specific rubrics appropriate for middle school students (grades 6-8):

- Age-appropriate language and feedback
- Focus on ISEE essay requirements
- Constructive, encouraging tone
- Specific, actionable suggestions

## Environment Variables

Required environment variables:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

If OpenAI API key is not configured, essay analysis endpoints will return:
```json
{
  "error": "OpenAI service not configured"
}
```
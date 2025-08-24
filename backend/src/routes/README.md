# Authentication API Endpoints

## Overview
The authentication system provides secure user registration, login, profile management, and session handling using Supabase Auth.

## Endpoints

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "examDate": "2024-06-01",
  "gradeLevel": 7,
  "parentEmail": "parent@example.com" // optional
}
```

**Response (201):**
```json
{
  "message": "Registration successful",
  "user": {
    "id": "uuid",
    "email": "student@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "examDate": "2024-06-01",
    "gradeLevel": 7,
    "parentEmail": "parent@example.com",
    "preferences": {
      "studyReminders": true,
      "parentNotifications": true,
      "difficultyLevel": "adaptive",
      "dailyGoalMinutes": 30
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": 1234567890
  }
}
```

### POST /api/auth/login
Authenticate an existing user.

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": { /* user profile */ },
  "session": { /* session tokens */ }
}
```

### POST /api/auth/logout
Logout the current user (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

### GET /api/auth/profile
Get the current user's profile (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "user": { /* user profile */ }
}
```

### PUT /api/auth/profile
Update the current user's profile (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body (all fields optional):**
```json
{
  "firstName": "Updated Name",
  "lastName": "Updated Last",
  "examDate": "2024-07-01",
  "gradeLevel": 8,
  "parentEmail": "newparent@example.com",
  "preferences": {
    "studyReminders": false,
    "parentNotifications": true,
    "difficultyLevel": "intermediate",
    "dailyGoalMinutes": 45
  }
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": { /* updated user profile */ }
}
```

### GET /api/auth/verify
Verify if the current token is valid (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "valid": true,
  "user": { /* user profile */ }
}
```

## Error Responses

### Validation Error (400)
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Authentication Error (401)
```json
{
  "error": "Access token required"
}
```

### Authorization Error (403)
```json
{
  "error": "Invalid or expired token"
}
```

### Rate Limit Error (429)
```json
{
  "error": "Too many authentication attempts, please try again later"
}
```

## Security Features

- **Rate Limiting**: 5 requests per 15 minutes for auth endpoints
- **Input Validation**: Comprehensive validation using Zod schemas
- **Password Requirements**: Minimum 8 characters
- **Token Verification**: JWT token validation for protected routes
- **CORS Protection**: Configured for frontend domain only
- **Helmet Security**: Security headers applied to all routes

## Middleware

- `authenticateToken`: Requires valid JWT token
- `validateRequest`: Validates request body against schema
- `authLimiter`: Rate limiting for authentication endpoints
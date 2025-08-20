# Project Structure & Organization

## Repository Structure

```
isee-ai-tutor/
├── frontend/                 # React TypeScript application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── auth/         # Authentication components
│   │   │   ├── dashboard/    # Dashboard and navigation
│   │   │   ├── practice/     # Practice module components
│   │   │   │   ├── math/     # Math practice components
│   │   │   │   ├── english/  # English practice components
│   │   │   │   └── essay/    # Essay practice components
│   │   │   ├── progress/     # Progress tracking components
│   │   │   ├── tutor/        # AI tutor interface
│   │   │   └── common/       # Shared UI components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API service functions
│   │   ├── types/            # TypeScript type definitions
│   │   ├── utils/            # Utility functions
│   │   ├── styles/           # Global styles and Tailwind config
│   │   └── pages/            # Page components
│   ├── public/               # Static assets
│   └── package.json
├── backend/                  # Node.js Express API
│   ├── src/
│   │   ├── routes/           # API route handlers
│   │   │   ├── auth.ts       # Authentication routes
│   │   │   ├── practice.ts   # Practice session routes
│   │   │   ├── progress.ts   # Progress tracking routes
│   │   │   └── tutor.ts      # AI tutor routes
│   │   ├── middleware/       # Express middleware
│   │   ├── services/         # Business logic services
│   │   │   ├── ai/           # OpenAI integration
│   │   │   ├── content/      # Content management
│   │   │   └── analytics/    # Progress analytics
│   │   ├── models/           # Data models and types
│   │   ├── utils/            # Utility functions
│   │   └── config/           # Configuration files
│   └── package.json
├── database/                 # Database schema and migrations
│   ├── migrations/           # Supabase migration files
│   ├── seeds/                # Test data and content
│   └── schema.sql            # Database schema definition
├── shared/                   # Shared types and utilities
│   └── types/                # Common TypeScript interfaces
└── docs/                     # Documentation
    ├── api/                  # API documentation
    ├── deployment/           # Deployment guides
    └── development/          # Development setup
```

## Component Organization

### Frontend Components
- **Atomic Design**: Follow atomic design principles (atoms, molecules, organisms)
- **Feature-based**: Group components by feature/domain
- **Shared Components**: Common UI elements in `components/common/`
- **Page Components**: Top-level page components in `pages/`

### Backend Structure
- **Route Handlers**: Thin controllers that delegate to services
- **Services**: Business logic and external API integration
- **Middleware**: Authentication, validation, error handling
- **Models**: Data validation and transformation

## File Naming Conventions

### Frontend
- **Components**: PascalCase (e.g., `MathProblem.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useProgress.ts`)
- **Services**: camelCase (e.g., `apiService.ts`)
- **Types**: PascalCase interfaces (e.g., `UserTypes.ts`)
- **Utils**: camelCase (e.g., `dateUtils.ts`)

### Backend
- **Routes**: kebab-case (e.g., `practice-routes.ts`)
- **Services**: camelCase (e.g., `aiService.ts`)
- **Models**: PascalCase (e.g., `UserModel.ts`)
- **Middleware**: camelCase (e.g., `authMiddleware.ts`)

## Configuration Files

### Environment Variables
- `.env.local` - Local development environment
- `.env.production` - Production environment
- `.env.example` - Template with required variables

### Key Configuration
- `vite.config.ts` - Frontend build configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `supabase/config.toml` - Supabase local configuration

## Content Organization

### Practice Content
- **Math Problems**: Organized by ISEE topics (arithmetic, algebra, geometry, data analysis)
- **Reading Passages**: Categorized by subject area and grade level
- **Essay Prompts**: Grouped by prompt type (narrative, expository, persuasive)
- **Vocabulary**: Organized by difficulty level and frequency

### Static Assets
- **Images**: Math diagrams, reading passage illustrations
- **Icons**: UI icons and achievement badges
- **Fonts**: Web fonts for optimal readability

## Development Workflow

### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Individual feature branches
- `hotfix/*` - Critical production fixes

### Code Organization Principles
- **Single Responsibility**: Each file/component has one clear purpose
- **DRY (Don't Repeat Yourself)**: Extract common functionality
- **Separation of Concerns**: Clear boundaries between UI, business logic, and data
- **Testability**: Structure code for easy unit and integration testing

### Import Organization
```typescript
// External libraries
import React from 'react'
import { useQuery } from 'react-query'

// Internal services and utilities
import { apiService } from '../services/apiService'
import { formatDate } from '../utils/dateUtils'

// Types
import type { User, PracticeSession } from '../types/UserTypes'

// Components (relative imports last)
import { Button } from './common/Button'
```
# Technology Stack & Development Guidelines

## Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS for utility-first styling
- **Routing**: React Router for client-side navigation
- **State Management**: React Query for server state and caching
- **Charts**: Chart.js for progress visualization
- **Rich Text**: Rich text editor for essay composition

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript for type safety
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **Real-time**: Supabase real-time subscriptions
- **AI Integration**: OpenAI API (GPT-4) for tutoring and essay analysis
- **Email**: Resend for notifications

### Infrastructure
- **Database & Auth**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **Frontend Deployment**: Vercel
- **Backend Deployment**: Railway or similar Node.js hosting
- **CDN**: For static assets and performance optimization

## Development Commands

### Frontend Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Type checking
npm run type-check
```

### Backend Development
```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Run tests
npm test

# Database migrations
npm run db:migrate

# Seed database
npm run db:seed
```

### Supabase Local Development
```bash
# Start Supabase locally
supabase start

# Stop Supabase
supabase stop

# Reset database
supabase db reset

# Generate types
supabase gen types typescript --local > types/supabase.ts
```

## Code Standards

### TypeScript
- Use strict TypeScript configuration
- Define interfaces for all data models
- Use proper typing for API responses and database queries
- Avoid `any` type - use proper type definitions

### React Components
- Use functional components with hooks
- Implement proper error boundaries
- Use React.memo for performance optimization where needed
- Follow component composition patterns

### API Design
- RESTful endpoints with consistent naming
- Proper HTTP status codes
- Comprehensive error handling
- Input validation and sanitization
- Rate limiting for AI endpoints

### Database
- Use Supabase Row Level Security (RLS)
- Proper indexing for performance
- Database migrations for schema changes
- Backup and recovery procedures

## Security Requirements

- COPPA compliance for users under 13
- Data encryption at rest and in transit
- Secure API key management
- Input validation and XSS prevention
- Rate limiting and abuse prevention
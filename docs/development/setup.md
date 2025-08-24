# Development Setup

## Prerequisites

- Node.js 18+ and npm
- Supabase CLI
- Git

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd isee-ai-tutor
```

2. Install dependencies:
```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

3. Set up Supabase locally:
```bash
supabase start
```

4. Set up environment variables:
```bash
cp .env.example .env
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

5. Update the environment files with your Supabase keys (displayed after `supabase start`)

6. Run database migrations:
```bash
supabase db push
```

## Development

Start the development servers:
```bash
npm run dev
```

This will start:
- Frontend on http://localhost:5173
- Backend on http://localhost:3001
- Supabase Studio on http://localhost:54323

## Testing

Run tests:
```bash
npm test
```

## Database Management

- View Supabase Studio: http://localhost:54323
- Reset database: `supabase db reset`
- Generate types: `supabase gen types typescript --local > shared/types/supabase.ts`
# Deployment Guide

This guide covers the deployment process for the ISEE AI Tutor application to staging and production environments.

## Overview

The application uses a multi-environment deployment strategy:
- **Staging**: For testing and validation before production
- **Production**: Live environment for end users

### Infrastructure

- **Frontend & Backend**: Deployed to Vercel (full-stack)
- **Database**: Supabase (managed PostgreSQL)
- **CI/CD**: GitHub Actions

## Prerequisites

### Required Tools

1. **Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Supabase CLI**
   ```bash
   npm install -g supabase
   ```

### Required Accounts

- Vercel account with project access
- Supabase account with project access
- GitHub repository with Actions enabled

## Environment Setup

### 1. Staging Environment

#### Supabase Staging Setup
1. Create a new Supabase project for staging
2. Configure authentication settings
3. Run database migrations:
   ```bash
   supabase db push --project-ref your-staging-project-ref
   ```

#### Vercel Staging Setup
1. Link the frontend to Vercel:
   ```bash
   cd frontend
   vercel link
   ```
2. Set environment variables:
   ```bash
   vercel env add VITE_SUPABASE_URL preview
   vercel env add VITE_SUPABASE_ANON_KEY preview
   vercel env add VITE_API_URL preview
   vercel env add VITE_ENVIRONMENT preview
   ```

#### Railway Staging Setup
1. Create a new Railway project for staging
2. Link the backend:
   ```bash
   cd backend
   railway login
   railway link
   ```
3. Set environment variables in Railway dashboard or CLI

### 2. Production Environment

#### Supabase Production Setup
1. Create a new Supabase project for production
2. Configure authentication with production domain
3. Enable Row Level Security (RLS)
4. Run database migrations:
   ```bash
   supabase db push --project-ref your-production-project-ref
   ```

#### Vercel Production Setup
1. Set production environment variables:
   ```bash
   vercel env add VITE_SUPABASE_URL production
   vercel env add VITE_SUPABASE_ANON_KEY production
   vercel env add VITE_API_URL production
   vercel env add VITE_ENVIRONMENT production
   ```

#### Railway Production Setup
1. Create a new Railway project for production
2. Configure production environment variables
3. Enable auto-scaling and monitoring

## Deployment Process

### Manual Deployment

#### Staging
```bash
# Deploy both frontend and backend to staging
npm run deploy:staging

# Or deploy individually
npm run deploy:staging:frontend
npm run deploy:staging:backend
```

#### Production
```bash
# Deploy both frontend and backend to production
npm run deploy:production

# Or deploy individually
npm run deploy:production:frontend
npm run deploy:production:backend
```

### Automated Deployment (CI/CD)

#### Staging Deployment
- Triggered on push to `develop` branch
- Runs tests before deployment
- Deploys to staging environment
- Runs health checks

#### Production Deployment
- Triggered on push to `main` branch or release creation
- Runs comprehensive tests including E2E
- Performs security audit
- Deploys to production environment
- Runs smoke tests

### GitHub Secrets Configuration

Add the following secrets to your GitHub repository:

```
VERCEL_TOKEN=your_vercel_token
RAILWAY_TOKEN=your_railway_token
SUPABASE_ACCESS_TOKEN=your_supabase_access_token
FRONTEND_URL=https://your-frontend.vercel.app
BACKEND_URL=https://your-backend.railway.app
```

## Environment Variables

### Frontend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_API_URL` | Backend API URL | Yes |
| `VITE_ENVIRONMENT` | Environment name | Yes |

### Backend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Node environment | Yes |
| `PORT` | Server port | No (defaults to 3001) |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `RESEND_API_KEY` | Resend email API key | Yes |
| `FROM_EMAIL` | From email address | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `ENCRYPTION_KEY` | Data encryption key | Yes |

## Monitoring and Health Checks

### Health Check Endpoints

- **Backend**: `GET /health`
- **Frontend**: Available at root URL

### Monitoring

- **Vercel**: Built-in analytics and performance monitoring
- **Railway**: Built-in metrics and logging
- **Supabase**: Database performance and usage metrics

### Logging

- **Backend**: Structured logging with Morgan
- **Frontend**: Error tracking with console logging
- **CI/CD**: GitHub Actions logs

## Rollback Procedures

### Frontend Rollback
```bash
# Rollback to previous deployment
vercel rollback
```

### Backend Rollback
```bash
# Rollback to previous deployment
railway rollback
```

### Database Rollback
```bash
# Rollback database migration
supabase db reset --project-ref your-project-ref
```

## Troubleshooting

### Common Issues

1. **Environment Variables Not Set**
   - Verify all required environment variables are configured
   - Check variable names match exactly

2. **Database Connection Issues**
   - Verify Supabase project is active
   - Check service role key permissions

3. **CORS Issues**
   - Verify FRONTEND_URL is set correctly in backend
   - Check Supabase auth configuration

4. **Build Failures**
   - Check for TypeScript errors
   - Verify all dependencies are installed

### Debug Commands

```bash
# Check deployment status
vercel ls
railway status

# View logs
vercel logs
railway logs

# Test health endpoints
curl https://your-backend.railway.app/health
curl https://your-frontend.vercel.app
```

## Security Considerations

- All environment variables containing secrets are encrypted
- HTTPS is enforced in production
- CORS is properly configured
- Rate limiting is enabled
- Security headers are set via Helmet.js
- Database access is protected by RLS policies

## Performance Optimization

- CDN is automatically configured via Vercel
- Database queries are optimized with proper indexing
- API responses are cached where appropriate
- Images and assets are optimized
- Bundle size is minimized through tree shaking
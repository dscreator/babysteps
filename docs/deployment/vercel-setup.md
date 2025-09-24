# Vercel Full-Stack Deployment Guide

This guide covers deploying the ISEE AI Tutor as a full-stack application on Vercel.

## Architecture Overview

- **Frontend**: React app served by Vercel
- **Backend**: Serverless API functions on Vercel
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage
- **Authentication**: Supabase Auth

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
3. **GitHub Repository**: Connected to Vercel
4. **Vercel CLI**: `npm install -g vercel`

## Setup Steps

### 1. Create Supabase Projects

#### Production Project
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Name: `babysteps-frontend-prod`
4. Choose a region close to your users
5. Set a strong database password
6. Wait for project creation

#### Staging Project (Optional)
1. Repeat above steps
2. Name: `babysteps-frontend-staging`

### 2. Configure Supabase

#### Database Setup
```sql
-- Run these in the Supabase SQL editor
-- (Your existing database migrations will be here)
```

#### Authentication Settings
1. Go to Authentication > Settings
2. Set Site URL to your Vercel domain
3. Add redirect URLs:
   - `https://babysteps-frontend.vercel.app/**`
   - `https://babysteps-frontend-git-*.vercel.app/**` (for preview deployments)

### 3. Deploy to Vercel

#### Initial Setup
```bash
# Clone your repository
git clone your-repo-url
cd babysteps

# Login to Vercel
vercel login

# Deploy (this will prompt for configuration)
vercel
```

#### Environment Variables
Set these in your Vercel dashboard (Settings > Environment Variables):

**Production Environment:**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_ENVIRONMENT=production

# Backend API variables
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
RESEND_API_KEY=your_resend_key
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
```

**Preview Environment (for staging):**
```
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_staging_anon_key
VITE_ENVIRONMENT=staging

# Backend API variables (staging versions)
SUPABASE_URL=https://your-staging-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_staging_service_role_key
OPENAI_API_KEY=your_staging_openai_key
RESEND_API_KEY=your_staging_resend_key
JWT_SECRET=your_staging_jwt_secret
ENCRYPTION_KEY=your_staging_encryption_key
```

### 4. Configure Automatic Deployments

#### GitHub Integration
1. Go to your Vercel dashboard
2. Import your GitHub repository
3. Configure build settings:
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `npm install`

#### Branch Configuration
- **Production Branch**: `main`
- **Preview Branches**: `develop`, feature branches

### 5. Custom Domain (Optional)

1. Go to Vercel dashboard > Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Update Supabase auth settings with new domain

## API Routes Structure

Your backend routes are now serverless functions:

```
/api/health              -> api/health.ts
/api/auth/register       -> api/auth/register.ts
/api/auth/login          -> api/auth/login.ts
/api/auth/profile        -> api/auth/profile.ts
/api/practice/*          -> api/practice/*.ts
/api/progress/*          -> api/progress/*.ts
/api/tutor/*             -> api/tutor/*.ts
```

## Deployment Commands

### Manual Deployment
```bash
# Deploy to production
npm run deploy:production

# Deploy to preview (staging)
npm run deploy:staging

# Deploy for testing
npm run deploy:preview
```

### Automatic Deployment
- **Push to `main`**: Deploys to production
- **Push to `develop`**: Deploys to preview
- **Pull requests**: Creates preview deployments

## Environment Management

### Local Development
```bash
# Pull environment variables from Vercel
vercel env pull .env.local

# Start development server
npm run dev
```

### Environment Variables
- **Production**: Set in Vercel dashboard for production environment
- **Preview**: Set in Vercel dashboard for preview environment
- **Development**: Use `.env.local` file (not committed)

## Monitoring and Logs

### Vercel Dashboard
- **Functions**: Monitor API function performance
- **Analytics**: Track page views and performance
- **Logs**: View function execution logs

### Health Checks
- **Endpoint**: `https://babysteps-frontend.vercel.app/api/health`
- **Monitoring**: Set up external monitoring (UptimeRobot, etc.)

## Troubleshooting

### Common Issues

1. **Function Timeout**
   - Increase timeout in `vercel.json`
   - Optimize database queries
   - Use connection pooling

2. **Environment Variables Not Working**
   - Check variable names match exactly
   - Ensure they're set for correct environment
   - Redeploy after changing variables

3. **CORS Issues**
   - Verify domain in Supabase auth settings
   - Check CORS configuration in API functions

4. **Build Failures**
   - Check build logs in Vercel dashboard
   - Verify all dependencies are installed
   - Check TypeScript compilation

### Debug Commands
```bash
# View deployment logs
vercel logs

# Check function logs
vercel logs --follow

# Test API endpoints locally
vercel dev
```

## Security Considerations

- All environment variables are encrypted
- API functions run in isolated environments
- Supabase handles authentication and authorization
- HTTPS is enforced by default
- Rate limiting is implemented in API functions

## Performance Optimization

- **Edge Functions**: API functions run at edge locations
- **CDN**: Static assets served from global CDN
- **Caching**: Implement appropriate caching strategies
- **Bundle Optimization**: Vite automatically optimizes bundles

## Cost Optimization

- **Hobby Plan**: Free for personal projects
- **Pro Plan**: $20/month for production apps
- **Function Execution**: Pay per invocation
- **Bandwidth**: Generous free tier

## Backup and Recovery

- **Database**: Supabase handles automated backups
- **Code**: Version controlled in Git
- **Environment Variables**: Document in secure location
- **Rollback**: Use Vercel's deployment history
# BabySteps Frontend - Vercel Deployment Guide

## Your Project Configuration

- **Project Name**: `babysteps-frontend`
- **Production URL**: `https://babysteps-frontend.vercel.app`
- **Staging URL**: `https://babysteps-frontend-git-develop.vercel.app`
- **Account Type**: Personal Vercel account

## Quick Setup Steps

### 1. Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account
3. Connect your GitHub repository

### 2. Create Supabase Projects

#### Production Project
- **Name**: `babysteps-frontend-prod`
- **URL**: Will be `https://[project-id].supabase.co`

#### Staging Project (Optional)
- **Name**: `babysteps-frontend-staging`
- **URL**: Will be `https://[project-id].supabase.co`

### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (first time setup)
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: babysteps-frontend
# - Directory: ./
# - Override settings? No
```

### 4. Set Environment Variables in Vercel

Go to your Vercel dashboard > babysteps-frontend > Settings > Environment Variables

**Production Environment:**
```
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_prod_anon_key
VITE_ENVIRONMENT=production

SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_role_key
OPENAI_API_KEY=your_openai_key
RESEND_API_KEY=your_resend_key
JWT_SECRET=your_jwt_secret_32_chars_min
ENCRYPTION_KEY=your_encryption_key_32_chars
```

**Preview Environment (for staging):**
```
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_staging_anon_key
VITE_ENVIRONMENT=staging

SUPABASE_URL=https://your-staging-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_staging_service_role_key
OPENAI_API_KEY=your_staging_openai_key
RESEND_API_KEY=your_staging_resend_key
JWT_SECRET=your_staging_jwt_secret
ENCRYPTION_KEY=your_staging_encryption_key
```

### 5. Configure Supabase Authentication

In your Supabase dashboard > Authentication > URL Configuration:

**Production:**
- Site URL: `https://babysteps-frontend.vercel.app`
- Redirect URLs: `https://babysteps-frontend.vercel.app/**`

**Staging:**
- Site URL: `https://babysteps-frontend-git-develop.vercel.app`
- Redirect URLs: `https://babysteps-frontend-git-develop.vercel.app/**`

### 6. Test Your Deployment

After deployment, test these URLs:
- **App**: `https://babysteps-frontend.vercel.app`
- **API Health**: `https://babysteps-frontend.vercel.app/api/health`

### 7. Automatic Deployments

Once connected to GitHub:
- **Push to `main`** → Deploys to production (`babysteps-frontend.vercel.app`)
- **Push to `develop`** → Deploys to preview (`babysteps-frontend-git-develop.vercel.app`)
- **Pull requests** → Creates preview deployments

## Deployment Commands

```bash
# Deploy to production
npm run deploy:production

# Deploy to staging/preview
npm run deploy:staging

# Deploy for testing
npm run deploy:preview
```

## Your Project URLs

- **Production**: https://babysteps-frontend.vercel.app
- **Staging**: https://babysteps-frontend-git-develop.vercel.app
- **API Health Check**: https://babysteps-frontend.vercel.app/api/health

## Next Steps

1. ✅ Create Vercel account
2. ✅ Create Supabase projects
3. ✅ Deploy to Vercel
4. ✅ Set environment variables
5. ✅ Configure Supabase auth
6. ✅ Test deployment
7. ✅ Set up automatic deployments

Your deployment pipeline is now configured with your specific project details!
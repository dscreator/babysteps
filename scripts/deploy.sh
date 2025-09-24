#!/bin/bash

# ISEE AI Tutor Deployment Script
# Usage: ./scripts/deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}

echo "🚀 Starting deployment to $ENVIRONMENT..."

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo "❌ Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Check if required tools are installed
command -v vercel >/dev/null 2>&1 || { echo "❌ Vercel CLI is required but not installed. Aborting." >&2; exit 1; }

# Run tests before deployment
echo "🧪 Running tests..."
npm test

# Deploy to Vercel
echo "🚀 Deploying to Vercel ($ENVIRONMENT)..."

if [[ "$ENVIRONMENT" == "production" ]]; then
    vercel --prod --yes
else
    vercel --target preview --yes
fi

echo "✅ Deployment to $ENVIRONMENT completed successfully!"

# Run post-deployment checks
echo "🔍 Running post-deployment health checks..."
sleep 10

if [[ "$ENVIRONMENT" == "production" ]]; then
    FRONTEND_URL=${PRODUCTION_FRONTEND_URL:-"https://babysteps-frontend.vercel.app"}
else
    FRONTEND_URL=${STAGING_FRONTEND_URL:-"https://babysteps-frontend-git-develop.vercel.app"}
fi

# Health check application
if curl -f "$FRONTEND_URL/api/health" > /dev/null 2>&1; then
    echo "✅ Application health check passed"
else
    echo "⚠️  Application health check failed"
fi

echo "🎉 Deployment process completed!"
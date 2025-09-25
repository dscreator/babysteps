#!/bin/bash

# Optimized deployment script for ISEE AI Tutor
set -e

echo "🚀 Starting optimized deployment process..."

# Environment check
if [ -z "$NODE_ENV" ]; then
    export NODE_ENV=production
fi

echo "📦 Installing dependencies..."
npm ci --only=production

echo "🔧 Building frontend with optimizations..."
cd frontend
npm run build:check
cd ..

echo "🔧 Building backend..."
cd backend
npm run build
cd ..

echo "📊 Analyzing bundle size..."
cd frontend
npx vite-bundle-analyzer dist/stats.html
cd ..

echo "🗜️ Compressing assets..."
find frontend/dist -name "*.js" -exec gzip -k {} \;
find frontend/dist -name "*.css" -exec gzip -k {} \;
find frontend/dist -name "*.html" -exec gzip -k {} \;

echo "🔍 Running security audit..."
npm audit --audit-level moderate

echo "🧪 Running tests..."
npm run test

echo "📈 Generating performance report..."
cd frontend
npx lighthouse-ci autorun --config=../lighthouse.config.js
cd ..

echo "🚀 Deploying to production..."
if [ "$DEPLOY_TARGET" = "vercel" ]; then
    npx vercel --prod
elif [ "$DEPLOY_TARGET" = "railway" ]; then
    railway deploy
else
    echo "No deployment target specified"
fi

echo "✅ Deployment completed successfully!"

# Post-deployment health check
echo "🏥 Running post-deployment health check..."
sleep 10
curl -f "${HEALTH_CHECK_URL:-https://your-app.vercel.app}/api/monitoring/health" || exit 1

echo "🎉 All systems operational!"
#!/bin/bash

# Environment Setup Script
# Usage: ./scripts/setup-env.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}

echo "🔧 Setting up environment configuration for $ENVIRONMENT..."

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo "❌ Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Create environment-specific configuration
echo "📝 Creating environment configuration..."

# Frontend environment setup
if [[ ! -f "frontend/.env.$ENVIRONMENT" ]]; then
    echo "⚠️  frontend/.env.$ENVIRONMENT not found. Please create it with the required variables."
    exit 1
fi

# Backend environment setup
if [[ ! -f "backend/.env.$ENVIRONMENT" ]]; then
    echo "⚠️  backend/.env.$ENVIRONMENT not found. Please create it with the required variables."
    exit 1
fi

# Validate required environment variables
echo "🔍 Validating environment variables..."

# Check frontend variables
FRONTEND_ENV_FILE="frontend/.env.$ENVIRONMENT"
required_frontend_vars=("VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY" "VITE_API_URL")

for var in "${required_frontend_vars[@]}"; do
    if ! grep -q "^$var=" "$FRONTEND_ENV_FILE"; then
        echo "❌ Missing required frontend variable: $var"
        exit 1
    fi
done

# Check backend variables
BACKEND_ENV_FILE="backend/.env.$ENVIRONMENT"
required_backend_vars=("NODE_ENV" "SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY" "OPENAI_API_KEY")

for var in "${required_backend_vars[@]}"; do
    if ! grep -q "^$var=" "$BACKEND_ENV_FILE"; then
        echo "❌ Missing required backend variable: $var"
        exit 1
    fi
done

echo "✅ Environment configuration validated successfully!"

# Set up Vercel environment variables
echo "🌐 Setting up Vercel environment variables..."
cd frontend

# Read environment variables and set them in Vercel
while IFS='=' read -r key value; do
    if [[ ! $key =~ ^#.* ]] && [[ -n $key ]]; then
        # Remove quotes from value if present
        value=$(echo "$value" | sed 's/^"//;s/"$//')
        
        if [[ "$ENVIRONMENT" == "production" ]]; then
            vercel env add "$key" production <<< "$value"
        else
            vercel env add "$key" preview <<< "$value"
        fi
    fi
done < ".env.$ENVIRONMENT"

cd ..

echo "✅ Environment setup completed for $ENVIRONMENT!"
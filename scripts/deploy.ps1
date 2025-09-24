# ISEE AI Tutor Deployment Script (PowerShell)
# Usage: .\scripts\deploy.ps1 [staging|production]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("staging", "production")]
    [string]$Environment = "staging"
)

Write-Host "🚀 Starting deployment to $Environment..." -ForegroundColor Green

# Check if required tools are installed
try {
    vercel --version | Out-Null
} catch {
    Write-Host "❌ Vercel CLI is required but not installed. Aborting." -ForegroundColor Red
    exit 1
}

# Run tests before deployment
Write-Host "🧪 Running tests..." -ForegroundColor Yellow
npm test
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Tests failed. Aborting deployment." -ForegroundColor Red
    exit 1
}

# Deploy to Vercel
Write-Host "🚀 Deploying to Vercel ($Environment)..." -ForegroundColor Yellow

if ($Environment -eq "production") {
    vercel --prod --yes
} else {
    vercel --target preview --yes
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deployment to $Environment completed successfully!" -ForegroundColor Green

# Run post-deployment checks
Write-Host "🔍 Running post-deployment health checks..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

if ($Environment -eq "production") {
    $FrontendUrl = $env:PRODUCTION_FRONTEND_URL ?? "https://babysteps-frontend.vercel.app"
} else {
    $FrontendUrl = $env:STAGING_FRONTEND_URL ?? "https://babysteps-frontend-git-develop.vercel.app"
}

# Health check application
try {
    Invoke-WebRequest -Uri "$FrontendUrl/api/health" -Method Head -TimeoutSec 10 | Out-Null
    Write-Host "✅ Application health check passed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Application health check failed" -ForegroundColor Yellow
}

Write-Host "🎉 Deployment process completed!" -ForegroundColor Green
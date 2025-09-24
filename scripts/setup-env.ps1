# Environment Setup Script (PowerShell)
# Usage: .\scripts\setup-env.ps1 [staging|production]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("staging", "production")]
    [string]$Environment = "staging"
)

Write-Host "🔧 Setting up environment configuration for $Environment..." -ForegroundColor Green

# Create environment-specific configuration
Write-Host "📝 Creating environment configuration..." -ForegroundColor Yellow

# Frontend environment setup
$FrontendEnvFile = "frontend\.env.$Environment"
if (-not (Test-Path $FrontendEnvFile)) {
    Write-Host "⚠️  $FrontendEnvFile not found. Please create it with the required variables." -ForegroundColor Red
    exit 1
}

# Backend environment setup
$BackendEnvFile = "backend\.env.$Environment"
if (-not (Test-Path $BackendEnvFile)) {
    Write-Host "⚠️  $BackendEnvFile not found. Please create it with the required variables." -ForegroundColor Red
    exit 1
}

# Validate required environment variables
Write-Host "🔍 Validating environment variables..." -ForegroundColor Yellow

# Check frontend variables
$RequiredFrontendVars = @("VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "VITE_API_URL")
$FrontendContent = Get-Content $FrontendEnvFile

foreach ($var in $RequiredFrontendVars) {
    $found = $FrontendContent | Where-Object { $_ -match "^$var=" }
    if (-not $found) {
        Write-Host "❌ Missing required frontend variable: $var" -ForegroundColor Red
        exit 1
    }
}

# Check backend variables
$RequiredBackendVars = @("NODE_ENV", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "OPENAI_API_KEY")
$BackendContent = Get-Content $BackendEnvFile

foreach ($var in $RequiredBackendVars) {
    $found = $BackendContent | Where-Object { $_ -match "^$var=" }
    if (-not $found) {
        Write-Host "❌ Missing required backend variable: $var" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Environment configuration validated successfully!" -ForegroundColor Green

# Set up Vercel environment variables
Write-Host "🌐 Setting up Vercel environment variables..." -ForegroundColor Yellow
Set-Location frontend

# Read environment variables and set them in Vercel
$EnvContent = Get-Content ".env.$Environment"
foreach ($line in $EnvContent) {
    if ($line -match '^([^#][^=]+)=(.*)$') {
        $key = $matches[1]
        $value = $matches[2] -replace '^"(.*)"$', '$1'  # Remove quotes if present
        
        if ($Environment -eq "production") {
            Write-Host "Setting $key for production..." -ForegroundColor Cyan
            echo $value | vercel env add $key production
        } else {
            Write-Host "Setting $key for preview..." -ForegroundColor Cyan
            echo $value | vercel env add $key preview
        }
    }
}

Set-Location ..

Write-Host "✅ Environment setup completed for $Environment!" -ForegroundColor Green
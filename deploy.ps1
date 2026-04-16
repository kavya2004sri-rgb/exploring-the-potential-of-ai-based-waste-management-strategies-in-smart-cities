# Quick Deployment Script for Railway
# Run this in PowerShell

Write-Host "🚀 RecycleConnect - Deployment Helper" -ForegroundColor Green
Write-Host ""

# Check if git is initialized
if (-not (Test-Path .git)) {
    Write-Host "📦 Initializing Git..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git initialized" -ForegroundColor Green
}

# Check for uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host "📝 Adding all files..." -ForegroundColor Yellow
    git add .
    
    $commitMessage = Read-Host "Enter commit message (or press Enter for default)"
    if ([string]::IsNullOrWhiteSpace($commitMessage)) {
        $commitMessage = "Ready for deployment - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    }
    
    git commit -m $commitMessage
    Write-Host "✅ Changes committed" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Create a new repository on GitHub (https://github.com/new)"
Write-Host "2. Copy your repository URL (e.g., https://github.com/username/repo.git)"
Write-Host ""

$repoUrl = Read-Host "Paste your GitHub repository URL (or press Enter to skip)"

if (-not [string]::IsNullOrWhiteSpace($repoUrl)) {
    Write-Host ""
    Write-Host "🔗 Adding remote and pushing..." -ForegroundColor Yellow
    
    # Remove existing remote if any
    git remote remove origin 2>$null
    
    git remote add origin $repoUrl
    git branch -M main
    
    try {
        git push -u origin main
        Write-Host "✅ Code pushed to GitHub!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Push failed. You may need to authenticate with GitHub first." -ForegroundColor Red
        Write-Host "Try running: gh auth login" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎯 Deploy to Railway:" -ForegroundColor Cyan
Write-Host "1. Visit https://railway.app" -ForegroundColor White
Write-Host "2. Sign up with GitHub" -ForegroundColor White
Write-Host "3. Click 'New Project' → 'Deploy from GitHub repo'" -ForegroundColor White
Write-Host "4. Select your repository" -ForegroundColor White
Write-Host "5. Add environment variables:" -ForegroundColor White
Write-Host "   - NODE_ENV=production" -ForegroundColor Gray
Write-Host "   - SESSION_SECRET=<generate 32-char secret>" -ForegroundColor Gray
Write-Host "   - AI_INTEGRATIONS_GEMINI_API_KEY=<your-gemini-key>" -ForegroundColor Gray
Write-Host "6. Add volumes:" -ForegroundColor White
Write-Host "   - /app/uploads" -ForegroundColor Gray
Write-Host "   - /app/data" -ForegroundColor Gray
Write-Host "7. Generate domain to get your live URL!" -ForegroundColor White
Write-Host ""

# Generate a session secret
Write-Host "🔐 Generate SESSION_SECRET:" -ForegroundColor Cyan
$secret = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
Write-Host $secret -ForegroundColor Yellow
Write-Host ""
Write-Host "Copy this and use it as SESSION_SECRET in Railway!" -ForegroundColor Green
Write-Host ""

Write-Host "📖 For detailed instructions, see DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "✨ Good luck with your deployment!" -ForegroundColor Green

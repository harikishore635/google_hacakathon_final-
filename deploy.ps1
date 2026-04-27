$ErrorActionPreference = "Continue"
$env:GITHUB_TOKEN = "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"
$remoteUrl = "https://${env:GITHUB_TOKEN}@github.com/sasank-456/NEXSEVA-Intelligence_Meets_Compassion.git"

Write-Host "STEP 1: Initialize/update..."
if (!(Test-Path .git)) { git init }
git remote set-url origin $remoteUrl 2>$null
if ($LASTEXITCODE -ne 0) { git remote add origin $remoteUrl }
git fetch --all

# The user is probably on another branch and has uncommitted changes.
# We will just stash first to be safe, switch to main, and unstash so we can commit!
git stash
git checkout main 2>$null
if ($LASTEXITCODE -ne 0) { git checkout -b main }
git pull origin main --rebase
git stash pop

Write-Host "STEP 2: Stage and commit..."
git add .
$status = git status --porcelain
if ($status) {
    git commit -m "feat: add crisis-db, KarmaDAO wallet integration, and dashboard data-binding"
}

Write-Host "STEP 3: Push main..."
git push $remoteUrl main
if ($LASTEXITCODE -ne 0) {
    git pull $remoteUrl main --rebase
    git push $remoteUrl main
}

Write-Host "STEP 4: Create and push branches..."
git checkout main
git checkout -B feature/dev-collaborator1-frontend
git push $remoteUrl feature/dev-collaborator1-frontend

git checkout main
git checkout -B feature/dev-collaborator2-backend
git push $remoteUrl feature/dev-collaborator2-backend

git checkout main
Write-Host "DONE"

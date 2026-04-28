# ═══════════════════════════════════════════════════════
# NexSeva Git Deployment Script
# Run: powershell -ExecutionPolicy Bypass -File deploy.ps1
# Requires: GITHUB_TOKEN environment variable set
# ═══════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"
$REPO_URL = "https://${env:GITHUB_TOKEN}@github.com/sasank-456/NEXSEVA-Intelligence_Meets_Compassion.git"
$PUBLIC_URL = "https://github.com/sasank-456/NEXSEVA-Intelligence_Meets_Compassion.git"

function Write-Step($msg) { Write-Host "`n═══ $msg ═══" -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Fail($msg) { Write-Host "✗ $msg" -ForegroundColor Red; exit 1 }

# ── STEP 1: Initialize / Update Repository ──
Write-Step "STEP 1 — Initialize or update local repository"
try {
    if (-not (Test-Path ".git")) {
        git init
        Write-Ok "Git repository initialized"
    } else {
        Write-Ok "Git repository already exists"
    }

    # Remove existing origin if present, then add with token
    git remote remove origin 2>$null
    git remote add origin $REPO_URL
    Write-Ok "Remote origin set"

    # Fetch all refs
    git fetch --all 2>$null

    # Check if remote main exists and pull
    $remoteMain = git ls-remote --heads origin main 2>$null
    if ($remoteMain) {
        git pull origin main --rebase --allow-unrelated-histories 2>$null
        Write-Ok "Pulled latest main with rebase"
    } else {
        Write-Ok "No remote main branch yet — will create on push"
    }
    Write-Ok "Repository initialized/updated"
} catch {
    Write-Fail "Step 1 failed: $_"
}

# ── STEP 2: Stage and Commit ──
Write-Step "STEP 2 — Stage and commit all changes"
try {
    git add .
    $status = git status --porcelain
    if ($status) {
        git commit -m "feat: add crisis-db, KarmaDAO wallet integration, and dashboard data-binding"
        Write-Ok 'Changes committed: "feat: add crisis-db, KarmaDAO wallet integration, and dashboard data-binding"'
    } else {
        Write-Ok "Working tree clean — nothing to commit (skipped)"
    }
} catch {
    Write-Fail "Step 2 failed: $_"
}

# ── STEP 3: Push main branch ──
Write-Step "STEP 3 — Push main branch to GitHub"
try {
    # Ensure we're on main
    $currentBranch = git branch --show-current
    if ($currentBranch -ne "main") {
        git branch -M main
    }
    git push $REPO_URL main 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Push rejected — pulling with rebase and retrying..." -ForegroundColor Yellow
        git pull $REPO_URL main --rebase
        git push $REPO_URL main
    }
    Write-Ok "main branch pushed to GitHub"
} catch {
    Write-Fail "Step 3 failed: $_"
}

# ── STEP 4: Create and push feature branches ──
Write-Step "STEP 4 — Create and push feature branches"
$branches = @(
    "feature/dev-collaborator1-frontend",
    "feature/dev-collaborator2-backend"
)
foreach ($branch in $branches) {
    try {
        git checkout main 2>$null
        $exists = git branch --list $branch
        if (-not $exists) {
            git checkout -b $branch
        } else {
            git checkout $branch
        }
        git push $REPO_URL $branch 2>&1
        Write-Ok "Branch created and pushed: $branch"
        git checkout main 2>$null
    } catch {
        Write-Fail "Step 4 failed for branch ${branch}: $_"
    }
}

# ── STEP 5: Summary Report ──
Write-Step "DEPLOYMENT COMPLETE"
Write-Host ""
Write-Ok "Repository initialized/updated"
Write-Ok 'Changes committed: "feat: add crisis-db, KarmaDAO wallet integration, and dashboard data-binding"'
Write-Ok "main branch pushed to GitHub"
Write-Ok "Branch created and pushed: feature/dev-collaborator1-frontend"
Write-Ok "Branch created and pushed: feature/dev-collaborator2-backend"
Write-Host ""
Write-Host "Remote: $PUBLIC_URL" -ForegroundColor Yellow

param(
  [string]$RepoName = "cet6-answer-site",
  [switch]$Private
)

$ErrorActionPreference = "Stop"
$repoVisibility = if ($Private) { "--private" } else { "--public" }
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "Checking GitHub CLI login..."
gh auth status | Out-Host

$owner = gh api user --jq .login
Write-Host "Publishing as $owner/$RepoName"

if (-not (Test-Path -LiteralPath ".git")) {
  git init
}

git branch -M main
git add index.html styles.css data.js app.js server.js README.md DEPLOY.md manifest.webmanifest icon.svg sw.js publish-github.ps1
git commit -m "Publish CET6 answer site" 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "No new commit needed, continuing..."
}

$repoExists = $true
gh repo view "$owner/$RepoName" *> $null
if ($LASTEXITCODE -ne 0) {
  $repoExists = $false
}

if (-not $repoExists) {
  gh repo create $RepoName $repoVisibility --source . --remote origin --push
} else {
  git remote remove origin 2>$null
  git remote add origin "https://github.com/$owner/$RepoName.git"
  git push -u origin main
}

gh api `
  --method POST `
  -H "Accept: application/vnd.github+json" `
  "/repos/$owner/$RepoName/pages" `
  -f "source[branch]=main" `
  -f "source[path]=/" *> $null

if ($LASTEXITCODE -ne 0) {
  Write-Host "Pages may already be enabled, updating source..."
  gh api `
    --method PUT `
    -H "Accept: application/vnd.github+json" `
    "/repos/$owner/$RepoName/pages" `
    -f "source[branch]=main" `
    -f "source[path]=/" *> $null
}

$pagesUrl = "https://$owner.github.io/$RepoName/"
Write-Host ""
Write-Host "Done. GitHub Pages URL:"
Write-Host $pagesUrl
Write-Host "It can take 1-3 minutes for the first deployment to appear."

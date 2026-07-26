$ErrorActionPreference = "Stop"

try {
    $repoRoot = git rev-parse --show-toplevel 2>$null
} catch {
    throw "This script must be run inside the capstone Git repository."
}

if (-not $repoRoot) {
    throw "This script must be run inside the capstone Git repository."
}

Set-Location $repoRoot

if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
    throw "Claude Code was not found. Install Claude Code and confirm that the 'claude' command works."
}

try {
    git rev-parse HEAD | Out-Null
} catch {
    throw "The repository needs at least one Git commit before an isolated worktree can be created."
}

$gitStatus = git status --porcelain

if ($gitStatus) {
    Write-Host ""
    Write-Host "The working tree contains uncommitted files."
    Write-Host ""
    Write-Host "Commit or stash your work before starting the overnight agents."
    Write-Host ""
    Write-Host "Suggested commands:"
    Write-Host 'git add .'
    Write-Host 'git commit -m "chore: prepare capstone AI agent run"'
    Write-Host '.\Start-CapstoneAgents.ps1'
    Write-Host ""
    exit 1
}

$thesisFiles = Get-ChildItem "docs/thesis" -File |
    Where-Object {
        $_.Name -ne "README.md" -and
        $_.Name -notlike "*.placeholder"
    }

if (-not $thesisFiles) {
    Write-Host ""
    Write-Host "No thesis file was found inside docs/thesis/."
    Write-Host ""
    Write-Host "Add the thesis PDF or DOCX, commit it, and run this launcher again."
    Write-Host ""
    exit 1
}

$queueFiles = Get-ChildItem "agent-queue" -Filter "*.md" -File |
    Where-Object {
        $_.Name -notlike "_*" -and
        $_.Name -ne "README.md"
    }

if (-not $queueFiles) {
    Write-Host ""
    Write-Host "No active change request was found."
    Write-Host ""
    Write-Host "Copy agent-queue/_CHANGE-TEMPLATE.md to a new filename,"
    Write-Host "complete the request, commit it, and run this launcher again."
    Write-Host ""
    exit 1
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$worktreeName = "capstone-nightly-$stamp"
$sessionName = "capstone-nightly-$stamp"
$runLog = Join-Path $repoRoot "agent-artifacts/runs/$sessionName.log"
$prompt = Get-Content ".claude/prompts/run-overnight.md" -Raw

New-Item -ItemType Directory -Force "agent-artifacts/runs" | Out-Null

Write-Host ""
Write-Host "Starting unattended Capstone AI Agent Team"
Write-Host "Session: $sessionName"
Write-Host "Worktree: $worktreeName"
Write-Host "Log: $runLog"
Write-Host ""
Write-Host "The agents are prohibited from merging, pushing, and deploying."
Write-Host ""

claude `
    -p `
    --name $sessionName `
    --worktree $worktreeName `
    --agent capstone-team-lead `
    --permission-mode auto `
    --output-format text `
    $prompt 2>&1 | Tee-Object -FilePath $runLog

$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "Capstone AI Agent run finished."
Write-Host "Exit code: $exitCode"
Write-Host "Log: $runLog"
Write-Host ""
Write-Host "Review the generated worktree branch and:"
Write-Host "agent-artifacts/nightly-summary.md"
Write-Host ""

exit $exitCode
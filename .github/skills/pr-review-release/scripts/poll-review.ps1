<#
.SYNOPSIS
    輪詢等待 GitHub Copilot Code Review 完成

.DESCRIPTION
    此腳本使用 gh CLI 定期查詢 PR 的 Copilot code review 狀態，
    直到 review 完成（COMMENTED / APPROVED / CHANGES_REQUESTED）。

    已知問題修正（v2.0.0）：
    - 避免在 jq 查詢中使用 PowerShell 反引號跳脫（改用單引號包裹 jq）
    - 使用 gh api 時動態取得 owner/repo（不使用文字佔位符）
    - 簡化 ConvertFrom-Json 管道，改用字串比對

.PARAMETER PrNumber
    PR 編號。若未指定，則使用當前分支的 PR。

.PARAMETER TimeoutMinutes
    等待逾時時間（分鐘）。預設 30 分鐘。

.PARAMETER PollIntervalSeconds
    輪詢間隔（秒）。預設 60 秒。

.EXAMPLE
    .\poll-review.ps1
    .\poll-review.ps1 -PrNumber 123
    .\poll-review.ps1 -TimeoutMinutes 60 -PollIntervalSeconds 30
#>

param(
    [Parameter(Position = 0)]
    [int]$PrNumber = 0,

    [int]$TimeoutMinutes = 30,

    [int]$PollIntervalSeconds = 60
)

$ErrorActionPreference = 'Stop'

# --- 取得 repo 資訊 ---
$repoFullName = gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>$null
if (-not $repoFullName) {
    Write-Host "ERROR: cannot detect repo (run from a git repo with gh auth)" -ForegroundColor Red
    exit 1
}

# --- 取得 PR 編號（若未指定）---
if ($PrNumber -eq 0) {
    $PrNumber = gh pr view --json number --jq '.number' 2>$null
    if (-not $PrNumber) {
        Write-Host "ERROR: cannot detect PR number for current branch" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Polling PR #$PrNumber Copilot Code Review status" -ForegroundColor Cyan
Write-Host "  Repo: $repoFullName | Timeout: ${TimeoutMinutes}m | Interval: ${PollIntervalSeconds}s" -ForegroundColor Gray
Write-Host ("-" * 55)

$startTime = Get-Date

while ($true) {
    $elapsed = (Get-Date) - $startTime
    $elapsedMin = [int]$elapsed.TotalMinutes
    $ts = Get-Date -Format "HH:mm:ss"

    # --- 逾時檢查 ---
    if ($elapsed.TotalMinutes -ge $TimeoutMinutes) {
        Write-Host ""
        Write-Host "TIMEOUT [$ts] after ${TimeoutMinutes}m" -ForegroundColor Yellow
        exit 2
    }

    # --- 查詢所有 reviews（以 JSON 陣列輸出）---
    $rawReviews = gh pr view $PrNumber --json reviews --jq '.reviews' 2>$null

    if (-not $rawReviews -or $rawReviews -eq 'null' -or $rawReviews -eq '[]') {
        Write-Host "WAIT [$ts] no reviews yet (${elapsedMin}m elapsed)" -ForegroundColor Gray
        Start-Sleep -Seconds $PollIntervalSeconds
        continue
    }

    # --- 找 Copilot review（字串比對，避免 jq 跳脫問題）---
    $reviews = $rawReviews | ConvertFrom-Json
    $copilotReview = $reviews |
        Where-Object { $_.author.login -eq 'copilot-pull-request-reviewer' -or $_.author.login -eq 'Copilot' } |
        Select-Object -Last 1

    if (-not $copilotReview) {
        Write-Host "WAIT [$ts] no Copilot review found (${elapsedMin}m elapsed)" -ForegroundColor Gray
        Start-Sleep -Seconds $PollIntervalSeconds
        continue
    }

    $state = $copilotReview.state

    # --- 終結狀態處理 ---
    if ($state -eq 'PENDING') {
        Write-Host "WAIT [$ts] Copilot review in progress (${elapsedMin}m elapsed)" -ForegroundColor Gray
        Start-Sleep -Seconds $PollIntervalSeconds
        continue
    }

    # COMMENTED / APPROVED / CHANGES_REQUESTED 都是完成狀態
    $icon = if ($state -eq 'CHANGES_REQUESTED') { 'CHANGES_REQUESTED' } elseif ($state -eq 'APPROVED') { 'APPROVED' } else { 'COMMENTED' }
    $color = if ($state -eq 'CHANGES_REQUESTED') { 'Red' } else { 'Green' }

    Write-Host ""
    Write-Host "$icon [$ts] PR #$PrNumber Copilot review: $state" -ForegroundColor $color

    # --- 輸出 review body ---
    if ($copilotReview.body) {
        Write-Host ""
        Write-Host "Review body:" -ForegroundColor Cyan
        Write-Host $copilotReview.body
    }

    # --- 取得 line comments（使用動態 repo 名稱）---
    Write-Host ""
    Write-Host "Line comments:" -ForegroundColor Yellow
    $jqFilter = '.[] | select(.user.login == "copilot-pull-request-reviewer" or .user.login == "Copilot") | {path, line, body}'
    $lineComments = gh api "repos/$repoFullName/pulls/$PrNumber/comments" --jq $jqFilter 2>$null
    if ($lineComments) {
        Write-Host $lineComments
    }
    else {
        Write-Host "(no line comments)" -ForegroundColor Gray
    }

    # --- Exit code：CHANGES_REQUESTED=1，其他=0 ---
    if ($state -eq 'CHANGES_REQUESTED') { exit 1 } else { exit 0 }
}


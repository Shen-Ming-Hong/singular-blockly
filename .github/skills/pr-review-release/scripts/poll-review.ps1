<#
.SYNOPSIS
    輪詢等待 GitHub Copilot Code Review 完成

.DESCRIPTION
    此腳本使用 gh CLI 定期查詢 PR 的 Copilot code review 狀態，
    直到 review 狀態變為 APPROVED 或 CHANGES_REQUESTED。

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

.NOTES
    Copilot reviewer login: copilot-pull-request-reviewer
#>

param(
    [Parameter(Position = 0)]
    [int]$PrNumber = 0,
    
    [int]$TimeoutMinutes = 30,
    
    [int]$PollIntervalSeconds = 60
)

$ErrorActionPreference = 'Stop'

# 取得 PR 編號（若未指定）
if ($PrNumber -eq 0) {
    try {
        $PrNumber = gh pr view --json number --jq '.number' 2>$null
        if (-not $PrNumber) {
            Write-Host "❌ 無法取得當前分支的 PR 編號" -ForegroundColor Red
            exit 1
        }
    }
    catch {
        Write-Host "❌ 無法取得當前分支的 PR 編號: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host "🔍 監聯 PR #$PrNumber 的 Copilot Code Review 狀態" -ForegroundColor Cyan
Write-Host "   逾時: $TimeoutMinutes 分鐘 | 間隔: $PollIntervalSeconds 秒" -ForegroundColor Gray
Write-Host ("-" * 50)

$startTime = Get-Date
# Copilot reviewer 可能以不同的 login 出現
$copilotLogins = @("copilot-pull-request-reviewer", "Copilot")

function Get-CopilotReviewState {
    param([int]$pr)
    
    # 嘗試所有可能的 Copilot login
    foreach ($login in $copilotLogins) {
        $jqQuery = ".reviews | map(select(.author.login == `"$login`")) | last"
        $review = gh pr view $pr --json reviews --jq $jqQuery 2>$null
        
        if ($review -and $review -ne "null") {
            return $review | ConvertFrom-Json
        }
    }
    return $null
}

function Get-CopilotReviewComments {
    param([int]$pr)
    
    # 取得 review threads（包含 line comments）- 嘗試所有可能的 login
    foreach ($login in $copilotLogins) {
        $jqQuery = ".reviews | map(select(.author.login == `"$login`"))"
        $reviews = gh pr view $pr --json reviews --jq $jqQuery 2>$null
        
        if ($reviews -and $reviews -ne "[]") {
            return $reviews
        }
    }
    return "[]"
}

while ($true) {
    $elapsed = (Get-Date) - $startTime
    $elapsedMinutes = [int]$elapsed.TotalMinutes
    $timestamp = Get-Date -Format "HH:mm:ss"
    
    # 檢查逾時
    if ($elapsed.TotalMinutes -ge $TimeoutMinutes) {
        Write-Host "`n⏰ [$timestamp] 等待逾時（$TimeoutMinutes 分鐘）" -ForegroundColor Yellow
        
        # 輸出最後狀態
        $lastReview = Get-CopilotReviewState -pr $PrNumber
        if ($lastReview) {
            Write-Host "`n📋 最後 Review 狀態:" -ForegroundColor Gray
            Write-Host ($lastReview | ConvertTo-Json -Depth 3)
        }
        
        exit 2
    }
    
    # 查詢 Copilot review 狀態
    $review = Get-CopilotReviewState -pr $PrNumber
    
    if (-not $review) {
        Write-Host "⏳ [$timestamp] 等待 Copilot Review... (已等待 ${elapsedMinutes}m)" -ForegroundColor Gray
    }
    else {
        $state = $review.state
        
        switch ($state) {
            "APPROVED" {
                Write-Host "`n✅ [$timestamp] PR #$PrNumber 已通過 Copilot Code Review！" -ForegroundColor Green
                
                # 輸出完整 review 資訊
                Write-Host "`n📋 Review 詳情:" -ForegroundColor Cyan
                $comments = Get-CopilotReviewComments -pr $PrNumber
                Write-Host $comments
                
                exit 0
            }
            "CHANGES_REQUESTED" {
                Write-Host "`n❌ [$timestamp] Copilot 要求修改 PR #$PrNumber" -ForegroundColor Red
                
                # 輸出完整 review 資訊（包含需修改的內容）
                Write-Host "`n📋 Review 詳情:" -ForegroundColor Cyan
                $comments = Get-CopilotReviewComments -pr $PrNumber
                Write-Host $comments
                
                # 取得 PR review threads（包含具體的 line comments）
                Write-Host "`n📝 Review Comments:" -ForegroundColor Yellow
                gh pr view $PrNumber --json reviewThreads --jq '.reviewThreads[] | select(.comments[0].author.login == "copilot-pull-request-reviewer") | {path: .path, line: .line, body: .comments[0].body}'
                
                exit 1
            }
            "COMMENTED" {
                # Copilot Code Review 完成後狀態通常為 COMMENTED（而非 APPROVED）
                Write-Host "`n💬 [$timestamp] Copilot Code Review 已完成 PR #$PrNumber" -ForegroundColor Green
                
                # 輸出完整 review 資訊
                Write-Host "`n📋 Review 詳情:" -ForegroundColor Cyan
                $comments = Get-CopilotReviewComments -pr $PrNumber
                Write-Host $comments
                
                # 嘗試取得 line comments（使用 API 搭配 jq 過濾）
                Write-Host "`n📝 Line Comments:" -ForegroundColor Yellow
                try {
                    $jqFilter = '.[] | select(.user.login == "Copilot" or .user.login == "copilot-pull-request-reviewer") | {path: .path, line: .line, body: .body}'
                    $lineComments = gh api "repos/{owner}/{repo}/pulls/$PrNumber/comments" --jq $jqFilter 2>$null
                    if ($lineComments) {
                        Write-Host $lineComments
                    } else {
                        Write-Host "(無 line comments)" -ForegroundColor Gray
                    }
                } catch {
                    Write-Host "(無法取得 line comments)" -ForegroundColor Gray
                }
                
                exit 0
            }
            "PENDING" {
                Write-Host "⏳ [$timestamp] Copilot Review 進行中... (已等待 ${elapsedMinutes}m)" -ForegroundColor Gray
            }
            default {
                Write-Host "⏳ [$timestamp] 狀態: $state (已等待 ${elapsedMinutes}m)" -ForegroundColor Gray
            }
        }
    }
    
    Start-Sleep -Seconds $PollIntervalSeconds
}

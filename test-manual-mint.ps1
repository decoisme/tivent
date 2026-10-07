# Test Manual Mint Endpoint (PowerShell version)
# Usage: .\test-manual-mint.ps1 "TIVENT-1-1791394621711-ofl88m"

param(
    [string]$ExternalId = "TIVENT-1-1791394621711-ofl88m"
)

$BaseUrl = "https://tivent.vercel.app"

Write-Host "🎫 Testing Manual Mint for: $ExternalId" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

Write-Host "📋 Step 1: Check payment status before minting..." -ForegroundColor Yellow
$StatusBefore = Invoke-RestMethod -Uri "$BaseUrl/api/payment/xendit/status?externalId=$ExternalId" -Method Get
$StatusBefore | ConvertTo-Json -Depth 10
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

Write-Host "🔨 Step 2: Trigger manual mint..." -ForegroundColor Yellow
try {
    $Body = @{
        externalId = $ExternalId
    } | ConvertTo-Json

    $Result = Invoke-RestMethod -Uri "$BaseUrl/api/payment/manual-mint" `
        -Method Post `
        -ContentType "application/json" `
        -Body $Body

    $Result | ConvertTo-Json -Depth 10
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host ""

    if ($Result.success) {
        Write-Host "✅ Mint successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎟️  Token ID: $($Result.token_id)" -ForegroundColor White
        Write-Host "💰 Buy TX: https://amoy.polygonscan.com/tx/$($Result.buy_tx_hash)" -ForegroundColor Blue
        Write-Host "📤 Transfer TX: https://amoy.polygonscan.com/tx/$($Result.transfer_tx_hash)" -ForegroundColor Blue
        Write-Host ""

        Write-Host "📋 Step 3: Verify payment status after minting..." -ForegroundColor Yellow
        $StatusAfter = Invoke-RestMethod -Uri "$BaseUrl/api/payment/xendit/status?externalId=$ExternalId" -Method Get
        $StatusAfter | ConvertTo-Json -Depth 10
    } else {
        Write-Host "❌ Mint failed!" -ForegroundColor Red
        Write-Host "Error: $($Result.error)" -ForegroundColor Red
        Write-Host "Details: $($Result.details)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Request failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Done!" -ForegroundColor Green

# Test Manual Mint Endpoint (PowerShell version)
# Usage: .\test-manual-mint.ps1 "TIVENT-1-1791394621711-ofl88m"

param(
    [string]$ExternalId = "TIVENT-2-1791428418056-504feq",
    [string]$BaseUrl = "https://tivent-crlkmlmsm-decoismes-projects.vercel.app"
)

# Use deployment URL that's confirmed working
# Update this to latest deployment URL from: vercel ls
# Or use production: "https://tivent.vercel.app" (after domain is fixed)

Write-Host "[TEST] Testing Manual Mint for: $ExternalId" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Gray
Write-Host ""

Write-Host "[STEP 1] Check payment status before minting..." -ForegroundColor Yellow
try {
    $StatusBefore = Invoke-RestMethod -Uri "$BaseUrl/api/payment/xendit/status?externalId=$ExternalId" -Method Get -ErrorAction Stop
    $StatusBefore | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Failed to get status: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""
Write-Host "============================================" -ForegroundColor Gray
Write-Host ""

Write-Host "[STEP 2] Trigger manual mint..." -ForegroundColor Yellow
try {
    $Body = @{
        externalId = $ExternalId
    } | ConvertTo-Json

    $Result = Invoke-RestMethod -Uri "$BaseUrl/api/payment/manual-mint" `
        -Method Post `
        -ContentType "application/json" `
        -Body $Body `
        -ErrorAction Stop

    $Result | ConvertTo-Json -Depth 10
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Gray
    Write-Host ""

    if ($Result.success) {
        Write-Host "[SUCCESS] Mint successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Token ID: $($Result.token_id)" -ForegroundColor White
        Write-Host "Buy TX: https://amoy.polygonscan.com/tx/$($Result.buy_tx_hash)" -ForegroundColor Blue
        Write-Host "Transfer TX: https://amoy.polygonscan.com/tx/$($Result.transfer_tx_hash)" -ForegroundColor Blue
        Write-Host ""

        Write-Host "[STEP 3] Verify payment status after minting..." -ForegroundColor Yellow
        $StatusAfter = Invoke-RestMethod -Uri "$BaseUrl/api/payment/xendit/status?externalId=$ExternalId" -Method Get -ErrorAction Stop
        $StatusAfter | ConvertTo-Json -Depth 10
    } else {
        Write-Host "[FAILED] Mint failed!" -ForegroundColor Red
        Write-Host "Error: $($Result.error)" -ForegroundColor Red
        Write-Host "Details: $($Result.details)" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERROR] Request failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Gray
Write-Host "[DONE]" -ForegroundColor Green

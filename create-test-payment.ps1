# Create Test Payment for NFT Minting
# Usage: .\create-test-payment.ps1

param(
    [string]$BaseUrl = "https://tivent-adsmc81z5-decoismes-projects.vercel.app",
    [string]$Email = "nsytpremi12@gmail.com",
    [string]$WalletAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
    [int]$EventId = 1,
    [int]$TicketTypeId = 0
)

Write-Host "[CREATE] Creating test payment..." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Gray
Write-Host "Base URL: $BaseUrl" -ForegroundColor White
Write-Host "Email: $Email" -ForegroundColor White
Write-Host "Wallet: $WalletAddress" -ForegroundColor White
Write-Host "Event ID: $EventId, Ticket Type: $TicketTypeId" -ForegroundColor White
Write-Host ""

try {
    $Body = @{
        eventId = $EventId
        ticketTypeId = $TicketTypeId
        ticketQuantity = 1
        buyerEmail = $Email
        buyerAddress = $WalletAddress
    } | ConvertTo-Json

    Write-Host "[STEP 1] Creating Xendit invoice..." -ForegroundColor Yellow
    
    $Result = Invoke-RestMethod -Uri "$BaseUrl/api/payment/xendit/create-invoice" `
        -Method Post `
        -ContentType "application/json" `
        -Body $Body `
        -ErrorAction Stop

    if ($Result.success) {
        Write-Host "[SUCCESS] Invoice created!" -ForegroundColor Green
        Write-Host ""
        Write-Host "External ID: $($Result.externalId)" -ForegroundColor Cyan
        Write-Host "Invoice ID: $($Result.invoiceId)" -ForegroundColor White
        Write-Host "Amount: IDR $($Result.amount)" -ForegroundColor White
        Write-Host ""
        Write-Host "Payment URL:" -ForegroundColor Yellow
        Write-Host "  $($Result.invoiceUrl)" -ForegroundColor Blue
        Write-Host ""
        Write-Host "[STEP 2] Open payment URL in browser and pay with test card" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "[STEP 3] After payment, check email for verification link" -ForegroundColor Yellow
        Write-Host "  Email: $Email" -ForegroundColor White
        Write-Host ""
        Write-Host "[STEP 4] Click verification link, ticket will auto-mint!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "[STEP 5] Check status with:" -ForegroundColor Yellow
        Write-Host "  .\check-payment-status.ps1 `"$($Result.externalId)`"" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "[STEP 6] If auto-mint fails, manually trigger:" -ForegroundColor Yellow
        Write-Host "  .\test-manual-mint.ps1 `"$($Result.externalId)`"" -ForegroundColor Cyan
        Write-Host ""
        
        # Save external ID for easy reference
        $Result.externalId | Out-File -FilePath "last-payment-id.txt" -Encoding UTF8
        Write-Host "[INFO] External ID saved to: last-payment-id.txt" -ForegroundColor Gray
        
    } else {
        Write-Host "[FAILED] Invoice creation failed!" -ForegroundColor Red
        Write-Host "Error: $($Result.error)" -ForegroundColor Red
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

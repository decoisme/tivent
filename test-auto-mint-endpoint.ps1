# Test the auto-mint flow end-to-end
Write-Host "Testing Auto-Mint Flow on Production Domain" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create test payment
Write-Host "Step 1: Creating test payment..." -ForegroundColor Yellow
$createBody = @{
    eventId = 2
    ticketTypeId = 0
    buyerAddress = "0xA167fBfD1d0b4eC46b5CddA6ec545f12B92B8a77"
    buyerEmail = "test@example.com"
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "https://tivent-chi.vercel.app/api/payment/test-auto-mint" `
        -Method Post `
        -Body $createBody `
        -ContentType "application/json"
    
    Write-Host "SUCCESS - Test payment created!" -ForegroundColor Green
    Write-Host "External ID: $($createResponse.externalId)" -ForegroundColor Cyan
    Write-Host "Verification URL: $($createResponse.verificationUrl)" -ForegroundColor Gray
    Write-Host ""
    
    $externalId = $createResponse.externalId
    $verificationUrl = $createResponse.verificationUrl
    
    # Step 2: Click verification URL to trigger auto-mint
    Write-Host "Step 2: Triggering auto-mint (clicking verification link)..." -ForegroundColor Yellow
    Write-Host "This should verify email and trigger auto-mint" -ForegroundColor Gray
    Write-Host ""
    
    try {
        $verifyResponse = Invoke-RestMethod -Uri $verificationUrl -Method Get
        Write-Host "SUCCESS - Verification response received!" -ForegroundColor Green
        $verifyResponse | ConvertTo-Json -Depth 10
        Write-Host ""
    } catch {
        Write-Host "ERROR during verification!" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
        exit
    }
    
    # Step 3: Wait for blockchain transaction
    Write-Host "Step 3: Waiting for blockchain transactions..." -ForegroundColor Yellow
    Write-Host "(This can take 15-30 seconds)" -ForegroundColor Gray
    Start-Sleep -Seconds 15
    
    # Step 4: Check final status
    Write-Host "Step 4: Checking final payment status..." -ForegroundColor Yellow
    try {
        $finalStatus = Invoke-RestMethod -Uri "https://tivent-chi.vercel.app/api/payment/xendit/status?externalId=$externalId" -Method Get
        
        Write-Host ""
        Write-Host "============================================" -ForegroundColor Cyan
        Write-Host "FINAL RESULT" -ForegroundColor Cyan
        Write-Host "============================================" -ForegroundColor Cyan
        Write-Host ""
        
        $payment = $finalStatus.payment
        Write-Host "External ID: $($payment.external_id)" -ForegroundColor White
        Write-Host "Email Verified: $($payment.email_verified)" -ForegroundColor White
        Write-Host "Ticket Minted: $($payment.ticket_minted)" -ForegroundColor White
        
        if ($payment.ticket_minted) {
            Write-Host ""
            Write-Host "SUCCESS! TICKET MINTED!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Token ID: $($payment.token_id)" -ForegroundColor Cyan
            Write-Host "Buy TX: $($payment.tx_hash)" -ForegroundColor Cyan
            Write-Host "Transfer TX: $($payment.transfer_tx_hash)" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "View on PolygonScan:" -ForegroundColor Yellow
            if ($payment.tx_hash) {
                Write-Host "  Buy: https://amoy.polygonscan.com/tx/$($payment.tx_hash)" -ForegroundColor Gray
            }
            if ($payment.transfer_tx_hash) {
                Write-Host "  Transfer: https://amoy.polygonscan.com/tx/$($payment.transfer_tx_hash)" -ForegroundColor Gray
            }
        } else {
            Write-Host ""
            Write-Host "WARNING - TICKET NOT MINTED" -ForegroundColor Yellow
            Write-Host ""
            if ($payment.mint_error) {
                Write-Host "Error: $($payment.mint_error)" -ForegroundColor Red
            } else {
                Write-Host "No error recorded. Check Vercel logs for:" -ForegroundColor Yellow
                Write-Host "  - [verify-email] TRIGGERING AUTO-MINT" -ForegroundColor Gray
                Write-Host "  - [mintTicket] Starting mint process..." -ForegroundColor Gray
            }
        }
        
        Write-Host ""
    } catch {
        Write-Host "ERROR checking status!" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
    
} catch {
    Write-Host "ERROR creating test payment!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Check Vercel logs at https://vercel.com for details" -ForegroundColor Yellow

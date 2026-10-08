# Test Full Email Verification + Auto-Mint Flow
# Usage: .\test-verify-flow.ps1

param(
    [string]$BaseUrl = "https://tivent-crlkmlmsm-decoismes-projects.vercel.app"
)

Write-Host "[TEST] Testing Email Verification + Auto-Mint Flow" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Gray
Write-Host ""

# Step 1: Create test payment
Write-Host "[STEP 1] Creating test payment..." -ForegroundColor Yellow

$PaymentBody = @{
    eventId = 2
    ticketTypeId = 0
    ticketQuantity = 1
    buyerEmail = "nsytpremi12@gmail.com"
    buyerAddress = "0xA167fBfD1d0b4eC46b5CddA6ec545f12B92B8a77"
    priceIDR = 50000
    pricePerTicket = 0.001
} | ConvertTo-Json

try {
    $Invoice = Invoke-RestMethod -Uri "$BaseUrl/api/payment/xendit/create-invoice" `
        -Method Post `
        -ContentType "application/json" `
        -Body $PaymentBody `
        -ErrorAction Stop
    
    if ($Invoice.success) {
        $ExternalId = $Invoice.externalId
        Write-Host "[SUCCESS] Payment created: $ExternalId" -ForegroundColor Green
        Write-Host "  Invoice URL: $($Invoice.invoiceUrl)" -ForegroundColor Blue
        Write-Host ""
        
        # Step 2: Simulate payment (update status to PAID manually)
        Write-Host "[STEP 2] Simulating payment (manual DB update needed)..." -ForegroundColor Yellow
        Write-Host "[INFO] In real flow, Xendit webhook updates this to PAID" -ForegroundColor Gray
        Write-Host "[INFO] For testing, update in Supabase:" -ForegroundColor Gray
        Write-Host "  UPDATE payments SET status='PAID' WHERE external_id='$ExternalId';" -ForegroundColor White
        Write-Host ""
        Write-Host "Press Enter after updating status to PAID..." -ForegroundColor Yellow
        Read-Host
        
        # Step 3: Send verification email
        Write-Host "[STEP 3] Sending verification email..." -ForegroundColor Yellow
        
        $VerifyBody = @{
            externalId = $ExternalId
        } | ConvertTo-Json
        
        $EmailResult = Invoke-RestMethod -Uri "$BaseUrl/api/payment/xendit/send-verification" `
            -Method Post `
            -ContentType "application/json" `
            -Body $VerifyBody `
            -ErrorAction Stop
        
        if ($EmailResult.success) {
            Write-Host "[SUCCESS] Verification email sent!" -ForegroundColor Green
            Write-Host "  Check email: nsytpremi12@gmail.com" -ForegroundColor White
            Write-Host ""
            
            $Token = $EmailResult.token
            Write-Host "[INFO] Verification token: $Token" -ForegroundColor Gray
            Write-Host "[INFO] Verification link:" -ForegroundColor Gray
            Write-Host "  $BaseUrl/api/payment/xendit/verify-email?token=$Token" -ForegroundColor Blue
            Write-Host ""
            
            # Step 4: Verify email (auto-mint should trigger here)
            Write-Host "[STEP 4] Click verification link or press Enter to simulate..." -ForegroundColor Yellow
            Read-Host
            
            Write-Host "[INFO] Triggering email verification..." -ForegroundColor Cyan
            
            $VerifyResult = Invoke-RestMethod -Uri "$BaseUrl/api/payment/xendit/verify-email?token=$Token" `
                -Method Get `
                -ErrorAction Stop
            
            Write-Host "[SUCCESS] Email verified!" -ForegroundColor Green
            Write-Host ""
            
            # Step 5: Check if auto-mint happened
            Write-Host "[STEP 5] Checking if ticket was auto-minted..." -ForegroundColor Yellow
            Start-Sleep -Seconds 3
            
            $Status = Invoke-RestMethod -Uri "$BaseUrl/api/payment/xendit/status?externalId=$ExternalId" `
                -Method Get `
                -ErrorAction Stop
            
            if ($Status.payment.ticket_minted) {
                Write-Host "[SUCCESS] Ticket auto-minted!" -ForegroundColor Green
                Write-Host "  Token ID: (check TX logs)" -ForegroundColor White
                Write-Host "  TX Hash: $($Status.payment.tx_hash)" -ForegroundColor Blue
                Write-Host "  View: https://amoy.polygonscan.com/tx/$($Status.payment.tx_hash)" -ForegroundColor Blue
            } else {
                Write-Host "[FAILED] Ticket NOT auto-minted!" -ForegroundColor Red
                Write-Host "  This is the issue we need to fix." -ForegroundColor Yellow
                Write-Host ""
                Write-Host "[DEBUG] Payment status:" -ForegroundColor Gray
                $Status.payment | ConvertTo-Json -Depth 5
            }
            
        } else {
            Write-Host "[FAILED] Could not send verification email" -ForegroundColor Red
            $EmailResult | ConvertTo-Json
        }
        
    } else {
        Write-Host "[FAILED] Payment creation failed" -ForegroundColor Red
        $Invoice | ConvertTo-Json
    }
    
} catch {
    Write-Host "[ERROR] Test failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Gray

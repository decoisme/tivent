# Simulate full payment flow on production domain
param(
    [string]$ExternalId = "TIVENT-2-1791430457380-h1wy2t"
)

Write-Host "Simulating full flow for: $ExternalId" -ForegroundColor Cyan
Write-Host ""

# Step 1: Send verification email (this will generate token)
Write-Host "Step 1: Sending verification email..." -ForegroundColor Yellow
$sendBody = @{ externalId = $ExternalId } | ConvertTo-Json

try {
    $sendResult = Invoke-RestMethod -Uri "https://tivent-chi.vercel.app/api/payment/xendit/send-verification" `
        -Method Post `
        -Body $sendBody `
        -ContentType "application/json"
    
    Write-Host "Email sent!" -ForegroundColor Green
    $sendResult | ConvertTo-Json -Depth 10
    Write-Host ""
} catch {
    Write-Host "ERROR sending email!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit
}

# Step 2: Get payment status to get verification token
Write-Host "Step 2: Getting verification token..." -ForegroundColor Yellow
try {
    $status = Invoke-RestMethod -Uri "https://tivent-chi.vercel.app/api/payment/xendit/status?externalId=$ExternalId" -Method Get
    
    if ($status.payment.verification_token) {
        $verificationToken = $status.payment.verification_token
        Write-Host "Token: $verificationToken" -ForegroundColor Cyan
        Write-Host ""
        
        # Step 3: Trigger email verification (auto-mint should happen here)
        Write-Host "Step 3: Clicking verification link (triggering auto-mint)..." -ForegroundColor Yellow
        $verifyUrl = "https://tivent-chi.vercel.app/api/payment/xendit/verify-email?token=$verificationToken"
        Write-Host "URL: $verifyUrl" -ForegroundColor Gray
        Write-Host ""
        
        try {
            $verifyResponse = Invoke-RestMethod -Uri $verifyUrl -Method Get
            Write-Host "Verification Response:" -ForegroundColor Green
            $verifyResponse | ConvertTo-Json -Depth 10
            Write-Host ""
            
            # Step 4: Wait a bit for minting to complete
            Write-Host "Step 4: Waiting for mint transaction..." -ForegroundColor Yellow
            Start-Sleep -Seconds 10
            
            # Step 5: Check final status
            Write-Host "Step 5: Checking final status..." -ForegroundColor Yellow
            $finalStatus = Invoke-RestMethod -Uri "https://tivent-chi.vercel.app/api/payment/xendit/status?externalId=$ExternalId" -Method Get
            Write-Host "Final Status:" -ForegroundColor Green
            $finalStatus.payment | ConvertTo-Json -Depth 10
            Write-Host ""
            
            if ($finalStatus.payment.ticket_minted) {
                Write-Host "SUCCESS! Ticket minted!" -ForegroundColor Green
                Write-Host "Token ID: $($finalStatus.payment.token_id)" -ForegroundColor Cyan
                Write-Host "TX Hash: $($finalStatus.payment.tx_hash)" -ForegroundColor Cyan
                Write-Host ""
                Write-Host "Check on PolygonScan:" -ForegroundColor Yellow
                Write-Host "https://amoy.polygonscan.com/tx/$($finalStatus.payment.tx_hash)"
            } else {
                Write-Host "WARNING: Ticket not minted yet" -ForegroundColor Yellow
                if ($finalStatus.payment.mint_error) {
                    Write-Host "Mint Error: $($finalStatus.payment.mint_error)" -ForegroundColor Red
                } else {
                    Write-Host "Check Vercel logs for auto-mint execution" -ForegroundColor Gray
                }
            }
        } catch {
            Write-Host "ERROR during verification!" -ForegroundColor Red
            Write-Host $_.Exception.Message -ForegroundColor Red
            if ($_.ErrorDetails.Message) {
                Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "No verification token generated!" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR checking status!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "Check Vercel logs for:" -ForegroundColor Yellow
Write-Host "[verify-email] TRIGGERING AUTO-MINT" -ForegroundColor Gray
Write-Host "[verify-email] Importing mintTicketWithPlatformWallet..." -ForegroundColor Gray
Write-Host "[verify-email] Calling mintTicketWithPlatformWallet..." -ForegroundColor Gray

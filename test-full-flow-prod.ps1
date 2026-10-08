# Test full flow on production domain
param(
    [string]$ExternalId = "TIVENT-2-1791430457380-h1wy2t"
)

Write-Host "Testing full flow for: $ExternalId" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check payment status
Write-Host "Step 1: Checking payment status..." -ForegroundColor Yellow
try {
    $status = Invoke-RestMethod -Uri "https://tivent-chi.vercel.app/api/payment/xendit/status?externalId=$ExternalId" -Method Get
    Write-Host "Payment Status:" -ForegroundColor Green
    $status | ConvertTo-Json -Depth 10
    Write-Host ""
    
    if ($status.payment) {
        $verificationToken = $status.payment.verification_token
        Write-Host "Verification Token: $verificationToken" -ForegroundColor Cyan
        Write-Host ""
        
        # Step 2: Trigger email verification
        if ($verificationToken) {
            Write-Host "Step 2: Triggering email verification..." -ForegroundColor Yellow
            $verifyUrl = "https://tivent-chi.vercel.app/api/payment/xendit/verify-email?token=$verificationToken"
            Write-Host "Verification URL: $verifyUrl" -ForegroundColor Gray
            Write-Host ""
            
            try {
                $verifyResponse = Invoke-RestMethod -Uri $verifyUrl -Method Get
                Write-Host "Verification Response:" -ForegroundColor Green
                $verifyResponse | ConvertTo-Json -Depth 10
                Write-Host ""
                
                # Step 3: Check final status
                Write-Host "Step 3: Checking final status..." -ForegroundColor Yellow
                Start-Sleep -Seconds 5
                $finalStatus = Invoke-RestMethod -Uri "https://tivent-chi.vercel.app/api/payment/xendit/status?externalId=$ExternalId" -Method Get
                Write-Host "Final Status:" -ForegroundColor Green
                $finalStatus | ConvertTo-Json -Depth 10
                Write-Host ""
                
                if ($finalStatus.payment.ticket_minted) {
                    Write-Host "SUCCESS! Ticket minted!" -ForegroundColor Green
                    Write-Host "Token ID: $($finalStatus.payment.token_id)" -ForegroundColor Cyan
                    Write-Host "TX Hash: $($finalStatus.payment.tx_hash)" -ForegroundColor Cyan
                } else {
                    Write-Host "WARNING: Ticket not minted yet" -ForegroundColor Yellow
                    if ($finalStatus.payment.mint_error) {
                        Write-Host "Mint Error: $($finalStatus.payment.mint_error)" -ForegroundColor Red
                    }
                }
            } catch {
                Write-Host "ERROR verifying email!" -ForegroundColor Red
                Write-Host $_.Exception.Message -ForegroundColor Red
            }
        } else {
            Write-Host "No verification token found!" -ForegroundColor Red
        }
    } else {
        Write-Host "Payment not found!" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR checking payment status!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "Check Vercel logs to see auto-mint execution:" -ForegroundColor Yellow
Write-Host "Look for: [verify-email] TRIGGERING AUTO-MINT" -ForegroundColor Gray

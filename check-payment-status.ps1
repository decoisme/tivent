# Check Payment Status
# Usage: .\check-payment-status.ps1 "TIVENT-1-1791394621711-ofl88m"

param(
    [string]$ExternalId = "TIVENT-1-1791394621711-ofl88m",
    [string]$BaseUrl = "https://tivent-adsmc81z5-decoismes-projects.vercel.app"
)

# Use deployment URL that's confirmed working
# Update this to latest deployment URL from: vercel ls

Write-Host "[CHECK] Checking Payment Status for: $ExternalId" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Gray
Write-Host ""

try {
    $Status = Invoke-RestMethod -Uri "$BaseUrl/api/payment/xendit/status?externalId=$ExternalId" -Method Get -ErrorAction Stop
    
    Write-Host "[Payment Details]" -ForegroundColor Yellow
    Write-Host "  External ID:    $($Status.external_id)" -ForegroundColor White
    Write-Host "  Invoice ID:     $($Status.invoice_id)" -ForegroundColor White
    Write-Host "  Status:         $($Status.status)" -ForegroundColor $(if($Status.status -eq 'VERIFIED'){'Green'}else{'Yellow'})
    Write-Host "  Amount:         IDR $($Status.amount_idr)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "[Email Verification]" -ForegroundColor Yellow
    Write-Host "  Email:          $($Status.buyer_email)" -ForegroundColor White
    Write-Host "  Verified:       $($Status.email_verified)" -ForegroundColor $(if($Status.email_verified){'Green'}else{'Red'})
    Write-Host "  Verified At:    $($Status.verified_at)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "[NFT Ticket]" -ForegroundColor Yellow
    Write-Host "  Minted:         $($Status.ticket_minted)" -ForegroundColor $(if($Status.ticket_minted){'Green'}else{'Red'})
    Write-Host "  TX Hash:        $($Status.tx_hash)" -ForegroundColor White
    Write-Host "  Minted At:      $($Status.minted_at)" -ForegroundColor White
    
    if ($Status.mint_error) {
        Write-Host "  [ERROR] Mint Error:  $($Status.mint_error)" -ForegroundColor Red
    }
    
    if ($Status.tx_hash) {
        Write-Host ""
        Write-Host "  [LINK] View on Explorer:" -ForegroundColor Blue
        Write-Host "     https://amoy.polygonscan.com/tx/$($Status.tx_hash)" -ForegroundColor Blue
    }
    
    Write-Host ""
    Write-Host "[Buyer Info]" -ForegroundColor Yellow
    Write-Host "  Wallet:         $($Status.buyer_address)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "[Event Info]" -ForegroundColor Yellow
    Write-Host "  Event ID:       $($Status.event_id)" -ForegroundColor White
    Write-Host "  Ticket Type:    $($Status.ticket_type_id)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "[Timestamps]" -ForegroundColor Yellow
    Write-Host "  Created:        $($Status.created_at)" -ForegroundColor White
    Write-Host "  Updated:        $($Status.updated_at)" -ForegroundColor White
    
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Gray
    
    # Action recommendations
    if (-not $Status.email_verified) {
        Write-Host "[WARNING] Email not verified yet!" -ForegroundColor Yellow
        Write-Host "   Check email for verification link" -ForegroundColor Yellow
    } elseif (-not $Status.ticket_minted) {
        Write-Host "[WARNING] Ticket not minted yet!" -ForegroundColor Yellow
        Write-Host "   Run: .\test-manual-mint.ps1 `"$ExternalId`"" -ForegroundColor Yellow
    } else {
        Write-Host "[SUCCESS] Payment complete! Ticket minted successfully!" -ForegroundColor Green
    }
    
} catch {
    Write-Host "[ERROR] Failed to fetch payment status!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

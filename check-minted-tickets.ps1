# Check Minted Tickets from Database
# Shows all successfully minted tickets

Write-Host "[CHECK] Fetching minted tickets from database..." -ForegroundColor Cyan
Write-Host ""

$DeploymentUrl = "https://tivent-crlkmlmsm-decoismes-projects.vercel.app"

try {
    # Get all minted tickets
    $Url = "$DeploymentUrl/api/payment/xendit/status?externalId=test"
    
    Write-Host "[INFO] Querying Supabase for minted tickets..." -ForegroundColor Yellow
    Write-Host "[INFO] You can also check directly in Supabase:" -ForegroundColor Gray
    Write-Host "  SELECT * FROM payments WHERE ticket_minted = true;" -ForegroundColor Gray
    Write-Host ""
    
    # For now, let's check the payment we know
    $KnownExternalId = "TIVENT-1-1791398728209-1xvgzd"
    
    Write-Host "[CHECK] Checking known payment: $KnownExternalId" -ForegroundColor Cyan
    $Result = Invoke-RestMethod -Uri "$DeploymentUrl/api/payment/xendit/status?externalId=$KnownExternalId" -Method Get -ErrorAction Stop
    
    if ($Result.success -and $Result.payment) {
        $p = $Result.payment
        
        Write-Host "[PAYMENT INFO]" -ForegroundColor Green
        Write-Host "  External ID:    $($p.external_id)" -ForegroundColor White
        Write-Host "  Buyer Address:  $($p.buyer_address)" -ForegroundColor White
        Write-Host "  Event ID:       $($p.event_id)" -ForegroundColor White
        Write-Host "  Ticket Type:    $($p.ticket_type_id)" -ForegroundColor White
        Write-Host "  Email Verified: $($p.email_verified)" -ForegroundColor $(if($p.email_verified){'Green'}else{'Red'})
        Write-Host "  Ticket Minted:  $($p.ticket_minted)" -ForegroundColor $(if($p.ticket_minted){'Green'}else{'Red'})
        Write-Host "  TX Hash:        $($p.tx_hash)" -ForegroundColor White
        
        if ($p.tx_hash) {
            Write-Host ""
            Write-Host "[TRANSACTION]" -ForegroundColor Yellow
            Write-Host "  View on Explorer:" -ForegroundColor Gray
            Write-Host "  https://amoy.polygonscan.com/tx/$($p.tx_hash)" -ForegroundColor Blue
            Write-Host ""
            
            Write-Host "[ACTION] To find token ID:" -ForegroundColor Yellow
            Write-Host "  1. Open the TX URL above" -ForegroundColor White
            Write-Host "  2. Click 'Logs' tab" -ForegroundColor White
            Write-Host "  3. Look for 'Transfer' or 'TicketMinted' event" -ForegroundColor White
            Write-Host "  4. Token ID will be in the event data" -ForegroundColor White
        }
        
        if (-not $p.ticket_minted) {
            Write-Host ""
            Write-Host "[WARNING] Ticket not minted yet!" -ForegroundColor Yellow
            Write-Host "  Run: .\test-manual-mint.ps1 `"$($p.external_id)`"" -ForegroundColor Cyan
        }
    }
    
} catch {
    Write-Host "[ERROR] Failed to check payments" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Gray

# Get latest payment from logs
# Extract external ID from Vercel logs

Write-Host "[INFO] Check Vercel logs for latest payment" -ForegroundColor Cyan
Write-Host ""
Write-Host "Look for log line with:" -ForegroundColor Yellow
Write-Host '  [payment-status] Payment found: VERIFIED' -ForegroundColor White
Write-Host ""
Write-Host "Then find the external_id in the request URL above it" -ForegroundColor Yellow
Write-Host ""
Write-Host "Or check Supabase directly:" -ForegroundColor Yellow
Write-Host "  SELECT external_id, buyer_address, ticket_minted, created_at" -ForegroundColor White
Write-Host "  FROM payments" -ForegroundColor White
Write-Host "  ORDER BY created_at DESC" -ForegroundColor White
Write-Host "  LIMIT 5;" -ForegroundColor White
Write-Host ""
Write-Host "Once you have external_id, run:" -ForegroundColor Yellow
Write-Host '  .\test-manual-mint.ps1 "TIVENT-X-XXXX-XXX"' -ForegroundColor Cyan

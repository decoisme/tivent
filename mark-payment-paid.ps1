# Mark payment as PAID (simulate successful Xendit webhook)
param(
    [string]$ExternalId = "TIVENT-2-1791430457380-h1wy2t"
)

Write-Host "This script needs to update database directly via Supabase" -ForegroundColor Yellow
Write-Host ""
Write-Host "Manual steps:" -ForegroundColor Cyan
Write-Host "1. Go to Supabase Dashboard"
Write-Host "2. Open SQL Editor"
Write-Host "3. Run this query:" -ForegroundColor Yellow
Write-Host ""
Write-Host @"
UPDATE payments
SET status = 'PAID',
    payment_method = 'QRIS',
    updated_at = NOW()
WHERE external_id = '$ExternalId';
"@ -ForegroundColor Green
Write-Host ""
Write-Host "After updating, run: .\simulate-full-flow-prod.ps1 -ExternalId $ExternalId" -ForegroundColor Cyan

# Create test payment on production domain
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$random = -join ((48..57) + (97..122) | Get-Random -Count 6 | ForEach-Object {[char]$_})
$externalId = "TIVENT-2-$timestamp-$random"

$body = @{
    eventId = "2"
    ticketTypeId = 0
    ticketQuantity = 1
    buyerAddress = "0xA167fBfD1d0b4eC46b5CddA6ec545f12B92B8a77"
    buyerEmail = "test@example.com"
    pricePerTicket = 0.025
    priceIDR = 125000
} | ConvertTo-Json

Write-Host "Creating payment with external ID: $externalId" -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "https://tivent-chi.vercel.app/api/payment/xendit/create-invoice" `
        -Method Post `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
    Write-Host "External ID: $externalId" -ForegroundColor Cyan
    Write-Host "Invoice URL: $($response.invoiceUrl)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Open invoice URL and pay"
    Write-Host "2. Check email for verification link"
    Write-Host "3. Click verification link"
    Write-Host "4. Check Vercel logs for auto-mint trigger"
} catch {
    Write-Host "ERROR!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

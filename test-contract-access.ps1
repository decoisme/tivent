# Test if new contract can be accessed
Write-Host "Testing new contract access..." -ForegroundColor Cyan
Write-Host "Contract: 0x35206B197Ed1293343Eaf44F7dbE268B7C109FaB" -ForegroundColor Gray
Write-Host ""

# Try to create test payment with Event ID 1 (should exist after first event creation)
Write-Host "Attempting to create test payment with Event ID 1..." -ForegroundColor Yellow

$body = @{
    eventId = 1
    ticketTypeId = 0
    buyerAddress = "0xA167fBfD1d0b4eC46b5CddA6ec545f12B92B8a77"
    buyerEmail = "test@example.com"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://tivent-chi.vercel.app/api/payment/test-auto-mint" `
        -Method Post `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "SUCCESS - Payment created!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
    Write-Host "Now click the verification URL..." -ForegroundColor Yellow
    
} catch {
    Write-Host "ERROR!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host ""
        Write-Host "Error Details:" -ForegroundColor Yellow
        $errorDetails | ConvertTo-Json -Depth 10
    }
}

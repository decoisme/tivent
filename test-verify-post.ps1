# Test verification using POST method (to get JSON response)
param(
    [string]$Token = "9d426690e26a802dc2d00bb0c3dd9e0eb403e0e17bd32349daa7217a66c67d9f"
)

Write-Host "Testing verification with POST method..." -ForegroundColor Cyan
Write-Host "Token: $Token" -ForegroundColor Gray
Write-Host ""

$body = @{ token = $Token } | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://tivent-chi.vercel.app/api/payment/xendit/verify-email" `
        -Method Post `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
    
} catch {
    Write-Host "ERROR!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

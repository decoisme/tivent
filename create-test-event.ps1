# Create test event in new contract for testing free minting
Write-Host "Creating test event in new contract..." -ForegroundColor Cyan
Write-Host "Contract: 0x35206B197Ed1293343Eaf44F7dbE268B7C109FaB" -ForegroundColor Gray
Write-Host ""

Write-Host "You need to create an event via the web UI:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Go to: http://localhost:3000/create-event" -ForegroundColor White
Write-Host "   (or your Vercel deployment URL)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Connect your wallet (0xA167fBfD1d0b4eC46b5CddA6ec545f12B92B8a77)" -ForegroundColor White
Write-Host ""
Write-Host "3. Create event with these settings:" -ForegroundColor White
Write-Host "   - Event Name: Test Event for Free Minting" -ForegroundColor Gray
Write-Host "   - Ticket Type: General Admission" -ForegroundColor Gray
Write-Host "   - Price: 0.025 POL (or any price - user won't pay this)" -ForegroundColor Gray
Write-Host "   - Price IDR: 125000" -ForegroundColor Gray
Write-Host "   - Max Supply: 100 tickets" -ForegroundColor Gray
Write-Host "   - Max per wallet: 10" -ForegroundColor Gray
Write-Host ""
Write-Host "4. After creating, the event will be Event ID #1" -ForegroundColor White
Write-Host ""
Write-Host "Then run the test again with Event ID 1:" -ForegroundColor Yellow
Write-Host "  Update test-auto-mint/route.ts to use eventId: 1" -ForegroundColor Gray
Write-Host ""
Write-Host "Or use the manual test endpoint:" -ForegroundColor Yellow
Write-Host '  $body = @{ eventId = 1; ticketTypeId = 0; buyerAddress = "0xA167fBfD1d0b4eC46b5CddA6ec545f12B92B8a77"; buyerEmail = "test@example.com" } | ConvertTo-Json' -ForegroundColor Gray
Write-Host '  Invoke-RestMethod -Uri "https://tivent-chi.vercel.app/api/payment/test-auto-mint" -Method Post -Body $body -ContentType "application/json"' -ForegroundColor Gray

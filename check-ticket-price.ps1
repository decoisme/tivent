# Check Ticket Price from Contract
# Usage: .\check-ticket-price.ps1 -EventId 1 -TicketTypeId 0

param(
    [int]$EventId = 1,
    [int]$TicketTypeId = 0
)

$RPC = $env:NEXT_PUBLIC_RPC_URL
$Contract = $env:NEXT_PUBLIC_CONTRACT_ADDRESS

if (-not $RPC -or -not $Contract) {
    Write-Host "[ERROR] Missing RPC_URL or CONTRACT_ADDRESS" -ForegroundColor Red
    exit 1
}

Write-Host "[CHECK] Querying ticket price from contract..." -ForegroundColor Cyan
Write-Host "Contract: $Contract" -ForegroundColor Gray
Write-Host "Event ID: $EventId, Ticket Type: $TicketTypeId" -ForegroundColor Gray
Write-Host ""

# Encode function call: ticketTypes(uint256,uint256)
# Function signature: 0x5ba8e715
$functionSig = "0x5ba8e715"
$eventIdHex = ([bigint]$EventId).ToString("X64")
$typeIdHex = ([bigint]$TicketTypeId).ToString("X64")
$data = "$functionSig$eventIdHex$typeIdHex"

$body = @{
    jsonrpc = "2.0"
    method = "eth_call"
    params = @(
        @{
            to = $Contract
            data = $data
        },
        "latest"
    )
    id = 1
} | ConvertTo-Json -Depth 10

try {
    $result = Invoke-RestMethod -Uri $RPC -Method Post -ContentType "application/json" -Body $body -ErrorAction Stop
    
    if ($result.result) {
        $hex = $result.result
        Write-Host "[SUCCESS] Raw response: $hex" -ForegroundColor Green
        
        # Parse tuple result (typeId, name, price, maxSupply, sold, active)
        # Price is at offset 64 (0x40), length 32 bytes
        $priceHex = $hex.Substring(2 + 128, 64)  # Skip 0x + 64 bytes for typeId and name offset
        
        $priceWei = [bigint]::Parse($priceHex, 'AllowHexSpecifier')
        $pricePOL = [double]$priceWei / 1e18
        
        Write-Host ""
        Write-Host "Ticket Price: $pricePOL POL" -ForegroundColor Cyan
        Write-Host "Ticket Price (Wei): $priceWei" -ForegroundColor Gray
        
    } else {
        Write-Host "[ERROR] No result returned" -ForegroundColor Red
        $result | ConvertTo-Json -Depth 10
    }
    
} catch {
    Write-Host "[ERROR] RPC call failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

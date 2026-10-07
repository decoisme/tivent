# List Recent Payments from Supabase
# This queries Supabase directly to show recent payment records

param(
    [int]$Limit = 10
)

$SupabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$SupabaseKey = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY

if (-not $SupabaseUrl -or -not $SupabaseKey) {
    Write-Host "[ERROR] Supabase credentials not found in environment!" -ForegroundColor Red
    Write-Host "Make sure .env.local is loaded or set these variables:" -ForegroundColor Yellow
    Write-Host "  NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor White
    Write-Host "  NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor White
    exit 1
}

Write-Host "[LIST] Fetching recent payments from Supabase..." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Gray
Write-Host ""

try {
    $Headers = @{
        "apikey" = $SupabaseKey
        "Authorization" = "Bearer $SupabaseKey"
        "Content-Type" = "application/json"
    }
    
    $Url = "$SupabaseUrl/rest/v1/payments?select=*&order=created_at.desc&limit=$Limit"
    
    $Payments = Invoke-RestMethod -Uri $Url -Headers $Headers -Method Get -ErrorAction Stop
    
    if ($Payments.Count -eq 0) {
        Write-Host "[INFO] No payments found in database" -ForegroundColor Yellow
    } else {
        Write-Host "[SUCCESS] Found $($Payments.Count) payment(s)" -ForegroundColor Green
        Write-Host ""
        
        foreach ($Payment in $Payments) {
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
            Write-Host "External ID: $($Payment.external_id)" -ForegroundColor Cyan
            Write-Host "  Status: $($Payment.status)" -ForegroundColor $(if($Payment.status -eq 'VERIFIED'){'Green'}else{'Yellow'})
            Write-Host "  Email: $($Payment.buyer_email)" -ForegroundColor White
            Write-Host "  Verified: $($Payment.email_verified)" -ForegroundColor $(if($Payment.email_verified){'Green'}else{'Red'})
            Write-Host "  Minted: $($Payment.ticket_minted)" -ForegroundColor $(if($Payment.ticket_minted){'Green'}else{'Red'})
            
            if ($Payment.mint_error) {
                Write-Host "  Error: $($Payment.mint_error)" -ForegroundColor Red
            }
            
            if ($Payment.tx_hash) {
                Write-Host "  TX: https://amoy.polygonscan.com/tx/$($Payment.tx_hash)" -ForegroundColor Blue
            }
            
            Write-Host "  Created: $($Payment.created_at)" -ForegroundColor Gray
            Write-Host ""
        }
        
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
        Write-Host ""
        Write-Host "[TIP] To test manual mint on any payment:" -ForegroundColor Yellow
        Write-Host "  .\test-manual-mint.ps1 `"EXTERNAL-ID-HERE`"" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "[ERROR] Failed to fetch payments!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Gray

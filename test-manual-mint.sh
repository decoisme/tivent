#!/bin/bash

# Test Manual Mint Endpoint
# Usage: ./test-manual-mint.sh TIVENT-1-1791394621711-ofl88m

EXTERNAL_ID="${1:-TIVENT-1-1791394621711-ofl88m}"
BASE_URL="https://tivent.vercel.app"

echo "🎫 Testing Manual Mint for: $EXTERNAL_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📋 Step 1: Check payment status before minting..."
curl -s "$BASE_URL/api/payment/xendit/status?externalId=$EXTERNAL_ID" | jq '.'
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🔨 Step 2: Trigger manual mint..."
RESULT=$(curl -s -X POST "$BASE_URL/api/payment/manual-mint" \
  -H "Content-Type: application/json" \
  -d "{\"externalId\":\"$EXTERNAL_ID\"}")

echo "$RESULT" | jq '.'
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Extract transaction hashes if successful
SUCCESS=$(echo "$RESULT" | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  echo "✅ Mint successful!"
  echo ""
  
  BUY_TX=$(echo "$RESULT" | jq -r '.buy_tx_hash')
  TRANSFER_TX=$(echo "$RESULT" | jq -r '.transfer_tx_hash')
  TOKEN_ID=$(echo "$RESULT" | jq -r '.token_id')
  
  echo "🎟️  Token ID: $TOKEN_ID"
  echo "💰 Buy TX: https://amoy.polygonscan.com/tx/$BUY_TX"
  echo "📤 Transfer TX: https://amoy.polygonscan.com/tx/$TRANSFER_TX"
  echo ""
  
  echo "📋 Step 3: Verify payment status after minting..."
  curl -s "$BASE_URL/api/payment/xendit/status?externalId=$EXTERNAL_ID" | jq '.'
else
  echo "❌ Mint failed!"
  echo "Error: $(echo "$RESULT" | jq -r '.error')"
  echo "Details: $(echo "$RESULT" | jq -r '.details')"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Done!"

# Ticket Redemption Guide

## Overview
Ticket redemption allows gate officers to verify and mark tickets as used when attendees enter the venue.

## Prerequisites

### ✅ Before You Can Redeem Tickets

1. **Your wallet address must be added as a Gate Officer**
   - Only addresses authorized by the contract owner can redeem tickets
   - This is a security feature to prevent unauthorized redemption

2. **You need POL tokens for gas fees**
   - ~0.01 POL per redemption
   - Get free testnet POL from: https://faucet.polygon.technology/

## Setup: Adding Gate Officers

### Quick Setup (For Testing)

Run this command from the `contracts/` directory:

```bash
# Replace with the wallet address you'll use for redemption
npx hardhat run scripts/add-gate-officer.js --network amoy 0xYourWalletAddress
```

Example:
```bash
npx hardhat run scripts/add-gate-officer.js --network amoy 0xe5986103321C179FF78BE4A07dC9FB414A2537d9
```

### Manual Setup (Using Hardhat Console)

```bash
cd contracts
npx hardhat console --network amoy
```

Then in the console:
```javascript
const EventTicketing = await ethers.getContractFactory("EventTicketing");
const contract = EventTicketing.attach("0xf7c60B0A8766baC5Ab991b46B9b07971aC97c021");

// Add gate officer
await contract.addGateOfficer("0xYourWalletAddress");

// Verify
await contract.gateOfficers("0xYourWalletAddress"); // Should return true
```

## Redemption Flow

### Step 1: Scan QR Code
1. Navigate to `/gate` page
2. Click "Scan QR Code" or enter ticket ID manually
3. QR code contains: `tokenId` and `owner` address

### Step 2: Verify Ticket
The system automatically checks:
- ✅ QR code is valid
- ✅ Ownership matches the QR code
- ✅ Ticket is active and not redeemed
- ✅ Event is not cancelled

### Step 3: Redeem Ticket
1. Review ticket details:
   - Event name, venue, date
   - Original price
   - Ticket holder address

2. Click **"Redeem & Allow Entry"**

3. Confirm transaction in MetaMask
   - Gas fee: ~0.01 POL
   - Confirmation time: ~3-5 seconds

4. Success! Ticket is now marked as redeemed

### Step 4: Allow Entry
- Ticket holder can now enter the venue
- Ticket cannot be redeemed again (on-chain proof)

## Troubleshooting

### ❌ Error: "Not authorized gate officer"

**Cause:** Your wallet address is not registered as a gate officer

**Solution:**
```bash
cd contracts
npx hardhat run scripts/add-gate-officer.js --network amoy YOUR_ADDRESS
```

### ❌ Error: "Ticket already redeemed"

**Cause:** This ticket was already used for entry

**Solution:** This is expected behavior. Each ticket can only be redeemed once.

### ❌ Error: "Holder mismatch"

**Cause:** The QR code owner doesn't match the actual ticket owner (ticket was transferred)

**Solution:** Scan the updated QR code from the new owner's wallet

### ❌ Error: "Event cancelled"

**Cause:** The event organizer cancelled the event

**Solution:** Ticket holders should claim refunds, not enter the venue

## Best Practices

### For Gate Officers

1. **Verify ID** - Check physical ID matches wallet address if needed
2. **One-time scan** - Each QR code should only be scanned once
3. **Check status** - Green checkmarks = ready to redeem
4. **Stable connection** - Ensure good internet connection
5. **Sufficient gas** - Keep at least 0.1 POL in wallet

### For Event Organizers

1. **Add officers early** - Set up gate officers before event day
2. **Test redemption** - Do a test run with sample tickets
3. **Monitor gas prices** - Provide POL to gate officers if needed
4. **Backup plan** - Have manual check-in as backup
5. **Remove officers** - Remove gate officer access after event

## Security Notes

### On-Chain Verification
- All redemptions are recorded on Polygon blockchain
- Immutable proof of entry
- Cannot be tampered with or reversed

### Gate Officer Permissions
- Gate officers can **only redeem tickets**
- Cannot transfer tickets
- Cannot cancel events
- Cannot claim refunds

### Privacy
- Ticket holder addresses are visible on-chain
- QR codes contain wallet addresses
- Consider privacy implications when sharing QRs

## Production Checklist

- [ ] Add all gate officer addresses
- [ ] Test redemption with test tickets
- [ ] Verify gas fees are acceptable
- [ ] Train gate staff on redemption flow
- [ ] Set up backup manual check-in
- [ ] Monitor redemption rate during event
- [ ] Remove gate officers after event

## Technical Details

### Smart Contract Function
```solidity
function redeemTicket(uint256 tokenId, address holder) 
    external 
    onlyGateOfficer 
    ticketExists(tokenId)
```

### Transaction Parameters
- **Gas Limit:** 200,000
- **Max Fee:** 250 Gwei (testnet)
- **Confirmation Time:** ~3-5 seconds
- **Cost:** ~0.01 POL (~$0.01 on mainnet)

### QR Code Format
```json
{
  "tokenId": "1",
  "owner": "0xe5986103321C179FF78BE4A07dC9FB414A2537d9",
  "eventId": "3",
  "timestamp": 1234567890
}
```

## Support

Having issues? Check:
1. PolygonScan: https://amoy.polygonscan.com/address/0xf7c60B0A8766baC5Ab991b46B9b07971aC97c021
2. Transaction history in your wallet
3. Contract events for `TicketRedeemed`

## Future Features

- [ ] Bulk redemption for multiple tickets
- [ ] Offline redemption (sync later)
- [ ] Per-event gate officers (not global)
- [ ] Time-limited gate officer access
- [ ] Mobile app for gate officers

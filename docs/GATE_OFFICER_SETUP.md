# Gate Officer Setup Guide

## Problem
Error: **"Transaction failed on-chain: Not authorized gate officer"**

When trying to redeem tickets, only addresses that have been added as **gate officers** in the smart contract can perform redemption.

## Solution

### Option 1: Add Gate Officer via Hardhat Console (Recommended for Testing)

1. Open terminal in `contracts/` directory

2. Connect to Amoy testnet:
```bash
npx hardhat console --network amoy
```

3. Get contract instance:
```javascript
const EventTicketing = await ethers.getContractFactory("EventTicketing");
const contract = EventTicketing.attach("0xf7c60B0A8766baC5Ab991b46B9b07971aC97c021");
```

4. Add your wallet as gate officer (replace with your address):
```javascript
const tx = await contract.addGateOfficer("YOUR_WALLET_ADDRESS_HERE");
await tx.wait();
console.log("Gate officer added successfully!");
```

5. Verify:
```javascript
const isOfficer = await contract.gateOfficers("YOUR_WALLET_ADDRESS_HERE");
console.log("Is gate officer:", isOfficer);
```

### Option 2: Create a Script (Automated)

Create `contracts/scripts/add-gate-officer.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const CONTRACT_ADDRESS = "0xf7c60B0A8766baC5Ab991b46B9b07971aC97c021";
  
  // Get the address to add (from command line or env)
  const gateOfficerAddress = process.env.GATE_OFFICER_ADDRESS || process.argv[2];
  
  if (!gateOfficerAddress) {
    console.error("❌ Please provide gate officer address");
    console.log("Usage: npx hardhat run scripts/add-gate-officer.js --network amoy <address>");
    process.exit(1);
  }

  console.log("📋 Adding gate officer...");
  console.log("Contract:", CONTRACT_ADDRESS);
  console.log("Officer:", gateOfficerAddress);

  const EventTicketing = await hre.ethers.getContractFactory("EventTicketing");
  const contract = EventTicketing.attach(CONTRACT_ADDRESS);

  // Add gate officer
  const tx = await contract.addGateOfficer(gateOfficerAddress, {
    gasLimit: 100000,
    maxFeePerGas: hre.ethers.parseUnits("250", "gwei"),
    maxPriorityFeePerGas: hre.ethers.parseUnits("250", "gwei"),
  });

  console.log("⏳ Transaction sent:", tx.hash);
  await tx.wait();

  // Verify
  const isOfficer = await contract.gateOfficers(gateOfficerAddress);
  
  if (isOfficer) {
    console.log("✅ Gate officer added successfully!");
  } else {
    console.log("❌ Failed to add gate officer");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

Run the script:
```bash
cd contracts
npx hardhat run scripts/add-gate-officer.js --network amoy 0xYourWalletAddress
```

### Option 3: Add via Organizer Dashboard (Production Feature)

**TODO:** Implement UI in organizer dashboard to manage gate officers:

1. Navigate to `/organizer/events/[id]/settings`
2. Section: "Gate Officers"
3. Add/Remove gate officer addresses
4. Each organizer can manage officers for their events

## Contract Functions

### `addGateOfficer(address officer)`
- **Restriction:** Only contract owner
- **Purpose:** Add new gate officer
- **Gas:** ~50,000

### `removeGateOfficer(address officer)`
- **Restriction:** Only contract owner
- **Purpose:** Remove gate officer
- **Gas:** ~30,000

### `redeemTicket(uint256 tokenId, address holder)`
- **Restriction:** Only gate officers
- **Purpose:** Mark ticket as redeemed
- **Gas:** ~200,000

## Security Notes

1. **Gate officers** have significant power - they can mark any ticket as redeemed
2. Only add trusted addresses (venue staff, security personnel)
3. Remove officers when no longer needed
4. For production, implement role-based access per event (not global)

## Testing Flow

1. Deploy contract → Owner is deployer
2. Owner adds gate officer address
3. Gate officer scans QR code
4. Gate officer calls `redeemTicket(tokenId, holder)`
5. Ticket marked as redeemed ✅

## Future Improvements

- [ ] Per-event gate officers (not global)
- [ ] Time-limited gate officer roles
- [ ] Multi-sig for adding/removing officers
- [ ] Event organizer can manage their own officers

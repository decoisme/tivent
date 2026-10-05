# Gate Officer Management Guide

Complete guide for managing gate officers in Tivent platform.

## Overview

Gate officers are authorized personnel who can scan and redeem tickets at event venues. Only the contract owner can add or remove gate officers.

## Prerequisites

- You must be the **contract owner** (the wallet that deployed the contract)
- Your wallet must be connected to the Tivent platform
- You must be on Polygon Amoy Testnet (Chain ID: 80002)

## Accessing Gate Officer Management

### Via Web Interface

1. Navigate to: https://tivent.vercel.app/admin/gate-officers
2. Or click **Admin** → **Gate Officers** in the navigation menu
3. Connect your wallet (must be contract owner)

### Contract Owner Address

The contract owner is the address that deployed the EventTicketing contract. Check your deployment logs or use:

```javascript
// Using ethers.js
const owner = await contract.owner();
console.log('Contract owner:', owner);
```

## Adding a Gate Officer

### Via Web Interface

1. Go to `/admin/gate-officers`
2. Enter the wallet address in "Add Gate Officer" section
3. Click "Add Gate Officer"
4. Confirm the transaction in MetaMask
5. Wait for blockchain confirmation (~2-4 seconds)
6. Officer is now authorized ✅

### Via Smart Contract Direct Call

```javascript
const ethers = require('ethers');

// Setup
const contractAddress = '0xF296c0191760541028e72Ae093C3771032aEfA3C';
const provider = new ethers.JsonRpcProvider('https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY');
const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);
const contract = new ethers.Contract(contractAddress, ABI, wallet);

// Add gate officer
const officerAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
const tx = await contract.addGateOfficer(officerAddress, {
  gasLimit: 150000,
  maxFeePerGas: ethers.parseUnits('250', 'gwei'),
  maxPriorityFeePerGas: ethers.parseUnits('250', 'gwei'),
});

await tx.wait();
console.log('✅ Gate officer added!');
```

### Via Hardhat Script

Use the included script:

```bash
cd contracts
npx hardhat run scripts/add-gate-officer.js --network amoy
```

## Removing a Gate Officer

### Via Web Interface

1. Go to `/admin/gate-officers`
2. Check the officer's status to see if they're active
3. Click the trash icon (🗑️) next to their address
4. Confirm the removal
5. Confirm transaction in MetaMask
6. Officer is now unauthorized ❌

### Via Smart Contract

```javascript
const tx = await contract.removeGateOfficer(officerAddress, {
  gasLimit: 100000,
  maxFeePerGas: ethers.parseUnits('250', 'gwei'),
  maxPriorityFeePerGas: ethers.parseUnits('250', 'gwei'),
});

await tx.wait();
console.log('✅ Gate officer removed!');
```

## Checking Officer Status

### Via Web Interface

1. Go to `/admin/gate-officers`
2. Enter the wallet address in "Check Officer Status"
3. Click "Check Status"
4. See if the address is authorized or not

### Via Smart Contract

```javascript
const isOfficer = await contract.gateOfficers(officerAddress);
console.log('Is gate officer:', isOfficer); // true or false
```

## How Gate Officers Use The System

Once added as a gate officer, the person can:

1. **Access the Scanner**:
   - Navigate to: `/gate`
   - Connect their authorized wallet
   - Start scanning QR codes

2. **Scan Tickets**:
   - Point camera at ticket QR code
   - System verifies:
     - ✅ QR signature valid
     - ✅ Timestamp not expired
     - ✅ Ownership matches
     - ✅ Ticket not already redeemed
     - ✅ Ticket is active

3. **Redeem Tickets**:
   - If ticket is valid, click "Admit Guest"
   - Confirm the redemption transaction
   - Ticket is marked as used on blockchain
   - Guest can enter venue ✅

## Security Features

### Authorization Check

The smart contract enforces authorization:

```solidity
modifier onlyGateOfficer() {
    require(gateOfficers[msg.sender], "Not authorized gate officer");
    _;
}

function redeemTicket(uint256 tokenId, address holder) 
    external 
    onlyGateOfficer 
{
    // Only authorized gate officers can call this
}
```

### On-Chain Verification

All gate officer additions/removals are recorded on blockchain:

```solidity
event GateOfficerAdded(address indexed officer);
event GateOfficerRemoved(address indexed officer);
```

### Access Control

- Only contract owner can add/remove officers
- Gate officers can only redeem tickets (cannot modify events or transfer tickets)
- Each redemption is permanently recorded on-chain

## Common Issues & Solutions

### Issue: "Access Denied" when accessing `/admin/gate-officers`

**Solution**: You must be the contract owner. Check:
```javascript
const owner = await contract.owner();
const myAddress = await wallet.getAddress();
console.log('Owner:', owner);
console.log('My address:', myAddress);
console.log('Am I owner?', owner.toLowerCase() === myAddress.toLowerCase());
```

### Issue: "Not authorized gate officer" when trying to redeem

**Solution**: The wallet must be added as gate officer first:
1. Contract owner adds the wallet address
2. Wait for transaction confirmation
3. Verify with: `await contract.gateOfficers(address)`

### Issue: Transaction fails with "Insufficient funds"

**Solution**: Make sure you have enough POL for gas:
- Get free testnet POL from: https://faucet.polygon.technology/
- Estimated gas cost: ~0.0001 POL per transaction

### Issue: Cannot find contract owner

**Solution**: Check deployment logs in `contracts/deployments/` or:
```bash
cd contracts
npx hardhat verify --network amoy 0xF296c0191760541028e72Ae093C3771032aEfA3C
```

## Best Practices

### 1. Use Dedicated Wallets

Create separate wallets for gate officers:
```bash
# Generate new wallet
npx ethereum-wallet-generator

# Fund with small amount of POL for gas
# Add to contract as gate officer
```

### 2. Rotate Officers Regularly

Remove officers after event:
```javascript
// After event ends
await contract.removeGateOfficer(officerAddress);
```

### 3. Monitor Activity

Track redemptions via blockchain events:
```javascript
contract.on('TicketRedeemed', (tokenId, holder, eventId) => {
  console.log(`Ticket #${tokenId} redeemed for event #${eventId}`);
});
```

### 4. Backup Officer List

Keep a list of authorized officers:
```json
{
  "event_id": 1,
  "gate_officers": [
    {
      "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "added_at": "2026-09-29T10:00:00Z",
      "name": "John Doe"
    }
  ]
}
```

## Gas Costs

| Operation | Gas Used | Cost (250 gwei) |
|-----------|----------|-----------------|
| Add gate officer | ~100,000 | ~0.000025 POL (~$0.0001) |
| Remove gate officer | ~50,000 | ~0.0000125 POL (~$0.00005) |
| Check status (view) | 0 | Free |
| Redeem ticket | ~80,000 | ~0.00002 POL (~$0.0001) |

## API Reference

### Smart Contract Functions

```solidity
// Add gate officer (only owner)
function addGateOfficer(address officer) external onlyOwner

// Remove gate officer (only owner)
function removeGateOfficer(address officer) external onlyOwner

// Check if address is gate officer (public view)
function gateOfficers(address officer) public view returns (bool)

// Get contract owner (public view)
function owner() public view returns (address)
```

### Web Interface Endpoints

- **Admin Dashboard**: `/admin`
- **Gate Officer Management**: `/admin/gate-officers`
- **Gate Scanner**: `/gate`
- **Redeem Ticket**: `/gate/redeem/[tokenId]`

## Support

If you encounter issues:

1. Check you're on Polygon Amoy (Chain ID 80002)
2. Verify you have POL for gas fees
3. Confirm you're the contract owner (for adding/removing)
4. Check console for error messages
5. Review transaction on PolygonScan: https://amoy.polygonscan.com/

## Related Documentation

- [Gate Officer Setup Guide](./GATE_OFFICER_SETUP.md)
- [Ticket Redemption Guide](./REDEEM_TICKET_GUIDE.md)
- [Smart Contract Documentation](./CONTRACT_SPEC.md)

---

**Last Updated**: September 29, 2026  
**Contract Address**: `0xF296c0191760541028e72Ae093C3771032aEfA3C`  
**Network**: Polygon Amoy Testnet (80002)

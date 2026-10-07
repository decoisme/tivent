const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.local' });

/**
 * Test platform wallet configuration and readiness
 * Verifies wallet connection, balance, and contract interaction
 */

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;
const PLATFORM_PRIVATE_KEY = process.env.PLATFORM_PRIVATE_KEY;
const PLATFORM_WALLET_ADDRESS = process.env.PLATFORM_WALLET_ADDRESS;

// Minimal ABI for testing
const MINIMAL_ABI = [
  'function owner() view returns (address)',
  'function eventCount() view returns (uint256)',
  'function getTicketType(uint256 eventId, uint256 typeId) view returns (tuple(uint256 typeId, string name, uint256 price, uint256 maxSupply, uint256 sold, bool active))',
];

async function testPlatformWallet() {
  console.log('🧪 Testing Platform Wallet Configuration...\n');

  // Check environment variables
  console.log('📋 Step 1: Checking Environment Variables');
  console.log('─────────────────────────────────────────');

  if (!PLATFORM_PRIVATE_KEY) {
    console.error('❌ PLATFORM_PRIVATE_KEY not set in .env.local');
    process.exit(1);
  }
  console.log('✅ PLATFORM_PRIVATE_KEY is set');

  if (!PLATFORM_WALLET_ADDRESS) {
    console.error('❌ PLATFORM_WALLET_ADDRESS not set in .env.local');
    process.exit(1);
  }
  console.log('✅ PLATFORM_WALLET_ADDRESS is set:', PLATFORM_WALLET_ADDRESS);

  if (!CONTRACT_ADDRESS) {
    console.error('❌ NEXT_PUBLIC_CONTRACT_ADDRESS not set in .env.local');
    process.exit(1);
  }
  console.log('✅ Contract address is set:', CONTRACT_ADDRESS);

  if (!RPC_URL) {
    console.error('❌ NEXT_PUBLIC_RPC_URL not set in .env.local');
    process.exit(1);
  }
  console.log('✅ RPC URL is set\n');

  // Initialize provider and wallet
  console.log('🔗 Step 2: Connecting to Blockchain');
  console.log('─────────────────────────────────────────');

  let provider;
  try {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    const network = await provider.getNetwork();
    console.log('✅ Connected to network:', network.name);
    console.log('   Chain ID:', network.chainId.toString());
  } catch (error) {
    console.error('❌ Failed to connect to RPC:', error.message);
    process.exit(1);
  }

  let wallet;
  try {
    // Add 0x prefix if not present
    const privateKey = PLATFORM_PRIVATE_KEY.startsWith('0x') 
      ? PLATFORM_PRIVATE_KEY 
      : '0x' + PLATFORM_PRIVATE_KEY;
    
    wallet = new ethers.Wallet(privateKey, provider);
    console.log('✅ Wallet initialized');
    console.log('   Address:', wallet.address);
  } catch (error) {
    console.error('❌ Failed to initialize wallet:', error.message);
    console.error('   Make sure PLATFORM_PRIVATE_KEY is valid (64 hex characters)');
    process.exit(1);
  }

  // Verify wallet address matches
  if (wallet.address.toLowerCase() !== PLATFORM_WALLET_ADDRESS.toLowerCase()) {
    console.error('❌ Wallet address mismatch!');
    console.error('   Derived from private key:', wallet.address);
    console.error('   PLATFORM_WALLET_ADDRESS:', PLATFORM_WALLET_ADDRESS);
    console.error('   Update PLATFORM_WALLET_ADDRESS in .env.local');
    process.exit(1);
  }
  console.log('✅ Wallet address verified\n');

  // Check balance
  console.log('💰 Step 3: Checking Wallet Balance');
  console.log('─────────────────────────────────────────');

  let balance;
  try {
    balance = await provider.getBalance(wallet.address);
    const balancePOL = ethers.formatEther(balance);
    console.log('✅ Balance:', balancePOL, 'POL');

    if (parseFloat(balancePOL) < 0.01) {
      console.warn('⚠️  WARNING: Balance is very low!');
      console.warn('   Recommended minimum: 0.1 POL');
      console.warn('   Get testnet POL: https://faucet.polygon.technology/');
    } else if (parseFloat(balancePOL) < 0.1) {
      console.warn('⚠️  Balance is low. Consider adding more POL.');
    } else {
      console.log('✅ Balance is sufficient');
    }
  } catch (error) {
    console.error('❌ Failed to check balance:', error.message);
    process.exit(1);
  }
  console.log();

  // Test contract connection
  console.log('📜 Step 4: Testing Contract Connection');
  console.log('─────────────────────────────────────────');

  let contract;
  try {
    contract = new ethers.Contract(CONTRACT_ADDRESS, MINIMAL_ABI, wallet);
    console.log('✅ Contract initialized');
  } catch (error) {
    console.error('❌ Failed to initialize contract:', error.message);
    process.exit(1);
  }

  // Read contract owner
  try {
    const owner = await contract.owner();
    console.log('✅ Contract owner:', owner);
  } catch (error) {
    console.error('❌ Failed to read contract owner:', error.message);
    console.error('   Contract may not be deployed or ABI is incorrect');
    process.exit(1);
  }

  // Read event count
  try {
    const eventCount = await contract.eventCount();
    console.log('✅ Total events:', eventCount.toString());
    
    if (eventCount.toString() === '0') {
      console.warn('⚠️  No events found in contract. Create an event first.');
    }
  } catch (error) {
    console.error('❌ Failed to read event count:', error.message);
  }
  console.log();

  // Estimate gas for a test transaction
  console.log('⛽ Step 5: Estimating Gas Costs');
  console.log('─────────────────────────────────────────');

  const avgGasPrice = await provider.getFeeData();
  console.log('✅ Current gas price:');
  console.log('   Max fee:', ethers.formatUnits(avgGasPrice.maxFeePerGas || 0n, 'gwei'), 'gwei');
  console.log('   Priority fee:', ethers.formatUnits(avgGasPrice.maxPriorityFeePerGas || 0n, 'gwei'), 'gwei');

  const estimatedGasForMint = 500000n; // Typical gas for buyTicket
  const estimatedCost = estimatedGasForMint * (avgGasPrice.maxFeePerGas || 250000000000n);
  console.log('   Estimated cost per mint:', ethers.formatEther(estimatedCost), 'POL');

  const maxMints = balance / estimatedCost;
  console.log('   Approximate mints possible:', Math.floor(Number(maxMints)).toLocaleString());
  console.log();

  // Summary
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 PLATFORM WALLET TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('Wallet Address:', wallet.address);
  console.log('Balance:', ethers.formatEther(balance), 'POL');
  console.log('Contract:', CONTRACT_ADDRESS);
  console.log('Network: Polygon Amoy Testnet (Chain ID: 80002)');
  console.log();

  if (parseFloat(ethers.formatEther(balance)) >= 0.1) {
    console.log('✅ ALL CHECKS PASSED!');
    console.log('   Platform wallet is ready for automatic ticket minting.');
  } else {
    console.log('⚠️  CHECKS PASSED WITH WARNINGS');
    console.log('   Platform wallet works but needs more POL.');
    console.log('   Fund the wallet: https://faucet.polygon.technology/');
  }
  console.log();
}

// Run the test
testPlatformWallet()
  .then(() => {
    console.log('✨ Platform wallet test complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  });

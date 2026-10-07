const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

/**
 * Generate a new platform wallet for auto-minting tickets
 * This script creates a new wallet and saves the credentials securely
 */

async function generatePlatformWallet() {
  console.log('🔐 Generating Platform Wallet...\n');

  // Create random wallet
  const wallet = ethers.Wallet.createRandom();

  // Extract credentials
  const address = wallet.address;
  const privateKey = wallet.privateKey.substring(2); // Remove 0x prefix
  const mnemonic = wallet.mnemonic.phrase;

  // Display information
  console.log('✅ Platform Wallet Generated Successfully!\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📍 Wallet Address:');
  console.log(`   ${address}\n`);
  console.log('🔑 Private Key (without 0x):');
  console.log(`   ${privateKey}\n`);
  console.log('📝 Mnemonic Phrase (BACKUP THIS!):');
  console.log(`   ${mnemonic}\n`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Generate .env snippet
  const envSnippet = `
# ========================================
# PLATFORM WALLET CONFIGURATION
# ========================================
# ⚠️ KEEP THIS SECRET! Never commit to git!
# This wallet is used to automatically mint NFT tickets after fiat payment
PLATFORM_PRIVATE_KEY=${privateKey}
PLATFORM_WALLET_ADDRESS=${address}
`;

  console.log('📄 Add these to your .env.local file:\n');
  console.log(envSnippet);

  // Ask to save
  console.log('💾 Saving credentials...\n');

  // Create secure backup file
  const backupDir = path.join(__dirname, '..', '.wallet-backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `platform-wallet-${timestamp}.txt`);

  const backupContent = `
TIVENT PLATFORM WALLET BACKUP
Generated: ${new Date().toISOString()}

⚠️ KEEP THIS FILE SECURE AND NEVER SHARE IT!

Wallet Address: ${address}
Private Key: ${privateKey}
Mnemonic Phrase: ${mnemonic}

HOW TO USE:
1. Add PLATFORM_PRIVATE_KEY and PLATFORM_WALLET_ADDRESS to .env.local
2. Fund this wallet with POL on Polygon Amoy testnet
3. Get free test POL: https://faucet.polygon.technology/

BACKUP:
Store this mnemonic phrase in a secure location (password manager, hardware wallet, etc.)
With this phrase, you can recover the wallet if the private key is lost.

NEVER:
- Commit this file to git
- Share the private key or mnemonic
- Store in plain text on public servers
`;

  fs.writeFileSync(backupFile, backupContent);
  console.log(`✅ Backup saved to: ${backupFile}`);

  // Add to .gitignore
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  let gitignoreContent = '';
  if (fs.existsSync(gitignorePath)) {
    gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  }

  if (!gitignoreContent.includes('.wallet-backup')) {
    fs.appendFileSync(gitignorePath, '\n# Platform wallet backups\n.wallet-backup/\n');
    console.log('✅ Added .wallet-backup/ to .gitignore\n');
  }

  // Instructions
  console.log('📋 NEXT STEPS:\n');
  console.log('1. Copy the environment variables above to your .env.local file');
  console.log('2. Fund the wallet with POL:');
  console.log('   - Testnet: https://faucet.polygon.technology/');
  console.log('   - Send to:', address);
  console.log('   - Recommended: 1-10 POL\n');
  console.log('3. Backup the mnemonic phrase securely');
  console.log('4. Test the wallet:');
  console.log('   npm run test:platform-wallet\n');
  console.log('🔒 Security Reminder:');
  console.log('   - Never commit .env.local to git');
  console.log('   - Store mnemonic in a password manager');
  console.log('   - Rotate wallet every 3-6 months\n');
}

// Run the generator
generatePlatformWallet()
  .then(() => {
    console.log('✨ Platform wallet generation complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error generating wallet:', error);
    process.exit(1);
  });

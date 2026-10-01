const hre = require("hardhat");

/**
 * Deploy EventTicketing contract to Polygon Amoy Testnet
 * 
 * Prerequisites:
 * 1. Get free POL from: https://faucet.polygon.technology/
 * 2. Add Amoy network to MetaMask (Chain ID: 80002)
 * 3. Create contracts/.env file with your PRIVATE_KEY
 * 
 * Usage:
 * npx hardhat run scripts/deploy-amoy.js --network amoy
 */

async function main() {
  console.log("🚀 Starting deployment to Polygon Amoy Testnet...\n");

  // Debug: Check if private key is loaded
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ ERROR: PRIVATE_KEY not found in .env file!");
    console.error("Please add your private key to contracts/.env");
    process.exit(1);
  }
  console.log("✅ Private key loaded (length:", privateKey.length, "characters)");

  // Get network info
  const network = await hre.ethers.provider.getNetwork();
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId.toString());

  // Verify we're on Amoy
  if (network.chainId !== 80002n) {
    console.error("❌ Error: Not on Amoy testnet!");
    console.error("Expected Chain ID: 80002");
    console.error("Current Chain ID:", network.chainId.toString());
    process.exit(1);
  }

  // Get the deployer account
  let deployer;
  try {
    [deployer] = await hre.ethers.getSigners();
  } catch (error) {
    console.error("❌ ERROR: Failed to get signer!");
    console.error("Error:", error.message);
    console.error("\nPossible causes:");
    console.error("1. Private key format is incorrect");
    console.error("2. Private key has '0x' prefix (should be removed)");
    console.error("3. .env file not loaded properly");
    process.exit(1);
  }

  if (!deployer) {
    console.error("❌ ERROR: Deployer is undefined!");
    console.error("Check your PRIVATE_KEY in contracts/.env");
    process.exit(1);
  }

  console.log("\n📍 Deployer address:", deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  const balancePOL = hre.ethers.formatEther(balance);
  console.log("💰 Balance:", balancePOL, "POL");

  if (parseFloat(balancePOL) < 0.1) {
    console.warn("\n⚠️  Warning: Low balance!");
    console.warn("Get free POL from: https://faucet.polygon.technology/");
    console.warn("You need at least 0.1 POL for deployment\n");
  }

  // Deploy EventTicketing contract
  console.log("\n📦 Deploying EventTicketing contract...");
  const EventTicketing = await hre.ethers.getContractFactory("EventTicketing");
  
  console.log("⏳ Sending transaction...");
  const eventTicketing = await EventTicketing.deploy();

  console.log("⏳ Waiting for deployment...");
  await eventTicketing.waitForDeployment();
  
  const contractAddress = await eventTicketing.getAddress();
  console.log("✅ Contract deployed to:", contractAddress);

  // Get deployment transaction details
  const deployTx = eventTicketing.deploymentTransaction();
  if (deployTx) {
    console.log("\n📊 Deployment Details:");
    console.log("   Transaction hash:", deployTx.hash);
    console.log("   Gas used:", deployTx.gasLimit?.toString() || "N/A");
    
    // Wait for confirmations
    console.log("\n⏳ Waiting for 5 block confirmations...");
    const receipt = await deployTx.wait(5);
    console.log("✅ Confirmed in block:", receipt?.blockNumber);
    
    // Calculate actual gas used
    if (receipt) {
      const gasUsed = receipt.gasUsed;
      const gasPrice = deployTx.gasPrice || 0n;
      const gasCost = gasUsed * gasPrice;
      const gasCostPOL = hre.ethers.formatEther(gasCost);
      console.log("💸 Gas cost:", gasCostPOL, "POL (~$" + (parseFloat(gasCostPOL) * 0.5).toFixed(4) + " USD)");
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(60));
  console.log("\n📋 Summary:");
  console.log("   Network: Polygon Amoy Testnet");
  console.log("   Contract: EventTicketing");
  console.log("   Address:", contractAddress);
  console.log("   Explorer: https://amoy.polygonscan.com/address/" + contractAddress);
  
  console.log("\n📝 Next Steps:");
  console.log("\n1. Update your .env.local file:");
  console.log("   NEXT_PUBLIC_CONTRACT_ADDRESS=" + contractAddress);
  
  console.log("\n2. Verify contract on PolygonScan (optional):");
  console.log("   npx hardhat verify --network amoy " + contractAddress);
  
  console.log("\n3. Test the contract:");
  console.log("   - Connect wallet to Amoy network");
  console.log("   - Run: npm run dev");
  console.log("   - Create an event and check gas fee (~$0.00)");
  
  console.log("\n4. View transactions:");
  console.log("   https://amoy.polygonscan.com/address/" + contractAddress);
  
  console.log("\n" + "=".repeat(60));
  console.log("✅ All done! Happy building! 🚀");
  console.log("=".repeat(60) + "\n");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

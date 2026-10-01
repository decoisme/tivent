const hre = require("hardhat");

/**
 * Deploy EventTicketing contract to Polygon Mumbai Testnet
 * 
 * Prerequisites:
 * 1. Get free MATIC from: https://faucet.polygon.technology/
 * 2. Add Mumbai network to MetaMask (Chain ID: 80001)
 * 3. Create contracts/.env file with your PRIVATE_KEY
 * 
 * Usage:
 * npx hardhat run scripts/deploy-mumbai.js --network mumbai
 */

async function main() {
  console.log("🚀 Starting deployment to Polygon Mumbai Testnet...\n");

  // Get network info
  const network = await hre.ethers.provider.getNetwork();
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId.toString());

  // Verify we're on Mumbai
  if (network.chainId !== 80001n) {
    console.error("❌ Error: Not on Mumbai testnet!");
    console.error("Expected Chain ID: 80001");
    console.error("Current Chain ID:", network.chainId.toString());
    process.exit(1);
  }

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("\n📍 Deployer address:", deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  const balanceMATIC = hre.ethers.formatEther(balance);
  console.log("💰 Balance:", balanceMATIC, "MATIC");

  if (parseFloat(balanceMATIC) < 0.1) {
    console.warn("\n⚠️  Warning: Low balance!");
    console.warn("Get free MATIC from: https://faucet.polygon.technology/");
    console.warn("You need at least 0.1 MATIC for deployment\n");
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
      const gasCostMATIC = hre.ethers.formatEther(gasCost);
      console.log("💸 Gas cost:", gasCostMATIC, "MATIC (~$" + (parseFloat(gasCostMATIC) * 0.5).toFixed(4) + " USD)");
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(60));
  console.log("\n📋 Summary:");
  console.log("   Network: Polygon Mumbai Testnet");
  console.log("   Contract: EventTicketing");
  console.log("   Address:", contractAddress);
  console.log("   Explorer: https://mumbai.polygonscan.com/address/" + contractAddress);
  
  console.log("\n📝 Next Steps:");
  console.log("\n1. Update your .env.local file:");
  console.log("   NEXT_PUBLIC_CONTRACT_ADDRESS=" + contractAddress);
  
  console.log("\n2. Verify contract on PolygonScan (optional):");
  console.log("   npx hardhat verify --network mumbai " + contractAddress);
  
  console.log("\n3. Test the contract:");
  console.log("   - Connect wallet to Mumbai network");
  console.log("   - Run: npm run dev");
  console.log("   - Create an event and check gas fee (~$0.00)");
  
  console.log("\n4. View transactions:");
  console.log("   https://mumbai.polygonscan.com/address/" + contractAddress);
  
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

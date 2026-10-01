const hre = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy EventTicketing contract
  console.log("\nDeploying EventTicketing contract...");
  const EventTicketing = await hre.ethers.getContractFactory("EventTicketing");
  const eventTicketing = await EventTicketing.deploy();

  await eventTicketing.waitForDeployment();
  const contractAddress = await eventTicketing.getAddress();

  console.log("EventTicketing deployed to:", contractAddress);

  // Wait for a few block confirmations
  console.log("Waiting for block confirmations...");
  await eventTicketing.deploymentTransaction()?.wait(5);

  console.log("\n✅ Deployment completed!");
  console.log("\nContract Address:", contractAddress);
  console.log("\nAdd this to your .env.local file:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);

  // Verify on Etherscan (if not on localhost)
  const network = await hre.ethers.provider.getNetwork();
  if (process.env.ETHERSCAN_API_KEY && network.chainId !== 1337n) {
    console.log("\nVerifying contract on Etherscan...");
    try {
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30s for indexing
      console.log("Run the following command to verify:");
      console.log(`npx hardhat verify --network <network> ${contractAddress}`);
    } catch (error) {
      console.log("Error during verification:", error);
    }
  }
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

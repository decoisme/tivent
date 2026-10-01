const hre = require("hardhat");

async function main() {
  const CONTRACT_ADDRESS = "0xf7c60B0A8766baC5Ab991b46B9b07971aC97c021";
  
  // Get the address to add (from command line or env)
  const gateOfficerAddress = process.env.GATE_OFFICER_ADDRESS || process.argv[2];
  
  if (!gateOfficerAddress) {
    console.error("❌ Please provide gate officer address");
    console.log("\nUsage:");
    console.log("  npx hardhat run scripts/add-gate-officer.js --network amoy <address>");
    console.log("\nOr set environment variable:");
    console.log("  GATE_OFFICER_ADDRESS=0x... npx hardhat run scripts/add-gate-officer.js --network amoy");
    process.exit(1);
  }

  // Validate address format
  if (!hre.ethers.isAddress(gateOfficerAddress)) {
    console.error("❌ Invalid Ethereum address:", gateOfficerAddress);
    process.exit(1);
  }

  console.log("\n📋 Gate Officer Setup");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Contract:      ", CONTRACT_ADDRESS);
  console.log("Officer:       ", gateOfficerAddress);
  console.log("Network:       ", hre.network.name);

  const [deployer] = await hre.ethers.getSigners();
  console.log("Caller:        ", deployer.address);

  const EventTicketing = await hre.ethers.getContractFactory("EventTicketing");
  const contract = EventTicketing.attach(CONTRACT_ADDRESS);

  // Check current status
  console.log("\n⏳ Checking current status...");
  const isAlreadyOfficer = await contract.gateOfficers(gateOfficerAddress);
  
  if (isAlreadyOfficer) {
    console.log("✅ Address is already a gate officer!");
    console.log("\nNo action needed.");
    return;
  }

  console.log("📝 Address is not a gate officer yet");

  // Add gate officer
  console.log("\n⏳ Adding gate officer...");
  const tx = await contract.addGateOfficer(gateOfficerAddress, {
    gasLimit: 100000,
    maxFeePerGas: hre.ethers.parseUnits("250", "gwei"),
    maxPriorityFeePerGas: hre.ethers.parseUnits("250", "gwei"),
  });

  console.log("📤 Transaction hash:", tx.hash);
  console.log("⏳ Waiting for confirmation...");
  
  const receipt = await tx.wait();
  
  console.log("✅ Transaction confirmed!");
  console.log("   Block:      ", receipt.blockNumber);
  console.log("   Gas used:   ", receipt.gasUsed.toString());

  // Verify
  console.log("\n⏳ Verifying...");
  const isOfficer = await contract.gateOfficers(gateOfficerAddress);
  
  if (isOfficer) {
    console.log("✅ Gate officer added successfully!");
    console.log("\n🎉 The address can now redeem tickets!");
  } else {
    console.log("❌ Failed to add gate officer");
    console.log("   Please check transaction on block explorer");
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("View on PolygonScan:");
  console.log(`https://amoy.polygonscan.com/tx/${tx.hash}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });

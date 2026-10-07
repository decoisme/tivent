const hre = require("hardhat");

async function main() {
  // Contract address (update this)
  const CONTRACT_ADDRESS = "0xB0637912f3e017542F8d6E7759F1D0bF3f21e678";
  
  // Gate officer address to add (update this with your wallet address)
  const GATE_OFFICER_ADDRESS = process.argv[2];
  
  if (!GATE_OFFICER_ADDRESS) {
    console.error("❌ Error: Please provide gate officer address");
    console.log("Usage: npx hardhat run scripts/add-gate-officer.js --network amoy <officer-address>");
    process.exit(1);
  }

  console.log("Adding gate officer...");
  console.log("Contract:", CONTRACT_ADDRESS);
  console.log("Gate Officer:", GATE_OFFICER_ADDRESS);

  // Get contract instance
  const EventTicketing = await hre.ethers.getContractFactory("EventTicketing");
  const contract = EventTicketing.attach(CONTRACT_ADDRESS);

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer (owner):", deployer.address);

  // Check if already a gate officer
  const isOfficer = await contract.gateOfficers(GATE_OFFICER_ADDRESS);
  if (isOfficer) {
    console.log("✅ This address is already a gate officer!");
    process.exit(0);
  }

  // Add gate officer
  console.log("\nAdding gate officer...");
  const tx = await contract.addGateOfficer(GATE_OFFICER_ADDRESS);
  console.log("Transaction hash:", tx.hash);
  
  console.log("Waiting for confirmation...");
  await tx.wait();
  
  // Verify
  const isOfficerNow = await contract.gateOfficers(GATE_OFFICER_ADDRESS);
  
  if (isOfficerNow) {
    console.log("\n✅ Gate officer added successfully!");
    console.log("Address:", GATE_OFFICER_ADDRESS);
  } else {
    console.log("\n❌ Failed to add gate officer");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

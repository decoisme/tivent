import { ethers } from "hardhat";
import { createEventMetadataURI, toBasisPoints } from "./helpers";

/**
 * Example script to interact with deployed EventTicketing contract
 * Usage: npx hardhat run scripts/interact.ts --network <network>
 */

async function main() {
  // Get contract address from environment or argument
  const contractAddress = process.env.CONTRACT_ADDRESS || "";
  
  if (!contractAddress) {
    console.error("Please set CONTRACT_ADDRESS environment variable");
    process.exit(1);
  }

  console.log("Connecting to contract at:", contractAddress);

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);

  // Connect to deployed contract
  const EventTicketing = await ethers.getContractFactory("EventTicketing");
  const eventTicketing = EventTicketing.attach(contractAddress);

  // Example: Create an event
  console.log("\n--- Creating Event ---");
  
  const eventMetadata = createEventMetadataURI({
    title: "Sample Concert",
    description: "An amazing live performance",
    venue: "Grand Arena",
    date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  });

  const ticketPrice = ethers.parseEther("0.1"); // 0.1 ETH
  const maxTickets = 100;
  const maxTicketsPerWallet = 4;
  const resalePriceCap = toBasisPoints(110); // 110% = max 10% markup
  const resaleDeadline = Math.floor(Date.now() / 1000) + (29 * 24 * 60 * 60); // 29 days

  try {
    const tx = await eventTicketing.createEvent(
      eventMetadata,
      ticketPrice,
      maxTickets,
      maxTicketsPerWallet,
      resalePriceCap,
      resaleDeadline
    );

    console.log("Transaction hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("Event created! Gas used:", receipt?.gasUsed.toString());

    // Get event details
    // Note: You'll need to implement getEvent function in the contract
    console.log("\n✅ Event created successfully!");
  } catch (error) {
    console.error("Error creating event:", error);
  }

  // Example: Query events
  console.log("\n--- Querying Events ---");
  try {
    // You'll need to implement these getter functions
    const eventCount = await eventTicketing.eventCount?.();
    console.log("Total events:", eventCount?.toString());
  } catch (error) {
    console.log("Query functions not yet implemented");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

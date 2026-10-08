const hre = require("hardhat");

/**
 * Create a test event for free minting testing
 */

async function main() {
  console.log("🎫 Creating test event for free minting...\n");

  const contractAddress = "0x35206B197Ed1293343Eaf44F7dbE268B7C109FaB";
  
  // Get contract instance
  const EventTicketing = await hre.ethers.getContractFactory("EventTicketing");
  const contract = EventTicketing.attach(contractAddress);
  
  // Get signer
  const [signer] = await hre.ethers.getSigners();
  console.log("Creating event from:", signer.address);
  
  // Check balance
  const balance = await hre.ethers.provider.getBalance(signer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "POL\n");
  
  // Event parameters
  const metadataURI = "ipfs://test-event-free-minting";
  const ticketPrice = hre.ethers.parseEther("0.025"); // 0.025 POL (not used for free minting)
  const maxTickets = 100;
  const maxTicketsPerWallet = 10;
  const resalePriceCap = 11000; // 110%
  const resaleDeadline = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
  
  console.log("Event Parameters:");
  console.log("  Metadata URI:", metadataURI);
  console.log("  Ticket Price:", hre.ethers.formatEther(ticketPrice), "POL");
  console.log("  Max Tickets:", maxTickets);
  console.log("  Max per Wallet:", maxTicketsPerWallet);
  console.log("  Resale Cap:", resalePriceCap / 100, "%");
  console.log("  Resale Deadline:", new Date(resaleDeadline * 1000).toISOString());
  console.log("");
  
  // Create event
  console.log("⏳ Creating event...");
  const tx = await contract.createEvent(
    metadataURI,
    ticketPrice,
    maxTickets,
    maxTicketsPerWallet,
    resalePriceCap,
    resaleDeadline,
    { gasLimit: 500000 }
  );
  
  console.log("Transaction hash:", tx.hash);
  console.log("⏳ Waiting for confirmation...");
  
  const receipt = await tx.wait();
  console.log("✅ Confirmed in block:", receipt.blockNumber);
  
  // Get event ID from logs
  let eventId = null;
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === 'EventCreated') {
        eventId = parsed.args.eventId.toString();
        console.log("\n✅ Event created with ID:", eventId);
        break;
      }
    } catch (e) {
      // Skip logs that don't match
    }
  }
  
  if (!eventId) {
    // Fallback: get event count
    const count = await contract.eventCount();
    eventId = count.toString();
    console.log("\n✅ Event created (ID from count):", eventId);
  }
  
  // Read event data to verify
  console.log("\n📋 Event Details:");
  const eventData = await contract.getEvent(eventId);
  console.log("  Event ID:", eventData.eventId.toString());
  console.log("  Organizer:", eventData.organizer);
  console.log("  Tickets Sold:", eventData.ticketsSold.toString(), "/", eventData.maxTickets.toString());
  console.log("  Primary Sale Active:", eventData.primarySaleActive);
  
  const ticketTypes = await contract.getEventTicketTypes(eventId);
  console.log("\n🎟️  Ticket Types:");
  for (let i = 0; i < ticketTypes.length; i++) {
    const tt = ticketTypes[i];
    console.log(`  Type ${i}: ${tt.name}`);
    console.log(`    Price: ${hre.ethers.formatEther(tt.price)} POL`);
    console.log(`    Supply: ${tt.sold}/${tt.maxSupply}`);
    console.log(`    Active: ${tt.active}`);
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("✅ SUCCESS! Event ready for testing");
  console.log("=".repeat(60));
  console.log("\n📝 Next steps:");
  console.log("1. Test free minting with Event ID:", eventId);
  console.log("\n   PowerShell:");
  console.log(`   $body = @{ eventId = ${eventId}; ticketTypeId = 0; buyerAddress = "0xA167fBfD1d0b4eC46b5CddA6ec545f12B92B8a77"; buyerEmail = "test@example.com" } | ConvertTo-Json`);
  console.log(`   Invoke-RestMethod -Uri "https://tivent-chi.vercel.app/api/payment/test-auto-mint" -Method Post -Body $body -ContentType "application/json"`);
  console.log("\n2. Or run: .\\test-auto-mint-endpoint.ps1");
  console.log("   (Update eventId to", eventId, "in test-auto-mint/route.ts)");
  console.log("\n3. View on PolygonScan:");
  console.log("   https://amoy.polygonscan.com/address/" + contractAddress);
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error creating event:");
    console.error(error);
    process.exit(1);
  });

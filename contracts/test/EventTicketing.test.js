const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("EventTicketing", function () {
  let eventTicketing;
  let owner, organizer, buyer1, buyer2, buyer3, gateOfficer;
  
  // Test data
  const EVENT_METADATA_URI = "ipfs://QmTest123";
  const TICKET_METADATA_URI = "ipfs://QmTicket456";
  const TICKET_PRICE = ethers.parseEther("0.1");
  const MAX_TICKETS = 100;
  const MAX_TICKETS_PER_WALLET = 4;
  const RESALE_PRICE_CAP = 11000; // 110%
  const ONE_DAY = 24 * 60 * 60;

  beforeEach(async function () {
    [owner, organizer, buyer1, buyer2, buyer3, gateOfficer] = await ethers.getSigners();

    const EventTicketing = await ethers.getContractFactory("EventTicketing");
    eventTicketing = await EventTicketing.deploy();
    await eventTicketing.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await eventTicketing.owner()).to.equal(owner.address);
    });

    it("Should initialize with zero events and tickets", async function () {
      expect(await eventTicketing.eventCount()).to.equal(0);
      expect(await eventTicketing.ticketCount()).to.equal(0);
    });

    it("Should not be paused initially", async function () {
      expect(await eventTicketing.paused()).to.equal(false);
    });
  });

  describe("Event Creation", function () {
    it("Should create an event with valid parameters", async function () {
      const futureTime = (await time.latest()) + 30 * ONE_DAY;
      
      await expect(
        eventTicketing.connect(organizer).createEvent(
          EVENT_METADATA_URI,
          TICKET_PRICE,
          MAX_TICKETS,
          MAX_TICKETS_PER_WALLET,
          RESALE_PRICE_CAP,
          futureTime
        )
      ).to.emit(eventTicketing, "EventCreated")
        .withArgs(1, organizer.address, EVENT_METADATA_URI, TICKET_PRICE, MAX_TICKETS);

      const event = await eventTicketing.events(1);
      expect(event.organizer).to.equal(organizer.address);
      expect(event.ticketPrice).to.equal(TICKET_PRICE);
      expect(event.maxTickets).to.equal(MAX_TICKETS);
      expect(event.primarySaleActive).to.equal(true);
      expect(event.resaleActive).to.equal(true);
      expect(event.cancelled).to.equal(false);
    });

    it("Should reject event with empty metadata URI", async function () {
      const futureTime = (await time.latest()) + 30 * ONE_DAY;
      
      await expect(
        eventTicketing.connect(organizer).createEvent(
          "",
          TICKET_PRICE,
          MAX_TICKETS,
          MAX_TICKETS_PER_WALLET,
          RESALE_PRICE_CAP,
          futureTime
        )
      ).to.be.revertedWith("Metadata URI required");
    });

    it("Should reject event with zero price", async function () {
      const futureTime = (await time.latest()) + 30 * ONE_DAY;
      
      await expect(
        eventTicketing.connect(organizer).createEvent(
          EVENT_METADATA_URI,
          0,
          MAX_TICKETS,
          MAX_TICKETS_PER_WALLET,
          RESALE_PRICE_CAP,
          futureTime
        )
      ).to.be.revertedWith("Price must be greater than 0");
    });

    it("Should reject resale cap below 100%", async function () {
      const futureTime = (await time.latest()) + 30 * ONE_DAY;
      
      await expect(
        eventTicketing.connect(organizer).createEvent(
          EVENT_METADATA_URI,
          TICKET_PRICE,
          MAX_TICKETS,
          MAX_TICKETS_PER_WALLET,
          9000, // 90%
          futureTime
        )
      ).to.be.revertedWith("Resale cap must be >= 100%");
    });

    it("Should reject resale deadline in the past", async function () {
      const pastTime = (await time.latest()) - ONE_DAY;
      
      await expect(
        eventTicketing.connect(organizer).createEvent(
          EVENT_METADATA_URI,
          TICKET_PRICE,
          MAX_TICKETS,
          MAX_TICKETS_PER_WALLET,
          RESALE_PRICE_CAP,
          pastTime
        )
      ).to.be.revertedWith("Deadline must be in future");
    });
  });

  describe("Ticket Purchase", function () {
    let eventId;

    beforeEach(async function () {
      const futureTime = (await time.latest()) + 30 * ONE_DAY;
      const tx = await eventTicketing.connect(organizer).createEvent(
        EVENT_METADATA_URI,
        TICKET_PRICE,
        MAX_TICKETS,
        MAX_TICKETS_PER_WALLET,
        RESALE_PRICE_CAP,
        futureTime
      );
      await tx.wait();
      eventId = 1;
    });

    it("Should allow ticket purchase with correct payment", async function () {
      await expect(
        eventTicketing.connect(buyer1).buyTicket(
          eventId,
          1, // ticket type
          TICKET_METADATA_URI,
          { value: TICKET_PRICE }
        )
      ).to.emit(eventTicketing, "TicketMinted")
        .withArgs(1, eventId, buyer1.address, TICKET_PRICE);

      expect(await eventTicketing.ownerOf(1)).to.equal(buyer1.address);
      
      const ticket = await eventTicketing.getTicket(1);
      expect(ticket.eventId).to.equal(eventId);
      expect(ticket.redeemed).to.equal(false);
      expect(ticket.active).to.equal(true);
    });

    it("Should transfer payment to organizer", async function () {
      const organizerBalanceBefore = await ethers.provider.getBalance(organizer.address);
      
      await eventTicketing.connect(buyer1).buyTicket(
        eventId,
        1,
        TICKET_METADATA_URI,
        { value: TICKET_PRICE }
      );

      const organizerBalanceAfter = await ethers.provider.getBalance(organizer.address);
      expect(organizerBalanceAfter - organizerBalanceBefore).to.equal(TICKET_PRICE);
    });

    it("Should reject incorrect payment amount", async function () {
      await expect(
        eventTicketing.connect(buyer1).buyTicket(
          eventId,
          1,
          TICKET_METADATA_URI,
          { value: ethers.parseEther("0.05") }
        )
      ).to.be.revertedWith("Incorrect payment amount");
    });

    it("Should enforce purchase limit per wallet", async function () {
      // Buy max allowed tickets
      for (let i = 0; i < MAX_TICKETS_PER_WALLET; i++) {
        await eventTicketing.connect(buyer1).buyTicket(
          eventId,
          1,
          TICKET_METADATA_URI,
          { value: TICKET_PRICE }
        );
      }

      // Try to buy one more
      await expect(
        eventTicketing.connect(buyer1).buyTicket(
          eventId,
          1,
          TICKET_METADATA_URI,
          { value: TICKET_PRICE }
        )
      ).to.be.revertedWith("Purchase limit exceeded");
    });

    it("Should reject purchase when sales are paused", async function () {
      await eventTicketing.connect(organizer).setPrimarySaleActive(eventId, false);

      await expect(
        eventTicketing.connect(buyer1).buyTicket(
          eventId,
          1,
          TICKET_METADATA_URI,
          { value: TICKET_PRICE }
        )
      ).to.be.revertedWith("Primary sale not active");
    });
  });

  describe("Resale Marketplace", function () {
    let eventId, tokenId;

    beforeEach(async function () {
      const futureTime = (await time.latest()) + 30 * ONE_DAY;
      await eventTicketing.connect(organizer).createEvent(
        EVENT_METADATA_URI,
        TICKET_PRICE,
        MAX_TICKETS,
        MAX_TICKETS_PER_WALLET,
        RESALE_PRICE_CAP,
        futureTime
      );
      eventId = 1;

      await eventTicketing.connect(buyer1).buyTicket(
        eventId,
        1,
        TICKET_METADATA_URI,
        { value: TICKET_PRICE }
      );
      tokenId = 1;
    });

    it("Should allow owner to list ticket for resale", async function () {
      const resalePrice = ethers.parseEther("0.105"); // 5% markup

      await expect(
        eventTicketing.connect(buyer1).listForResale(tokenId, resalePrice)
      ).to.emit(eventTicketing, "TicketListed")
        .withArgs(tokenId, buyer1.address, resalePrice);

      const listing = await eventTicketing.getListing(tokenId);
      expect(listing.active).to.equal(true);
      expect(listing.seller).to.equal(buyer1.address);
      expect(listing.price).to.equal(resalePrice);
    });

    it("Should reject listing above price cap", async function () {
      const tooHighPrice = ethers.parseEther("0.15"); // 50% markup

      await expect(
        eventTicketing.connect(buyer1).listForResale(tokenId, tooHighPrice)
      ).to.be.revertedWith("Price exceeds cap");
    });

    it("Should reject listing from non-owner", async function () {
      const resalePrice = ethers.parseEther("0.105");

      await expect(
        eventTicketing.connect(buyer2).listForResale(tokenId, resalePrice)
      ).to.be.revertedWith("Not ticket owner");
    });

    it("Should allow seller to cancel listing", async function () {
      const resalePrice = ethers.parseEther("0.105");
      await eventTicketing.connect(buyer1).listForResale(tokenId, resalePrice);

      await expect(
        eventTicketing.connect(buyer1).cancelResale(tokenId)
      ).to.emit(eventTicketing, "TicketDelisted")
        .withArgs(tokenId);

      const listing = await eventTicketing.getListing(tokenId);
      expect(listing.active).to.equal(false);
    });

    it("Should complete atomic resale transaction", async function () {
      const resalePrice = ethers.parseEther("0.105");
      await eventTicketing.connect(buyer1).listForResale(tokenId, resalePrice);

      const seller1BalanceBefore = await ethers.provider.getBalance(buyer1.address);

      await expect(
        eventTicketing.connect(buyer2).buyResale(tokenId, { value: resalePrice })
      ).to.emit(eventTicketing, "TicketResold")
        .withArgs(tokenId, buyer1.address, buyer2.address, resalePrice);

      // Verify ownership transferred
      expect(await eventTicketing.ownerOf(tokenId)).to.equal(buyer2.address);

      // Verify payment transferred
      const seller1BalanceAfter = await ethers.provider.getBalance(buyer1.address);
      expect(seller1BalanceAfter - seller1BalanceBefore).to.equal(resalePrice);

      // Verify listing closed
      const listing = await eventTicketing.getListing(tokenId);
      expect(listing.active).to.equal(false);

      // Verify resale count incremented
      const ticket = await eventTicketing.getTicket(tokenId);
      expect(ticket.resaleCount).to.equal(1);
    });

    it("Should enforce resale deadline", async function () {
      const resalePrice = ethers.parseEther("0.105");
      await eventTicketing.connect(buyer1).listForResale(tokenId, resalePrice);

      // Fast forward past deadline
      await time.increase(31 * ONE_DAY);

      await expect(
        eventTicketing.connect(buyer2).buyResale(tokenId, { value: resalePrice })
      ).to.be.revertedWith("Resale deadline passed");
    });

    it("Should enforce max resale count", async function () {
      const resalePrice = ethers.parseEther("0.105");

      // Resell maximum times (3)
      for (let i = 0; i < 3; i++) {
        const currentOwner = i === 0 ? buyer1 : (i === 1 ? buyer2 : buyer3);
        const nextBuyer = i === 0 ? buyer2 : (i === 1 ? buyer3 : buyer1);

        await eventTicketing.connect(currentOwner).listForResale(tokenId, resalePrice);
        await eventTicketing.connect(nextBuyer).buyResale(tokenId, { value: resalePrice });
      }

      // Try to list again (should fail)
      await expect(
        eventTicketing.connect(buyer1).listForResale(tokenId, resalePrice)
      ).to.be.revertedWith("Max resale count reached");
    });
  });

  describe("Ticket Redemption", function () {
    let eventId, tokenId;

    beforeEach(async function () {
      const futureTime = (await time.latest()) + 30 * ONE_DAY;
      await eventTicketing.connect(organizer).createEvent(
        EVENT_METADATA_URI,
        TICKET_PRICE,
        MAX_TICKETS,
        MAX_TICKETS_PER_WALLET,
        RESALE_PRICE_CAP,
        futureTime
      );
      eventId = 1;

      await eventTicketing.connect(buyer1).buyTicket(
        eventId,
        1,
        TICKET_METADATA_URI,
        { value: TICKET_PRICE }
      );
      tokenId = 1;

      // Add gate officer
      await eventTicketing.connect(owner).addGateOfficer(gateOfficer.address);
    });

    it("Should allow gate officer to redeem ticket", async function () {
      await expect(
        eventTicketing.connect(gateOfficer).redeemTicket(tokenId, buyer1.address)
      ).to.emit(eventTicketing, "TicketRedeemed")
        .withArgs(tokenId, buyer1.address, eventId);

      const ticket = await eventTicketing.getTicket(tokenId);
      expect(ticket.redeemed).to.equal(true);
    });

    it("Should prevent double redemption", async function () {
      await eventTicketing.connect(gateOfficer).redeemTicket(tokenId, buyer1.address);

      await expect(
        eventTicketing.connect(gateOfficer).redeemTicket(tokenId, buyer1.address)
      ).to.be.revertedWith("Ticket already redeemed");
    });

    it("Should reject redemption from non-gate officer", async function () {
      await expect(
        eventTicketing.connect(buyer2).redeemTicket(tokenId, buyer1.address)
      ).to.be.revertedWith("Not authorized gate officer");
    });

    it("Should reject redemption with wrong holder", async function () {
      await expect(
        eventTicketing.connect(gateOfficer).redeemTicket(tokenId, buyer2.address)
      ).to.be.revertedWith("Holder mismatch");
    });

    it("Should mark ticket as invalid after redemption", async function () {
      expect(await eventTicketing.isTicketValid(tokenId)).to.equal(true);

      await eventTicketing.connect(gateOfficer).redeemTicket(tokenId, buyer1.address);

      expect(await eventTicketing.isTicketValid(tokenId)).to.equal(false);
    });
  });

  describe("Event Cancellation and Refunds", function () {
    let eventId, tokenId1, tokenId2;

    beforeEach(async function () {
      const futureTime = (await time.latest()) + 30 * ONE_DAY;
      await eventTicketing.connect(organizer).createEvent(
        EVENT_METADATA_URI,
        TICKET_PRICE,
        MAX_TICKETS,
        MAX_TICKETS_PER_WALLET,
        RESALE_PRICE_CAP,
        futureTime
      );
      eventId = 1;

      await eventTicketing.connect(buyer1).buyTicket(
        eventId,
        1,
        TICKET_METADATA_URI,
        { value: TICKET_PRICE }
      );
      tokenId1 = 1;

      await eventTicketing.connect(buyer2).buyTicket(
        eventId,
        1,
        TICKET_METADATA_URI,
        { value: TICKET_PRICE }
      );
      tokenId2 = 2;
    });

    it("Should allow organizer to cancel event", async function () {
      await expect(
        eventTicketing.connect(organizer).cancelEvent(eventId)
      ).to.emit(eventTicketing, "EventCancelled")
        .withArgs(eventId, organizer.address);

      const event = await eventTicketing.events(eventId);
      expect(event.cancelled).to.equal(true);
      expect(event.primarySaleActive).to.equal(false);
      expect(event.resaleActive).to.equal(false);
    });

    it("Should reject cancellation from non-organizer", async function () {
      await expect(
        eventTicketing.connect(buyer1).cancelEvent(eventId)
      ).to.be.revertedWith("Not event organizer");
    });

    it("Should allow refund claim after cancellation", async function () {
      await eventTicketing.connect(organizer).cancelEvent(eventId);

      // Organizer deposits refund funds
      await eventTicketing.connect(organizer).depositRefundFunds(eventId, {
        value: TICKET_PRICE * 2n
      });

      const buyer1BalanceBefore = await ethers.provider.getBalance(buyer1.address);

      await expect(
        eventTicketing.connect(buyer1).claimRefund(tokenId1)
      ).to.emit(eventTicketing, "RefundClaimed")
        .withArgs(tokenId1, buyer1.address, TICKET_PRICE);

      const buyer1BalanceAfter = await ethers.provider.getBalance(buyer1.address);
      
      // Balance increase should be close to TICKET_PRICE (minus gas)
      const balanceIncrease = buyer1BalanceAfter - buyer1BalanceBefore;
      expect(balanceIncrease).to.be.closeTo(TICKET_PRICE, ethers.parseEther("0.001"));
    });

    it("Should prevent double refund", async function () {
      await eventTicketing.connect(organizer).cancelEvent(eventId);
      
      await eventTicketing.connect(organizer).depositRefundFunds(eventId, {
        value: TICKET_PRICE * 2n
      });

      await eventTicketing.connect(buyer1).claimRefund(tokenId1);

      await expect(
        eventTicketing.connect(buyer1).claimRefund(tokenId1)
      ).to.be.revertedWith("Ticket not active");
    });

    it("Should reject refund claim for non-cancelled event", async function () {
      await expect(
        eventTicketing.connect(buyer1).claimRefund(tokenId1)
      ).to.be.revertedWith("Event not cancelled");
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to add gate officer", async function () {
      await expect(
        eventTicketing.connect(owner).addGateOfficer(gateOfficer.address)
      ).to.emit(eventTicketing, "GateOfficerAdded")
        .withArgs(gateOfficer.address);

      expect(await eventTicketing.gateOfficers(gateOfficer.address)).to.equal(true);
    });

    it("Should reject non-owner adding gate officer", async function () {
      await expect(
        eventTicketing.connect(buyer1).addGateOfficer(gateOfficer.address)
      ).to.be.revertedWithCustomError(eventTicketing, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to pause contract", async function () {
      await eventTicketing.connect(owner).pause();
      expect(await eventTicketing.paused()).to.equal(true);
    });

    it("Should prevent actions when paused", async function () {
      await eventTicketing.connect(owner).pause();

      const futureTime = (await time.latest()) + 30 * ONE_DAY;
      
      await expect(
        eventTicketing.connect(organizer).createEvent(
          EVENT_METADATA_URI,
          TICKET_PRICE,
          MAX_TICKETS,
          MAX_TICKETS_PER_WALLET,
          RESALE_PRICE_CAP,
          futureTime
        )
      ).to.be.revertedWithCustomError(eventTicketing, "EnforcedPause");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle sold out event", async function () {
      const futureTime = (await time.latest()) + 30 * ONE_DAY;
      await eventTicketing.connect(organizer).createEvent(
        EVENT_METADATA_URI,
        TICKET_PRICE,
        2, // Only 2 tickets
        2,
        RESALE_PRICE_CAP,
        futureTime
      );
      const eventId = 1;

      // Buy all tickets
      await eventTicketing.connect(buyer1).buyTicket(eventId, 1, TICKET_METADATA_URI, {
        value: TICKET_PRICE
      });
      await eventTicketing.connect(buyer2).buyTicket(eventId, 1, TICKET_METADATA_URI, {
        value: TICKET_PRICE
      });

      // Try to buy when sold out
      await expect(
        eventTicketing.connect(buyer3).buyTicket(eventId, 1, TICKET_METADATA_URI, {
          value: TICKET_PRICE
        })
      ).to.be.revertedWith("Sold out");
    });

    it("Should prevent buying own ticket on resale", async function () {
      const futureTime = (await time.latest()) + 30 * ONE_DAY;
      await eventTicketing.connect(organizer).createEvent(
        EVENT_METADATA_URI,
        TICKET_PRICE,
        MAX_TICKETS,
        MAX_TICKETS_PER_WALLET,
        RESALE_PRICE_CAP,
        futureTime
      );

      await eventTicketing.connect(buyer1).buyTicket(1, 1, TICKET_METADATA_URI, {
        value: TICKET_PRICE
      });

      const resalePrice = ethers.parseEther("0.105");
      await eventTicketing.connect(buyer1).listForResale(1, resalePrice);

      await expect(
        eventTicketing.connect(buyer1).buyResale(1, { value: resalePrice })
      ).to.be.revertedWith("Cannot buy own ticket");
    });
  });
});

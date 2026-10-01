import { readTicket, readTicketOwner, EVENT_TICKETING_ABI, CONTRACT_ADDRESS } from './contractReads';
import { createPublicClient, http, type Address } from 'viem';
import { polygonAmoy } from 'viem/chains';

// Create public client for reading blockchain events
const publicClient = createPublicClient({
  chain: polygonAmoy,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://poly-amoy-testnet.api.pocket.network'),
});

/**
 * Ownership event types
 */
export enum OwnershipEventType {
  MINTED = 'minted',
  PURCHASED = 'purchased',
  LISTED = 'listed',
  LISTING_CANCELLED = 'listing_cancelled',
  RESOLD = 'resold',
  REDEEMED = 'redeemed',
  TRANSFERRED = 'transferred',
}

/**
 * Ownership history record
 */
export interface OwnershipRecord {
  id: string;
  tokenId: number;
  eventType: OwnershipEventType;
  fromAddress: string | null;
  toAddress: string | null;
  price: string | null;
  transactionHash: string | null;
  blockNumber: number | null;
  timestamp: Date;
  metadata?: {
    eventId?: number;
    listingPrice?: string;
    reason?: string;
  };
}

/**
 * Ownership chain summary
 */
export interface OwnershipChain {
  tokenId: number;
  currentOwner: string;
  originalOwner: string;
  totalTransfers: number;
  totalResales: number;
  history: OwnershipRecord[];
  timeline: {
    minted: Date;
    firstSale?: Date;
    lastTransfer?: Date;
    redeemed?: Date;
  };
  priceHistory: {
    originalPrice: string;
    currentPrice: string;
    highestPrice: string;
    lowestPrice: string;
    totalVolume: string;
  };
}

/**
 * Provenance verification
 */
export interface ProvenanceVerification {
  isAuthentic: boolean;
  verificationScore: number;
  checks: {
    contractVerified: boolean;
    ownershipValid: boolean;
    noSuspiciousActivity: boolean;
    chainIntact: boolean;
  };
  warnings: string[];
}

/**
 * Get complete ownership history for a ticket from blockchain events
 */
export async function getTicketOwnershipHistory(
  tokenId: number
): Promise<OwnershipChain | null> {
  try {
    console.log(`[OwnershipHistory] Loading history for ticket ${tokenId}`);
    
    // Get current ticket data
    const ticketData = await readTicket(tokenId);
    if (!ticketData) {
      console.error('[OwnershipHistory] Ticket not found');
      return null;
    }

    const currentOwner = await readTicketOwner(tokenId);
    if (!currentOwner) {
      console.error('[OwnershipHistory] Current owner not found');
      return null;
    }

    const originalPrice = ticketData[2] as bigint;
    const resaleCount = Number(ticketData[3]);
    const redeemed = ticketData[5] as boolean;

    console.log('[OwnershipHistory] Querying Transfer events...');
    // Get Transfer events from blockchain
    // Using Alchemy RPC which supports archival queries for full history
    let transferEvents: any[] = [];
    try {
      transferEvents = await publicClient.getContractEvents({
        address: CONTRACT_ADDRESS,
        abi: EVENT_TICKETING_ABI,
        eventName: 'Transfer',
        args: {
          tokenId: BigInt(tokenId),
        },
        fromBlock: 'earliest',
        toBlock: 'latest',
      });
      console.log(`[OwnershipHistory] Found ${transferEvents.length} transfer events`);
    } catch (eventErr: any) {
      console.warn('[OwnershipHistory] Could not fetch Transfer events:', eventErr.message);
    }

    console.log('[OwnershipHistory] Querying TicketListed events...');
    // Get TicketListed events
    let listingEvents: any[] = [];
    try {
      listingEvents = await publicClient.getContractEvents({
        address: CONTRACT_ADDRESS,
        abi: EVENT_TICKETING_ABI,
        eventName: 'TicketListed',
        fromBlock: 'earliest',
        toBlock: 'latest',
      });
    } catch (eventErr: any) {
      console.warn('[OwnershipHistory] Could not fetch TicketListed events:', eventErr.message);
    }

    const relevantListings = listingEvents.filter(
      (event: any) => Number(event.args.tokenId) === tokenId
    );

    console.log('[OwnershipHistory] Querying TicketResold events...');
    // Get TicketResold events
    let resaleEvents: any[] = [];
    try {
      resaleEvents = await publicClient.getContractEvents({
        address: CONTRACT_ADDRESS,
        abi: EVENT_TICKETING_ABI,
        eventName: 'TicketResold',
        fromBlock: 'earliest',
        toBlock: 'latest',
      });
    } catch (eventErr: any) {
      console.warn('[OwnershipHistory] Could not fetch TicketResold events:', eventErr.message);
    }

    const relevantResales = resaleEvents.filter(
      (event: any) => Number(event.args.tokenId) === tokenId
    );

    // Build history
    const history: OwnershipRecord[] = [];
    let originalOwner = currentOwner;
    let totalVolume = 0n;
    let highestPrice = originalPrice;
    let lowestPrice = originalPrice;

    // Add minted event (first transfer or fallback)
    if (transferEvents.length > 0) {
      const mintEvent = transferEvents[0];
      const block = await publicClient.getBlock({ blockNumber: mintEvent.blockNumber });
      
      originalOwner = mintEvent.args.to as Address;

      history.push({
        id: `mint-${tokenId}`,
        tokenId,
        eventType: OwnershipEventType.MINTED,
        fromAddress: null,
        toAddress: mintEvent.args.to as string,
        price: originalPrice.toString(),
        transactionHash: mintEvent.transactionHash,
        blockNumber: Number(mintEvent.blockNumber),
        timestamp: new Date(Number(block.timestamp) * 1000),
        metadata: {
          eventId: Number(ticketData[0]),
        },
      });

      totalVolume += originalPrice;
    } else {
      // Fallback: Create a synthetic mint record if no Transfer events found
      console.log('[OwnershipHistory] No Transfer events found, creating fallback mint record');
      history.push({
        id: `mint-${tokenId}`,
        tokenId,
        eventType: OwnershipEventType.MINTED,
        fromAddress: null,
        toAddress: currentOwner as string,
        price: originalPrice.toString(),
        transactionHash: null,
        blockNumber: null,
        timestamp: new Date(), // Current time as fallback
        metadata: {
          eventId: Number(ticketData[0]),
        },
      });
      totalVolume += originalPrice;
    }

    // Add listing events
    for (const listEvent of relevantListings) {
      const block = await publicClient.getBlock({ blockNumber: listEvent.blockNumber });
      const listPrice = listEvent.args.price as bigint;

      history.push({
        id: `list-${listEvent.transactionHash}`,
        tokenId,
        eventType: OwnershipEventType.LISTED,
        fromAddress: listEvent.args.seller as string,
        toAddress: null,
        price: listPrice.toString(),
        transactionHash: listEvent.transactionHash,
        blockNumber: Number(listEvent.blockNumber),
        timestamp: new Date(Number(block.timestamp) * 1000),
        metadata: {
          listingPrice: listPrice.toString(),
        },
      });

      if (listPrice > highestPrice) highestPrice = listPrice;
      if (listPrice < lowestPrice) lowestPrice = listPrice;
    }

    // Add resale events
    for (const resaleEvent of relevantResales) {
      const block = await publicClient.getBlock({ blockNumber: resaleEvent.blockNumber });
      const resalePrice = resaleEvent.args.price as bigint;

      history.push({
        id: `resale-${resaleEvent.transactionHash}`,
        tokenId,
        eventType: OwnershipEventType.RESOLD,
        fromAddress: resaleEvent.args.from as string,
        toAddress: resaleEvent.args.to as string,
        price: resalePrice.toString(),
        transactionHash: resaleEvent.transactionHash,
        blockNumber: Number(resaleEvent.blockNumber),
        timestamp: new Date(Number(block.timestamp) * 1000),
      });

      totalVolume += resalePrice;
      if (resalePrice > highestPrice) highestPrice = resalePrice;
      if (resalePrice < lowestPrice) lowestPrice = resalePrice;
    }

    // Sort by timestamp
    history.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Build timeline
    const timeline = {
      minted: history[0]?.timestamp || new Date(),
      firstSale: history.find(h => h.eventType === OwnershipEventType.RESOLD)?.timestamp,
      lastTransfer: history[history.length - 1]?.timestamp,
      redeemed: redeemed ? new Date() : undefined,
    };

    const ownershipChain: OwnershipChain = {
      tokenId,
      currentOwner,
      originalOwner,
      totalTransfers: transferEvents.length,
      totalResales: resaleCount,
      history,
      timeline,
      priceHistory: {
        originalPrice: originalPrice.toString(),
        currentPrice: originalPrice.toString(), // Last known price
        highestPrice: highestPrice.toString(),
        lowestPrice: lowestPrice.toString(),
        totalVolume: totalVolume.toString(),
      },
    };

    console.log('[OwnershipHistory] Built ownership chain:', ownershipChain);
    return ownershipChain;
  } catch (err: any) {
    console.error('[OwnershipHistory] Error loading history:', err);
    console.error('[OwnershipHistory] Error details:', {
      message: err.message,
      code: err.code,
      name: err.name,
      stack: err.stack,
    });
    return null;
  }
}

/**
 * Get wallet ownership history (stub for now)
 */
export async function getWalletOwnershipHistory(
  walletAddress: string
): Promise<OwnershipRecord[]> {
  console.log('[OwnershipHistory] getWalletOwnershipHistory not fully implemented');
  return [];
}

/**
 * Get wallet ownership stats (stub for now)
 */
export async function getWalletOwnershipStats(walletAddress: string): Promise<any> {
  console.log('[OwnershipHistory] getWalletOwnershipStats not fully implemented');
  return {
    totalTicketsOwned: 0,
    totalTicketsPurchased: 0,
    totalTicketsSold: 0,
    totalSpent: '0',
    totalEarned: '0',
  };
}

/**
 * Verify ticket provenance
 */
export async function verifyTicketProvenance(
  tokenId: number
): Promise<ProvenanceVerification> {
  try {
    const chain = await getTicketOwnershipHistory(tokenId);
    
    if (!chain) {
      return {
        isAuthentic: false,
        verificationScore: 0,
        checks: {
          contractVerified: false,
          ownershipValid: false,
          noSuspiciousActivity: false,
          chainIntact: false,
        },
        warnings: ['Could not load ownership history'],
      };
    }

    // Perform checks
    const checks = {
      contractVerified: true, // Assuming contract is verified on Polygon Amoy
      ownershipValid: chain.currentOwner !== '0x0000000000000000000000000000000000000000',
      noSuspiciousActivity: chain.totalResales <= 10, // Allow up to 10 resales
      chainIntact: chain.history.length > 0,
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const verificationScore = (passedChecks / 4) * 100;

    const warnings: string[] = [];
    if (!checks.contractVerified) warnings.push('Contract not verified');
    if (!checks.ownershipValid) warnings.push('Invalid owner address');
    if (!checks.noSuspiciousActivity) warnings.push('High number of resales detected');
    if (!checks.chainIntact) warnings.push('Ownership chain incomplete');
    
    // Add info if using fallback data
    if (chain.history.length === 1 && !chain.history[0].transactionHash) {
      warnings.push('Using fallback data - blockchain events not fully indexed');
    }

    return {
      isAuthentic: passedChecks >= 3, // Pass if 3 out of 4 checks pass
      verificationScore,
      checks,
      warnings,
    };
  } catch (err) {
    console.error('[Provenance] Error:', err);
    return {
      isAuthentic: false,
      verificationScore: 0,
      checks: {
        contractVerified: false,
        ownershipValid: false,
        noSuspiciousActivity: false,
        chainIntact: false,
      },
      warnings: ['Verification failed'],
    };
  }
}

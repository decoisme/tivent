import { supabase } from './supabase';

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
 * Get complete ownership history for a ticket
 */
export async function getTicketOwnershipHistory(
  tokenId: number
): Promise<OwnershipChain | null> {
  try {
    // Get ticket metadata
    const { data: ticket, error: ticketError } = await supabase
      .from('ticket_metadata')
      .select('*')
      .eq('token_id', tokenId)
      .single();

    if (ticketError || !ticket) {
      console.error('Error loading ticket:', ticketError);
      return null;
    }

    // Get all blockchain transactions for this ticket
    const { data: transactions, error: txError } = await supabase
      .from('blockchain_transactions')
      .select('*')
      .or(`metadata->>tokenId.eq.${tokenId}`)
      .order('timestamp', { ascending: true });

    // Get resale history
    const { data: resales, error: resaleError } = await supabase
      .from('resale_listings')
      .select('*')
      .eq('token_id', tokenId)
      .order('listed_at', { ascending: true });

    // Build ownership history
    const history: OwnershipRecord[] = [];

    // 1. Minted event (original purchase)
    const mintTx = transactions?.find(
      (tx) => tx.transaction_type === 'ticket_purchase'
    );
    if (mintTx) {
      history.push({
        id: mintTx.id,
        tokenId,
        eventType: OwnershipEventType.MINTED,
        fromAddress: null,
        toAddress: ticket.original_owner,
        price: ticket.original_price,
        transactionHash: mintTx.transaction_hash,
        blockNumber: mintTx.block_number,
        timestamp: new Date(mintTx.timestamp),
        metadata: {
          eventId: ticket.event_id,
        },
      });
    }

    // 2. Listing events
    if (resales) {
      for (const resale of resales) {
        history.push({
          id: resale.id,
          tokenId,
          eventType: OwnershipEventType.LISTED,
          fromAddress: resale.seller_address,
          toAddress: null,
          price: resale.price,
          transactionHash: null,
          blockNumber: null,
          timestamp: new Date(resale.listed_at),
          metadata: {
            listingPrice: resale.price,
          },
        });

        // Cancelled listing
        if (!resale.is_active && resale.cancelled_at) {
          history.push({
            id: `${resale.id}-cancel`,
            tokenId,
            eventType: OwnershipEventType.LISTING_CANCELLED,
            fromAddress: resale.seller_address,
            toAddress: null,
            price: null,
            transactionHash: null,
            blockNumber: null,
            timestamp: new Date(resale.cancelled_at),
          });
        }

        // Resold
        if (!resale.is_active && resale.sold_at && resale.buyer_address) {
          const resaleTx = transactions?.find(
            (tx) =>
              tx.transaction_type === 'ticket_resale' &&
              new Date(tx.timestamp).getTime() ===
                new Date(resale.sold_at!).getTime()
          );

          history.push({
            id: `${resale.id}-sold`,
            tokenId,
            eventType: OwnershipEventType.RESOLD,
            fromAddress: resale.seller_address,
            toAddress: resale.buyer_address,
            price: resale.price,
            transactionHash: resaleTx?.transaction_hash || null,
            blockNumber: resaleTx?.block_number || null,
            timestamp: new Date(resale.sold_at),
          });
        }
      }
    }

    // 3. Redemption event
    if (ticket.is_redeemed && ticket.redeemed_at) {
      history.push({
        id: `${tokenId}-redeemed`,
        tokenId,
        eventType: OwnershipEventType.REDEEMED,
        fromAddress: ticket.current_owner,
        toAddress: null,
        price: null,
        transactionHash: null,
        blockNumber: null,
        timestamp: new Date(ticket.redeemed_at),
        metadata: {
          reason: 'Ticket used for event entry',
        },
      });
    }

    // Sort history by timestamp
    history.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Calculate statistics
    const transfers = history.filter(
      (h) =>
        h.eventType === OwnershipEventType.RESOLD ||
        h.eventType === OwnershipEventType.TRANSFERRED
    );
    const resaleEvents = history.filter(
      (h) => h.eventType === OwnershipEventType.RESOLD
    );

    const prices = history
      .filter((h) => h.price)
      .map((h) => BigInt(h.price!));

    const timeline = {
      minted: history[0]?.timestamp || new Date(),
      firstSale: resaleEvents[0]?.timestamp,
      lastTransfer:
        transfers.length > 0
          ? transfers[transfers.length - 1].timestamp
          : undefined,
      redeemed: ticket.is_redeemed ? new Date(ticket.redeemed_at!) : undefined,
    };

    const priceHistory = {
      originalPrice: ticket.original_price,
      currentPrice: ticket.current_price,
      highestPrice: prices.length > 0 ? prices.reduce((a, b) => (a > b ? a : b)).toString() : ticket.original_price,
      lowestPrice: prices.length > 0 ? prices.reduce((a, b) => (a < b ? a : b)).toString() : ticket.original_price,
      totalVolume: prices.reduce((sum, p) => sum + p, 0n).toString(),
    };

    return {
      tokenId,
      currentOwner: ticket.current_owner,
      originalOwner: ticket.original_owner,
      totalTransfers: transfers.length,
      totalResales: resaleEvents.length,
      history,
      timeline,
      priceHistory,
    };
  } catch (error) {
    console.error('Error getting ownership history:', error);
    return null;
  }
}

/**
 * Get ownership history for a wallet address
 */
export async function getWalletOwnershipHistory(
  walletAddress: string
): Promise<OwnershipRecord[]> {
  try {
    const { data: tickets, error } = await supabase
      .from('ticket_metadata')
      .select('token_id')
      .or(
        `current_owner.eq.${walletAddress.toLowerCase()},original_owner.eq.${walletAddress.toLowerCase()}`
      );

    if (error || !tickets) {
      return [];
    }

    const allHistory: OwnershipRecord[] = [];

    for (const ticket of tickets) {
      const chain = await getTicketOwnershipHistory(ticket.token_id);
      if (chain) {
        // Filter history to only include events involving this wallet
        const relevantHistory = chain.history.filter(
          (h) =>
            h.fromAddress?.toLowerCase() === walletAddress.toLowerCase() ||
            h.toAddress?.toLowerCase() === walletAddress.toLowerCase()
        );
        allHistory.push(...relevantHistory);
      }
    }

    // Sort by timestamp descending
    return allHistory.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  } catch (error) {
    console.error('Error getting wallet ownership history:', error);
    return [];
  }
}

/**
 * Get ownership statistics for a wallet
 */
export async function getWalletOwnershipStats(walletAddress: string) {
  try {
    const history = await getWalletOwnershipHistory(walletAddress);

    const purchases = history.filter(
      (h) =>
        (h.eventType === OwnershipEventType.MINTED ||
          h.eventType === OwnershipEventType.RESOLD) &&
        h.toAddress?.toLowerCase() === walletAddress.toLowerCase()
    );

    const sales = history.filter(
      (h) =>
        h.eventType === OwnershipEventType.RESOLD &&
        h.fromAddress?.toLowerCase() === walletAddress.toLowerCase()
    );

    const listings = history.filter(
      (h) =>
        h.eventType === OwnershipEventType.LISTED &&
        h.fromAddress?.toLowerCase() === walletAddress.toLowerCase()
    );

    const redemptions = history.filter(
      (h) =>
        h.eventType === OwnershipEventType.REDEEMED &&
        h.fromAddress?.toLowerCase() === walletAddress.toLowerCase()
    );

    const totalSpent = purchases
      .filter((h) => h.price)
      .reduce((sum, h) => sum + BigInt(h.price!), 0n);

    const totalEarned = sales
      .filter((h) => h.price)
      .reduce((sum, h) => sum + BigInt(h.price!), 0n);

    return {
      totalPurchases: purchases.length,
      totalSales: sales.length,
      totalListings: listings.length,
      totalRedemptions: redemptions.length,
      totalSpent: totalSpent.toString(),
      totalEarned: totalEarned.toString(),
      netPosition: (totalEarned - totalSpent).toString(),
      firstActivity: history[history.length - 1]?.timestamp,
      lastActivity: history[0]?.timestamp,
    };
  } catch (error) {
    console.error('Error getting wallet ownership stats:', error);
    return null;
  }
}

/**
 * Get provenance verification for a ticket
 */
export interface ProvenanceVerification {
  isVerified: boolean;
  tokenId: number;
  currentOwner: string;
  originalOwner: string;
  mintDate: Date;
  transferCount: number;
  lastVerified: Date;
  chainOfCustody: {
    owner: string;
    from: Date;
    to: Date | null;
    verified: boolean;
  }[];
}

export async function verifyTicketProvenance(
  tokenId: number
): Promise<ProvenanceVerification | null> {
  try {
    const chain = await getTicketOwnershipHistory(tokenId);
    if (!chain) return null;

    // Build chain of custody
    const custody: ProvenanceVerification['chainOfCustody'] = [];
    let currentOwner = chain.originalOwner;
    let currentStart = chain.timeline.minted;

    for (const event of chain.history) {
      if (
        event.eventType === OwnershipEventType.RESOLD &&
        event.toAddress
      ) {
        // Close previous custody period
        custody.push({
          owner: currentOwner,
          from: currentStart,
          to: event.timestamp,
          verified: true,
        });

        // Start new custody period
        currentOwner = event.toAddress;
        currentStart = event.timestamp;
      }
    }

    // Add current custody period
    custody.push({
      owner: currentOwner,
      from: currentStart,
      to: null,
      verified: true,
    });

    return {
      isVerified: true,
      tokenId,
      currentOwner: chain.currentOwner,
      originalOwner: chain.originalOwner,
      mintDate: chain.timeline.minted,
      transferCount: chain.totalTransfers,
      lastVerified: new Date(),
      chainOfCustody: custody,
    };
  } catch (error) {
    console.error('Error verifying provenance:', error);
    return null;
  }
}

/**
 * Export ownership history to CSV
 */
export function exportOwnershipHistoryToCSV(chain: OwnershipChain): string {
  const headers = [
    'Timestamp',
    'Event Type',
    'From Address',
    'To Address',
    'Price (ETH)',
    'Transaction Hash',
  ];

  const rows = chain.history.map((record) => [
    record.timestamp.toISOString(),
    record.eventType,
    record.fromAddress || 'N/A',
    record.toAddress || 'N/A',
    record.price || 'N/A',
    record.transactionHash || 'N/A',
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csv;
}

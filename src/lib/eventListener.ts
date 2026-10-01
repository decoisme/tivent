import { createPublicClient, http, parseAbiItem, type Address, type Log, decodeEventLog, getEventSelector } from 'viem';
import { polygonAmoy } from 'viem/chains';
import { supabase } from './supabase';

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '') as Address;
const chain = polygonAmoy;

const publicClient = createPublicClient({
  chain,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://poly-amoy-testnet.api.pocket.network'),
});

/**
 * Event signatures from the smart contract
 */
const EVENT_CREATED = parseAbiItem('event EventCreated(uint256 indexed eventId, address indexed organizer, string metadataURI, uint256 ticketPrice, uint256 maxTickets)');
const TICKET_PURCHASED = parseAbiItem('event TicketPurchased(uint256 indexed tokenId, uint256 indexed eventId, address indexed buyer, uint256 price)');
const TICKET_LISTED = parseAbiItem('event TicketListedForResale(uint256 indexed tokenId, address indexed seller, uint256 price)');
const RESALE_CANCELLED = parseAbiItem('event ResaleCancelled(uint256 indexed tokenId)');
const TICKET_RESOLD = parseAbiItem('event TicketResold(uint256 indexed tokenId, address indexed from, address indexed to, uint256 price)');
const TICKET_REDEEMED = parseAbiItem('event TicketRedeemed(uint256 indexed tokenId, address indexed holder, address indexed gateOfficer)');
const EVENT_CANCELLED = parseAbiItem('event EventCancelled(uint256 indexed eventId)');

// Compute event selectors for comparison
const EVENT_CREATED_SIG = getEventSelector(EVENT_CREATED);
const TICKET_PURCHASED_SIG = getEventSelector(TICKET_PURCHASED);
const TICKET_LISTED_SIG = getEventSelector(TICKET_LISTED);
const RESALE_CANCELLED_SIG = getEventSelector(RESALE_CANCELLED);
const TICKET_RESOLD_SIG = getEventSelector(TICKET_RESOLD);
const TICKET_REDEEMED_SIG = getEventSelector(TICKET_REDEEMED);
const EVENT_CANCELLED_SIG = getEventSelector(EVENT_CANCELLED);

/**
 * Process EventCreated event
 */
async function processEventCreated(log: any) {
  try {
    const decoded = decodeEventLog({
      abi: [EVENT_CREATED],
      data: log.data,
      topics: log.topics,
    });

    const { eventId, organizer, metadataURI, ticketPrice, maxTickets } = decoded.args;
    
    console.log(`Processing EventCreated: #${eventId}`);

    // Insert/update event in database
    const { error } = await supabase
      .from('events')
      .upsert({
        event_id: Number(eventId),
        organizer_address: organizer.toLowerCase(),
        metadata_uri: metadataURI,
        ticket_price: ticketPrice.toString(),
        max_tickets: Number(maxTickets),
        tickets_sold: 0,
        is_active: true,
        is_cancelled: false,
        blockchain_created_at: new Date().toISOString(),
      }, {
        onConflict: 'event_id',
      });

    if (error) {
      console.error('Error inserting event:', error);
      return;
    }

    // Record transaction
    await recordTransaction(log, 'event_created', organizer);
    
    console.log(`✓ Event #${eventId} synced to database`);
  } catch (error) {
    console.error('Error processing EventCreated:', error);
  }
}

/**
 * Process TicketPurchased event
 */
async function processTicketPurchased(log: Log) {
  try {
    const decoded = decodeEventLog({
      abi: [TICKET_PURCHASED],
      data: log.data,
      topics: log.topics,
    });
    const { tokenId, eventId, buyer, price } = decoded.args;
    
    console.log(`Processing TicketPurchased: Token #${tokenId}`);

    // Insert ticket metadata
    const { error: ticketError } = await supabase
      .from('ticket_metadata')
      .upsert({
        token_id: Number(tokenId),
        event_id: Number(eventId),
        current_owner: buyer.toLowerCase(),
        original_owner: buyer.toLowerCase(),
        original_price: price.toString(),
        current_price: price.toString(),
        purchase_count: 1,
        is_redeemed: false,
        is_listed: false,
        blockchain_minted_at: new Date().toISOString(),
      }, {
        onConflict: 'token_id',
      });

    if (ticketError) {
      console.error('Error inserting ticket:', ticketError);
      return;
    }

    // Update event tickets_sold count
    const { error: eventError } = await supabase.rpc('increment_tickets_sold', {
      p_event_id: Number(eventId),
    });

    if (eventError) {
      console.error('Error updating tickets_sold:', eventError);
    }

    // Record transaction
    await recordTransaction(log, 'ticket_purchase', buyer);
    
    console.log(`✓ Ticket #${tokenId} synced to database`);
  } catch (error) {
    console.error('Error processing TicketPurchased:', error);
  }
}

/**
 * Process TicketListedForResale event
 */
async function processTicketListed(log: Log) {
  try {
    const decoded = decodeEventLog({
      abi: [TICKET_LISTED],
      data: log.data,
      topics: log.topics,
    });
    const { tokenId, seller, price } = decoded.args;
    
    console.log(`Processing TicketListedForResale: Token #${tokenId}`);

    // Update ticket status
    const { error: ticketError } = await supabase
      .from('ticket_metadata')
      .update({
        is_listed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('token_id', Number(tokenId));

    if (ticketError) {
      console.error('Error updating ticket listing status:', ticketError);
    }

    // Insert resale listing
    const { error: listingError } = await supabase
      .from('resale_listings')
      .upsert({
        token_id: Number(tokenId),
        seller_address: seller.toLowerCase(),
        price: price.toString(),
        is_active: true,
        listed_at: new Date().toISOString(),
      }, {
        onConflict: 'token_id',
      });

    if (listingError) {
      console.error('Error inserting resale listing:', listingError);
    }

    // Record transaction
    await recordTransaction(log, 'ticket_listed', seller);
    
    console.log(`✓ Listing for Token #${tokenId} synced to database`);
  } catch (error) {
    console.error('Error processing TicketListedForResale:', error);
  }
}

/**
 * Process ResaleCancelled event
 */
async function processResaleCancelled(log: Log) {
  try {
    const decoded = decodeEventLog({
      abi: [RESALE_CANCELLED],
      data: log.data,
      topics: log.topics,
    });
    const { tokenId } = decoded.args;
    
    console.log(`Processing ResaleCancelled: Token #${tokenId}`);

    // Update ticket status
    const { error: ticketError } = await supabase
      .from('ticket_metadata')
      .update({
        is_listed: false,
        updated_at: new Date().toISOString(),
      })
      .eq('token_id', Number(tokenId));

    if (ticketError) {
      console.error('Error updating ticket status:', ticketError);
    }

    // Deactivate listing
    const { error: listingError } = await supabase
      .from('resale_listings')
      .update({
        is_active: false,
        cancelled_at: new Date().toISOString(),
      })
      .eq('token_id', Number(tokenId))
      .eq('is_active', true);

    if (listingError) {
      console.error('Error cancelling listing:', listingError);
    }

    console.log(`✓ Cancellation for Token #${tokenId} synced to database`);
  } catch (error) {
    console.error('Error processing ResaleCancelled:', error);
  }
}

/**
 * Process TicketResold event
 */
async function processTicketResold(log: Log) {
  try {
    const decoded = decodeEventLog({
      abi: [TICKET_RESOLD],
      data: log.data,
      topics: log.topics,
    });
    const { tokenId, from, to, price } = decoded.args;
    
    console.log(`Processing TicketResold: Token #${tokenId}`);

    // Update ticket owner and price
    const { error: ticketError } = await supabase
      .from('ticket_metadata')
      .update({
        current_owner: to.toLowerCase(),
        current_price: price.toString(),
        purchase_count: supabase.rpc('increment'),
        is_listed: false,
        updated_at: new Date().toISOString(),
      })
      .eq('token_id', Number(tokenId));

    if (ticketError) {
      console.error('Error updating ticket after resale:', ticketError);
    }

    // Mark listing as sold
    const { error: listingError } = await supabase
      .from('resale_listings')
      .update({
        is_active: false,
        buyer_address: to.toLowerCase(),
        sold_at: new Date().toISOString(),
      })
      .eq('token_id', Number(tokenId))
      .eq('is_active', true);

    if (listingError) {
      console.error('Error updating listing:', listingError);
    }

    // Record transaction
    await recordTransaction(log, 'ticket_resale', to);
    
    console.log(`✓ Resale of Token #${tokenId} synced to database`);
  } catch (error) {
    console.error('Error processing TicketResold:', error);
  }
}

/**
 * Process TicketRedeemed event
 */
async function processTicketRedeemed(log: Log) {
  try {
    const decoded = decodeEventLog({
      abi: [TICKET_REDEEMED],
      data: log.data,
      topics: log.topics,
    });
    const { tokenId, holder, gateOfficer } = decoded.args;
    
    console.log(`Processing TicketRedeemed: Token #${tokenId}`);

    // Mark ticket as redeemed
    const { error: ticketError } = await supabase
      .from('ticket_metadata')
      .update({
        is_redeemed: true,
        redeemed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('token_id', Number(tokenId));

    if (ticketError) {
      console.error('Error marking ticket as redeemed:', ticketError);
    }

    // Record scan log
    const { error: scanError } = await supabase
      .from('scan_logs')
      .insert({
        token_id: Number(tokenId),
        scanner_address: gateOfficer.toLowerCase(),
        holder_address: holder.toLowerCase(),
        scan_result: 'success',
        scanned_at: new Date().toISOString(),
      });

    if (scanError) {
      console.error('Error recording scan log:', scanError);
    }

    // Record transaction
    await recordTransaction(log, 'ticket_redemption', holder);
    
    console.log(`✓ Redemption of Token #${tokenId} synced to database`);
  } catch (error) {
    console.error('Error processing TicketRedeemed:', error);
  }
}

/**
 * Process EventCancelled event
 */
async function processEventCancelled(log: Log) {
  try {
    const decoded = decodeEventLog({
      abi: [EVENT_CANCELLED],
      data: log.data,
      topics: log.topics,
    });
    const { eventId } = decoded.args;
    
    console.log(`Processing EventCancelled: Event #${eventId}`);

    // Mark event as cancelled
    const { error } = await supabase
      .from('events')
      .update({
        is_cancelled: true,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('event_id', Number(eventId));

    if (error) {
      console.error('Error marking event as cancelled:', error);
    }

    console.log(`✓ Cancellation of Event #${eventId} synced to database`);
  } catch (error) {
    console.error('Error processing EventCancelled:', error);
  }
}

/**
 * Record transaction in database
 */
async function recordTransaction(
  log: Log,
  eventType: string,
  userAddress: Address
) {
  try {
    await supabase
      .from('blockchain_transactions')
      .insert({
        tx_hash: log.transactionHash,
        block_number: Number(log.blockNumber),
        event_type: eventType,
        user_address: userAddress.toLowerCase(),
        contract_address: CONTRACT_ADDRESS.toLowerCase(),
        timestamp: new Date().toISOString(),
      });
  } catch (error) {
    console.error('Error recording transaction:', error);
  }
}

/**
 * Start listening to blockchain events
 */
export async function startEventListener(fromBlock: bigint = 0n) {
  console.log('🎧 Starting blockchain event listener...');
  console.log(`Contract: ${CONTRACT_ADDRESS}`);
  console.log(`Chain: ${chain.name}`);
  console.log(`From block: ${fromBlock}`);

  try {
    // Watch for new events
    const unwatch = publicClient.watchEvent({
      address: CONTRACT_ADDRESS,
      events: [
        EVENT_CREATED,
        TICKET_PURCHASED,
        TICKET_LISTED,
        RESALE_CANCELLED,
        TICKET_RESOLD,
        TICKET_REDEEMED,
        EVENT_CANCELLED,
      ],
      onLogs: async (logs) => {
        for (const log of logs) {
          try {
            // Determine event type and process accordingly
            if (log.topics[0] === EVENT_CREATED_SIG) {
              await processEventCreated(log);
            } else if (log.topics[0] === TICKET_PURCHASED_SIG) {
              await processTicketPurchased(log);
            } else if (log.topics[0] === TICKET_LISTED_SIG) {
              await processTicketListed(log);
            } else if (log.topics[0] === RESALE_CANCELLED_SIG) {
              await processResaleCancelled(log);
            } else if (log.topics[0] === TICKET_RESOLD_SIG) {
              await processTicketResold(log);
            } else if (log.topics[0] === TICKET_REDEEMED_SIG) {
              await processTicketRedeemed(log);
            } else if (log.topics[0] === EVENT_CANCELLED_SIG) {
              await processEventCancelled(log);
            }
          } catch (error) {
            console.error('Error processing log:', error);
          }
        }
      },
    });

    console.log('✓ Event listener started successfully');
    
    return unwatch;
  } catch (error) {
    console.error('❌ Failed to start event listener:', error);
    throw error;
  }
}

/**
 * Sync historical events from blockchain to database
 */
export async function syncHistoricalEvents(fromBlock: bigint, toBlock: bigint) {
  console.log(`🔄 Syncing historical events from block ${fromBlock} to ${toBlock}...`);

  try {
    const logs = await publicClient.getLogs({
      address: CONTRACT_ADDRESS,
      events: [
        EVENT_CREATED,
        TICKET_PURCHASED,
        TICKET_LISTED,
        RESALE_CANCELLED,
        TICKET_RESOLD,
        TICKET_REDEEMED,
        EVENT_CANCELLED,
      ],
      fromBlock,
      toBlock,
    });

    console.log(`Found ${logs.length} historical events`);

    for (const log of logs) {
      try {
        if (log.topics[0] === EVENT_CREATED_SIG) {
          await processEventCreated(log);
        } else if (log.topics[0] === TICKET_PURCHASED_SIG) {
          await processTicketPurchased(log);
        } else if (log.topics[0] === TICKET_LISTED_SIG) {
          await processTicketListed(log);
        } else if (log.topics[0] === RESALE_CANCELLED_SIG) {
          await processResaleCancelled(log);
        } else if (log.topics[0] === TICKET_RESOLD_SIG) {
          await processTicketResold(log);
        } else if (log.topics[0] === TICKET_REDEEMED_SIG) {
          await processTicketRedeemed(log);
        } else if (log.topics[0] === EVENT_CANCELLED_SIG) {
          await processEventCancelled(log);
        }
      } catch (error) {
        console.error('Error processing historical log:', error);
      }
    }

    console.log('✓ Historical sync completed');
  } catch (error) {
    console.error('❌ Failed to sync historical events:', error);
    throw error;
  }
}

/**
 * Get the latest synced block number from database
 */
export async function getLatestSyncedBlock(): Promise<bigint> {
  try {
    const { data, error } = await supabase
      .from('blockchain_transactions')
      .select('block_number')
      .order('block_number', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return 0n;
    }

    return BigInt(data.block_number);
  } catch (error) {
    console.error('Error getting latest synced block:', error);
    return 0n;
  }
}

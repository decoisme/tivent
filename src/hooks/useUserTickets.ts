import { useState, useEffect } from 'react';
import { useWallet } from './useWallet';
import { readEvent, readTicket, readTicketOwner, readTicketType } from '@/lib/contractReads';
import { formatEther } from 'viem';

export interface UserTicket {
  tokenId: number;
  eventId: number;
  ticketTypeId: number;
  ticketTypeName?: string;
  originalPrice: bigint;
  resaleCount: number;
  maxResaleCount: number;
  redeemed: boolean;
  active: boolean;
  eventTitle?: string;
  eventVenue?: string;
  eventDate?: string;
  eventImageUrl?: string;
}

/**
 * Hook to fetch and manage user's tickets
 */
export function useUserTickets() {
  const { address, isConnected } = useWallet();
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      loadUserTickets();
    } else {
      setTickets([]);
      setLoading(false);
    }
  }, [address, isConnected]);

  const loadUserTickets = async () => {
    if (!address) return;

    try {
      setLoading(true);
      setError(null);
      setTickets([]); // Clear old tickets before scanning

      console.log('[useUserTickets] Starting scan for address:', address);

      // In production, this should query an indexer or database
      // For now, we'll check tickets with a smarter approach:
      // Stop after finding 10 consecutive non-existent tokens OR max 50 tokens
      const userTickets: UserTicket[] = [];
      let consecutiveNotFound = 0;
      const maxConsecutiveNotFound = 10; // Reduced from 20
      const maxTokensToCheck = 50; // Stop after checking 50 tokens max
      let tokenId = 1;

      while (consecutiveNotFound < maxConsecutiveNotFound && tokenId <= maxTokensToCheck) {
        try {
          console.log(`[useUserTickets] Checking tokenId ${tokenId}...`);
          const owner = await readTicketOwner(tokenId);
          
          if (owner) {
            // Token exists, reset counter
            consecutiveNotFound = 0;
            console.log(`[useUserTickets] Token ${tokenId} exists, owner: ${owner}`);
            
            if (owner.toLowerCase() === address.toLowerCase()) {
              console.log(`[useUserTickets] ✅ Token ${tokenId} belongs to user!`);
              // User owns this ticket, fetch details
              const ticketData = await readTicket(tokenId);
              
              if (ticketData) {
                const eventId = Number(ticketData[0]);
                const eventData = await readEvent(eventId);
                
                // Decode event metadata
                let eventTitle = `Event #${eventId}`;
                let eventVenue = 'Venue TBD';
                let eventDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                let eventImageUrl = undefined;
                let ticketTypeName = 'General Admission';

                if (eventData) {
                  const metadataURI = eventData[2] as string;
                  
                  try {
                    if (metadataURI.startsWith('ipfs://Qm')) {
                      // Extract base64 part after 'ipfs://Qm'
                      const base64Part = metadataURI.replace('ipfs://Qm', '');
                      
                      // Decode base64 to binary string
                      const decoded = atob(base64Part);
                      
                      // Decode URI component
                      const jsonStr = decodeURIComponent(escape(decoded));
                      
                      // Parse JSON
                      const metadata = JSON.parse(jsonStr);
                      
                      eventTitle = metadata.title || eventTitle;
                      eventVenue = metadata.venue || eventVenue;
                      eventDate = metadata.startDate || eventDate;
                      eventImageUrl = metadata.imageUrl;
                      
                      console.log(`[Ticket #${tokenId}] Decoded metadata:`, metadata);
                    }
                  } catch (err) {
                    console.error(`[Ticket #${tokenId}] Metadata decode error:`, err);
                    // Use fallback values already set
                  }

                  // Read ticket type name from contract
                  try {
                    const ticketTypeId = Number(ticketData[1]);
                    const ticketTypeData = await readTicketType(eventId, ticketTypeId);
                    if (ticketTypeData) {
                      ticketTypeName = ticketTypeData[1] as string;
                    }
                  } catch (err) {
                    console.error(`[Ticket #${tokenId}] Error reading ticket type:`, err);
                  }
                }

                const newTicket = {
                  tokenId,
                  eventId: Number(ticketData[0]),
                  ticketTypeId: Number(ticketData[1]),
                  ticketTypeName,
                  originalPrice: ticketData[2] as bigint,
                  resaleCount: Number(ticketData[3]),
                  maxResaleCount: Number(ticketData[4]),
                  redeemed: ticketData[5] as boolean,
                  active: ticketData[6] as boolean,
                  eventTitle,
                  eventVenue,
                  eventDate,
                  eventImageUrl,
                };

                userTickets.push(newTicket);
                
                // Update state immediately so ticket appears in UI (use functional update)
                setTickets(prev => [...prev, newTicket]);
                
                // Set loading to false after first ticket is found so UI can start showing tickets
                if (userTickets.length === 1) {
                  setLoading(false);
                }
                
                console.log(`[useUserTickets] ✅ Ticket ${tokenId} added and state updated (${userTickets.length} total)`);
              }
            } else {
              console.log(`[useUserTickets] Token ${tokenId} belongs to someone else: ${owner}`);
            }
          }
          
          tokenId++;
        } catch (err: any) {
          // Token doesn't exist or error reading
          const isNonexistentToken = err.message?.includes('0x7e273289') || 
                                      err.message?.includes('execution reverted') ||
                                      err.message?.includes('ERC721NonexistentToken');
          
          if (isNonexistentToken) {
            consecutiveNotFound++;
            // Don't log individual nonexistent tokens to reduce console spam
            if (consecutiveNotFound === 1 || consecutiveNotFound % 5 === 0) {
              console.log(`[useUserTickets] Tokens ${tokenId - consecutiveNotFound + 1}-${tokenId} not found`);
            }
          } else {
            // Log other types of errors
            console.error(`[useUserTickets] Token ${tokenId} error:`, err.message?.substring(0, 100));
          }
          
          tokenId++;
          continue;
        }
      }

      console.log(`[useUserTickets] ✅ Scan complete! Found ${userTickets.length} tickets for user, stopped at tokenId ${tokenId}`);
      console.log('[useUserTickets] User tickets:', userTickets.map(t => ({ tokenId: t.tokenId, event: t.eventTitle })));
      console.log('[useUserTickets] Setting tickets state...');
      setTickets(userTickets);
      console.log('[useUserTickets] Tickets state set successfully');
    } catch (err: any) {
      console.error('[useUserTickets] ❌ Error loading user tickets:', err);
      setError(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const refreshTickets = () => {
    loadUserTickets();
  };

  return {
    tickets,
    loading,
    error,
    refreshTickets,
  };
}

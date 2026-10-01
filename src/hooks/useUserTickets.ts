import { useState, useEffect } from 'react';
import { useWallet } from './useWallet';
import { readEvent, readTicket, readTicketOwner } from '@/lib/contractReads';
import { formatEther } from 'viem';

export interface UserTicket {
  tokenId: number;
  eventId: number;
  ticketTypeId: number;
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

      // In production, this should query an indexer or database
      // For now, we'll check tickets 1-100 (inefficient, but works for demo)
      const userTickets: UserTicket[] = [];

      for (let tokenId = 1; tokenId <= 100; tokenId++) {
        try {
          const owner = await readTicketOwner(tokenId);
          
          if (owner && owner.toLowerCase() === address.toLowerCase()) {
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
              }

              userTickets.push({
                tokenId,
                eventId: Number(ticketData[0]),
                ticketTypeId: Number(ticketData[1]),
                originalPrice: ticketData[2] as bigint,
                resaleCount: Number(ticketData[3]),
                maxResaleCount: Number(ticketData[4]),
                redeemed: ticketData[5] as boolean,
                active: ticketData[6] as boolean,
                eventTitle,
                eventVenue,
                eventDate,
                eventImageUrl,
              });
            }
          }
        } catch (err) {
          // Token doesn't exist or error reading, skip
          continue;
        }
      }

      setTickets(userTickets);
    } catch (err: any) {
      console.error('Error loading user tickets:', err);
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

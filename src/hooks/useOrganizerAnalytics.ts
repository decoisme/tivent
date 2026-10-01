import { useState, useEffect } from 'react';
import { useWallet } from './useWallet';
import { readEventCount, readEvent, readEventTicketTypes } from '@/lib/contractReads';
import { formatEther } from 'viem';

export interface TicketTypeInfo {
  typeId: number;
  name: string;
  pricePOL: string;
  maxSupply: number;
  sold: number;
  available: number;
  active: boolean;
}

export interface EventAnalytics {
  eventId: number;
  title: string;
  venue: string;
  startDate: string;
  imageUrl?: string;
  ticketTypes: TicketTypeInfo[];
  maxTickets: number;
  ticketsSold: number;
  totalRevenue: bigint;
  isCancelled: boolean;
  isPrimarySaleActive: boolean;
  isResaleActive: boolean;
}

export interface OrganizerStats {
  totalEvents: number;
  activeEvents: number;
  totalTicketsSold: number;
  totalRevenue: string;
  averageTicketPrice: string;
}

/**
 * Hook to fetch organizer analytics and event data
 */
export function useOrganizerAnalytics() {
  const { address, isConnected } = useWallet();
  const [events, setEvents] = useState<EventAnalytics[]>([]);
  const [stats, setStats] = useState<OrganizerStats>({
    totalEvents: 0,
    activeEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: '0',
    averageTicketPrice: '0',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      loadOrganizerData();
    } else {
      setEvents([]);
      setLoading(false);
    }
  }, [address, isConnected]);

  const loadOrganizerData = async () => {
    if (!address) return;

    try {
      setLoading(true);
      setError(null);

      console.log('[useOrganizerAnalytics] Loading data for organizer:', address);

      // Get total event count
      const totalEventCount = await readEventCount();
      console.log('[useOrganizerAnalytics] Total event count:', totalEventCount);
      
      if (!totalEventCount || totalEventCount === 0n) {
        console.log('[useOrganizerAnalytics] No events found');
        setEvents([]);
        setLoading(false);
        return;
      }

      // Load all events and filter by organizer
      const organizerEvents: EventAnalytics[] = [];
      
      for (let i = 1; i <= Number(totalEventCount); i++) {
        try {
          console.log(`[useOrganizerAnalytics] Checking event ${i}...`);
          const eventData = await readEvent(i);
          if (!eventData) {
            console.log(`[useOrganizerAnalytics] Event ${i} not found`);
            continue;
          }

          const organizer = eventData[1] as string;
          console.log(`[useOrganizerAnalytics] Event ${i} organizer: ${organizer}, current user: ${address}`);
          
          // Check if current user is organizer
          if (organizer.toLowerCase() === address.toLowerCase()) {
            console.log(`[useOrganizerAnalytics] ✅ Event ${i} belongs to user!`);
            const metadataURI = eventData[2] as string;
            
            // Decode metadata
            let eventTitle = `Event #${i}`;
            let eventVenue = 'Venue TBD';
            let eventStartDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            let eventImageUrl = undefined;

            try {
              if (metadataURI.startsWith('ipfs://Qm')) {
                const base64Part = metadataURI.replace('ipfs://Qm', '');
                const decoded = atob(base64Part);
                const jsonStr = decodeURIComponent(escape(decoded));
                const metadata = JSON.parse(jsonStr);
                
                eventTitle = metadata.title || eventTitle;
                eventVenue = metadata.venue || eventVenue;
                eventStartDate = metadata.startDate || eventStartDate;
                eventImageUrl = metadata.imageUrl;
              }
            } catch (err) {
              console.error(`[Event ${i}] Metadata decode error:`, err);
            }

            // Read ticket types
            const ticketTypesData = await readEventTicketTypes(i);
            const ticketTypes: TicketTypeInfo[] = ticketTypesData.map((typeData: any) => ({
              typeId: Number(typeData.typeId),
              name: typeData.name as string,
              pricePOL: formatEther(typeData.price as bigint),
              maxSupply: Number(typeData.maxSupply),
              sold: Number(typeData.sold),
              available: Number(typeData.maxSupply) - Number(typeData.sold),
              active: typeData.active as boolean,
            }));

            // Calculate total revenue from all ticket types
            let totalRevenue = 0n;
            for (const typeData of ticketTypesData) {
              const price = (typeData as any).price as bigint;
              const sold = Number((typeData as any).sold);
              totalRevenue += price * BigInt(sold);
            }

            organizerEvents.push({
              eventId: i,
              title: eventTitle,
              venue: eventVenue,
              startDate: eventStartDate,
              imageUrl: eventImageUrl,
              ticketTypes,
              maxTickets: Number(eventData[4]),
              ticketsSold: Number(eventData[5]),
              totalRevenue,
              isCancelled: eventData[11] as boolean,
              isPrimarySaleActive: eventData[9] as boolean,
              isResaleActive: eventData[10] as boolean,
            });
            
            console.log(`[useOrganizerAnalytics] Added event ${i}: ${eventTitle}`);
          } else {
            console.log(`[useOrganizerAnalytics] Event ${i} belongs to someone else`);
          }
        } catch (err) {
          console.error(`[useOrganizerAnalytics] Error loading event ${i}:`, err);
          continue;
        }
      }

      console.log(`[useOrganizerAnalytics] ✅ Found ${organizerEvents.length} events for organizer`);
      console.log('[useOrganizerAnalytics] Events:', organizerEvents.map(e => ({ id: e.eventId, title: e.title })));
      setEvents(organizerEvents);

      // Calculate stats
      const totalEvents = organizerEvents.length;
      const activeEvents = organizerEvents.filter(
        e => e.isPrimarySaleActive && !e.isCancelled
      ).length;
      const totalTicketsSold = organizerEvents.reduce(
        (sum, e) => sum + e.ticketsSold,
        0
      );
      const totalRevenueBigInt = organizerEvents.reduce(
        (sum, e) => sum + e.totalRevenue,
        0n
      );
      
      // Calculate average price across all ticket types
      let totalTicketTypeCount = 0;
      let sumOfPrices = 0n;
      organizerEvents.forEach(e => {
        e.ticketTypes.forEach(t => {
          totalTicketTypeCount++;
          sumOfPrices += BigInt(Math.round(parseFloat(t.pricePOL) * 1e18));
        });
      });
      const averagePrice = totalTicketTypeCount > 0 ? sumOfPrices / BigInt(totalTicketTypeCount) : 0n;

      setStats({
        totalEvents,
        activeEvents,
        totalTicketsSold,
        totalRevenue: formatEther(totalRevenueBigInt),
        averageTicketPrice: formatEther(averagePrice),
      });
    } catch (err: any) {
      console.error('Error loading organizer data:', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadOrganizerData();
  };

  return {
    events,
    stats,
    loading,
    error,
    refreshData,
  };
}

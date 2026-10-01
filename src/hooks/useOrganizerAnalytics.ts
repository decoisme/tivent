import { useState, useEffect } from 'react';
import { useWallet } from './useWallet';
import { readEventCount, readEvent } from '@/lib/contractReads';
import { formatEther } from 'viem';

export interface EventAnalytics {
  eventId: number;
  title: string;
  ticketPrice: bigint;
  maxTickets: number;
  ticketsSold: number;
  totalRevenue: bigint;
  isCancelled: boolean;
  isPrimarySaleActive: boolean;
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

      // Get total event count
      const totalEventCount = await readEventCount();
      if (!totalEventCount || totalEventCount === 0n) {
        setEvents([]);
        setLoading(false);
        return;
      }

      // Load all events and filter by organizer
      const organizerEvents: EventAnalytics[] = [];
      
      for (let i = 1; i <= Number(totalEventCount); i++) {
        try {
          const eventData = await readEvent(i);
          if (!eventData) continue;

          const organizer = eventData[1] as string;
          
          // Check if current user is organizer
          if (organizer.toLowerCase() === address.toLowerCase()) {
            const ticketPrice = eventData[3] as bigint;
            const ticketsSold = Number(eventData[5]);
            const totalRevenue = ticketPrice * BigInt(ticketsSold);

            organizerEvents.push({
              eventId: i,
              title: `Event #${i}`,
              ticketPrice,
              maxTickets: Number(eventData[4]),
              ticketsSold,
              totalRevenue,
              isCancelled: eventData[11] as boolean,
              isPrimarySaleActive: eventData[9] as boolean,
            });
          }
        } catch (err) {
          console.error(`Error loading event ${i}:`, err);
          continue;
        }
      }

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
      const averagePrice = totalEvents > 0
        ? organizerEvents.reduce((sum, e) => sum + e.ticketPrice, 0n) / BigInt(totalEvents)
        : 0n;

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

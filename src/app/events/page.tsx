'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatEther } from 'viem';
import { readEventCount, readEvent, readEventTicketTypes } from '@/lib/contractReads';
import { formatIDR } from '@/lib/currency';
import { useLivePrice } from '@/hooks/useLivePrice';
import {
  Search,
  MapPin,
  Calendar,
  Ticket,
  CheckCircle2,
  ArrowLeft,
  Filter,
  SlidersHorizontal,
} from 'lucide-react';

interface EventDisplay {
  eventId: number;
  organizer: string;
  metadataURI: string;
  lowestPrice: number; // In IDR
  highestPrice: number; // In IDR
  maxTickets: number;
  ticketsSold: number;
  isPrimarySaleActive: boolean;
  isResaleActive: boolean;
  isCancelled: boolean;
  metadata?: {
    title: string;
    description: string;
    venue: string;
    startDate: string;
    endDate: string;
    imageUrl?: string;
  };
}

export default function EventsPage() {
  const router = useRouter();
  const { rate: polRate, loading: priceLoading } = useLivePrice();

  const [events, setEvents] = useState<EventDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'available' | 'soldout'>('available');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const count = await readEventCount();
      console.log('[Events] Event count from contract:', count);

      if (!count || count === 0n) {
        console.log('[Events] No events found, count is 0');
        setEvents([]);
        setLoading(false);
        return;
      }

      console.log(`[Events] Loading ${Number(count)} events...`);
      const eventPromises: Promise<EventDisplay | null>[] = [];

      for (let i = 1; i <= Number(count); i++) {
        eventPromises.push(
          (async () => {
            try {
              const eventData = await readEvent(i);
              if (!eventData) return null;

              let metadata;
              try {
                const metadataURI = eventData[2] as string;
                
                if (metadataURI.startsWith('ipfs://Qm')) {
                  const base64Part = metadataURI.replace('ipfs://Qm', '');
                  
                  try {
                    let decoded: string;
                    try {
                      decoded = atob(base64Part);
                    } catch (e) {
                      const padded = base64Part + '='.repeat((4 - (base64Part.length % 4)) % 4);
                      decoded = atob(padded);
                    }
                    
                    const jsonStr = decodeURIComponent(escape(decoded));
                    const parsedMetadata = JSON.parse(jsonStr);
                    
                    metadata = {
                      title: parsedMetadata.title || `Event #${i}`,
                      description: parsedMetadata.description || '',
                      venue: parsedMetadata.venue || 'Venue TBD',
                      startDate: parsedMetadata.startDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                      endDate: parsedMetadata.endDate || new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
                      imageUrl: parsedMetadata.imageUrl || '',
                      ticketTypes: parsedMetadata.ticketTypes || [], // ✅ ADD THIS!
                    };
                  } catch (decodeError) {
                    console.error(`[Event ${i}] Decode error:`, decodeError);
                    metadata = {
                      title: `Event #${i}`,
                      description: '',
                      venue: 'Venue TBD',
                      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                      endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
                      imageUrl: '',
                    };
                  }
                } else {
                  metadata = {
                    title: `Event #${i}`,
                    description: '',
                    venue: 'Venue TBD',
                    startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
                    imageUrl: '',
                  };
                }
              } catch (error) {
                console.error('Error parsing metadata for event', i, error);
                metadata = {
                  title: `Event #${i}`,
                  description: '',
                  venue: 'Venue TBD',
                  startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                  endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
                  imageUrl: '',
                };
              }

              // Read ticket types to get prices
              const ticketTypesData = await readEventTicketTypes(i);
              console.log(`[Event ${i}] Ticket types from contract (length: ${ticketTypesData.length}):`, ticketTypesData);
              console.log(`[Event ${i}] Metadata:`, metadata);
              console.log(`[Event ${i}] Metadata ticket types:`, (metadata as any).ticketTypes);
              
              // Use the same rate as create event form (from useLivePrice hook with fallback)
              const POL_TO_IDR = polRate || 5000;
              
              const ticketTypesPrices = ticketTypesData
                .map((typeData: any, index: number) => {
                  // First try to get from metadata (PRIORITY - this is the exact price)
                  const metaTicketTypes = (metadata as any).ticketTypes || [];
                  const metaType = metaTicketTypes[index]; // Match by array index, not typeId
                  
                  console.log(`[Event ${i}] Processing index ${index}:`, {
                    contractType: typeData.name,
                    contractPrice: typeData.price?.toString(),
                    metaType: metaType,
                    metaPriceIDR: metaType?.priceIDR,
                  });
                  
                  if (metaType?.priceIDR) {
                    console.log(`[Event ${i}] ✅ Using metadata price for index ${index}: ${metaType.priceIDR} IDR`);
                    return metaType.priceIDR;
                  }
                  
                  // Fallback: Convert from contract price (POL wei to IDR)
                  const priceInWei = typeData.price;
                  const priceInPOL = Number(priceInWei) / 1e18;
                  const priceInIDR = Math.round(priceInPOL * POL_TO_IDR);
                  console.log(`[Event ${i}] ⚠️ Fallback conversion for index ${index}: ${priceInWei} wei = ${priceInPOL} POL = ${priceInIDR} IDR (rate: ${POL_TO_IDR})`);
                  return priceInIDR;
                })
                .filter((price: number) => price > 0);

              console.log(`[Event ${i}] Final extracted prices:`, ticketTypesPrices);
              const lowestPrice = ticketTypesPrices.length > 0 ? Math.min(...ticketTypesPrices) : 0;
              const highestPrice = ticketTypesPrices.length > 0 ? Math.max(...ticketTypesPrices) : 0;
              console.log(`[Event ${i}] Price range - Lowest: ${lowestPrice}, Highest: ${highestPrice}`);

              return {
                eventId: i,
                organizer: eventData[1] as string,
                metadataURI: eventData[2] as string,
                lowestPrice,
                highestPrice,
                maxTickets: Number(eventData[4]),
                ticketsSold: Number(eventData[5]),
                isPrimarySaleActive: eventData[9] as boolean,
                isResaleActive: eventData[10] as boolean,
                isCancelled: eventData[11] as boolean,
                metadata,
              };
            } catch (error) {
              console.error(`[Event ${i}] Failed to load:`, error);
              return null;
            }
          })()
        );
      }

      const loadedEvents = (await Promise.all(eventPromises)).filter(
        (e): e is EventDisplay => {
          // Filter out null events
          if (!e) {
            console.log('[Events] Filtered out null event');
            return false;
          }
          
          // Don't filter out events even if metadata is fallback
          // We can still show them with data from contract
          console.log(`[Event ${e.eventId}] Including event: ${e.metadata?.title}, cancelled: ${e.isCancelled}, sold: ${e.ticketsSold}/${e.maxTickets}`);
          
          return true;
        }
      );

      setEvents(loadedEvents);
      console.log('[Events] All loaded events:', loadedEvents.map(e => ({
        id: e.eventId,
        title: e.metadata?.title,
        sold: e.ticketsSold,
        max: e.maxTickets,
        isSoldOut: e.ticketsSold >= e.maxTickets,
        lowestPrice: e.lowestPrice,
        highestPrice: e.highestPrice,
      })));
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    if (event.isCancelled) return false;

    switch (filter) {
      case 'available':
        return event.isPrimarySaleActive && event.ticketsSold < event.maxTickets;
      case 'soldout':
        return event.ticketsSold >= event.maxTickets;
      default:
        return true;
    }
  });

  const getStatusBadge = (event: EventDisplay) => {
    if (event.isCancelled) return <span className="dp-badge dp-badge-expired">Cancelled</span>;
    if (event.ticketsSold >= event.maxTickets) return <span className="dp-badge dp-badge-used">Sold Out</span>;
    if (event.isPrimarySaleActive) return <span className="dp-badge dp-badge-active">On Sale</span>;
    return <span className="dp-badge dp-badge-used">Unavailable</span>;
  };

  return (
    <div className="min-h-screen pt-[72px] pb-16 px-4">
      <div className="dp-container">
        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() => router.push('/')}
            className="dp-btn-ghost mb-4"
            style={{ padding: '4px 0', color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <h1 className="text-[28px] md:text-[32px] font-semibold tracking-[-0.03em] mb-2">
            Explore Events
          </h1>
          <p className="text-[15px]" style={{ color: 'var(--text-secondary)' }}>
            Discover events with verified on-chain ticketing.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-8">
          {(['available', 'all', 'soldout'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`dp-tab ${filter === f ? 'dp-tab-active' : ''}`}
            >
              {f === 'available' ? 'Available' : f === 'all' ? 'All Events' : 'Sold Out'}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="dp-surface overflow-hidden">
                <div className="dp-skeleton h-[160px]" style={{ borderRadius: 0 }} />
                <div className="p-5 space-y-3">
                  <div className="dp-skeleton h-4 w-3/4" />
                  <div className="dp-skeleton h-3 w-1/2" />
                  <div className="dp-skeleton h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filteredEvents.length === 0 && (
          <div className="dp-surface p-16 text-center max-w-lg mx-auto">
            <Ticket size={32} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <h3 className="text-[18px] font-semibold mb-2">No events found</h3>
            <p className="text-[14px] mb-6" style={{ color: 'var(--text-secondary)' }}>
              {filter === 'all'
                ? 'There are no events available yet.'
                : `No ${filter} events at the moment.`}
            </p>
            {filter !== 'all' && (
              <button onClick={() => setFilter('all')} className="dp-btn-secondary">
                View All Events
              </button>
            )}
          </div>
        )}

        {/* Events Grid */}
        {!loading && filteredEvents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEvents.map((event) => (
              <div
                key={event.eventId}
                onClick={() => router.push(`/events/${event.eventId}`)}
                className="dp-surface-interactive overflow-hidden cursor-pointer group"
              >
                {/* Image area */}
                <div
                  className="h-[160px] flex items-center justify-center"
                  style={{ backgroundColor: 'var(--surface-elevated)' }}
                >
                  {event.metadata?.imageUrl ? (
                    <img
                      src={event.metadata.imageUrl}
                      alt={event.metadata.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Ticket size={32} style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>

                {/* Info */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-[15px] font-semibold tracking-[-0.01em] line-clamp-2 flex-1 mr-2">
                      {event.metadata?.title || `Event #${event.eventId}`}
                    </h3>
                    {getStatusBadge(event)}
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                      <MapPin size={13} style={{ color: 'var(--text-muted)' }} />
                      <span className="line-clamp-1">{event.metadata?.venue || 'Venue TBD'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                      <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                      <span>
                        {event.metadata?.startDate
                          ? new Date(event.metadata.startDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Date TBD'}
                      </span>
                    </div>
                  </div>

                  <hr className="dp-divider mb-4" />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>
                        {event.lowestPrice === 0 ? 'Price' : event.lowestPrice === event.highestPrice ? 'Price' : 'From'}
                      </p>
                      <p className="text-[15px] font-semibold">
                        {event.lowestPrice === 0 
                          ? 'Contact Organizer'
                          : event.lowestPrice === event.highestPrice 
                            ? formatIDR(event.lowestPrice)
                            : `${formatIDR(event.lowestPrice)} - ${formatIDR(event.highestPrice)}`
                        }
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Available</p>
                      <p className="text-[15px] font-semibold">
                        {event.maxTickets - event.ticketsSold}
                        <span className="text-[12px] font-normal" style={{ color: 'var(--text-muted)' }}> / {event.maxTickets}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

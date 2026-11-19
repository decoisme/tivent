'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { formatEther } from 'viem';
import { readEvent, readEventTicketTypes } from '@/lib/contractReads';
import { formatIDR } from '@/lib/currency';
import { useLivePrice } from '@/hooks/useLivePrice';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Ticket,
  Shield,
  CheckCircle2,
  QrCode,
  ArrowLeftRight,
  ExternalLink,
  Lock,
} from 'lucide-react';

interface TicketTypeInfo {
  typeId: number;
  name: string;
  description: string;
  priceIDR: number;
  pricePOL: string;
  maxSupply: number;
  sold: number;
  available: number;
  active: boolean;
}

interface EventDetail {
  eventId: number;
  organizer: string;
  metadataURI: string;
  ticketTypesCount: number;
  maxTickets: number;
  ticketsSold: number;
  maxTicketsPerWallet: number;
  resalePriceCapBps: number;
  resaleDeadline: number;
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
    ticketTypes?: TicketTypeInfo[];
  };
  ticketTypes: TicketTypeInfo[];
}

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = parseInt(params.id as string);

  const { isConnected, address } = useWallet();
  const { rate: polRate, loading: priceLoading } = useLivePrice();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Get price range for display
  const getPriceRange = () => {
    if (!event || event.ticketTypes.length === 0) return { min: 0, max: 0, single: 0 };
    
    const activeTypes = event.ticketTypes.filter(t => t.active && t.available > 0);
    if (activeTypes.length === 0) {
      // If no active types, use all types for display
      const prices = event.ticketTypes.map(t => t.priceIDR || 0);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return { min, max, single: min === max ? min : 0 };
    }
    
    const prices = activeTypes.map(t => t.priceIDR || 0);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    
    return { min, max, single: min === max ? min : 0 };
  };

  useEffect(() => {
    if (eventId && !isNaN(eventId)) {
      loadEvent();
    }
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const eventData = await readEvent(eventId);

      if (!eventData) {
        setEvent(null);
        setLoading(false);
        return;
      }

      let metadata;
      try {
        // Try to decode metadata from metadataURI
        const metadataURI = eventData[2] as string;
        
        if (metadataURI.startsWith('ipfs://Qm')) {
          // Extract base64 part from mock IPFS URI (format: ipfs://Qm{base64})
          const base64Part = metadataURI.replace('ipfs://Qm', '');
          
          try {
            // Try direct decode without replacing 'x'
            let decoded: string;
            
            try {
              // First attempt: direct decode
              decoded = atob(base64Part);
            } catch (e) {
              // Second attempt: add padding if needed
              const padded = base64Part + '='.repeat((4 - (base64Part.length % 4)) % 4);
              decoded = atob(padded);
            }
            
            // Decode URI component
            const jsonStr = decodeURIComponent(escape(decoded));
            const parsedMetadata = JSON.parse(jsonStr);
            
            // Ensure metadata has all required fields with fallbacks
            metadata = {
              title: parsedMetadata.title || `Event #${eventId}`,
              description: parsedMetadata.description || 'Event details will be available soon.',
              venue: parsedMetadata.venue || 'Venue TBD',
              startDate: parsedMetadata.startDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              endDate: parsedMetadata.endDate || new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
              imageUrl: parsedMetadata.imageUrl || '',
              ticketTypes: parsedMetadata.ticketTypes || [],
            };
          } catch (decodeError) {
            console.error('[EventDetail] Error decoding metadata:', decodeError);
            // Fallback metadata
            metadata = {
              title: `Event #${eventId}`,
              description: 'Event details will be available soon.',
              venue: 'Venue TBD',
              startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
              imageUrl: '',
              ticketTypes: [],
            };
          }
        } else {
          // Fallback for other URI formats
          metadata = {
            title: `Event #${eventId}`,
            description: 'Event details will be available soon.',
            venue: 'Venue TBD',
            startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
            imageUrl: '',
            ticketTypes: [],
          };
        }
      } catch (error) {
        console.error('[EventDetail] Error parsing metadata:', error);
        metadata = {
          title: `Event #${eventId}`,
          description: 'Event details will be available soon.',
          venue: 'Venue TBD',
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
          imageUrl: '',
          ticketTypes: [],
        };
      }

      // Read ticket types from contract
      const ticketTypesData = await readEventTicketTypes(eventId);
      
      // Use the same rate as create event form (from useLivePrice hook with fallback)
      const POL_TO_IDR = polRate || 5000;
      
      const ticketTypes: TicketTypeInfo[] = ticketTypesData.map((typeData: any, index: number) => {
        // Find corresponding metadata
        const metaType = metadata.ticketTypes?.find((t: any) => t.typeId === index) || {};
        
        // Get price from metadata, or convert from contract
        let priceIDR = metaType.priceIDR;
        if (!priceIDR || priceIDR === 0) {
          const priceInWei = typeData.price; // Use property name, not index
          const priceInPOL = Number(priceInWei) / 1e18;
          priceIDR = Math.round(priceInPOL * POL_TO_IDR);
        }
        
        return {
          typeId: Number(typeData.typeId),
          name: typeData.name as string,
          description: metaType.description || '',
          priceIDR,
          pricePOL: formatEther(typeData.price as bigint),
          maxSupply: Number(typeData.maxSupply),
          sold: Number(typeData.sold),
          available: Number(typeData.maxSupply) - Number(typeData.sold),
          active: typeData.active as boolean,
        };
      });

      setEvent({
        eventId,
        organizer: eventData[1] as string,
        metadataURI: eventData[2] as string,
        ticketTypesCount: Number(eventData[3]),
        maxTickets: Number(eventData[4]),
        ticketsSold: Number(eventData[5]),
        maxTicketsPerWallet: Number(eventData[6]),
        resalePriceCapBps: Number(eventData[7]),
        resaleDeadline: Number(eventData[8]),
        isPrimarySaleActive: eventData[9] as boolean,
        isResaleActive: eventData[10] as boolean,
        isCancelled: eventData[11] as boolean,
        metadata,
        ticketTypes,
      });
    } catch (error) {
      console.error('[EventDetail] Error loading event:', error);
      setEvent(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getResalePriceCap = () => {
    if (!event) return '0%';
    const percentage = event.resalePriceCapBps / 100;
    return `${percentage}%`;
  };

  const getResaleDeadline = () => {
    if (!event || !event.metadata?.startDate) return 'N/A';
    const eventStart = new Date(event.metadata.startDate);
    const deadline = new Date(event.resaleDeadline * 1000);
    const hoursBeforeEvent = Math.floor((eventStart.getTime() - deadline.getTime()) / (1000 * 60 * 60));
    return `${hoursBeforeEvent} hours before event`;
  };

  if (loading) {
    return (
      <main className="min-h-screen px-4 pb-20 pt-24 md:pt-28">
        <div className="dp-container max-w-[1180px]">
          <div className="dp-skeleton mb-6 h-4 w-28" />
          <div className="dp-skeleton mb-8 h-[300px] rounded-[28px] md:h-[440px]" />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2"><div className="dp-skeleton h-48 rounded-2xl" /><div className="dp-skeleton h-56 rounded-2xl" /></div>
            <div className="dp-skeleton h-[320px] rounded-2xl" />
          </div>
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-20">
        <div className="dp-surface w-full max-w-lg rounded-3xl px-7 py-14 text-center md:px-12">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }}><Ticket size={30} /></div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Missing from the lineup</p>
          <h2 className="mb-3 text-3xl font-semibold tracking-[-0.05em]">Event Not Found</h2>
          <p className="mb-7 text-[14px]" style={{ color: 'var(--text-secondary)' }}>The event you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => router.push('/events')} className="dp-btn-primary">Browse Events</button>
        </div>
      </main>
    );
  }

  const ticketsRemaining = event.maxTickets - event.ticketsSold;
  const isSoldOut = ticketsRemaining === 0;
  const canPurchase = event.isPrimarySaleActive && !isSoldOut && !event.isCancelled;
  const soldPercentage = event.maxTickets > 0 ? (event.ticketsSold / event.maxTickets) * 100 : 0;

  return (
    <main className="min-h-screen px-4 pb-20 pt-24 md:pt-28">
      <div className="dp-container max-w-[1180px]">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push('/events');
          }}
          className="mb-6 flex items-center gap-2 text-[13px] transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        ><ArrowLeft size={15} /><span>All events</span></button>

        <section className="group relative mb-8 flex min-h-[360px] items-end overflow-hidden rounded-[28px] border md:min-h-[470px]" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-elevated)' }}>
          {event.metadata?.imageUrl ? (
            <img src={event.metadata.imageUrl} alt={event.metadata.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}><Ticket size={56} /></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
          <div className="relative z-10 max-w-4xl px-6 pb-8 pt-24 md:px-10 md:pb-10">
            <div className="mb-5">
              {event.isCancelled ? <span className="dp-badge dp-badge-expired">Event Cancelled</span> : isSoldOut ? <span className="dp-badge dp-badge-used">Sold Out</span> : event.isPrimarySaleActive ? <span className="dp-badge dp-badge-active">Tickets Available</span> : <span className="dp-badge dp-badge-used">Sale Not Active</span>}
            </div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/65">Tivent presents · Event № {event.eventId}</p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-white md:text-6xl">{event.metadata?.title || `Event #${event.eventId}`}</h1>
            <div className="mt-6 flex flex-col gap-3 text-[13px] text-white/80 sm:flex-row sm:flex-wrap sm:gap-x-7">
              <span className="flex items-center gap-2"><Calendar size={15} className="text-white/60" />{event.metadata?.startDate ? formatDate(event.metadata.startDate) : 'Date TBD'}</span>
              <span className="flex items-center gap-2"><MapPin size={15} className="text-white/60" />{event.metadata?.venue || 'Venue TBD'}</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="dp-surface rounded-2xl p-6 md:p-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>The experience</p>
                  <h2 className="text-2xl font-semibold tracking-[-0.04em]">About this event</h2>
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>Presented by</p>
                  <p className="dp-mono text-[12px]" style={{ color: 'var(--text-secondary)' }}>{event.organizer.slice(0, 6)}...{event.organizer.slice(-4)}</p>
                </div>
              </div>
              <p className="text-[14px] leading-7" style={{ color: 'var(--text-secondary)' }}>{event.metadata?.description || 'No description available.'}</p>
              <div className="mt-7 grid grid-cols-1 gap-3 border-t pt-5 sm:grid-cols-2" style={{ borderColor: 'var(--border)' }}>
                <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--surface-elevated)' }}><div className="mb-2 flex items-center gap-2" style={{ color: 'var(--accent)' }}><Calendar size={15} /><span className="text-[10px] font-semibold uppercase tracking-[0.15em]">Date & time</span></div><p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{event.metadata?.startDate ? formatDate(event.metadata.startDate) : 'Date TBD'}</p></div>
                <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--surface-elevated)' }}><div className="mb-2 flex items-center gap-2" style={{ color: 'var(--accent)' }}><MapPin size={15} /><span className="text-[10px] font-semibold uppercase tracking-[0.15em]">Location</span></div><p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{event.metadata?.venue || 'Venue TBD'}</p></div>
              </div>
            </section>

            {event.ticketTypes.length > 0 && (
              <section className="dp-surface rounded-2xl p-6 md:p-8">
                <div className="mb-5 flex items-end justify-between gap-3">
                  <div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>Choose your place</p><h2 className="text-2xl font-semibold tracking-[-0.04em]">Ticket types</h2></div>
                  <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{event.ticketTypes.length} options</span>
                </div>
                <div className="space-y-3">
                  {event.ticketTypes.map((type) => (
                    <article key={type.typeId} className="rounded-xl border p-4 transition-colors" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border)', opacity: !type.active || type.available <= 0 ? 0.6 : 1 }}>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2"><h3 className="text-[16px] font-semibold">{type.name}</h3>{!type.active || type.available <= 0 ? <span className="rounded-full px-2.5 py-1 text-[10px] font-medium" style={{ backgroundColor: 'var(--error-muted)', color: 'var(--error)' }}>{!type.active ? 'Inactive' : 'Sold Out'}</span> : <span className="rounded-full px-2.5 py-1 text-[10px] font-medium" style={{ backgroundColor: 'var(--success-muted)', color: 'var(--success)' }}>{type.available} left</span>}</div>
                          {type.description && <p className="mb-3 text-[12px] leading-5" style={{ color: 'var(--text-muted)' }}>{type.description}</p>}
                          <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{type.sold} / {type.maxSupply} sold</p>
                        </div>
                        <div className="sm:text-right"><p className="text-xl font-semibold tracking-[-0.03em]">{formatIDR(type.priceIDR)}</p><p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>≈ {type.pricePOL} POL</p></div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <section className="dp-surface rounded-2xl p-6 md:p-8">
              <div className="mb-5 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }}><Lock size={16} /></div><div><p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.17em]" style={{ color: 'var(--text-muted)' }}>Built into the protocol</p><h2 className="text-[16px] font-semibold">Smart contract rules</h2></div></div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="dp-protocol-rule rounded-xl p-4"><p className="mb-1 text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Purchase limit</p><p className="text-[13px] font-semibold">{event.maxTicketsPerWallet} tickets per wallet</p></div>
                <div className="dp-protocol-rule rounded-xl p-4"><p className="mb-1 text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Resale price cap</p><p className="text-[13px] font-semibold">{getResalePriceCap()} of original price</p></div>
                <div className="dp-protocol-rule rounded-xl p-4"><p className="mb-1 text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Resale deadline</p><p className="text-[13px] font-semibold">{getResaleDeadline()}</p></div>
              </div>
            </section>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { icon: <CheckCircle2 size={14} />, label: 'Verified Organizer' },
                { icon: <Shield size={14} />, label: 'On-chain Ticket' },
                { icon: <ArrowLeftRight size={14} />, label: 'Official Resale' },
                { icon: <QrCode size={14} />, label: 'Dynamic QR Entry' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl border px-3 py-3" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}><span style={{ color: 'var(--accent)' }}>{item.icon}</span><span className="text-[11px] font-medium">{item.label}</span></div>
              ))}
            </div>
          </div>

          <aside className="lg:col-span-1">
            <div className="dp-surface overflow-hidden rounded-2xl lg:sticky lg:top-24">
              <div className="p-6">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>{getPriceRange().single > 0 ? 'Price per ticket' : 'Price range'}</p>
                {getPriceRange().single > 0 ? <><p className="text-3xl font-semibold tracking-[-0.05em]">{formatIDR(getPriceRange().single)}</p>{event.ticketTypes.length > 0 && event.ticketTypes[0].pricePOL && <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>≈ {event.ticketTypes[0].pricePOL} POL</p>}</> : <><p className="text-2xl font-semibold tracking-[-0.04em]">{formatIDR(getPriceRange().min)} - {formatIDR(getPriceRange().max)}</p><p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>Multiple ticket types available</p></>}
              </div>
              <div className="border-y px-6 py-5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-elevated)' }}>
                <div className="mb-3 flex justify-between text-[12px]"><span style={{ color: 'var(--text-secondary)' }}>Total tickets</span><span className="font-medium">{event.maxTickets}</span></div>
                <div className="mb-3 flex justify-between text-[12px]"><span style={{ color: 'var(--text-secondary)' }}>Sold</span><span className="font-medium">{event.ticketsSold}</span></div>
                <div className="mb-4 flex justify-between text-[12px]"><span style={{ color: 'var(--text-secondary)' }}>Remaining</span><span className="font-semibold" style={{ color: ticketsRemaining > 0 ? 'var(--success)' : 'var(--error)' }}>{ticketsRemaining}</span></div>
                <div className="dp-progress"><div className="dp-progress-fill" style={{ width: `${soldPercentage}%` }} /></div>
              </div>
              <div className="p-6">
                {!isConnected ? <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'var(--surface-elevated)' }}><p className="mb-3 text-[12px]" style={{ color: 'var(--text-secondary)' }}>Connect your wallet to purchase</p><button onClick={() => router.push('/')} className="dp-btn-primary w-full">Connect Wallet</button></div> : event.isCancelled ? <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'var(--error-muted)' }}><p className="text-[13px] font-medium" style={{ color: 'var(--error)' }}>Event Cancelled</p><p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>If you purchased tickets, you can claim a refund.</p></div> : !canPurchase ? <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'var(--surface-elevated)' }}><p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>{isSoldOut ? 'Sold Out' : 'Tickets not available'}</p></div> : <div className="space-y-3"><button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/events/${eventId}/purchase`); }} className="dp-btn-primary w-full text-[14px] font-medium" style={{ padding: '14px 24px' }}>Buy Ticket</button><a href={`https://amoy.polygonscan.com/address/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="dp-btn-secondary flex w-full items-center justify-center gap-2 text-[13px]" style={{ padding: '12px 24px' }}><ExternalLink size={14} /><span>View on Blockchain</span></a></div>}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { formatEther } from 'viem';
import { readEvent } from '@/lib/contractReads';
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

interface EventDetail {
  eventId: number;
  organizer: string;
  metadataURI: string;
  ticketPrice: bigint;
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
    ticketPriceIDR?: number | null;
  };
}

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = parseInt(params.id as string);

  const { isConnected, address } = useWallet();
  const { rate: polRate, loading: priceLoading } = useLivePrice();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Get ticket price in IDR (from metadata or convert from POL using live rate)
  const getTicketPriceIDR = () => {
    if (!event) return 0;
    
    // If organizer set IDR price in metadata, use that
    if (event.metadata?.ticketPriceIDR && event.metadata.ticketPriceIDR > 0) {
      return event.metadata.ticketPriceIDR;
    }
    
    // Otherwise, convert POL price to IDR using live rate
    if (polRate) {
      const polPrice = parseFloat(formatEther(event.ticketPrice));
      return Math.round(polPrice * polRate);
    }
    
    // Fallback while loading
    return 0;
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
              ticketPriceIDR: parsedMetadata.ticketPriceIDR || null, // IDR price from organizer
            };
          } catch (decodeError) {
            console.error('Error decoding metadata:', decodeError);
            // Fallback metadata
            metadata = {
              title: `Event #${eventId}`,
              description: 'Event details will be available soon.',
              venue: 'Venue TBD',
              startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
              imageUrl: '',
              ticketPriceIDR: null,
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
            ticketPriceIDR: null,
          };
        }
      } catch (error) {
        console.error('Error parsing metadata:', error);
        metadata = {
          title: `Event #${eventId}`,
          description: 'Event details will be available soon.',
          venue: 'Venue TBD',
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
          imageUrl: '',
          ticketPriceIDR: null,
        };
      }

      setEvent({
        eventId,
        organizer: eventData[1] as string,
        metadataURI: eventData[2] as string,
        ticketPrice: eventData[3] as bigint,
        maxTickets: Number(eventData[4]),
        ticketsSold: Number(eventData[5]),
        maxTicketsPerWallet: Number(eventData[6]),
        resalePriceCapBps: Number(eventData[7]),
        resaleDeadline: Number(eventData[8]),
        isPrimarySaleActive: eventData[9] as boolean,
        isResaleActive: eventData[10] as boolean,
        isCancelled: eventData[11] as boolean,
        metadata,
      });
    } catch (error) {
      console.error('Error loading event:', error);
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
      <div className="min-h-screen pt-[72px] pb-16 px-4">
        <div className="dp-container max-w-[1080px]">
          <div className="dp-skeleton h-4 w-20 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="dp-skeleton h-[320px] rounded-xl" />
              <div className="dp-skeleton h-[200px] rounded-xl" />
            </div>
            <div>
              <div className="dp-skeleton h-[300px] rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="dp-surface p-12 max-w-md w-full text-center">
          <Ticket size={32} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h2 className="text-[20px] font-semibold mb-2">Event Not Found</h2>
          <p className="text-[14px] mb-6" style={{ color: 'var(--text-secondary)' }}>
            The event you're looking for doesn't exist or has been removed.
          </p>
          <button onClick={() => router.push('/events')} className="dp-btn-primary">
            Browse Events
          </button>
        </div>
      </div>
    );
  }

  const ticketsRemaining = event.maxTickets - event.ticketsSold;
  const isSoldOut = ticketsRemaining === 0;
  const canPurchase = event.isPrimarySaleActive && !isSoldOut && !event.isCancelled;
  const soldPercentage = event.maxTickets > 0 ? (event.ticketsSold / event.maxTickets) * 100 : 0;

  return (
    <div className="min-h-screen pt-[72px] pb-16 px-4">
      <div className="dp-container max-w-[1080px]">
        {/* Back */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push('/events');
          }}
          className="flex items-center gap-2 text-sm mb-6 transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <ArrowLeft size={16} /> 
          <span>Back to Events</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left: Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover image */}
            <div
              className="h-[280px] md:h-[360px] rounded-xl flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              {event.metadata?.imageUrl ? (
                <img
                  src={event.metadata.imageUrl}
                  alt={event.metadata.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Ticket size={48} style={{ color: 'var(--text-muted)' }} />
              )}
            </div>

            {/* Event Info */}
            <div>
              {/* Status */}
              <div className="mb-4">
                {event.isCancelled ? (
                  <span className="dp-badge dp-badge-expired">Event Cancelled</span>
                ) : isSoldOut ? (
                  <span className="dp-badge dp-badge-used">Sold Out</span>
                ) : event.isPrimarySaleActive ? (
                  <span className="dp-badge dp-badge-active">Tickets Available</span>
                ) : (
                  <span className="dp-badge dp-badge-used">Sale Not Active</span>
                )}
              </div>

              <h1 className="text-[28px] md:text-[36px] font-semibold tracking-[-0.03em] mb-6">
                {event.metadata?.title || `Event #${event.eventId}`}
              </h1>

              {/* Date & Venue */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <Calendar size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <p className="text-[14px] font-medium">Date & Time</p>
                    <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                      {event.metadata?.startDate ? formatDate(event.metadata.startDate) : 'Date TBD'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <p className="text-[14px] font-medium">Venue</p>
                    <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                      {event.metadata?.venue || 'Venue TBD'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <p className="text-[14px] font-medium">Organizer</p>
                    <p className="dp-mono" style={{ color: 'var(--text-secondary)' }}>
                      {event.organizer.slice(0, 6)}...{event.organizer.slice(-4)}
                    </p>
                  </div>
                </div>
              </div>

              <hr className="dp-divider mb-6" />

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-[16px] font-semibold mb-3">About This Event</h2>
                <p className="text-[14px] leading-[1.7]" style={{ color: 'var(--text-secondary)' }}>
                  {event.metadata?.description || 'No description available.'}
                </p>
              </div>
            </div>

            {/* Smart Contract Rules */}
            <div className="dp-surface p-6">
              <div className="flex items-center gap-2 mb-5">
                <Lock size={14} style={{ color: 'var(--accent)' }} />
                <h2 className="text-[15px] font-semibold">Smart Contract Rules</h2>
              </div>
              <div className="space-y-3">
                <div className="dp-protocol-rule">
                  <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Purchase limit</p>
                  <p className="text-[14px] font-semibold">{event.maxTicketsPerWallet} tickets per wallet</p>
                </div>
                <div className="dp-protocol-rule">
                  <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Resale price cap</p>
                  <p className="text-[14px] font-semibold">{getResalePriceCap()} of original price</p>
                </div>
                <div className="dp-protocol-rule">
                  <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Resale deadline</p>
                  <p className="text-[14px] font-semibold">{getResaleDeadline()}</p>
                </div>
              </div>
            </div>

            {/* Trust section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: <CheckCircle2 size={14} />, label: 'Verified Organizer' },
                { icon: <Shield size={14} />, label: 'On-chain Ticket' },
                { icon: <ArrowLeftRight size={14} />, label: 'Official Resale' },
                { icon: <QrCode size={14} />, label: 'Dynamic QR Entry' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 py-3 px-4 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
                  <span style={{ color: 'var(--accent)' }}>{item.icon}</span>
                  <span className="text-[12px] font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Purchase Sidebar */}
          <div className="lg:col-span-1">
            <div className="dp-surface p-6 lg:sticky lg:top-[88px] lg:self-start">
              <div className="mb-5">
                <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>Price per ticket</p>
                <p className="text-[28px] font-semibold tracking-[-0.02em]">
                  {formatIDR(getTicketPriceIDR())}
                </p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  ≈ {formatEther(event.ticketPrice)} POL
                </p>
              </div>

              <hr className="dp-divider mb-5" />

              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-[13px]">
                  <span style={{ color: 'var(--text-secondary)' }}>Total tickets</span>
                  <span className="font-medium">{event.maxTickets}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span style={{ color: 'var(--text-secondary)' }}>Sold</span>
                  <span className="font-medium">{event.ticketsSold}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span style={{ color: 'var(--text-secondary)' }}>Remaining</span>
                  <span className="font-medium" style={{ color: ticketsRemaining > 0 ? 'var(--success)' : 'var(--error)' }}>
                    {ticketsRemaining}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="dp-progress mb-6">
                <div className="dp-progress-fill" style={{ width: `${soldPercentage}%` }} />
              </div>

              {/* CTA */}
              {!isConnected ? (
                <div className="text-center py-4 px-4 rounded-lg" style={{ backgroundColor: 'var(--surface-elevated)' }}>
                  <p className="text-[13px] mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Connect your wallet to purchase
                  </p>
                  <button onClick={() => router.push('/')} className="dp-btn-primary w-full">
                    Connect Wallet
                  </button>
                </div>
              ) : event.isCancelled ? (
                <div className="text-center py-4 px-4 rounded-lg" style={{ backgroundColor: 'var(--error-muted)' }}>
                  <p className="text-[13px]" style={{ color: 'var(--error)' }}>Event Cancelled</p>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    If you purchased tickets, you can claim a refund.
                  </p>
                </div>
              ) : !canPurchase ? (
                <div className="text-center py-4 px-4 rounded-lg" style={{ backgroundColor: 'var(--surface-elevated)' }}>
                  <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                    {isSoldOut ? 'Sold Out' : 'Tickets not available'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/events/${eventId}/purchase`);
                    }}
                    className="dp-btn-primary w-full text-[14px] font-medium"
                    style={{ padding: '14px 24px' }}
                  >
                    Buy Ticket
                  </button>
                  <a
                    href={`https://amoy.polygonscan.com/address/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dp-btn-secondary w-full text-[13px] flex items-center justify-center gap-2"
                    style={{ padding: '12px 24px' }}
                  >
                    <ExternalLink size={14} /> 
                    <span>View on Blockchain</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

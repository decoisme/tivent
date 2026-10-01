'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useEventTicketing } from '@/hooks/useEventTicketing';
import { readTicket, readEvent, readListing } from '@/lib/contractReads';
import { formatEther } from 'viem';
import {
  ArrowLeft,
  Ticket,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  User,
} from 'lucide-react';

interface ResaleDetail {
  tokenId: number;
  eventId: number;
  seller: string;
  price: bigint;
  originalPrice: bigint;
  resaleCount: number;
  active: boolean;
  eventData?: {
    title: string;
    description: string;
    venue: string;
    startDate: string;
    imageUrl: string;
    organizer: string;
    isCancelled: boolean;
  };
}

export default function ResalePurchasePage() {
  const router = useRouter();
  const params = useParams();
  const tokenId = parseInt(params.id as string);
  
  const { isConnected, address } = useWallet();
  const { buyResale, isPending, isConfirming, isConfirmed, hash, error } = useEventTicketing();
  
  const [listing, setListing] = useState<ResaleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tokenId && !isNaN(tokenId)) {
      loadListing();
    }
  }, [tokenId]);

  const loadListing = async () => {
    try {
      setLoading(true);
      
      const listingData = await readListing(tokenId);
      if (!listingData || !listingData[3]) {
        setListing(null);
        setLoading(false);
        return;
      }

      const ticketData = await readTicket(tokenId);
      if (!ticketData) {
        setListing(null);
        setLoading(false);
        return;
      }

      const eventId = Number(ticketData[0]);
      const eventData = await readEvent(eventId);

      // Decode event metadata
      let eventMetadata = {
        title: `Event #${eventId}`,
        description: '',
        venue: 'Venue TBD',
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        imageUrl: '',
        organizer: eventData ? (eventData[1] as string) : '0x...',
        isCancelled: eventData ? (eventData[11] as boolean) : false,
      };

      if (eventData) {
        const metadataURI = eventData[2] as string;
        
        try {
          if (metadataURI.startsWith('ipfs://Qm')) {
            const base64Part = metadataURI.replace('ipfs://Qm', '');
            const decoded = atob(base64Part);
            const jsonStr = decodeURIComponent(escape(decoded));
            const metadata = JSON.parse(jsonStr);
            
            eventMetadata = {
              title: metadata.title || eventMetadata.title,
              description: metadata.description || '',
              venue: metadata.venue || eventMetadata.venue,
              startDate: metadata.startDate || eventMetadata.startDate,
              imageUrl: metadata.imageUrl || '',
              organizer: eventData[1] as string,
              isCancelled: eventData[11] as boolean,
            };
            
            console.log(`[Resale Detail] Decoded metadata for event ${eventId}:`, metadata);
          }
        } catch (err) {
          console.error(`[Resale Detail] Metadata decode error:`, err);
        }
      }

      setListing({
        tokenId,
        eventId,
        seller: listingData[1] as string,
        price: listingData[2] as bigint,
        originalPrice: ticketData[2] as bigint,
        resaleCount: Number(ticketData[3]),
        active: listingData[3] as boolean,
        eventData: eventMetadata,
      });
    } catch (error) {
      console.error('Error loading listing:', error);
      setListing(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!listing || !isConnected) return;

    try {
      await buyResale(tokenId, formatEther(listing.price));
    } catch (err: any) {
      console.error('Purchase error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="text-center">
          <Clock size={64} className="mx-auto mb-4 animate-pulse" style={{ color: 'var(--accent)' }} />
          <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>Loading listing...</p>
        </div>
      </div>
    );
  }

  if (!listing || !listing.active) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="dp-surface p-12 max-w-md w-full text-center">
          <XCircle size={64} className="mx-auto mb-4" style={{ color: 'var(--danger)' }} />
          <h2 className="text-[24px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Listing Not Available
          </h2>
          <p className="text-[14px] mb-6" style={{ color: 'var(--text-secondary)' }}>
            This ticket is no longer listed for resale.
          </p>
          <button
            onClick={() => router.push('/resale')}
            className="dp-btn-primary"
          >
            Browse Resale Marketplace
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (isConfirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="dp-surface p-12 max-w-md w-full text-center">
          <CheckCircle2 size={64} className="mx-auto mb-4" style={{ color: 'var(--success)' }} />
          <h2 className="text-[28px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Purchase Successful!
          </h2>
          <p className="text-[14px] mb-4" style={{ color: 'var(--text-secondary)' }}>
            You now own ticket #{tokenId}
          </p>
          <p className="text-[12px] font-mono mb-6 break-all" style={{ color: 'var(--text-muted)' }}>
            Tx: {hash?.slice(0, 10)}...{hash?.slice(-8)}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push(`/tickets/${tokenId}`)}
              className="dp-btn-primary w-full"
            >
              View My Ticket
            </button>
            <button
              onClick={() => router.push('/tickets')}
              className="w-full text-[14px] py-3 rounded-lg transition-all"
              style={{
                backgroundColor: 'var(--surface-hover)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              Go to My Tickets
            </button>
          </div>
        </div>
      </div>
    );
  }

  const discount = listing.originalPrice > 0n
    ? Math.round((1 - Number(listing.price) / Number(listing.originalPrice)) * 100)
    : 0;

  const isSeller = address && listing.seller.toLowerCase() === address.toLowerCase();

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="dp-container max-w-5xl mx-auto">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[13px] transition-opacity hover:opacity-80"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded text-[11px] font-medium" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
              Resale
            </span>
            {discount > 0 && (
              <span className="px-2 py-1 rounded text-[11px] font-medium" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' }}>
                {discount}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Compact Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          {/* Main Content */}
          <div className="space-y-4">
            {/* Event Image & Title - Compact */}
            <div className="dp-surface overflow-hidden">
              {listing.eventData?.imageUrl ? (
                <div className="relative h-[280px] w-full">
                  <img
                    src={listing.eventData.imageUrl}
                    alt={listing.eventData.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="h-[280px] flex items-center justify-center" style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)">
                            <svg width="64" height="64" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.3">
                              <path d="M2 9a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3"></path>
                              <path d="M22 9a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3"></path>
                              <path d="M2 9v10a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V9"></path>
                              <path d="M10 12h4"></path>
                            </svg>
                          </div>
                        `;
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h1 className="text-[22px] font-semibold text-white mb-1">
                      {listing.eventData.title}
                    </h1>
                    {listing.eventData.description && (
                      <p className="text-[12px] text-white/70 line-clamp-1">
                        {listing.eventData.description}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-[280px] flex flex-col items-center justify-center gap-3" style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)' }}>
                  <Ticket size={64} style={{ color: 'var(--accent)', opacity: 0.3 }} />
                  <h1 className="text-[20px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {listing.eventData?.title}
                  </h1>
                </div>
              )}
            </div>

            {/* Event Info & Details - Compact Combined */}
            <div className="dp-surface p-5">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-start gap-2">
                  <MapPin size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Venue</p>
                    <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{listing.eventData?.venue}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Date</p>
                    <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                      {listing.eventData?.startDate
                        ? new Date(listing.eventData.startDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'TBD'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t grid grid-cols-2 gap-3" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Token ID</p>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>#{tokenId}</p>
                </div>
                <div>
                  <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Resale Count</p>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{listing.resaleCount}x</p>
                </div>
                <div>
                  <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Original Price</p>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{formatEther(listing.originalPrice)} POL</p>
                </div>
                <div>
                  <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Resale Price</p>
                  <p className="text-[15px] font-bold" style={{ color: 'var(--accent)' }}>{formatEther(listing.price)} POL</p>
                </div>
              </div>

              <button
                onClick={() => router.push(`/events/${listing.eventId}`)}
                className="w-full mt-4 text-[13px] py-2 rounded-lg transition-all"
                style={{
                  backgroundColor: 'var(--surface-hover)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                }}
              >
                View Event Details
              </button>
            </div>

            {/* Seller Info - Compact */}
            <div className="dp-surface p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-subtle)' }}>
                  <User size={16} style={{ color: 'var(--accent)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Seller</p>
                  <p className="font-mono text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>{listing.seller}</p>
                </div>
                {isSeller && (
                  <span className="text-[10px] px-2 py-1 rounded" style={{ backgroundColor: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa' }}>
                    Your Listing
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Compact Sticky */}
          <div className="lg:w-[340px]">
            <div className="dp-surface p-5 space-y-4 sticky top-20">
              <div>
                <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                  Resale Price
                </p>
                <p className="text-[32px] font-bold tracking-[-0.03em]" style={{ color: 'var(--text-primary)' }}>
                  {formatEther(listing.price)} POL
                </p>
                {discount > 0 && (
                  <p className="text-[12px] mt-1" style={{ color: 'var(--success)' }}>
                    Save {formatEther(listing.originalPrice - listing.price)} POL ({discount}% off)
                  </p>
                )}
              </div>

              {!isConnected ? (
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-hover)' }}>
                  <p className="text-[12px] mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Connect wallet to purchase
                  </p>
                  <button
                    onClick={() => router.push('/')}
                    className="dp-btn-primary w-full text-[14px] py-2.5"
                  >
                    Connect Wallet
                  </button>
                </div>
              ) : isSeller ? (
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(96, 165, 250, 0.1)' }}>
                  <p className="text-[12px] mb-2" style={{ color: '#60a5fa' }}>Your listing</p>
                  <button
                    onClick={() => router.push(`/tickets/${tokenId}/resale`)}
                    className="w-full text-[13px] py-2.5 rounded-lg transition-all"
                    style={{
                      backgroundColor: 'var(--surface-hover)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    Manage Listing
                  </button>
                </div>
              ) : listing.eventData?.isCancelled ? (
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                  <p className="text-[12px]" style={{ color: 'var(--danger)' }}>Event cancelled</p>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="p-3 rounded-lg text-[12px]" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                      {error.message || 'Transaction failed'}
                    </div>
                  )}

                  <button
                    onClick={handlePurchase}
                    disabled={isPending || isConfirming}
                    className="dp-btn-primary w-full text-[14px] py-3"
                  >
                    {isPending || isConfirming ? (
                      <span className="flex items-center justify-center gap-2">
                        <Clock size={14} className="animate-spin" />
                        {isPending ? 'Confirm...' : 'Processing...'}
                      </span>
                    ) : (
                      'Buy Now'
                    )}
                  </button>
                  <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
                    Secure atomic escrow
                  </p>
                </>
              )}

              {/* Protection Info - Compact */}
              <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Buyer Protection
                </p>
                <ul className="space-y-1.5 text-[11px]">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} style={{ color: 'var(--success)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>Verified on blockchain</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} style={{ color: 'var(--success)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>Atomic escrow</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} style={{ color: 'var(--success)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>Instant ownership</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

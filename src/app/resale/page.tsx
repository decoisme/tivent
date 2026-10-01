'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { readEventCount, readEvent, readListing, readTicket } from '@/lib/contractReads';
import { formatEther } from 'viem';
import {
  ArrowLeft,
  Ticket,
  MapPin,
  Calendar,
  Shield,
  RefreshCw,
  ArrowUpRight,
  CheckCircle2,
  Lock,
  TrendingUp,
} from 'lucide-react';

interface ResaleListing {
  tokenId: number;
  eventId: number;
  seller: string;
  price: bigint;
  originalPrice: bigint;
  eventTitle?: string;
  eventVenue?: string;
  eventDate?: string;
  eventImageUrl?: string;
  discount: number;
}

export default function ResaleMarketplacePage() {
  const router = useRouter();

  const [listings, setListings] = useState<ResaleListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'discount'>('discount');

  useEffect(() => {
    loadResaleListings();
  }, []);

  const loadResaleListings = async () => {
    try {
      setLoading(true);
      const resaleListings: ResaleListing[] = [];

      for (let tokenId = 1; tokenId <= 100; tokenId++) {
        try {
          const listingData = await readListing(tokenId);

          if (listingData && listingData[3]) {
            const ticketData = await readTicket(tokenId);
            if (!ticketData) continue;

            const eventId = Number(ticketData[0]);
            const eventData = await readEvent(eventId);

            // Decode event metadata
            let eventMetadata = {
              title: `Event #${eventId}`,
              venue: 'Venue TBD',
              date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              imageUrl: undefined as string | undefined,
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
                    venue: metadata.venue || eventMetadata.venue,
                    date: metadata.startDate || eventMetadata.date,
                    imageUrl: metadata.imageUrl,
                  };
                }
              } catch (err) {
                console.error(`[Resale Marketplace] Metadata decode error for event ${eventId}:`, err);
              }
            }

            const price = listingData[2] as bigint;
            const originalPrice = ticketData[2] as bigint;
            const discount = originalPrice > 0n
              ? Math.round((1 - Number(price) / Number(originalPrice)) * 100)
              : 0;

            resaleListings.push({
              tokenId,
              eventId,
              seller: listingData[1] as string,
              price,
              originalPrice,
              eventTitle: eventMetadata.title,
              eventVenue: eventMetadata.venue,
              eventDate: eventMetadata.date,
              discount,
            });
          }
        } catch (err) {
          continue;
        }
      }

      setListings(resaleListings);
    } catch (error) {
      console.error('Error loading resale listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedListings = [...listings].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return Number(a.price - b.price);
      case 'price-high': return Number(b.price - a.price);
      case 'discount': return b.discount - a.discount;
      default: return 0;
    }
  });

  const getMarkupDisplay = (listing: ResaleListing) => {
    if (listing.discount > 0) {
      return <span style={{ color: 'var(--success)' }}>-{listing.discount}%</span>;
    } else if (listing.discount < 0) {
      return <span style={{ color: 'var(--accent)' }}>+{Math.abs(listing.discount)}%</span>;
    }
    return <span style={{ color: 'var(--text-muted)' }}>0%</span>;
  };

  return (
    <div className="min-h-screen pt-[72px] pb-16 px-4">
      <div className="dp-container">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="dp-btn-ghost mb-4"
            style={{ padding: '4px 0', color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={14} /> Home
          </button>
          <h1 className="text-[28px] md:text-[32px] font-semibold tracking-[-0.03em] mb-2">
            Resale Marketplace
          </h1>
          <p className="text-[15px]" style={{ color: 'var(--text-secondary)' }}>
            Buy tickets from verified owners with smart contract escrow.
          </p>
        </div>

        {/* Price cap notice */}
        <div className="dp-protocol-rule mb-8 flex items-center gap-3">
          <Lock size={14} style={{ color: 'var(--accent)' }} />
          <p className="text-[13px]">
            <span className="font-medium">Price cap enforced by smart contract.</span>
            <span style={{ color: 'var(--text-secondary)' }}> Resale prices cannot exceed the configured markup limit.</span>
          </p>
        </div>

        {/* Filters & Sort */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {(['discount', 'price-low', 'price-high'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`dp-tab ${sortBy === s ? 'dp-tab-active' : ''}`}
              >
                {s === 'discount' ? 'Best Value' : s === 'price-low' ? 'Price ↑' : 'Price ↓'}
              </button>
            ))}
          </div>
          <button onClick={loadResaleListings} className="dp-btn-ghost" style={{ padding: '8px' }}>
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="dp-surface p-5">
                <div className="flex gap-4">
                  <div className="dp-skeleton w-20 h-16 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="dp-skeleton h-4 w-3/4" />
                    <div className="dp-skeleton h-3 w-1/2" />
                  </div>
                  <div className="dp-skeleton w-24 h-10" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && sortedListings.length === 0 && (
          <div className="dp-surface p-16 text-center max-w-lg mx-auto">
            <Ticket size={32} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <h3 className="text-[18px] font-semibold mb-2">No Resale Listings</h3>
            <p className="text-[14px] mb-6" style={{ color: 'var(--text-secondary)' }}>
              No tickets are currently available for resale.
            </p>
            <button onClick={() => router.push('/events')} className="dp-btn-primary">
              Browse Primary Sales
            </button>
          </div>
        )}

        {/* Listings — table-like rows for a serious marketplace feel */}
        {!loading && sortedListings.length > 0 && (
          <div className="space-y-2">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--text-muted)' }}>
              <div className="col-span-4">Event</div>
              <div className="col-span-2">Seller</div>
              <div className="col-span-2 text-right">Original</div>
              <div className="col-span-2 text-right">Resale</div>
              <div className="col-span-1 text-right">Markup</div>
              <div className="col-span-1"></div>
            </div>

            {sortedListings.map((listing) => (
              <div
                key={listing.tokenId}
                onClick={() => router.push(`/resale/${listing.tokenId}`)}
                className="dp-surface-interactive grid grid-cols-12 gap-4 items-center px-5 py-4 cursor-pointer"
              >
                {/* Event */}
                <div className="col-span-4">
                  <p className="text-[14px] font-medium truncate">
                    {listing.eventTitle || `Event #${listing.eventId}`}
                  </p>
                  <div className="flex items-center gap-3 text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1">
                      <MapPin size={10} />
                      {listing.eventVenue || 'TBD'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {listing.eventDate
                        ? new Date(listing.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : 'TBD'}
                    </span>
                  </div>
                </div>

                {/* Seller */}
                <div className="col-span-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={11} style={{ color: 'var(--success)' }} />
                    <span className="dp-mono text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                      {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                    </span>
                  </div>
                </div>

                {/* Original Price */}
                <div className="col-span-2 text-right">
                  <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                    {formatEther(listing.originalPrice)} ETH
                  </p>
                </div>

                {/* Resale Price */}
                <div className="col-span-2 text-right">
                  <p className="text-[14px] font-semibold">
                    {formatEther(listing.price)} ETH
                  </p>
                </div>

                {/* Markup */}
                <div className="col-span-1 text-right text-[13px] font-medium">
                  {getMarkupDisplay(listing)}
                </div>

                {/* Action */}
                <div className="col-span-1 text-right">
                  <ArrowUpRight size={14} style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Protection info */}
        {!loading && sortedListings.length > 0 && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: <Shield size={13} />, text: 'All tickets verified on blockchain — no fakes' },
              { icon: <Lock size={13} />, text: 'Smart contract escrow ensures safe transfer' },
              { icon: <TrendingUp size={13} />, text: 'Price caps prevent scalping — fair prices enforced' },
              { icon: <CheckCircle2 size={13} />, text: 'Instant ownership transfer on purchase' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                <span style={{ color: 'var(--success)' }}>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

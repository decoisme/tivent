'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { readListing, readTicket, readEvent } from '@/lib/contractReads';
import { formatEther } from 'viem';
import {
  ArrowLeft,
  Ticket,
  MapPin,
  Calendar,
  ArrowLeftRight,
  Shield,
  CheckCircle2,
  Lock,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

interface ResaleListing {
  tokenId: number;
  seller: string;
  price: bigint;
  eventId: number;
  originalPrice: bigint;
  resaleCount: number;
  eventTitle?: string;
  eventVenue?: string;
  eventDate?: string;
  eventImageUrl?: string;
  discount?: number;
}

export default function ResaleMarketplacePage() {
  const router = useRouter();
  const { isConnected, address } = useWallet();

  const [listings, setListings] = useState<ResaleListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'deals' | 'premium'>('all');

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      setLoading(true);
      const activeListings: ResaleListing[] = [];

      for (let tokenId = 1; tokenId <= 100; tokenId++) {
        try {
          const listingData = await readListing(tokenId);

          if (listingData && listingData[3]) {
            const ticketData = await readTicket(tokenId);

            if (ticketData) {
              const eventId = Number(ticketData[0]);
              const eventData = await readEvent(eventId);

              const originalPrice = ticketData[2] as bigint;
              const resalePrice = listingData[2] as bigint;

              const discount = originalPrice > 0n
                ? Number((originalPrice - resalePrice) * 100n / originalPrice)
                : 0;

              activeListings.push({
                tokenId,
                seller: listingData[1] as string,
                price: resalePrice,
                eventId,
                originalPrice,
                resaleCount: Number(ticketData[3]),
                eventTitle: `Event #${eventId}`,
                eventVenue: 'Venue',
                eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                discount,
              });
            }
          }
        } catch (err) {
          continue;
        }
      }

      setListings(activeListings);
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter((listing) => {
    switch (filter) {
      case 'deals': return listing.discount && listing.discount > 0;
      case 'premium': return !listing.discount || listing.discount <= 0;
      default: return true;
    }
  });

  return (
    <div className="min-h-screen pt-[72px] pb-16 px-4">
      <div className="dp-container">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => router.push('/')} className="dp-btn-ghost mb-4" style={{ padding: '4px 0', color: 'var(--text-muted)' }}>
            <ArrowLeft size={14} /> Home
          </button>
          <h1 className="text-[28px] md:text-[32px] font-semibold tracking-[-0.03em] mb-2">
            Marketplace
          </h1>
          <p className="text-[15px]" style={{ color: 'var(--text-secondary)' }}>
            Browse verified ticket resales with anti-scalping protection.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="dp-surface p-5">
            <div className="flex items-center gap-2 mb-2">
              <Ticket size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em]" style={{ color: 'var(--text-muted)' }}>Listings</span>
            </div>
            <p className="text-[24px] font-semibold">{listings.length}</p>
          </div>
          <div className="dp-surface p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em]" style={{ color: 'var(--text-muted)' }}>Best Deal</span>
            </div>
            <p className="text-[24px] font-semibold">
              {listings.length > 0 ? Math.max(...listings.map(l => l.discount || 0)) : 0}%
            </p>
          </div>
          <div className="dp-surface p-5">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em]" style={{ color: 'var(--text-muted)' }}>Protected</span>
            </div>
            <p className="text-[24px] font-semibold">100%</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {(['all', 'deals', 'premium'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`dp-tab ${filter === f ? 'dp-tab-active' : ''}`}
              >
                {f === 'all' ? 'All' : f === 'deals' ? 'Below Original' : 'Premium'}
              </button>
            ))}
          </div>
          <button onClick={loadListings} className="dp-btn-ghost" style={{ padding: '8px' }}>
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="dp-surface p-5 space-y-3">
                <div className="dp-skeleton h-[120px] rounded-lg" />
                <div className="dp-skeleton h-4 w-3/4" />
                <div className="dp-skeleton h-3 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filteredListings.length === 0 && (
          <div className="dp-surface p-16 text-center max-w-lg mx-auto">
            <Ticket size={32} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <h3 className="text-[18px] font-semibold mb-2">No Listings Found</h3>
            <p className="text-[14px] mb-6" style={{ color: 'var(--text-secondary)' }}>
              {filter === 'all' ? 'No tickets available for resale yet.' : `No ${filter} listings at the moment.`}
            </p>
            {filter !== 'all' && (
              <button onClick={() => setFilter('all')} className="dp-btn-secondary">View All</button>
            )}
          </div>
        )}

        {/* Grid */}
        {!loading && filteredListings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredListings.map((listing) => (
              <div
                key={listing.tokenId}
                onClick={() => router.push(`/marketplace/${listing.tokenId}`)}
                className="dp-surface-interactive overflow-hidden cursor-pointer"
              >
                <div className="h-[120px] flex items-center justify-center" style={{ backgroundColor: 'var(--surface-elevated)' }}>
                  {listing.eventImageUrl ? (
                    <img src={listing.eventImageUrl} alt={listing.eventTitle} className="w-full h-full object-cover" />
                  ) : (
                    <Ticket size={28} style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-[14px] font-semibold line-clamp-2 flex-1 mr-2">
                      {listing.eventTitle || `Event #${listing.eventId}`}
                    </h3>
                    {listing.discount && listing.discount > 0 ? (
                      <span className="dp-badge dp-badge-active">{listing.discount}% Off</span>
                    ) : listing.discount && listing.discount < 0 ? (
                      <span className="dp-badge dp-badge-listed">Premium</span>
                    ) : (
                      <span className="dp-badge" style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-muted)' }}>Fair</span>
                    )}
                  </div>

                  <div className="space-y-1 mb-4 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={11} />
                      <span className="line-clamp-1">{listing.eventVenue || 'Venue TBD'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={11} />
                      <span>
                        {listing.eventDate
                          ? new Date(listing.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'Date TBD'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ArrowLeftRight size={11} />
                      <span>Resold {listing.resaleCount}×</span>
                    </div>
                  </div>

                  <hr className="dp-divider mb-3" />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Resale</p>
                      <p className="text-[16px] font-semibold">{formatEther(listing.price)} ETH</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Original</p>
                      <p className="text-[13px] line-through" style={{ color: 'var(--text-muted)' }}>
                        {formatEther(listing.originalPrice)} ETH
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Protection */}
        {!loading && filteredListings.length > 0 && (
          <div className="mt-10 dp-surface p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} style={{ color: 'var(--accent)' }} />
              <p className="text-[13px] font-semibold">Buyer Protection</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                'All resale tickets are verified NFTs on the blockchain',
                'Price caps prevent scalping and excessive markups',
                'Atomic escrow ensures safe payment and instant transfer',
                'No chargebacks or fraudulent reversals',
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                  <CheckCircle2 size={11} style={{ color: 'var(--success)' }} />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

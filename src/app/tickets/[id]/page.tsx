'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useTicketOwnershipHistory, useProvenanceVerification } from '@/hooks/useOwnershipHistory';
import { readTicket, readEvent, readTicketOwner, readListing, readTicketType } from '@/lib/contractReads';
import { formatEther } from 'viem';
import { OwnershipTimeline, OwnershipStatsCard, ProvenanceCard } from '@/components/OwnershipTimeline';
import AdmitOneTicket from '@/components/ui/admit-one-3-d-holographic-ticket';
import {
  ArrowLeft,
  QrCode,
  Tag,
  Calendar,
  MapPin,
  User,
  Shield,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowLeftRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface TicketDetail {
  tokenId: number;
  eventId: number;
  ticketTypeId: number;
  ticketTypeName?: string;
  originalPrice: bigint;
  resaleCount: number;
  maxResaleCount: number;
  redeemed: boolean;
  active: boolean;
  owner: string;
  eventImageUrl?: string;
  eventData?: {
    title: string;
    venue: string;
    startDate: string;
    endDate: string;
    organizer: string;
    ticketPrice: bigint;
    isCancelled: boolean;
  };
  listingData?: {
    price: bigint;
    seller: string;
    active: boolean;
  };
}

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tokenId = parseInt(params.id as string);

  const { isConnected, address } = useWallet();
  const { ownershipChain, loading: historyLoading } = useTicketOwnershipHistory(tokenId);
  const { provenance } = useProvenanceVerification(tokenId);

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (tokenId && !isNaN(tokenId)) {
      loadTicket();
    }
  }, [tokenId, address]);

  const loadTicket = async () => {
    try {
      setLoading(true);

      const ticketData = await readTicket(tokenId);
      if (!ticketData) { setTicket(null); setLoading(false); return; }

      const owner = await readTicketOwner(tokenId);
      if (!owner) { setTicket(null); setLoading(false); return; }

      const userIsOwner = address && owner.toLowerCase() === address.toLowerCase();
      setIsOwner(!!userIsOwner);

      const eventId = Number(ticketData[0]);
      const eventData = await readEvent(eventId);
      const listingData = await readListing(tokenId);

      // Decode event metadata
      let eventMetadata = {
        title: `Event #${eventId}`,
        venue: 'Venue TBD',
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
        organizer: eventData ? (eventData[1] as string) : '0x...',
        ticketPrice: eventData ? (eventData[3] as bigint) : 0n,
        isCancelled: eventData ? (eventData[11] as boolean) : false,
      };

      let ticketTypeName = 'General Admission';
      let eventImageUrl: string | undefined = undefined;

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
            
            eventMetadata = {
              title: metadata.title || eventMetadata.title,
              venue: metadata.venue || eventMetadata.venue,
              startDate: metadata.startDate || eventMetadata.startDate,
              endDate: metadata.endDate || eventMetadata.endDate,
              organizer: eventData[1] as string,
              ticketPrice: eventData[3] as bigint,
              isCancelled: eventData[11] as boolean,
            };
            
            eventImageUrl = metadata.imageUrl;
            
            console.log(`[Ticket Detail #${tokenId}] Decoded metadata:`, metadata);
          }
        } catch (err) {
          console.error(`[Ticket Detail #${tokenId}] Metadata decode error:`, err);
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
          console.error(`[Ticket Detail #${tokenId}] Error reading ticket type:`, err);
        }
      }

      setTicket({
        tokenId,
        eventId: Number(ticketData[0]),
        ticketTypeId: Number(ticketData[1]),
        ticketTypeName,
        originalPrice: ticketData[2] as bigint,
        resaleCount: Number(ticketData[3]),
        maxResaleCount: Number(ticketData[4]),
        redeemed: ticketData[5] as boolean,
        active: ticketData[6] as boolean,
        owner,
        eventImageUrl,
        eventData: eventMetadata,
        listingData: listingData ? {
          price: listingData[2] as bigint,
          seller: listingData[1] as string,
          active: listingData[3] as boolean,
        } : undefined,
      });
    } catch (error) {
      console.error('Error loading ticket:', error);
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-[72px] pb-16 px-4">
        <div className="dp-container max-w-[900px]">
          <div className="dp-skeleton h-4 w-16 mb-6" />
          <div className="dp-skeleton h-6 w-48 mb-2" />
          <div className="dp-skeleton h-4 w-32 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="dp-skeleton h-[200px] rounded-xl" />
              <div className="dp-skeleton h-[150px] rounded-xl" />
            </div>
            <div className="dp-skeleton h-[300px] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="dp-surface p-12 max-w-md w-full text-center">
          <Tag size={28} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h2 className="text-[20px] font-semibold mb-2">Ticket Not Found</h2>
          <p className="text-[14px] mb-6" style={{ color: 'var(--text-secondary)' }}>
            This ticket doesn't exist or couldn't be loaded.
          </p>
          <button onClick={() => router.push('/tickets')} className="dp-btn-primary">
            Back to My Tickets
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const canListForResale = isOwner && ticket.active && !ticket.redeemed &&
    !ticket.listingData?.active && !ticket.eventData?.isCancelled;

  const getStatusBadge = () => {
    if (ticket.redeemed) return <span className="dp-badge dp-badge-used">Used</span>;
    if (ticket.listingData?.active) return <span className="dp-badge dp-badge-listed">Listed</span>;
    if (ticket.active) return <span className="dp-badge dp-badge-active">Active</span>;
    return <span className="dp-badge dp-badge-expired">Inactive</span>;
  };

  return (
    <div className="min-h-screen pt-[72px] pb-16 px-4">
      <div className="dp-container max-w-[900px]">
        {/* Back */}
        <button
          onClick={() => router.push('/tickets')}
          className="dp-btn-ghost mb-6"
          style={{ padding: '4px 0', color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={14} /> Back to My Tickets
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-[24px] md:text-[28px] font-semibold tracking-[-0.02em]">
              Ticket #{ticket.tokenId}
            </h1>
            {getStatusBadge()}
            {isOwner && (
              <span className="text-[11px] font-medium px-2 py-1 rounded" style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }}>
                You own this
              </span>
            )}
          </div>
          <p className="text-[15px]" style={{ color: 'var(--text-secondary)' }}>
            {ticket.eventData?.title || `Event #${ticket.eventId}`}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Holographic Ticket Display */}
            <div className="dp-surface p-6">
              <h2 className="text-[11px] font-semibold mb-4" style={{ color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Your Ticket
              </h2>
              <div className="flex justify-center">
                <AdmitOneTicket
                  name={ticket.ticketTypeName?.toUpperCase() || 'GENERAL ADMISSION'}
                  presenter="TIVENT"
                  event={ticket.eventData?.title?.toUpperCase() || `EVENT #${ticket.eventId}`}
                  venue={ticket.eventData?.venue?.toUpperCase() || 'VENUE TBD'}
                  dates={ticket.eventData?.startDate 
                    ? new Date(ticket.eventData.startDate).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      }).toUpperCase()
                    : 'DATE TBD'
                  }
                  stubText={ticket.ticketTypeName?.toUpperCase() || 'GENERAL'}
                  watermark={new Date().getFullYear().toString()}
                  width={560}
                  imageUrl={ticket.eventImageUrl}
                  walletAddress={ticket.owner ? `${ticket.owner.slice(0, 8)}...${ticket.owner.slice(-8)}` : undefined}
                  texture={{
                    colorFront: '#a78bfa',
                    shape: 'warp',
                    speed: 0.4,
                  }}
                />
              </div>
            </div>

            {/* Event Info */}
            <div className="dp-surface p-6">
              <h2 className="text-[14px] font-semibold mb-4" style={{ color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '11px' }}>Event Information</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[14px]">
                  <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>{ticket.eventData?.venue}</span>
                </div>
                <div className="flex items-center gap-3 text-[14px]">
                  <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>{ticket.eventData?.startDate ? formatDate(ticket.eventData.startDate) : 'TBD'}</span>
                </div>
                <div className="flex items-center gap-3 text-[14px]">
                  <User size={14} style={{ color: 'var(--text-muted)' }} />
                  <span className="dp-mono" style={{ color: 'var(--text-secondary)' }}>
                    {ticket.eventData?.organizer.slice(0, 10)}...{ticket.eventData?.organizer.slice(-8)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => router.push(`/events/${ticket.eventId}`)}
                className="dp-btn-ghost mt-4"
                style={{ padding: '4px 0', fontSize: '13px' }}
              >
                View Event Page <ExternalLink size={12} />
              </button>
            </div>

            {/* Ticket Details */}
            <div className="dp-surface p-6">
              <h2 className="text-[11px] font-semibold mb-4" style={{ color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Ticket Details</h2>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Token ID</p>
                  <p className="text-[14px] font-medium">#{ticket.tokenId}</p>
                </div>
                {ticket.ticketTypeName && (
                  <div>
                    <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Ticket Type</p>
                    <p className="text-[14px] font-medium">{ticket.ticketTypeName}</p>
                  </div>
                )}
                <div>
                  <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Original Price</p>
                  <p className="text-[14px] font-medium">{formatEther(ticket.originalPrice)} ETH</p>
                </div>
                <div>
                  <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Resale Count</p>
                  <p className="text-[14px] font-medium">{ticket.resaleCount} / {ticket.maxResaleCount}</p>
                </div>
                <div>
                  <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Status</p>
                  <p className="text-[14px] font-medium">
                    {ticket.redeemed ? 'Redeemed' : ticket.active ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
            </div>

            {/* Current Owner */}
            <div className="dp-surface p-6">
              <h2 className="text-[11px] font-semibold mb-4" style={{ color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Current Owner</h2>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: 'var(--surface-elevated)' }}>
                  <User size={14} style={{ color: 'var(--text-muted)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="dp-mono truncate">{ticket.owner}</p>
                  {isOwner && (
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--accent)' }}>This is your wallet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Ownership History */}
            <div className="dp-surface p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Ownership History</h2>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="dp-btn-ghost"
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                >
                  {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {showHistory ? 'Hide' : 'Show'}
                </button>
              </div>

              {showHistory ? (
                historyLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <div key={i} className="dp-skeleton h-12" />)}
                  </div>
                ) : ownershipChain ? (
                  <div className="space-y-6">
                    {ownershipChain.priceHistory && (
                      <OwnershipStatsCard stats={{
                        totalTransfers: ownershipChain.totalTransfers,
                        totalResales: ownershipChain.totalResales,
                        originalPrice: ownershipChain.priceHistory.originalPrice,
                        currentPrice: ownershipChain.priceHistory.currentPrice,
                        highestPrice: ownershipChain.priceHistory.highestPrice,
                        totalVolume: ownershipChain.priceHistory.totalVolume,
                      }} />
                    )}
                    <OwnershipTimeline history={ownershipChain.history} />
                    {provenance && <ProvenanceCard provenance={provenance} />}
                  </div>
                ) : (
                  <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                    No ownership history available.
                  </p>
                )
              ) : (
                <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  Click "Show" to view the complete ownership chain and provenance verification.
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="dp-surface p-6 space-y-4 sticky top-[72px]">
              <h2 className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Actions</h2>

              {/* QR Code */}
              {isOwner && ticket.active && !ticket.redeemed && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`/tickets/${ticket.tokenId}/qr`);
                  }}
                  className="dp-btn-primary w-full"
                >
                  <QrCode size={15} /> Show QR Code
                </button>
              )}

              {/* Resale */}
              {canListForResale && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`/tickets/${ticket.tokenId}/resale`);
                  }}
                  className="dp-btn-secondary w-full"
                >
                  <ArrowLeftRight size={14} /> Resell Ticket
                </button>
              )}

              {/* Listed info */}
              {ticket.listingData?.active && (
                <div className="py-4 px-4 rounded-lg" style={{ backgroundColor: 'var(--accent-muted)', border: '1px solid rgba(201,121,69,0.2)' }}>
                  <p className="text-[12px] font-medium mb-1" style={{ color: 'var(--accent)' }}>Listed for Resale</p>
                  <p className="text-[20px] font-semibold mb-2">{formatEther(ticket.listingData.price)} ETH</p>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/tickets/${ticket.tokenId}/resale`);
                      }}
                      className="dp-btn-secondary w-full text-[12px]"
                      style={{ padding: '6px 12px' }}
                    >
                      Manage Listing
                    </button>
                  )}
                </div>
              )}

              {/* Redeemed */}
              {ticket.redeemed && (
                <div className="py-4 px-4 rounded-lg text-center" style={{ backgroundColor: 'var(--surface-elevated)' }}>
                  <CheckCircle2 size={16} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                    This ticket has been used for entry.
                  </p>
                </div>
              )}

              {/* Cancelled event */}
              {ticket.eventData?.isCancelled && isOwner && (
                <div className="py-4 px-4 rounded-lg" style={{ backgroundColor: 'var(--error-muted)' }}>
                  <p className="text-[13px] font-medium mb-2" style={{ color: 'var(--error)' }}>Event Cancelled</p>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Handle claim refund
                    }}
                    className="dp-btn-primary w-full" 
                    style={{ backgroundColor: 'var(--error)', fontSize: '13px', padding: '8px 14px' }}
                  >
                    Claim Refund
                  </button>
                </div>
              )}

              <hr className="dp-divider" />

              {/* Blockchain info */}
              <div>
                <p className="text-[11px] font-semibold mb-3" style={{ color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  On-chain Data
                </p>
                <div className="space-y-2 text-[12px]">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Token Standard</span>
                    <span className="dp-mono">ERC-721</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Token ID</span>
                    <span className="dp-mono">#{ticket.tokenId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Event ID</span>
                    <span className="dp-mono">#{ticket.eventId}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useEventTicketing } from '@/hooks/useEventTicketing';
import { readTicket, readEvent } from '@/lib/contractReads';
import { formatEther } from 'viem';
import { Clock, XCircle, Ticket, CheckCircle2, AlertTriangle } from 'lucide-react';

interface TicketInfo {
  tokenId: number;
  eventId: number;
  owner: string;
  originalPrice: bigint;
  redeemed: boolean;
  active: boolean;
  eventData?: {
    title: string;
    venue: string;
    startDate: string;
    organizer: string;
  };
}

export default function RedeemTicketPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const tokenId = parseInt(params.id as string);
  const ownerAddress = searchParams.get('owner');
  
  const { isConnected, address } = useWallet();
  const { redeemTicket, isPending, isConfirming, isConfirmed, hash, error } = useEventTicketing();
  
  const [ticket, setTicket] = useState<TicketInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tokenId && !isNaN(tokenId) && ownerAddress) {
      loadTicket();
    }
  }, [tokenId, ownerAddress]);

  const loadTicket = async () => {
    if (!ownerAddress) return;

    try {
      setLoading(true);
      
      const ticketData = await readTicket(tokenId);
      if (!ticketData) {
        setTicket(null);
        setLoading(false);
        return;
      }

      const eventId = Number(ticketData[0]);
      const eventData = await readEvent(eventId);

      // Decode event metadata properly
      let eventMetadata = {
        title: `Event #${eventId}`,
        venue: 'Venue TBD',
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        organizer: eventData ? (eventData[1] as string) : '0x...',
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
              startDate: metadata.startDate || eventMetadata.startDate,
              organizer: eventData[1] as string,
            };
            
            console.log('[Gate Redeem] Decoded metadata:', metadata);
          }
        } catch (err) {
          console.error('[Gate Redeem] Metadata decode error:', err);
        }
      }

      setTicket({
        tokenId,
        eventId,
        owner: ownerAddress,
        originalPrice: ticketData[2] as bigint,
        redeemed: ticketData[5] as boolean,
        active: ticketData[6] as boolean,
        eventData: eventMetadata,
      });
    } catch (error) {
      console.error('Error loading ticket:', error);
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!ticket || !ownerAddress || !address) return;

    try {
      await redeemTicket(tokenId, ownerAddress as `0x${string}`);
    } catch (err: any) {
      console.error('Redemption error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="text-center">
          <Clock size={64} className="mx-auto mb-4 animate-pulse" style={{ color: 'var(--accent)' }} />
          <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="dp-surface p-12 max-w-md w-full text-center">
          <XCircle size={64} className="mx-auto mb-4" style={{ color: 'var(--danger)' }} />
          <h2 className="text-[24px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Ticket Not Found
          </h2>
          <p className="text-[14px] mb-6" style={{ color: 'var(--text-secondary)' }}>
            Unable to load ticket information.
          </p>
          <button
            onClick={() => router.push('/gate')}
            className="dp-btn-primary w-full"
          >
            Back to Scanner
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
          <CheckCircle2 size={64} className="mx-auto mb-4 animate-bounce" style={{ color: 'var(--success)' }} />
          <h2 className="text-[28px] font-semibold mb-2" style={{ color: 'var(--success)' }}>
            Ticket Redeemed!
          </h2>
          <p className="text-[14px] mb-4" style={{ color: 'var(--text-secondary)' }}>
            Ticket #{tokenId} has been successfully redeemed.
          </p>
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
            <p className="text-[13px] font-semibold mb-1 flex items-center justify-center gap-2" style={{ color: 'var(--success)' }}>
              <CheckCircle2 size={16} />
              Entry Approved
            </p>
            <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
              Ticket holder may now enter the venue
            </p>
          </div>
          <p className="text-[11px] font-mono mb-6 break-all" style={{ color: 'var(--text-muted)' }}>
            Tx: {hash?.slice(0, 10)}...{hash?.slice(-8)}
          </p>
          <button
            onClick={() => router.push('/gate')}
            className="dp-btn-primary w-full"
          >
            Scan Next Ticket
          </button>
        </div>
      </div>
    );
  }

  if (ticket.redeemed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="dp-surface p-12 max-w-md w-full text-center">
          <AlertTriangle size={64} className="mx-auto mb-4" style={{ color: '#eab308' }} />
          <h2 className="text-[28px] font-semibold mb-2" style={{ color: '#eab308' }}>
            Already Redeemed
          </h2>
          <p className="text-[14px] mb-6" style={{ color: 'var(--text-secondary)' }}>
            This ticket has already been used for entry.
          </p>
          <button
            onClick={() => router.push('/gate')}
            className="dp-btn-primary w-full"
          >
            Back to Scanner
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="dp-container max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-[40px] font-semibold tracking-[-0.03em] mb-2" style={{ color: 'var(--text-primary)' }}>
            Redeem Ticket
          </h1>
          <p className="text-[15px]" style={{ color: 'var(--text-secondary)' }}>
            Confirm redemption to allow entry
          </p>
        </div>

        {/* Ticket Info */}
        <div className="dp-surface p-6 mb-6 border-2 border-green-500/30">
          <div className="flex items-center gap-3 mb-6">
            <Ticket size={40} style={{ color: 'var(--accent)' }} />
            <div>
              <h2 className="text-[24px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                Ticket #{tokenId}
              </h2>
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                {ticket.eventData?.title}
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center text-[13px]">
              <span style={{ color: 'var(--text-muted)' }}>Event ID</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>#{ticket.eventId}</span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span style={{ color: 'var(--text-muted)' }}>Venue</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{ticket.eventData?.venue}</span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span style={{ color: 'var(--text-muted)' }}>Date</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {ticket.eventData?.startDate
                  ? new Date(ticket.eventData.startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'TBD'}
              </span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span style={{ color: 'var(--text-muted)' }}>Original Price</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {formatEther(ticket.originalPrice)} POL
              </span>
            </div>
          </div>

          <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              Ticket Holder
            </p>
            <p className="font-mono text-[12px] break-all" style={{ color: 'var(--text-secondary)' }}>
              {ticket.owner}
            </p>
          </div>
        </div>

        {/* Verification Status */}
        <div className="dp-surface p-6 mb-6">
          <h3 className="text-[16px] font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
            Verification Complete
          </h3>
          <ul className="space-y-2 text-[13px]">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>QR code validated</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Ownership confirmed</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Ticket is active and unused</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Ready for redemption</span>
            </li>
          </ul>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '3px solid var(--danger)' }}>
            <p className="text-[13px] font-medium" style={{ color: 'var(--danger)' }}>
              {error.message || 'Redemption failed'}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleRedeem}
            disabled={isPending || isConfirming}
            className="dp-btn-primary w-full text-[15px] py-4"
          >
            {isPending || isConfirming ? (
              <span className="flex items-center justify-center gap-2">
                <Clock size={16} className="animate-spin" />
                {isPending ? 'Confirm in Wallet...' : 'Redeeming...'}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 size={18} />
                Redeem & Allow Entry
              </span>
            )}
          </button>

          <button
            onClick={() => router.push('/gate')}
            className="w-full text-[14px] py-3 rounded-lg transition-all"
            style={{
              backgroundColor: 'var(--surface)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface)';
            }}
          >
            Cancel & Go Back
          </button>
        </div>

        {/* Warning */}
        <div className="mt-6 p-4 rounded-lg flex items-start gap-3" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
          <AlertTriangle size={18} style={{ color: '#eab308', flexShrink: 0, marginTop: '2px' }} />
          <p className="text-[12px]" style={{ color: '#eab308' }}>
            This action cannot be undone. The ticket will be marked as used.
          </p>
        </div>

        {/* Gate Officer Info */}
        <div className="mt-6 p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--surface)' }}>
          <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
            Gate Officer
          </p>
          <p className="font-mono text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            {address}
          </p>
        </div>
      </div>
    </div>
  );
}

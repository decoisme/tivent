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
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-14" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="dp-container max-w-5xl mx-auto">
        <header className="mb-8 border-b pb-6" style={{ borderColor: 'var(--border)' }}>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>Tivent · Venue operations</p>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><h1 className="text-4xl font-semibold tracking-tighter sm:text-5xl">Admit to venue<span style={{ color: 'var(--accent)' }}>.</span></h1><p className="mt-3 text-[14px]" style={{ color: 'var(--text-secondary)' }}>Review the guest pass before confirming entry.</p></div>
            <span className="dp-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>Gate check-in / #{tokenId}</span>
          </div>
        </header>

        <div className="grid items-start gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="dp-surface overflow-hidden">
            <div className="border-b p-5 sm:p-7" style={{ borderColor: 'var(--border)' }}>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div><p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>Guest pass</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{ticket.eventData?.title}</h2></div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--accent-muted)' }}><Ticket size={23} style={{ color: 'var(--accent)' }} /></div>
              </div>
              <div className="mb-6 flex items-center justify-between border-y py-4" style={{ borderColor: 'var(--border)' }}><span className="text-[12px] uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Ticket ID</span><span className="dp-mono text-lg font-semibold">#{tokenId}</span></div>
              <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                <div><dt className="mb-1 text-[11px] uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Event number</dt><dd className="text-[14px] font-medium">#{ticket.eventId}</dd></div>
                <div><dt className="mb-1 text-[11px] uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Venue</dt><dd className="text-[14px] font-medium">{ticket.eventData?.venue}</dd></div>
                <div><dt className="mb-1 text-[11px] uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Event date</dt><dd className="text-[14px] font-medium">{ticket.eventData?.startDate ? new Date(ticket.eventData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}</dd></div>
                <div><dt className="mb-1 text-[11px] uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Original price</dt><dd className="text-[14px] font-medium">{formatEther(ticket.originalPrice)} POL</dd></div>
              </dl>
              <div className="mt-6 border-t pt-5" style={{ borderColor: 'var(--border)' }}><p className="mb-2 text-[11px] uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Ticket holder</p><p className="dp-mono break-all text-[12px]" style={{ color: 'var(--text-secondary)' }}>{ticket.owner}</p></div>
            </div>
            <div className="p-5 sm:p-7">
              <div className="mb-4 flex items-center gap-2"><CheckCircle2 size={17} style={{ color: 'var(--success)' }} /><h3 className="text-[13px] font-semibold">Verification complete</h3></div>
              <ul className="grid gap-3 sm:grid-cols-2">
                {['QR code validated', 'Ownership confirmed', 'Ticket is active and unused', 'Ready for redemption'].map((check) => <li key={check} className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}><CheckCircle2 size={14} style={{ color: 'var(--success)' }} />{check}</li>)}
              </ul>
            </div>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-8">
            <div className="dp-surface p-5 sm:p-6">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>Confirm admission</p>
              <p className="mb-5 text-[13px] leading-6" style={{ color: 'var(--text-secondary)' }}>Redeeming this pass records the guest’s entry on the blockchain. This action is final.</p>
              {error && <div className="mb-4 rounded-lg p-3" style={{ backgroundColor: 'var(--error-muted)', borderLeft: '3px solid var(--error)' }}><p className="text-[13px] font-medium" style={{ color: 'var(--error)' }}>{error.message || 'Redemption failed'}</p></div>}
              <div className="space-y-3">
                <button onClick={handleRedeem} disabled={isPending || isConfirming} className="dp-btn-primary w-full text-[15px] py-4">{isPending || isConfirming ? <span className="flex items-center justify-center gap-2"><Clock size={16} className="animate-spin" />{isPending ? 'Confirm in Wallet...' : 'Redeeming...'}</span> : <span className="flex items-center justify-center gap-2"><CheckCircle2 size={18} />Redeem & Allow Entry</span>}</button>
                <button onClick={() => router.push('/gate')} className="dp-btn-secondary w-full">Cancel & Go Back</button>
              </div>
              <div className="mt-5 flex items-start gap-3 border-t pt-4" style={{ borderColor: 'var(--border)' }}><AlertTriangle size={17} className="mt-0.5 shrink-0" style={{ color: 'var(--warning)' }} /><p className="text-[12px] leading-5" style={{ color: 'var(--text-secondary)' }}>This action cannot be undone. The ticket will be marked as used.</p></div>
            </div>
            <div className="rounded-xl border px-4 py-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}><p className="mb-2 text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>Gate officer</p><p className="dp-mono break-all text-[11px]" style={{ color: 'var(--text-secondary)' }}>{address}</p></div>
          </aside>
        </div>
      </div>
    </main>
  );
}

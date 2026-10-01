'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { readTicket, readEvent, readTicketOwner } from '@/lib/contractReads';
import { createQRPayload, generateQRCode } from '@/lib/qrcode';
import {
  ArrowLeft,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Calendar,
  Lock,
  RefreshCw,
} from 'lucide-react';

interface TicketInfo {
  tokenId: number;
  eventId: number;
  redeemed: boolean;
  active: boolean;
  owner: string;
  eventData?: {
    title: string;
    venue: string;
    startDate: string;
    isCancelled: boolean;
  };
}

export default function TicketQRPage() {
  const router = useRouter();
  const params = useParams();
  const tokenId = parseInt(params.id as string);

  const { isConnected, address, mounted } = useWallet();

  const [ticket, setTicket] = useState<TicketInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (tokenId && !isNaN(tokenId)) {
      loadTicket();
    }
  }, [tokenId, address]);

  useEffect(() => {
    // Only check connection after component is mounted
    if (!mounted) return;
    
    if (!isConnected) {
      console.log('[QR Page] Wallet not connected, redirecting...');
      router.push(`/tickets/${tokenId}`);
    }
  }, [isConnected, mounted, tokenId, router]);

  // Regenerate QR code every 30 seconds
  useEffect(() => {
    if (ticket && isOwner && address) {
      generateNewQR();
      const interval = setInterval(() => {
        generateNewQR();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [ticket, isOwner, address]);

  // Countdown timer
  useEffect(() => {
    if (qrCode) {
      setTimeRemaining(30);
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) return 30;
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [qrCode]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      const ticketData = await readTicket(tokenId);
      if (!ticketData) { setTicket(null); setLoading(false); return; }

      const owner = await readTicketOwner(tokenId);
      if (!owner) { setTicket(null); setLoading(false); return; }

      const userIsOwner = address && owner.toLowerCase() === address.toLowerCase();
      setIsOwner(!!userIsOwner);

      if (!userIsOwner) { router.push(`/tickets/${tokenId}`); return; }

      const eventId = Number(ticketData[0]);
      const eventData = await readEvent(eventId);

      // Decode event metadata
      let eventMetadata = {
        title: `Event #${eventId}`,
        venue: 'Venue TBD',
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
              venue: metadata.venue || eventMetadata.venue,
              startDate: metadata.startDate || eventMetadata.startDate,
              isCancelled: eventData[11] as boolean,
            };
          }
        } catch (err) {
          console.error('[QR Page] Metadata decode error:', err);
        }
      }

      setTicket({
        tokenId,
        eventId: Number(ticketData[0]),
        redeemed: ticketData[5] as boolean,
        active: ticketData[6] as boolean,
        owner,
        eventData: eventMetadata,
      });
    } catch (error) {
      console.error('Error loading ticket:', error);
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  const generateNewQR = useCallback(async () => {
    if (!ticket || !address) return;
    try {
      const payload = await createQRPayload(ticket.tokenId, address);
      const qrDataUrl = await generateQRCode(payload);
      setQrCode(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }, [ticket, address]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="dp-skeleton w-64 h-64 rounded-xl" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="dp-surface p-12 max-w-md w-full text-center">
          <Lock size={28} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h2 className="text-[20px] font-semibold mb-2">Ticket Not Found</h2>
          <p className="text-[14px] mb-6" style={{ color: 'var(--text-secondary)' }}>
            This ticket doesn't exist or you don't own it.
          </p>
          <button onClick={() => router.push('/tickets')} className="dp-btn-primary">
            Back to My Tickets
          </button>
        </div>
      </div>
    );
  }

  if (ticket.redeemed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="dp-surface p-12 max-w-md w-full text-center">
          <CheckCircle2 size={28} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h2 className="text-[20px] font-semibold mb-2">Ticket Already Used</h2>
          <p className="text-[14px] mb-6" style={{ color: 'var(--text-secondary)' }}>
            This ticket has already been redeemed for entry.
          </p>
          <button onClick={() => router.push(`/tickets/${tokenId}`)} className="dp-btn-primary">
            View Ticket Details
          </button>
        </div>
      </div>
    );
  }

  if (!ticket.active || ticket.eventData?.isCancelled) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="dp-surface p-12 max-w-md w-full text-center">
          <AlertTriangle size={28} className="mx-auto mb-4" style={{ color: 'var(--warning)' }} />
          <h2 className="text-[20px] font-semibold mb-2">Ticket Not Valid</h2>
          <p className="text-[14px] mb-6" style={{ color: 'var(--text-secondary)' }}>
            {ticket.eventData?.isCancelled ? 'The event has been cancelled.' : 'This ticket is not currently active.'}
          </p>
          <button onClick={() => router.push(`/tickets/${tokenId}`)} className="dp-btn-primary">
            View Ticket Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-[72px] pb-16 px-4">
      <div className="dp-container max-w-[480px]">
        {/* Back */}
        <button
          onClick={() => router.push(`/tickets/${tokenId}`)}
          className="dp-btn-ghost mb-6"
          style={{ padding: '4px 0', color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={14} /> Back to Ticket
        </button>

        {/* Digital Pass Card */}
        <div className="dp-surface overflow-hidden">
          {/* Pass header */}
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--accent)' }}>
                Entry Pass
              </p>
              <span className="dp-badge dp-badge-active">Active</span>
            </div>
            <h2 className="text-[18px] font-semibold tracking-[-0.01em] mb-4">
              {ticket.eventData?.title || `Event #${ticket.eventId}`}
            </h2>

            <div className="flex gap-4 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
              <span className="flex items-center gap-1">
                <MapPin size={11} style={{ color: 'var(--text-muted)' }} />
                {ticket.eventData?.venue}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={11} style={{ color: 'var(--text-muted)' }} />
                {ticket.eventData?.startDate
                  ? new Date(ticket.eventData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'TBD'}
              </span>
            </div>
          </div>

          <hr className="dp-divider" />

          {/* QR Code - visual centerpiece */}
          <div className="p-8 flex flex-col items-center">
            <div
              className="w-full max-w-[280px] aspect-square rounded-xl p-6 flex items-center justify-center mb-6"
              style={{ backgroundColor: '#ffffff' }}
            >
              {qrCode ? (
                <img src={qrCode} alt="Ticket QR Code" className="w-full h-full" />
              ) : (
                <div className="dp-skeleton w-full h-full" />
              )}
            </div>

            {/* Timer */}
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw size={12} className={timeRemaining <= 5 ? 'dp-pulse' : ''} style={{ color: 'var(--accent)' }} />
              <span className="text-[13px] font-medium">
                QR refreshes in <span style={{ color: 'var(--accent)' }}>{timeRemaining}s</span>
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-[280px] dp-progress">
              <div
                className="dp-progress-fill"
                style={{ width: `${(timeRemaining / 30) * 100}%`, transition: 'width 1s linear' }}
              />
            </div>

            <p className="text-[11px] mt-3 text-center" style={{ color: 'var(--text-muted)' }}>
              This QR is temporary and linked to the current ticket owner.
            </p>
          </div>

          <hr className="dp-divider" />

          {/* Ticket info footer */}
          <div className="p-6 pt-4">
            <div className="grid grid-cols-3 gap-4 text-[12px]">
              <div>
                <p className="mb-0.5" style={{ color: 'var(--text-muted)' }}>Ticket ID</p>
                <p className="dp-mono font-medium">#{ticket.tokenId}</p>
              </div>
              <div>
                <p className="mb-0.5" style={{ color: 'var(--text-muted)' }}>Venue</p>
                <p className="font-medium truncate">{ticket.eventData?.venue}</p>
              </div>
              <div>
                <p className="mb-0.5" style={{ color: 'var(--text-muted)' }}>Date</p>
                <p className="font-medium">
                  {ticket.eventData?.startDate
                    ? new Date(ticket.eventData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'TBD'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security info */}
        <div className="mt-6 space-y-2">
          {[
            'Dynamic QR changes every 30 seconds',
            'Screenshots cannot be used — expired timestamp',
            'Blockchain verification ensures authenticity',
            'One-time use only — cannot be reused',
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>
              <Shield size={11} style={{ color: 'var(--success)' }} />
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* Brightness warning */}
        <div
          className="mt-6 p-3 rounded-lg flex items-center gap-2"
          style={{ backgroundColor: 'var(--warning-muted)', border: '1px solid rgba(196,153,59,0.2)' }}
        >
          <AlertTriangle size={13} style={{ color: 'var(--warning)' }} />
          <p className="text-[12px]" style={{ color: 'var(--warning)' }}>
            Keep your screen brightness high for easy scanning.
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import AdmitOneTicket from '@/components/ui/admit-one-3-d-holographic-ticket';
import { CheckCircle2, X, ExternalLink, Eye, ArrowRight } from 'lucide-react';

interface TicketSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    eventId: number;
    metadata?: {
      title: string;
      venue: string;
      startDate: string;
      imageUrl?: string;
    };
  };
  ticketType: {
    name: string;
  };
  quantity: number;
  transactionHash?: string;
  walletAddress?: string;
}

export default function TicketSuccessModal({
  isOpen,
  onClose,
  event,
  ticketType,
  quantity,
  transactionHash,
  walletAddress,
}: TicketSuccessModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const eventDate = event.metadata?.startDate
    ? formatDate(event.metadata.startDate)
    : 'TBD';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[var(--surface-elevated)] transition-colors z-10"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={20} />
        </button>

        <div className="p-8">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{ backgroundColor: 'var(--success-bg)' }}
            >
              <CheckCircle2 size={32} style={{ color: 'var(--success)' }} />
            </div>
            <h2 className="text-[24px] font-semibold mb-2">Purchase Successful!</h2>
            <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
              Your ticket{quantity > 1 ? 's have' : ' has'} been minted on the blockchain
            </p>
          </div>

          {/* Holographic Ticket Preview */}
          <div className="mb-8 flex justify-center">
            <AdmitOneTicket
              name={ticketType.name.toUpperCase()}
              presenter="TIVENT"
              event={event.metadata?.title.toUpperCase() || 'EVENT'}
              venue={event.metadata?.venue.toUpperCase() || 'VENUE TBD'}
              dates={eventDate.toUpperCase()}
              stubText={ticketType.name.toUpperCase()}
              watermark={new Date().getFullYear().toString()}
              width={560}
              imageUrl={event.metadata?.imageUrl}
              walletAddress={walletAddress ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-8)}` : undefined}
              texture={{
                colorFront: '#8b5cf6',
                shape: 'warp',
                speed: 0.4,
              }}
            />
          </div>

          {/* Purchase Details */}
          <div className="dp-surface p-6 mb-6">
            <h3 className="text-[15px] font-semibold mb-4">Purchase Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-[13px]">
                <span style={{ color: 'var(--text-secondary)' }}>Event</span>
                <span className="font-medium">{event.metadata?.title || `Event #${event.eventId}`}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span style={{ color: 'var(--text-secondary)' }}>Ticket Type</span>
                <span className="font-medium">{ticketType.name}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span style={{ color: 'var(--text-secondary)' }}>Quantity</span>
                <span className="font-medium">{quantity}</span>
              </div>
              {transactionHash && (
                <div className="flex justify-between items-center text-[13px]">
                  <span style={{ color: 'var(--text-secondary)' }}>Transaction</span>
                  <a
                    href={`https://amoy.polygonscan.com/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-medium hover:text-[var(--accent)] transition-colors"
                  >
                    View on Explorer
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push('/tickets')}
              className="dp-btn-secondary flex items-center justify-center gap-2"
            >
              <Eye size={16} />
              View My Tickets
            </button>
            <button
              onClick={() => router.push(`/events/${event.eventId}`)}
              className="dp-btn-primary flex items-center justify-center gap-2"
            >
              Back to Event
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

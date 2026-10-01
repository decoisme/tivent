'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useUserTickets } from '@/hooks/useUserTickets';
import { formatEther } from 'viem';
import {
  ArrowLeft,
  Ticket,
  QrCode,
  MapPin,
  Calendar,
  Tag,
  RefreshCw,
  Lock,
  Eye,
} from 'lucide-react';

export default function TicketsPage() {
  const router = useRouter();
  const { isConnected, address } = useWallet();
  const { tickets, loading, error, refreshTickets } = useUserTickets();

  const [filter, setFilter] = useState<'all' | 'active' | 'redeemed'>('active');

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="dp-surface p-12 max-w-md w-full text-center">
          <Lock size={28} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h2 className="text-[20px] font-semibold mb-2">Wallet Required</h2>
          <p className="text-[14px] mb-6" style={{ color: 'var(--text-secondary)' }}>
            Connect your wallet to view your tickets.
          </p>
          <button onClick={() => router.push('/')} className="dp-btn-primary">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const filteredTickets = tickets.filter((ticket) => {
    switch (filter) {
      case 'active': return ticket.active && !ticket.redeemed;
      case 'redeemed': return ticket.redeemed;
      default: return true;
    }
  });

  const activeCount = tickets.filter(t => t.active && !t.redeemed).length;
  const usedCount = tickets.filter(t => t.redeemed).length;

  const getStatusBadge = (ticket: any) => {
    if (ticket.redeemed) return <span className="dp-badge dp-badge-used">Used</span>;
    if (ticket.active) return <span className="dp-badge dp-badge-active">Active</span>;
    return <span className="dp-badge dp-badge-expired">Inactive</span>;
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
            My Tickets
          </h1>
          <p className="text-[15px]" style={{ color: 'var(--text-secondary)' }}>
            Your digital passes with on-chain ownership.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="dp-surface p-5">
            <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>Total</p>
            <p className="text-[24px] font-semibold">{tickets.length}</p>
          </div>
          <div className="dp-surface p-5">
            <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>Active</p>
            <p className="text-[24px] font-semibold" style={{ color: 'var(--success)' }}>{activeCount}</p>
          </div>
          <div className="dp-surface p-5">
            <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>Used</p>
            <p className="text-[24px] font-semibold">{usedCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {(['active', 'all', 'redeemed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`dp-tab ${filter === f ? 'dp-tab-active' : ''}`}
              >
                {f === 'active' ? 'Active' : f === 'all' ? 'All' : 'Used'}
              </button>
            ))}
          </div>
          <button onClick={refreshTickets} className="dp-btn-ghost" style={{ padding: '8px' }}>
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="dp-surface p-5">
                <div className="flex gap-4">
                  <div className="dp-skeleton w-16 h-16 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="dp-skeleton h-4 w-3/4" />
                    <div className="dp-skeleton h-3 w-1/2" />
                    <div className="dp-skeleton h-3 w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="dp-surface p-8 text-center">
            <p className="text-[14px] mb-4" style={{ color: 'var(--error)' }}>{error}</p>
            <button onClick={refreshTickets} className="dp-btn-primary">Try Again</button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filteredTickets.length === 0 && (
          <div className="dp-surface p-16 text-center max-w-lg mx-auto">
            <Ticket size={32} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <h3 className="text-[18px] font-semibold mb-2">
              {filter === 'all' ? 'No Tickets Yet' : filter === 'active' ? 'No Active Tickets' : 'No Used Tickets'}
            </h3>
            <p className="text-[14px] mb-6" style={{ color: 'var(--text-secondary)' }}>
              {filter === 'all' ? 'Purchase your first ticket to get started.' : `You don't have any ${filter} tickets.`}
            </p>
            {filter === 'all' ? (
              <button onClick={() => router.push('/events')} className="dp-btn-primary">
                Browse Events
              </button>
            ) : (
              <button onClick={() => setFilter('all')} className="dp-btn-secondary">
                View All Tickets
              </button>
            )}
          </div>
        )}

        {/* Tickets List — designed as premium digital passes */}
        {!loading && !error && filteredTickets.length > 0 && (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.tokenId}
                className="dp-surface-interactive overflow-hidden"
              >
                <div className="flex items-stretch">
                  {/* Left accent stripe */}
                  <div
                    className="w-1 flex-shrink-0"
                    style={{
                      backgroundColor: ticket.redeemed
                        ? 'var(--text-muted)'
                        : ticket.active
                        ? 'var(--accent)'
                        : 'var(--error)',
                    }}
                  />

                  {/* Content */}
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 mr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-[15px] font-semibold tracking-[-0.01em]">
                            {ticket.eventTitle || `Event #${ticket.eventId}`}
                          </h3>
                          {getStatusBadge(ticket)}
                        </div>
                        <p className="dp-mono" style={{ color: 'var(--text-muted)' }}>
                          Ticket #{ticket.tokenId}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mb-4 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={12} style={{ color: 'var(--text-muted)' }} />
                        {ticket.eventVenue || 'Venue TBD'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                        {ticket.eventDate
                          ? new Date(ticket.eventDate).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })
                          : 'Date TBD'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Tag size={12} style={{ color: 'var(--text-muted)' }} />
                        {formatEther(ticket.originalPrice)} ETH
                      </span>
                    </div>

                    {/* Resale info */}
                    {ticket.resaleCount > 0 && (
                      <p className="text-[11px] mb-3 py-1 px-2 rounded inline-block" style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-muted)' }}>
                        Resold {ticket.resaleCount}× (max: {ticket.maxResaleCount})
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/tickets/${ticket.tokenId}`)}
                        className="dp-btn-secondary"
                        style={{ padding: '7px 14px', fontSize: '13px' }}
                      >
                        <Eye size={13} /> Open Ticket
                      </button>
                      {ticket.active && !ticket.redeemed && (
                        <button
                          onClick={() => router.push(`/tickets/${ticket.tokenId}/qr`)}
                          className="dp-btn-accent-subtle"
                          style={{ padding: '7px 14px', fontSize: '13px' }}
                        >
                          <QrCode size={13} /> Show QR
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

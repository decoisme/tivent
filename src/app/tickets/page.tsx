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

  // Debug logging
  console.log('[TicketsPage] Render - tickets:', tickets.length, 'loading:', loading, 'error:', error);
  console.log('[TicketsPage] Tickets data:', tickets.map(t => ({ id: t.tokenId, event: t.eventTitle, active: t.active })));

  if (!isConnected) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-20">
        <div className="dp-surface w-full max-w-lg overflow-hidden rounded-2xl">
          <div className="h-1" style={{ background: 'var(--accent)' }} />
          <div className="px-7 py-12 text-center sm:px-12">
            <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}><Lock size={22} /></span>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>Private collection</p>
            <h2 className="text-2xl font-semibold tracking-tight">Your passes are waiting</h2>
            <p className="mx-auto mb-7 mt-3 max-w-sm text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>Connect the wallet that holds your tickets to view your collection and live entry codes.</p>
            <button onClick={() => router.push('/')} className="dp-btn-primary">Go to home to connect</button>
          </div>
        </div>
      </main>
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
    <main className="min-h-screen px-4 pb-20 pt-24 md:pt-28">
      <div className="dp-container max-w-6xl">
        <header className="mb-10 border-b pb-8" style={{ borderColor: 'var(--border)' }}>
          <button onClick={() => router.push('/')} className="dp-btn-ghost mb-8" style={{ padding: '4px 0', color: 'var(--text-muted)' }}><ArrowLeft size={14} /> Back home</button>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>Your collection · on-chain passes</p><h1 className="text-4xl font-semibold leading-none tracking-[-0.055em] md:text-6xl">The night is<br className="hidden sm:block" /> yours.</h1><p className="mt-4 max-w-lg text-[15px] leading-7" style={{ color: 'var(--text-secondary)' }}>Your tickets, ready when you are. Open a pass for details or bring up its live entry code at the door.</p></div>
            <div className="flex items-center gap-2 rounded-full border px-3 py-2" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}><span className="h-2 w-2 rounded-full" style={{ background: 'var(--success)' }} /><span className="dp-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Wallet connected'}</span></div>
          </div>
        </header>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-0 border-y" style={{ borderColor: 'var(--border)' }}>
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
          <div className="grid gap-4 md:grid-cols-2">
            {filteredTickets.map((ticket) => (
              <article
                key={ticket.tokenId}
                className="dp-surface-interactive overflow-hidden rounded-xl transition-transform duration-200 hover:-translate-y-0.5"
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
                  <div className="min-w-0 flex-1 p-5 sm:p-6">
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
                      {ticket.ticketTypeName && (
                        <span className="flex items-center gap-1.5">
                          <Ticket size={12} style={{ color: 'var(--text-muted)' }} />
                          {ticket.ticketTypeName}
                        </span>
                      )}
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
                    <div className="flex flex-wrap gap-2">
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
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

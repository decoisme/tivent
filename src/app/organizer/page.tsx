'use client';

import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useOrganizerAnalytics } from '@/hooks/useOrganizerAnalytics';
import { formatEther } from 'viem';
import {
  ArrowLeft,
  Plus,
  Ticket,
  DollarSign,
  BarChart3,
  RefreshCw,
  ArrowUpRight,
  TrendingUp,
  Users,
  Lock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export default function OrganizerDashboard() {
  const router = useRouter();
  const { isConnected, address } = useWallet();
  const { events, stats, loading, error, refreshData } = useOrganizerAnalytics();

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="dp-surface p-12 max-w-md w-full text-center">
          <Lock size={28} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h2 className="text-[20px] font-semibold mb-2">Wallet Required</h2>
          <p className="text-[14px] mb-6" style={{ color: 'var(--text-secondary)' }}>
            Connect your wallet to access the organizer dashboard.
          </p>
          <button onClick={() => router.push('/')} className="dp-btn-primary">Go to Home</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-[72px] pb-16 px-4">
        <div className="dp-container max-w-[1080px]">
          <div className="dp-skeleton h-8 w-48 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => <div key={i} className="dp-skeleton h-24 rounded-xl" />)}
          </div>
          <div className="dp-skeleton h-[300px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-[72px] pb-16 px-4">
      <div className="dp-container max-w-[1080px]">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <button
              onClick={() => router.push('/')}
              className="dp-btn-ghost mb-3"
              style={{ padding: '4px 0', color: 'var(--text-muted)' }}
            >
              <ArrowLeft size={14} /> Home
            </button>
            <h1 className="text-[28px] md:text-[32px] font-semibold tracking-[-0.03em] mb-1">
              Organizer Dashboard
            </h1>
            <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
              Manage your events and monitor ticket sales.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={refreshData} className="dp-btn-ghost" style={{ padding: '8px' }}>
              <RefreshCw size={14} />
            </button>
            <button onClick={() => router.push('/organizer/events/new')} className="dp-btn-primary">
              <Plus size={14} /> Create Event
            </button>
          </div>
        </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="dp-surface p-5">
            <div className="flex items-center gap-2 mb-3">
              <Ticket size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em]" style={{ color: 'var(--text-muted)' }}>
                Tickets Sold
              </span>
            </div>
            <p className="text-[24px] font-semibold">{stats.totalTicketsSold}</p>
          </div>

          <div className="dp-surface p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em]" style={{ color: 'var(--text-muted)' }}>
                Revenue
              </span>
            </div>
            <p className="text-[24px] font-semibold">{parseFloat(stats.totalRevenue).toFixed(4)}</p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>ETH</p>
          </div>

          <div className="dp-surface p-5">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em]" style={{ color: 'var(--text-muted)' }}>
                Total Events
              </span>
            </div>
            <p className="text-[24px] font-semibold">{stats.totalEvents}</p>
            <p className="text-[11px]" style={{ color: 'var(--success)' }}>{stats.activeEvents} active</p>
          </div>

          <div className="dp-surface p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em]" style={{ color: 'var(--text-muted)' }}>
                Avg Price
              </span>
            </div>
            <p className="text-[24px] font-semibold">{parseFloat(stats.averageTicketPrice).toFixed(4)}</p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>ETH / ticket</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          <button
            onClick={() => router.push('/gate')}
            className="dp-surface-interactive p-4 text-left flex items-center gap-3"
          >
            <Users size={16} style={{ color: 'var(--text-muted)' }} />
            <div>
              <p className="text-[13px] font-medium">Gate Scanner</p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Scan and verify tickets</p>
            </div>
            <ArrowUpRight size={14} className="ml-auto" style={{ color: 'var(--text-muted)' }} />
          </button>

          <button
            onClick={() => router.push('/admin/fraud')}
            className="dp-surface-interactive p-4 text-left flex items-center gap-3"
          >
            <AlertTriangle size={16} style={{ color: 'var(--text-muted)' }} />
            <div>
              <p className="text-[13px] font-medium">Fraud Detection</p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Monitor suspicious activity</p>
            </div>
            <ArrowUpRight size={14} className="ml-auto" style={{ color: 'var(--text-muted)' }} />
          </button>

          <button
            onClick={() => router.push('/resale')}
            className="dp-surface-interactive p-4 text-left flex items-center gap-3"
          >
            <TrendingUp size={16} style={{ color: 'var(--text-muted)' }} />
            <div>
              <p className="text-[13px] font-medium">Resale Activity</p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>View marketplace listings</p>
            </div>
            <ArrowUpRight size={14} className="ml-auto" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        {/* Events List */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-4" style={{ color: 'var(--text-muted)' }}>
            Your Events
          </p>

          {events.length === 0 ? (
            <div className="dp-surface p-16 text-center">
              <Ticket size={32} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
              <h3 className="text-[18px] font-semibold mb-2">No events yet</h3>
              <p className="text-[14px] mb-6" style={{ color: 'var(--text-secondary)' }}>
                Create your first event to start selling tickets.
              </p>
              <button onClick={() => router.push('/organizer/events/new')} className="dp-btn-primary">
                <Plus size={14} /> Create Event
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.eventId}
                  className="dp-surface-interactive p-5 cursor-pointer"
                  onClick={() => router.push(`/events/${event.eventId}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[15px] font-semibold">{event.title}</h3>
                        {event.isCancelled ? (
                          <span className="dp-badge dp-badge-expired">Cancelled</span>
                        ) : event.isPrimarySaleActive ? (
                          <span className="dp-badge dp-badge-active">Active</span>
                        ) : (
                          <span className="dp-badge dp-badge-used">Inactive</span>
                        )}
                      </div>
                      <p className="dp-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>Event #{event.eventId}</p>
                    </div>
                    <ArrowUpRight size={14} style={{ color: 'var(--text-muted)' }} />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Sold</p>
                      <p className="text-[15px] font-semibold">
                        {event.ticketsSold}
                        <span className="text-[12px] font-normal" style={{ color: 'var(--text-muted)' }}> / {event.maxTickets}</span>
                      </p>
                      <div className="dp-progress mt-1.5">
                        <div
                          className="dp-progress-fill"
                          style={{ width: `${event.maxTickets > 0 ? (event.ticketsSold / event.maxTickets) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Revenue</p>
                      <p className="text-[15px] font-semibold">{parseFloat(formatEther(event.totalRevenue)).toFixed(4)} ETH</p>
                    </div>
                    <div>
                      <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Price</p>
                      <p className="text-[15px] font-semibold">{parseFloat(formatEther(event.ticketPrice)).toFixed(4)} ETH</p>
                    </div>
                    <div>
                      <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Fill Rate</p>
                      <p className="text-[15px] font-semibold">
                        {event.maxTickets > 0 ? ((event.ticketsSold / event.maxTickets) * 100).toFixed(0) : '0'}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

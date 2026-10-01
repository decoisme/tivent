'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useOrganizerAnalytics } from '@/hooks/useOrganizerAnalytics';
import { useEventTicketing } from '@/hooks/useEventTicketing';
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
  X,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  XCircle,
} from 'lucide-react';

export default function OrganizerDashboard() {
  const router = useRouter();
  const { isConnected, address } = useWallet();
  const { events, stats, loading, error, refreshData } = useOrganizerAnalytics();
  const { cancelEvent, isPending, isConfirming } = useEventTicketing();
  
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());
  const [cancellingEventId, setCancellingEventId] = useState<number | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const toggleEventDetails = (eventId: number) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const handleCancelEvent = async (eventId: number) => {
    try {
      setCancellingEventId(eventId);
      await cancelEvent(eventId);
      setShowCancelDialog(false);
      // Refresh data after successful cancellation
      setTimeout(() => {
        refreshData();
        setCancellingEventId(null);
      }, 2000);
    } catch (error: any) {
      console.error('Error cancelling event:', error);
      alert(`Failed to cancel event: ${error.message || 'Unknown error'}`);
      setCancellingEventId(null);
    }
  };

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
            <p className="text-[24px] font-semibold">{stats.totalTicketsSold.toLocaleString()}</p>
          </div>

          <div className="dp-surface p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em]" style={{ color: 'var(--text-muted)' }}>
                Total Revenue
              </span>
            </div>
            <p className="text-[24px] font-semibold">{parseFloat(stats.totalRevenue).toFixed(4)}</p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>POL</p>
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
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>POL / ticket</p>
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
            Your Events ({events.length})
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
              {events.map((event) => {
                const isExpanded = expandedEvents.has(event.eventId);
                const fillRate = event.maxTickets > 0 ? (event.ticketsSold / event.maxTickets) * 100 : 0;
                
                return (
                  <div
                    key={event.eventId}
                    className="dp-surface overflow-hidden"
                  >
                    {/* Main Event Card */}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 mr-4">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-[16px] font-semibold">{event.title}</h3>
                            {event.isCancelled ? (
                              <span className="dp-badge dp-badge-expired">Cancelled</span>
                            ) : event.isPrimarySaleActive ? (
                              <span className="dp-badge dp-badge-active">Active</span>
                            ) : (
                              <span className="dp-badge dp-badge-used">Inactive</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                            <span className="dp-mono">Event #{event.eventId}</span>
                            <span className="flex items-center gap-1">
                              <MapPin size={11} />
                              {event.venue}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={11} />
                              {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => router.push(`/events/${event.eventId}`)}
                            className="dp-btn-ghost p-2"
                            title="View Event"
                          >
                            <ArrowUpRight size={14} />
                          </button>
                          {!event.isCancelled && event.ticketsSold === 0 && (
                            <button
                              onClick={() => {
                                setCancellingEventId(event.eventId);
                                setShowCancelDialog(true);
                              }}
                              className="dp-btn-ghost p-2 hover:bg-error/10"
                              style={{ color: 'var(--error)' }}
                              title="Cancel Event"
                            >
                              <XCircle size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => toggleEventDetails(event.eventId)}
                            className="dp-btn-ghost p-2"
                            title={isExpanded ? 'Hide Details' : 'Show Details'}
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Quick Stats */}
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
                              style={{ width: `${fillRate}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Revenue</p>
                          <p className="text-[15px] font-semibold">{parseFloat(formatEther(event.totalRevenue)).toFixed(4)}</p>
                          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>POL</p>
                        </div>
                        <div>
                          <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Ticket Types</p>
                          <p className="text-[15px] font-semibold">{event.ticketTypes.length}</p>
                        </div>
                        <div>
                          <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Fill Rate</p>
                          <p className="text-[15px] font-semibold">{fillRate.toFixed(0)}%</p>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-elevated)' }}>
                        <div className="p-5">
                          <h4 className="text-[13px] font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
                            TICKET TYPES BREAKDOWN
                          </h4>
                          <div className="space-y-2">
                            {event.ticketTypes.map((type) => (
                              <div
                                key={type.typeId}
                                className="flex items-center justify-between py-2 px-3 rounded-lg"
                                style={{ backgroundColor: 'var(--surface)' }}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <div>
                                    <p className="text-[13px] font-medium">{type.name}</p>
                                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                      {type.sold} / {type.maxSupply} sold
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-[13px] font-semibold">{type.pricePOL} POL</p>
                                  <p className="text-[11px]" style={{ color: type.available > 0 ? 'var(--success)' : 'var(--error)' }}>
                                    {type.available} left
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cancel Event Dialog */}
        {showCancelDialog && cancellingEventId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div className="dp-surface p-6 max-w-md w-full">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--error-muted)' }}>
                  <AlertTriangle size={20} style={{ color: 'var(--error)' }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-[16px] font-semibold mb-1">Cancel Event & Issue Refunds?</h3>
                  <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                    This will cancel the event and automatically refund all ticket holders. This action cannot be undone.
                  </p>
                </div>
              </div>

              {events.find(e => e.eventId === cancellingEventId)?.ticketsSold === 0 ? (
                <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: 'var(--success-muted)', border: '1px solid rgba(63,173,127,0.2)' }}>
                  <p className="text-[12px]" style={{ color: 'var(--success)' }}>
                    <CheckCircle2 size={12} className="inline mr-1" />
                    No tickets sold yet - safe to cancel
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: 'var(--warning-muted)', border: '1px solid rgba(196,153,59,0.2)' }}>
                  <p className="text-[12px]" style={{ color: 'var(--warning)' }}>
                    <AlertTriangle size={12} className="inline mr-1" />
                    {events.find(e => e.eventId === cancellingEventId)?.ticketsSold || 0} ticket holders will be refunded
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancelDialog(false);
                    setCancellingEventId(null);
                  }}
                  className="dp-btn-secondary flex-1"
                  disabled={isPending || isConfirming}
                >
                  Keep Event
                </button>
                <button
                  onClick={() => handleCancelEvent(cancellingEventId)}
                  className="dp-btn-primary flex-1"
                  style={{ backgroundColor: 'var(--error)' }}
                  disabled={isPending || isConfirming}
                >
                  {isPending || isConfirming ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="dp-pulse">●</span>
                      {isPending ? 'Confirm...' : 'Cancelling...'}
                    </span>
                  ) : (
                    'Cancel Event'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

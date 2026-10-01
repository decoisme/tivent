'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useFraudStatistics } from '@/hooks/useFraudDetection';
import { RiskBadge } from '@/components/RiskBadge';
import { RiskLevel, FraudFlag } from '@/lib/fraudDetection';
import { supabase } from '@/lib/supabase';
import { CustomSelect } from '@/components/ui/CustomSelect';
import {
  ArrowLeft,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Search,
  RefreshCw,
  Shield,
  ArrowUpRight,
  Activity,
  XCircle,
  RotateCcw,
} from 'lucide-react';

interface FraudFlagRecord {
  id: string;
  wallet_address: string;
  flag_type: FraudFlag;
  risk_score: number;
  risk_level: RiskLevel;
  reason: string;
  flagged_by: string;
  is_resolved: boolean;
  flagged_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

export default function FraudManagementPage() {
  const router = useRouter();
  const { isConnected, address } = useWallet();
  const { stats, loading: statsLoading, refreshStats } = useFraudStatistics();

  const [flags, setFlags] = useState<FraudFlagRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'resolved'>('active');
  const [filterRisk, setFilterRisk] = useState<'all' | RiskLevel>('all');
  const [searchAddress, setSearchAddress] = useState('');

  useEffect(() => {
    loadFlags();
  }, [filterStatus, filterRisk]);

  const loadFlags = async () => {
    try {
      setLoading(true);
      let query = supabase.from('fraud_flags').select('*').order('flagged_at', { ascending: false });

      if (filterStatus === 'active') query = query.eq('is_resolved', false);
      else if (filterStatus === 'resolved') query = query.eq('is_resolved', true);
      if (filterRisk !== 'all') query = query.eq('risk_level', filterRisk);
      if (searchAddress) query = query.ilike('wallet_address', `%${searchAddress}%`);

      const { data, error } = await query;
      if (error) { console.error('Error loading flags:', error); return; }
      setFlags(data || []);
    } catch (error) {
      console.error('Error loading fraud flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (flagId: string) => {
    try {
      const { error } = await supabase
        .from('fraud_flags')
        .update({ is_resolved: true, resolved_at: new Date().toISOString(), resolved_by: address || 'admin' })
        .eq('id', flagId);
      if (error) { alert('Failed to resolve flag'); return; }
      await loadFlags();
      refreshStats();
    } catch (error) { alert('Failed to resolve flag'); }
  };

  const handleUnresolve = async (flagId: string) => {
    try {
      const { error } = await supabase
        .from('fraud_flags')
        .update({ is_resolved: false, resolved_at: null, resolved_by: null })
        .eq('id', flagId);
      if (error) { alert('Failed to unresolve flag'); return; }
      await loadFlags();
      refreshStats();
    } catch (error) { alert('Failed to unresolve flag'); }
  };

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.CRITICAL: return 'var(--error)';
      case RiskLevel.HIGH: return 'var(--accent)';
      case RiskLevel.MEDIUM: return 'var(--warning)';
      default: return 'var(--text-muted)';
    }
  };

  const getRiskBg = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.CRITICAL: return 'var(--error-muted)';
      case RiskLevel.HIGH: return 'var(--accent-muted)';
      case RiskLevel.MEDIUM: return 'var(--warning-muted)';
      default: return 'var(--surface-elevated)';
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="dp-surface p-12 max-w-md w-full text-center">
          <Lock size={28} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h2 className="text-[20px] font-semibold mb-2">Admin Access Required</h2>
          <p className="text-[14px] mb-6" style={{ color: 'var(--text-secondary)' }}>
            Connect your wallet to access fraud management.
          </p>
          <button onClick={() => router.push('/')} className="dp-btn-primary">Go to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-[72px] pb-16 px-4">
      <div className="dp-container">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/organizer')}
            className="dp-btn-ghost mb-4"
            style={{ padding: '4px 0', color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={14} /> Dashboard
          </button>
          <h1 className="text-[28px] md:text-[32px] font-semibold tracking-[-0.03em] mb-2">
            Fraud Detection
          </h1>
          <p className="text-[15px]" style={{ color: 'var(--text-secondary)' }}>
            Monitor and manage flagged wallets and suspicious activity.
          </p>
        </div>

        {/* Metrics */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="dp-surface p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} style={{ color: 'var(--text-muted)' }} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em]" style={{ color: 'var(--text-muted)' }}>
                  Total Flags
                </span>
              </div>
              <p className="text-[24px] font-semibold">{stats.totalFlags}</p>
            </div>
            <div className="dp-surface p-5">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={14} style={{ color: 'var(--accent)' }} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em]" style={{ color: 'var(--text-muted)' }}>
                  Active
                </span>
              </div>
              <p className="text-[24px] font-semibold" style={{ color: 'var(--accent)' }}>{stats.activeFlags}</p>
            </div>
            <div className="dp-surface p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em]" style={{ color: 'var(--text-muted)' }}>
                  Resolved
                </span>
              </div>
              <p className="text-[24px] font-semibold" style={{ color: 'var(--success)' }}>{stats.resolvedFlags}</p>
            </div>
            <div className="dp-surface p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={14} style={{ color: 'var(--text-muted)' }} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em]" style={{ color: 'var(--text-muted)' }}>
                  By Level
                </span>
              </div>
              <div className="space-y-1 text-[12px]">
                {Object.entries(stats.byRiskLevel).map(([level, count]) => (
                  <div key={level} className="flex justify-between">
                    <span className="capitalize" style={{ color: 'var(--text-muted)' }}>{level}</span>
                    <span className="font-medium">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="dp-surface p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CustomSelect
              label="Status"
              options={[
                { value: 'all', label: 'All' },
                { value: 'active', label: 'Active' },
                { value: 'resolved', label: 'Resolved' },
              ]}
              value={filterStatus}
              onChange={(value) => setFilterStatus(value as any)}
            />
            
            <CustomSelect
              label="Risk Level"
              options={[
                { value: 'all', label: 'All Levels' },
                { value: String(RiskLevel.LOW), label: 'Low' },
                { value: String(RiskLevel.MEDIUM), label: 'Medium' },
                { value: String(RiskLevel.HIGH), label: 'High' },
                { value: String(RiskLevel.CRITICAL), label: 'Critical' },
              ]}
              value={filterRisk}
              onChange={(value) => setFilterRisk(value as any)}
            />
            
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] mb-2" style={{ color: 'var(--text-muted)' }}>
                Wallet Address
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  placeholder="0x..."
                  className="dp-input"
                />
                <button onClick={() => loadFlags()} className="dp-btn-primary" style={{ padding: '10px 14px' }}>
                  <Search size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Flags */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--text-muted)' }}>
            Fraud Flags
          </p>
          <button onClick={loadFlags} className="dp-btn-ghost" style={{ padding: '6px' }}>
            <RefreshCw size={13} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="dp-skeleton h-28 rounded-xl" />)}
          </div>
        ) : flags.length === 0 ? (
          <div className="dp-surface p-16 text-center">
            <Shield size={32} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <h3 className="text-[18px] font-semibold mb-2">No flags found</h3>
            <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
              {filterStatus === 'active' ? 'All flags have been resolved.' : 'Try adjusting your filters.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {flags.map((flag) => (
              <div
                key={flag.id}
                className="dp-surface overflow-hidden"
              >
                <div className="flex items-stretch">
                  {/* Risk stripe */}
                  <div className="w-1 flex-shrink-0" style={{ backgroundColor: flag.is_resolved ? 'var(--success)' : getRiskColor(flag.risk_level) }} />

                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {/* Risk score */}
                          <span
                            className="text-[12px] font-semibold px-2 py-0.5 rounded"
                            style={{ backgroundColor: getRiskBg(flag.risk_level), color: getRiskColor(flag.risk_level) }}
                          >
                            Score: {flag.risk_score}
                          </span>
                          <span
                            className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded"
                            style={{ backgroundColor: getRiskBg(flag.risk_level), color: getRiskColor(flag.risk_level) }}
                          >
                            {flag.risk_level}
                          </span>
                          {flag.is_resolved && (
                            <span className="dp-badge dp-badge-active">Resolved</span>
                          )}
                        </div>
                        <p className="dp-mono text-[13px] mt-1">{flag.wallet_address}</p>
                        <p className="text-[12px] mt-0.5 capitalize" style={{ color: 'var(--text-muted)' }}>
                          {flag.flag_type.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {new Date(flag.flagged_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>

                    {/* Reason */}
                    <div className="py-3 px-4 rounded-md mb-4" style={{ backgroundColor: 'var(--surface-elevated)' }}>
                      <p className="text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Detected Pattern</p>
                      <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{flag.reason}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        Flagged by: {flag.flagged_by}
                        {flag.is_resolved && flag.resolved_by && ` · Resolved by: ${flag.resolved_by}`}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/admin/fraud/${flag.wallet_address}`)}
                          className="dp-btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Details <ArrowUpRight size={11} />
                        </button>
                        {!flag.is_resolved ? (
                          <button
                            onClick={() => handleResolve(flag.id)}
                            className="dp-btn-ghost"
                            style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--success)' }}
                          >
                            <CheckCircle2 size={12} /> Resolve
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnresolve(flag.id)}
                            className="dp-btn-ghost"
                            style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--accent)' }}
                          >
                            <RotateCcw size={12} /> Unresolve
                          </button>
                        )}
                      </div>
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

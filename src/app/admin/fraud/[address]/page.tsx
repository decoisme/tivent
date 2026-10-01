'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useWalletFraudFlags, useFraudRisk } from '@/hooks/useFraudDetection';
import { RiskIndicator } from '@/components/RiskBadge';
import { supabase } from '@/lib/supabase';

interface WalletActivity {
  purchases: number;
  resales: number;
  listings: number;
  redemptions: number;
  totalSpent: string;
  totalEarned: string;
  accountAge: string;
}

export default function WalletFraudDetailPage() {
  const router = useRouter();
  const params = useParams();
  const targetAddress = params.address as string;

  const { isConnected } = useWallet();
  const { flags, loading: flagsLoading, refreshFlags } = useWalletFraudFlags(targetAddress);
  const { riskScore, loading: riskLoading, refreshRisk } = useFraudRisk(targetAddress);

  const [activity, setActivity] = useState<WalletActivity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWalletActivity();
  }, [targetAddress]);

  const loadWalletActivity = async () => {
    try {
      setLoading(true);

      // Get purchase count
      const { data: purchases, error: purchaseError } = await supabase
        .from('blockchain_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_address', targetAddress.toLowerCase())
        .eq('transaction_type', 'ticket_purchase');

      // Get tickets owned
      const { data: tickets, error: ticketError } = await supabase
        .from('ticket_metadata')
        .select('*')
        .or(`current_owner.eq.${targetAddress.toLowerCase()},original_owner.eq.${targetAddress.toLowerCase()}`);

      // Get resale listings
      const { data: listings, error: listingError } = await supabase
        .from('resale_listings')
        .select('*')
        .eq('seller_address', targetAddress.toLowerCase());

      // Get redemptions
      const { data: redemptions, error: redemptionError } = await supabase
        .from('ticket_metadata')
        .select('*', { count: 'exact', head: true })
        .eq('current_owner', targetAddress.toLowerCase())
        .eq('is_redeemed', true);

      // Get first transaction to calculate account age
      const { data: firstTx, error: firstTxError } = await supabase
        .from('blockchain_transactions')
        .select('timestamp')
        .eq('user_address', targetAddress.toLowerCase())
        .order('timestamp', { ascending: true })
        .limit(1);

      let accountAge = 'Unknown';
      if (firstTx && firstTx.length > 0) {
        const age = Date.now() - new Date(firstTx[0].timestamp).getTime();
        const days = Math.floor(age / (1000 * 60 * 60 * 24));
        if (days === 0) {
          accountAge = 'Less than 1 day';
        } else if (days === 1) {
          accountAge = '1 day';
        } else {
          accountAge = `${days} days`;
        }
      }

      const soldListings = listings?.filter((l) => !l.is_active && l.sold_at) || [];

      setActivity({
        purchases: tickets?.filter((t) => t.original_owner === targetAddress.toLowerCase()).length || 0,
        resales: soldListings.length,
        listings: listings?.filter((l) => l.is_active).length || 0,
        redemptions: 0, // Will be updated with actual count
        totalSpent: '0', // Calculate from transactions
        totalEarned: '0', // Calculate from resales
        accountAge,
      });
    } catch (error) {
      console.error('Error loading wallet activity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass rounded-xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Admin Access Required</h2>
          <p className="text-muted-foreground mb-6">
            Please connect your wallet to view fraud details
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Back Button */}
        <button
          onClick={() => router.push('/admin/fraud')}
          className="text-muted-foreground hover:text-foreground mb-6 flex items-center gap-2"
        >
          ← Back to Fraud Management
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Wallet Investigation</h1>
          <p className="text-muted-foreground font-mono break-all">
            {targetAddress}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Risk Assessment */}
            {!riskLoading && riskScore && (
              <RiskIndicator walletAddress={targetAddress} riskScore={riskScore} />
            )}

            {/* Activity Summary */}
            {!loading && activity && (
              <div className="glass rounded-xl p-6">
                <h2 className="text-2xl font-semibold mb-6">Activity Summary</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Purchases</p>
                    <p className="text-2xl font-bold">{activity.purchases}</p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Resales</p>
                    <p className="text-2xl font-bold">{activity.resales}</p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Active Listings</p>
                    <p className="text-2xl font-bold">{activity.listings}</p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Account Age</p>
                    <p className="text-lg font-bold">{activity.accountAge}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Resale Ratio:</span>
                    <span className="font-semibold">
                      {activity.purchases > 0
                        ? `${Math.round((activity.resales / activity.purchases) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Fraud Flags History */}
            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Fraud Flags History</h2>
                <button
                  onClick={() => {
                    refreshFlags();
                    refreshRisk();
                  }}
                  className="px-4 py-2 rounded-lg glass hover:glass-hover transition-all text-sm"
                >
                  🔄 Refresh
                </button>
              </div>

              {flagsLoading ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-muted-foreground">Loading flags...</p>
                </div>
              ) : flags.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-4xl mb-2">✓</div>
                  <p>No fraud flags for this wallet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {flags.map((flag: any) => (
                    <div
                      key={flag.id}
                      className={`p-4 rounded-lg border ${
                        flag.is_resolved
                          ? 'bg-green-500/5 border-green-500/20'
                          : 'bg-red-500/5 border-red-500/20'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold capitalize">
                            {flag.flag_type.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Risk Score: {flag.risk_score}/100 ({flag.risk_level})
                          </p>
                        </div>
                        <div className="text-right">
                          {flag.is_resolved ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                              ✓ Resolved
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              Active
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">{flag.reason}</p>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Flagged: {new Date(flag.flagged_at).toLocaleDateString()}
                        </span>
                        <span>By: {flag.flagged_by}</span>
                      </div>

                      {flag.is_resolved && (
                        <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
                          Resolved: {new Date(flag.resolved_at).toLocaleDateString()} by{' '}
                          {flag.resolved_by}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Quick Actions */}
          <div className="lg:col-span-1">
            <div className="glass rounded-xl p-6 sticky top-24 space-y-4">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>

              <button
                onClick={() => window.open(`https://etherscan.io/address/${targetAddress}`, '_blank')}
                className="w-full px-4 py-3 rounded-lg glass hover:glass-hover transition-all text-sm flex items-center justify-between"
              >
                <span>View on Etherscan</span>
                <span>↗</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(targetAddress);
                  alert('Address copied!');
                }}
                className="w-full px-4 py-3 rounded-lg glass hover:glass-hover transition-all text-sm flex items-center justify-between"
              >
                <span>Copy Address</span>
                <span>📋</span>
              </button>

              <button
                onClick={() => refreshRisk()}
                className="w-full px-4 py-3 rounded-lg glass hover:glass-hover transition-all text-sm flex items-center justify-between"
              >
                <span>Recalculate Risk</span>
                <span>🔄</span>
              </button>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Investigation Tools:</p>
                <div className="space-y-2">
                  <button className="w-full px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-all text-xs text-left">
                    View Transaction History
                  </button>
                  <button className="w-full px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-all text-xs text-left">
                    View Owned Tickets
                  </button>
                  <button className="w-full px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-all text-xs text-left">
                    View Resale History
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

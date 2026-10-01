import { formatEther } from 'viem';
import { OwnershipEventType, type OwnershipRecord } from '@/lib/ownershipHistory';
import { 
  Ticket, 
  ShoppingCart, 
  Tag, 
  X, 
  RefreshCw, 
  CheckCircle2, 
  Send,
  TrendingUp,
  TrendingDown,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  ArrowRightLeft
} from 'lucide-react';

interface OwnershipTimelineProps {
  history: OwnershipRecord[];
  compact?: boolean;
}

export function OwnershipTimeline({
  history,
  compact = false,
}: OwnershipTimelineProps) {
  const getEventIcon = (eventType: OwnershipEventType) => {
    switch (eventType) {
      case OwnershipEventType.MINTED:
        return <Ticket className="w-4 h-4" />;
      case OwnershipEventType.PURCHASED:
        return <ShoppingCart className="w-4 h-4" />;
      case OwnershipEventType.LISTED:
        return <Tag className="w-4 h-4" />;
      case OwnershipEventType.LISTING_CANCELLED:
        return <X className="w-4 h-4" />;
      case OwnershipEventType.RESOLD:
        return <RefreshCw className="w-4 h-4" />;
      case OwnershipEventType.REDEEMED:
        return <CheckCircle2 className="w-4 h-4" />;
      case OwnershipEventType.TRANSFERRED:
        return <Send className="w-4 h-4" />;
      default:
        return <ArrowRightLeft className="w-4 h-4" />;
    }
  };

  const getEventColor = (eventType: OwnershipEventType) => {
    switch (eventType) {
      case OwnershipEventType.MINTED:
        return 'border-[#8B5CF6]'; // purple
      case OwnershipEventType.PURCHASED:
        return 'border-[#10B981]'; // green
      case OwnershipEventType.LISTED:
        return 'border-[#F59E0B]'; // amber
      case OwnershipEventType.LISTING_CANCELLED:
        return 'border-[#EF4444]'; // red
      case OwnershipEventType.RESOLD:
        return 'border-[#3B82F6]'; // blue
      case OwnershipEventType.REDEEMED:
        return 'border-[#059669]'; // emerald
      case OwnershipEventType.TRANSFERRED:
        return 'border-[#6B7280]'; // gray
      default:
        return 'border-[#9CA3AF]';
    }
  };

  const getEventBgColor = (eventType: OwnershipEventType) => {
    switch (eventType) {
      case OwnershipEventType.MINTED:
        return 'bg-[#8B5CF6]/10 text-[#8B5CF6]';
      case OwnershipEventType.PURCHASED:
        return 'bg-[#10B981]/10 text-[#10B981]';
      case OwnershipEventType.LISTED:
        return 'bg-[#F59E0B]/10 text-[#F59E0B]';
      case OwnershipEventType.LISTING_CANCELLED:
        return 'bg-[#EF4444]/10 text-[#EF4444]';
      case OwnershipEventType.RESOLD:
        return 'bg-[#3B82F6]/10 text-[#3B82F6]';
      case OwnershipEventType.REDEEMED:
        return 'bg-[#059669]/10 text-[#059669]';
      case OwnershipEventType.TRANSFERRED:
        return 'bg-[#6B7280]/10 text-[#6B7280]';
      default:
        return 'bg-[#9CA3AF]/10 text-[#9CA3AF]';
    }
  };

  const getEventTitle = (eventType: OwnershipEventType) => {
    switch (eventType) {
      case OwnershipEventType.MINTED:
        return 'Minted';
      case OwnershipEventType.PURCHASED:
        return 'Purchased';
      case OwnershipEventType.LISTED:
        return 'Listed for Resale';
      case OwnershipEventType.LISTING_CANCELLED:
        return 'Listing Cancelled';
      case OwnershipEventType.RESOLD:
        return 'Resold';
      case OwnershipEventType.REDEEMED:
        return 'Redeemed';
      case OwnershipEventType.TRANSFERRED:
        return 'Transferred';
      default:
        return 'Event';
    }
  };

  const formatAddress = (address: string | null) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {history.map((record, index) => (
          <div
            key={record.id}
            className={`flex items-center gap-3 p-3 rounded-lg ${getEventBgColor(record.eventType)}`}
          >
            <span className="flex items-center justify-center w-8 h-8">
              {getEventIcon(record.eventType)}
            </span>
            <div className="flex-1">
              <p className="font-medium text-[13px]">{getEventTitle(record.eventType)}</p>
              <p className="text-[11px] opacity-70">
                {record.timestamp.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            {record.price && (
              <span className="font-semibold text-[13px]">
                {parseFloat(formatEther(BigInt(record.price))).toFixed(4)} ETH
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-[18px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#8B5CF6] via-[#3B82F6] to-transparent opacity-30"></div>

      <div className="space-y-4">
        {history.map((record, index) => (
          <div key={record.id} className="relative pl-12">
            {/* Timeline dot */}
            <div
              className={`absolute left-0 w-[38px] h-[38px] rounded-full border-2 ${getEventColor(
                record.eventType
              )} ${getEventBgColor(record.eventType)} flex items-center justify-center shadow-lg`}
            >
              {getEventIcon(record.eventType)}
            </div>

            {/* Event card */}
            <div className="dp-card rounded-xl p-4 border-l-[3px] hover:shadow-lg transition-shadow duration-200" style={{ borderLeftColor: getEventColor(record.eventType).replace('border-', '') }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-[15px] mb-1">
                    {getEventTitle(record.eventType)}
                  </h4>
                  <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                    {record.timestamp.toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {record.price && (
                  <div className="text-right ml-4">
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Price</p>
                    <p className="text-[16px] font-bold" style={{ color: 'var(--primary)' }}>
                      {parseFloat(formatEther(BigInt(record.price))).toFixed(4)} ETH
                    </p>
                  </div>
                )}
              </div>

              {(record.fromAddress || record.toAddress) && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {record.fromAddress && (
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--card-bg)' }}>
                      <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>From</p>
                      <p className="font-mono text-[12px]">{formatAddress(record.fromAddress)}</p>
                    </div>
                  )}
                  {record.toAddress && (
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--card-bg)' }}>
                      <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>To</p>
                      <p className="font-mono text-[12px]">{formatAddress(record.toAddress)}</p>
                    </div>
                  )}
                </div>
              )}

              {record.transactionHash && (
                <div className="pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>Transaction</p>
                  <a
                    href={`https://amoy.polygonscan.com/tx/${record.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] font-mono hover:underline flex items-center gap-1.5"
                    style={{ color: 'var(--primary)' }}
                  >
                    {formatAddress(record.transactionHash)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {record.metadata && (record.metadata.reason || record.metadata.eventId) && (
                <div className="mt-2 pt-2 border-t text-[11px]" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                  {record.metadata.reason && <p>• {record.metadata.reason}</p>}
                  {record.metadata.eventId && <p>• Event #{record.metadata.eventId}</p>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface OwnershipStatsCardProps {
  stats: {
    totalTransfers: number;
    totalResales: number;
    originalPrice: string;
    currentPrice: string;
    highestPrice: string;
    totalVolume: string;
  };
}

export function OwnershipStatsCard({ stats }: OwnershipStatsCardProps) {
  const calculateValueChange = () => {
    const current = parseFloat(formatEther(BigInt(stats.currentPrice)));
    const original = parseFloat(formatEther(BigInt(stats.originalPrice)));
    const change = ((current - original) / original) * 100;
    return {
      percentage: change.toFixed(1),
      isPositive: change > 0,
      isNegative: change < 0,
    };
  };

  const valueChange = calculateValueChange();

  return (
    <div className="dp-card rounded-xl p-5">
      <h3 className="text-[16px] font-semibold mb-4 flex items-center gap-2">
        <ArrowRightLeft className="w-5 h-5" style={{ color: 'var(--primary)' }} />
        Ownership Statistics
      </h3>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>Transfers</p>
          <p className="text-[24px] font-bold">{stats.totalTransfers}</p>
        </div>

        <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>Resales</p>
          <p className="text-[24px] font-bold">{stats.totalResales}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>Original Price</p>
          <p className="text-[14px] font-bold">
            {parseFloat(formatEther(BigInt(stats.originalPrice))).toFixed(4)} ETH
          </p>
        </div>

        <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>Current Price</p>
          <p className="text-[14px] font-bold">
            {parseFloat(formatEther(BigInt(stats.currentPrice))).toFixed(4)} ETH
          </p>
        </div>

        <div className="p-3 rounded-lg border" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: '#10B981' }}>
          <p className="text-[11px] mb-1 flex items-center gap-1" style={{ color: '#10B981' }}>
            <TrendingUp className="w-3 h-3" />
            Highest Price
          </p>
          <p className="text-[14px] font-bold" style={{ color: '#10B981' }}>
            {parseFloat(formatEther(BigInt(stats.highestPrice))).toFixed(4)} ETH
          </p>
        </div>

        <div className="p-3 rounded-lg border" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: '#8B5CF6' }}>
          <p className="text-[11px] mb-1" style={{ color: '#8B5CF6' }}>Total Volume</p>
          <p className="text-[14px] font-bold" style={{ color: '#8B5CF6' }}>
            {parseFloat(formatEther(BigInt(stats.totalVolume))).toFixed(4)} ETH
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
        <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Value Change:</span>
        <span
          className={`font-semibold text-[14px] flex items-center gap-1.5 ${
            valueChange.isPositive
              ? 'text-[#10B981]'
              : valueChange.isNegative
              ? 'text-[#EF4444]'
              : ''
          }`}
          style={!valueChange.isPositive && !valueChange.isNegative ? { color: 'var(--text-muted)' } : {}}
        >
          {valueChange.isPositive && <TrendingUp className="w-4 h-4" />}
          {valueChange.isNegative && <TrendingDown className="w-4 h-4" />}
          {valueChange.isPositive ? '+' : ''}{valueChange.percentage}%
        </span>
      </div>
    </div>
  );
}

interface ProvenanceCardProps {
  provenance: {
    isAuthentic: boolean;
    verificationScore: number;
    checks: {
      contractVerified: boolean;
      ownershipValid: boolean;
      noSuspiciousActivity: boolean;
      chainIntact: boolean;
    };
    warnings: string[];
  };
}

export function ProvenanceCard({ provenance }: ProvenanceCardProps) {
  const getCheckIcon = (isValid: boolean) => {
    return isValid ? (
      <ShieldCheck className="w-4 h-4 text-[#10B981]" />
    ) : (
      <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
    );
  };

  return (
    <div className="dp-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[16px] font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          Provenance Verification
        </h3>
        {provenance.isAuthentic ? (
          <span className="px-3 py-1.5 rounded-full text-[12px] font-medium flex items-center gap-1.5" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified
          </span>
        ) : (
          <span className="px-3 py-1.5 rounded-full text-[12px] font-medium flex items-center gap-1.5" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}>
            <X className="w-3.5 h-3.5" />
            Unverified
          </span>
        )}
      </div>

      {/* Verification Score */}
      <div className="mb-4 p-4 rounded-lg border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Verification Score</span>
          <span className="text-[20px] font-bold" style={{ color: provenance.verificationScore === 100 ? '#10B981' : 'var(--primary)' }}>
            {provenance.verificationScore}%
          </span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)' }}>
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${provenance.verificationScore}%`,
              backgroundColor: provenance.verificationScore === 100 ? '#10B981' : '#8B5CF6'
            }}
          />
        </div>
      </div>

      {/* Security Checks */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ backgroundColor: 'var(--card-bg)' }}>
          <span className="text-[13px] flex items-center gap-2">
            {getCheckIcon(provenance.checks.contractVerified)}
            Contract Verified
          </span>
          <span className="text-[12px] font-medium" style={{ color: provenance.checks.contractVerified ? '#10B981' : '#EF4444' }}>
            {provenance.checks.contractVerified ? 'Valid' : 'Invalid'}
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ backgroundColor: 'var(--card-bg)' }}>
          <span className="text-[13px] flex items-center gap-2">
            {getCheckIcon(provenance.checks.ownershipValid)}
            Ownership Valid
          </span>
          <span className="text-[12px] font-medium" style={{ color: provenance.checks.ownershipValid ? '#10B981' : '#EF4444' }}>
            {provenance.checks.ownershipValid ? 'Valid' : 'Invalid'}
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ backgroundColor: 'var(--card-bg)' }}>
          <span className="text-[13px] flex items-center gap-2">
            {getCheckIcon(provenance.checks.noSuspiciousActivity)}
            No Suspicious Activity
          </span>
          <span className="text-[12px] font-medium" style={{ color: provenance.checks.noSuspiciousActivity ? '#10B981' : '#EF4444' }}>
            {provenance.checks.noSuspiciousActivity ? 'Clear' : 'Detected'}
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ backgroundColor: 'var(--card-bg)' }}>
          <span className="text-[13px] flex items-center gap-2">
            {getCheckIcon(provenance.checks.chainIntact)}
            Chain Intact
          </span>
          <span className="text-[12px] font-medium" style={{ color: provenance.checks.chainIntact ? '#10B981' : '#EF4444' }}>
            {provenance.checks.chainIntact ? 'Intact' : 'Broken'}
          </span>
        </div>
      </div>

      {/* Warnings */}
      {provenance.warnings.length > 0 && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <h4 className="font-semibold mb-2.5 text-[13px] flex items-center gap-1.5" style={{ color: '#F59E0B' }}>
            <AlertTriangle className="w-4 h-4" />
            Warnings
          </h4>
          <div className="space-y-2">
            {provenance.warnings.map((warning, index) => (
              <div
                key={index}
                className="flex items-start gap-2 text-[12px] p-2.5 rounded-lg border"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: '#F59E0B' }}
              >
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#F59E0B' }} />
                <p className="flex-1" style={{ color: '#F59E0B' }}>{warning}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

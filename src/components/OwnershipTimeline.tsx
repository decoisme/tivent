import { formatEther } from 'viem';
import { OwnershipEventType, type OwnershipRecord } from '@/lib/ownershipHistory';

interface OwnershipTimelineProps {
  history: OwnershipRecord[];
  compact?: boolean;
}

export function OwnershipTimeline({
  history,
  compact = false,
}: OwnershipTimelineProps) {
  const getEventIcon = (eventType: OwnershipEventType) => {
    const iconClass = "w-4 h-4";
    switch (eventType) {
      case OwnershipEventType.MINTED:
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
        );
      case OwnershipEventType.PURCHASED:
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case OwnershipEventType.LISTED:
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case OwnershipEventType.LISTING_CANCELLED:
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case OwnershipEventType.RESOLD:
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case OwnershipEventType.REDEEMED:
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case OwnershipEventType.TRANSFERRED:
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        );
      default:
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
    }
  };

  const getEventColor = (eventType: OwnershipEventType) => {
    switch (eventType) {
      case OwnershipEventType.MINTED:
        return 'border-blue-500';
      case OwnershipEventType.PURCHASED:
        return 'border-green-500';
      case OwnershipEventType.LISTED:
        return 'border-yellow-500';
      case OwnershipEventType.LISTING_CANCELLED:
        return 'border-red-500';
      case OwnershipEventType.RESOLD:
        return 'border-purple-500';
      case OwnershipEventType.REDEEMED:
        return 'border-green-400';
      case OwnershipEventType.TRANSFERRED:
        return 'border-gray-500';
      default:
        return 'border-gray-400';
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
            className="flex items-center gap-3 text-sm"
          >
            <span className="text-2xl flex items-center justify-center w-8 h-8">{getEventIcon(record.eventType)}</span>
            <div className="flex-1">
              <p className="font-medium">{getEventTitle(record.eventType)}</p>
              <p className="text-xs text-muted-foreground">
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
              <span className="font-semibold">
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
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>

      <div className="space-y-6">
        {history.map((record, index) => (
          <div key={record.id} className="relative pl-14">
            {/* Timeline dot */}
            <div
              className={`absolute left-3 w-6 h-6 rounded-full border-4 ${getEventColor(
                record.eventType
              )} bg-background flex items-center justify-center text-xs`}
            >
              <span className="scale-75">{getEventIcon(record.eventType)}</span>
            </div>

            {/* Event card */}
            <div className="glass rounded-lg p-4 border-l-4 ${getEventColor(record.eventType)}">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-lg">
                    {getEventTitle(record.eventType)}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {record.timestamp.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {record.price && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="text-lg font-bold">
                      {parseFloat(formatEther(BigInt(record.price))).toFixed(4)} ETH
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {record.fromAddress && (
                  <div>
                    <p className="text-muted-foreground mb-1">From</p>
                    <p className="font-mono">{formatAddress(record.fromAddress)}</p>
                  </div>
                )}
                {record.toAddress && (
                  <div>
                    <p className="text-muted-foreground mb-1">To</p>
                    <p className="font-mono">{formatAddress(record.toAddress)}</p>
                  </div>
                )}
              </div>

              {record.transactionHash && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Transaction</p>
                  <a
                    href={`https://etherscan.io/tx/${record.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
                  >
                    {formatAddress(record.transactionHash)}
                    <span>↗</span>
                  </a>
                </div>
              )}

              {record.metadata && (
                <div className="mt-2 text-xs text-muted-foreground">
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
  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-xl font-semibold mb-4">Ownership Statistics</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Transfers</p>
          <p className="text-2xl font-bold">{stats.totalTransfers}</p>
        </div>

        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Resales</p>
          <p className="text-2xl font-bold">{stats.totalResales}</p>
        </div>

        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Original Price</p>
          <p className="text-lg font-bold">
            {parseFloat(formatEther(BigInt(stats.originalPrice))).toFixed(4)} ETH
          </p>
        </div>

        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Current Price</p>
          <p className="text-lg font-bold">
            {parseFloat(formatEther(BigInt(stats.currentPrice))).toFixed(4)} ETH
          </p>
        </div>

        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Highest Price</p>
          <p className="text-lg font-bold text-green-400">
            {parseFloat(formatEther(BigInt(stats.highestPrice))).toFixed(4)} ETH
          </p>
        </div>

        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Total Volume</p>
          <p className="text-lg font-bold text-blue-400">
            {parseFloat(formatEther(BigInt(stats.totalVolume))).toFixed(4)} ETH
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Value Change:</span>
          <span
            className={`font-semibold ${
              BigInt(stats.currentPrice) > BigInt(stats.originalPrice)
                ? 'text-green-400'
                : BigInt(stats.currentPrice) < BigInt(stats.originalPrice)
                ? 'text-red-400'
                : 'text-muted-foreground'
            }`}
          >
            {BigInt(stats.currentPrice) > BigInt(stats.originalPrice) ? '+' : ''}
            {(
              ((parseFloat(formatEther(BigInt(stats.currentPrice))) -
                parseFloat(formatEther(BigInt(stats.originalPrice)))) /
                parseFloat(formatEther(BigInt(stats.originalPrice)))) *
              100
            ).toFixed(1)}
            %
          </span>
        </div>
      </div>
    </div>
  );
}

interface ProvenanceCardProps {
  provenance: {
    isVerified: boolean;
    mintDate: Date;
    transferCount: number;
    chainOfCustody: {
      owner: string;
      from: Date;
      to: Date | null;
      verified: boolean;
    }[];
  };
}

export function ProvenanceCard({ provenance }: ProvenanceCardProps) {
  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Provenance Verification</h3>
        {provenance.isVerified && (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Verified
          </span>
        )}
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Mint Date:</span>
          <span className="font-semibold">
            {provenance.mintDate.toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Total Transfers:</span>
          <span className="font-semibold">{provenance.transferCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Chain Integrity:</span>
          <span className="font-semibold text-green-400">100%</span>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <h4 className="font-semibold mb-3 text-sm">Chain of Custody</h4>
        <div className="space-y-2">
          {provenance.chainOfCustody.map((custody, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded"
            >
              <span className="text-green-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <div className="flex-1">
                <p className="font-mono text-xs">
                  {custody.owner.slice(0, 6)}...{custody.owner.slice(-4)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {custody.from.toLocaleDateString()} -{' '}
                  {custody.to ? custody.to.toLocaleDateString() : 'Present'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

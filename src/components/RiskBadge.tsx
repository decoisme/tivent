import { RiskLevel } from '@/lib/fraudDetection';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function RiskBadge({
  level,
  score,
  showScore = false,
  size = 'md',
}: RiskBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  };

  const levelConfig = {
    [RiskLevel.LOW]: {
      bg: 'bg-green-500/20',
      text: 'text-green-400',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      label: 'Low Risk',
    },
    [RiskLevel.MEDIUM]: {
      bg: 'bg-yellow-500/20',
      text: 'text-yellow-400',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      label: 'Medium Risk',
    },
    [RiskLevel.HIGH]: {
      bg: 'bg-orange-500/20',
      text: 'text-orange-400',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      label: 'High Risk',
    },
    [RiskLevel.CRITICAL]: {
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      label: 'Critical Risk',
    },
  };

  const config = levelConfig[level];

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bg} ${config.text} ${sizeClasses[size]}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
      {showScore && score !== undefined && (
        <span className="font-bold">({score})</span>
      )}
    </div>
  );
}

interface FraudWarningProps {
  reasons: string[];
  score: number;
  onClose?: () => void;
}

export function FraudWarning({ reasons, score, onClose }: FraudWarningProps) {
  return (
    <div className="glass rounded-lg p-4 border-l-4 border-red-500">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="font-semibold text-red-400">Fraud Risk Detected</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm text-muted-foreground">Risk Score:</span>
          <span className="font-bold text-red-400">{score}/100</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-gradient-to-r from-yellow-500 to-red-500 h-2 rounded-full transition-all"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Detected Issues:</p>
        <ul className="space-y-1">
          {reasons.map((reason, index) => (
            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-red-400 mt-0.5">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface RiskIndicatorProps {
  walletAddress: string;
  riskScore?: { score: number; level: RiskLevel; reasons: string[] };
  compact?: boolean;
}

export function RiskIndicator({
  walletAddress,
  riskScore,
  compact = false,
}: RiskIndicatorProps) {
  if (!riskScore) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <RiskBadge level={riskScore.level} score={riskScore.score} showScore />
      </div>
    );
  }

  return (
    <div className="glass rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold">Fraud Risk Assessment</h4>
        <RiskBadge level={riskScore.level} score={riskScore.score} showScore />
      </div>

      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Risk Score</span>
            <span className="font-medium">{riskScore.score}/100</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                riskScore.level === RiskLevel.CRITICAL
                  ? 'bg-red-500'
                  : riskScore.level === RiskLevel.HIGH
                  ? 'bg-orange-500'
                  : riskScore.level === RiskLevel.MEDIUM
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${riskScore.score}%` }}
            />
          </div>
        </div>

        {riskScore.reasons.length > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-1">Risk Factors:</p>
            <ul className="space-y-1">
              {riskScore.reasons.map((reason, index) => (
                <li
                  key={index}
                  className="text-xs text-muted-foreground flex items-start gap-1.5"
                >
                  <span className="text-yellow-500 mt-0.5">▸</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </p>
        </div>
      </div>
    </div>
  );
}

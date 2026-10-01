import { useState, useEffect } from 'react';
import {
  calculateRiskScore,
  getWalletFraudFlags,
  isWalletFlagged,
  analyzeTransaction,
  getFraudStatistics,
  type RiskScore,
} from '@/lib/fraudDetection';

/**
 * Hook to check fraud risk for a wallet address
 */
export function useFraudRisk(walletAddress?: string) {
  const [riskScore, setRiskScore] = useState<RiskScore | null>(null);
  const [isFlagged, setIsFlagged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (walletAddress) {
      checkRisk();
    } else {
      setRiskScore(null);
      setIsFlagged(false);
    }
  }, [walletAddress]);

  const checkRisk = async () => {
    if (!walletAddress) return;

    try {
      setLoading(true);
      setError(null);

      const [score, flagged] = await Promise.all([
        calculateRiskScore(walletAddress),
        isWalletFlagged(walletAddress),
      ]);

      setRiskScore(score);
      setIsFlagged(flagged);
    } catch (err: any) {
      console.error('Error checking fraud risk:', err);
      setError(err.message || 'Failed to check risk');
    } finally {
      setLoading(false);
    }
  };

  const refreshRisk = () => {
    checkRisk();
  };

  return {
    riskScore,
    isFlagged,
    loading,
    error,
    refreshRisk,
  };
}

/**
 * Hook to get fraud flags for a wallet
 */
export function useWalletFraudFlags(walletAddress?: string) {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      loadFlags();
    } else {
      setFlags([]);
    }
  }, [walletAddress]);

  const loadFlags = async () => {
    if (!walletAddress) return;

    try {
      setLoading(true);
      const data = await getWalletFraudFlags(walletAddress);
      setFlags(data);
    } catch (err) {
      console.error('Error loading fraud flags:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    flags,
    loading,
    refreshFlags: loadFlags,
  };
}

/**
 * Hook to analyze a transaction before execution
 */
export function useTransactionAnalysis() {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{
    isSuspicious: boolean;
    reason?: string;
    riskScore?: RiskScore;
  } | null>(null);

  const analyzeBeforeTransaction = async (
    walletAddress: string,
    transactionType: string,
    metadata?: any
  ) => {
    try {
      setAnalyzing(true);
      const result = await analyzeTransaction(
        walletAddress,
        transactionType,
        metadata
      );
      setAnalysis(result);
      return result;
    } catch (err) {
      console.error('Error analyzing transaction:', err);
      return { isSuspicious: false };
    } finally {
      setAnalyzing(false);
    }
  };

  return {
    analyzing,
    analysis,
    analyzeBeforeTransaction,
  };
}

/**
 * Hook to get fraud statistics
 */
export function useFraudStatistics() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getFraudStatistics();
      setStats(data);
    } catch (err) {
      console.error('Error loading fraud statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    loading,
    refreshStats: loadStats,
  };
}

import { useState, useEffect } from 'react';
import {
  getTicketOwnershipHistory,
  getWalletOwnershipHistory,
  getWalletOwnershipStats,
  verifyTicketProvenance,
  type OwnershipChain,
  type OwnershipRecord,
  type ProvenanceVerification,
} from '@/lib/ownershipHistory';

/**
 * Hook to get ticket ownership history
 */
export function useTicketOwnershipHistory(tokenId?: number) {
  const [ownershipChain, setOwnershipChain] = useState<OwnershipChain | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tokenId !== undefined) {
      loadHistory();
    } else {
      setOwnershipChain(null);
    }
  }, [tokenId]);

  const loadHistory = async () => {
    if (tokenId === undefined) return;

    try {
      setLoading(true);
      setError(null);
      const chain = await getTicketOwnershipHistory(tokenId);
      setOwnershipChain(chain);
    } catch (err: any) {
      console.error('Error loading ownership history:', err);
      setError(err.message || 'Failed to load ownership history');
    } finally {
      setLoading(false);
    }
  };

  return {
    ownershipChain,
    loading,
    error,
    refreshHistory: loadHistory,
  };
}

/**
 * Hook to get wallet ownership history
 */
export function useWalletOwnershipHistory(walletAddress?: string) {
  const [history, setHistory] = useState<OwnershipRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      loadWalletHistory();
    } else {
      setHistory([]);
      setStats(null);
    }
  }, [walletAddress]);

  const loadWalletHistory = async () => {
    if (!walletAddress) return;

    try {
      setLoading(true);
      const [historyData, statsData] = await Promise.all([
        getWalletOwnershipHistory(walletAddress),
        getWalletOwnershipStats(walletAddress),
      ]);

      setHistory(historyData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading wallet history:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    history,
    stats,
    loading,
    refreshHistory: loadWalletHistory,
  };
}

/**
 * Hook to verify ticket provenance
 */
export function useProvenanceVerification(tokenId?: number) {
  const [provenance, setProvenance] =
    useState<ProvenanceVerification | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (tokenId !== undefined) {
      verifyProvenance();
    } else {
      setProvenance(null);
    }
  }, [tokenId]);

  const verifyProvenance = async () => {
    if (tokenId === undefined) return;

    try {
      setVerifying(true);
      const verification = await verifyTicketProvenance(tokenId);
      setProvenance(verification);
    } catch (err) {
      console.error('Error verifying provenance:', err);
    } finally {
      setVerifying(false);
    }
  };

  return {
    provenance,
    verifying,
    refreshProvenance: verifyProvenance,
  };
}

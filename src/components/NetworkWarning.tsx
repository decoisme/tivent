'use client';

import { useWallet } from '@/hooks/useWallet';
import { useEffect, useState } from 'react';

/**
 * NetworkWarning component
 * Shows a warning banner when user is on wrong network
 */
export function NetworkWarning() {
  const { chain, isConnected, mounted } = useWallet();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!mounted || !isConnected) {
      setShowWarning(false);
      return;
    }

    // Expected chain: Amoy (80002) - Mumbai is deprecated
    const expectedChainId = 80002;
    const isWrongNetwork = chain?.id !== expectedChainId;
    
    setShowWarning(isWrongNetwork);
  }, [chain, isConnected, mounted]);

  if (!showWarning) return null;

  const switchNetwork = async () => {
    try {
      // Request to switch to Amoy (Mumbai is deprecated)
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x13882' }], // 80002 in hex
        });
      }
    } catch (error: any) {
      // If network not added, add it
      if (error.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x13882',
                chainName: 'Polygon Amoy Testnet',
                nativeCurrency: {
                  name: 'POL',
                  symbol: 'POL',
                  decimals: 18,
                },
                rpcUrls: ['https://poly-amoy-testnet.api.pocket.network'],
                blockExplorerUrls: ['https://amoy.polygonscan.com/'],
              },
            ],
          });
        } catch (addError) {
          console.error('Failed to add network:', addError);
        }
      } else {
        console.error('Failed to switch network:', error);
      }
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-yellow-500/10 border-b border-yellow-500/20 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-yellow-500">Wrong Network</p>
              <p className="text-sm text-yellow-500/80">
                You&apos;re on <strong>{chain?.name || 'unknown network'}</strong>. Please switch to <strong>Polygon Amoy Testnet</strong> for free gas.
              </p>
            </div>
          </div>
          <button
            onClick={switchNetwork}
            className="px-4 py-2 rounded-lg bg-yellow-500 text-black font-medium hover:bg-yellow-400 transition-all"
          >
            Switch to Amoy
          </button>
        </div>
      </div>
    </div>
  );
}

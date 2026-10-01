'use client';

import { useWallet } from '@/hooks/useWallet';
import { formatEther } from 'viem';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function WalletButton() {
  const {
    isConnected,
    isConnecting,
    address,
    shortAddress,
    balance,
    chain,
    connect,
    connectWalletConnect,
    disconnect,
    hasInjected,
    mounted,
  } = useWallet();

  const [showDropdown, setShowDropdown] = useState(false);

  // Get network info
  const getNetworkInfo = () => {
    if (!chain) return { 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ), 
      name: 'Unknown', 
      color: 'text-yellow-500' 
    };

    const isTestnet = chain.id === 80002; // Amoy
    const isMainnet = chain.id === 137; // Polygon Mainnet
    
    if (isTestnet) {
      return { 
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        ), 
        name: 'Amoy', 
        color: 'text-blue-400' 
      };
    } else if (isMainnet) {
      return { 
        icon: (
          <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-4.41-1.08-7.5-5.25-7.5-9V8.3l7.5-3.7 7.5 3.7V11c0 3.75-3.09 7.92-7.5 9z"/>
          </svg>
        ), 
        name: 'Polygon', 
        color: 'text-purple-400' 
      };
    }
    
    return { 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ), 
      name: chain.name, 
      color: 'text-yellow-500' 
    };
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button className="px-4 py-2 rounded-lg bg-muted animate-pulse">
        Loading...
      </button>
    );
  }

  if (isConnecting) {
    return (
      <button
        disabled
        className="px-4 py-2 rounded-lg bg-primary/50 text-primary-foreground"
      >
        Connecting...
      </button>
    );
  }

  if (isConnected && address) {
    const networkInfo = getNetworkInfo();
    
    return (
      <div className="relative">
        {/* Compact Wallet Button */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg glass hover:glass-hover transition-all"
        >
          <span className="flex items-center justify-center">{networkInfo.icon}</span>
          <span className="font-mono text-sm hidden sm:inline">{shortAddress}</span>
          <span className="font-mono text-sm sm:hidden">{address.slice(0, 4)}...</span>
          <ChevronDown size={14} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowDropdown(false)}
            />
            
            {/* Dropdown Content */}
            <div className="absolute right-0 top-full mt-2 w-[280px] rounded-lg glass border border-border p-4 z-50 shadow-xl">
              {/* Network Info */}
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
                <span className="flex items-center justify-center">{networkInfo.icon}</span>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Network</p>
                  <p className={`text-sm font-medium ${networkInfo.color}`}>{networkInfo.name}</p>
                </div>
              </div>

              {/* Address */}
              <div className="mb-3 pb-3 border-b border-border">
                <p className="text-xs text-muted-foreground mb-1">Address</p>
                <p className="text-sm font-mono break-all">{address}</p>
              </div>

              {/* Balance */}
              {balance && (
                <div className="mb-3 pb-3 border-b border-border">
                  <p className="text-xs text-muted-foreground mb-1">Balance</p>
                  <p className="text-sm font-medium">
                    {parseFloat(formatEther(balance.value)).toFixed(4)} {balance.symbol}
                  </p>
                </div>
              )}

              {/* Disconnect Button */}
              <button
                onClick={() => {
                  disconnect();
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-all text-sm font-medium"
              >
                Disconnect Wallet
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {hasInjected && (
        <button
          onClick={connect}
          className="dp-btn-primary text-sm"
          style={{ padding: '8px 16px' }}
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}

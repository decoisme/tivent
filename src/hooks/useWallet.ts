import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { useEffect, useState } from 'react';

/**
 * Custom hook for wallet operations
 * Provides easy access to wallet connection state and actions
 */
export function useWallet() {
  const { address, isConnected, isConnecting, isReconnecting, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({
    address: address,
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get the injected connector (MetaMask, etc.)
  const injectedConnector = connectors.find((c) => c.id === 'injected');
  const walletConnectConnector = connectors.find((c) => c.id === 'walletConnect');

  const connectInjected = () => {
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    }
  };

  const connectWalletConnect = () => {
    if (walletConnectConnector) {
      connect({ connector: walletConnectConnector });
    }
  };

  return {
    // Connection state
    address,
    isConnected: mounted && isConnected,
    isConnecting: isConnecting || isReconnecting || isPending,
    chain,
    balance,
    
    // Actions
    connect: connectInjected,
    connectWalletConnect,
    disconnect,
    
    // Connectors
    connectors,
    hasInjected: !!injectedConnector,
    hasWalletConnect: !!walletConnectConnector,
    
    // Helpers
    shortAddress: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '',
    mounted,
  };
}

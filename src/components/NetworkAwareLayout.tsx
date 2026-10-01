'use client';

import { useWallet } from '@/hooks/useWallet';
import { useEffect, useState, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

/**
 * NetworkAwareLayout
 * Adjusts navbar position when NetworkWarning is visible
 */
export function NetworkAwareLayout({ children }: Props) {
  const { chain, isConnected, mounted } = useWallet();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!mounted || !isConnected) {
      setShowWarning(false);
      return;
    }

    // Expected chain: Amoy (80002)
    const expectedChainId = 80002;
    const isWrongNetwork = chain?.id !== expectedChainId;
    
    setShowWarning(isWrongNetwork);
  }, [chain, isConnected, mounted]);

  return (
    <div className={showWarning ? 'pt-[68px]' : ''}>
      {children}
    </div>
  );
}

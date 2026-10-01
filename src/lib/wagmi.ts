import { http, createConfig } from 'wagmi';
import { polygonAmoy } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// Get environment variables
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://poly-amoy-testnet.api.pocket.network';

// Configure chains - using Polygon Amoy testnet for FREE gas
export const chains = [polygonAmoy] as const;

// Configure wagmi
export const config = createConfig({
  chains,
  connectors: [
    injected({
      shimDisconnect: true,
    }),
    walletConnect({
      projectId: walletConnectProjectId,
      showQrModal: true,
    }),
  ],
  transports: {
    [polygonAmoy.id]: http(rpcUrl),
  },
  ssr: true,
});

// Re-export types
export type Config = typeof config;

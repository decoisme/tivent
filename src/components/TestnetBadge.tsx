'use client';

/**
 * TestnetBadge component
 * Shows a small badge indicating the app is running on testnet
 */
export function TestnetBadge() {
  return (
    <div className="fixed bottom-4 left-4 z-40 hidden sm:block">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg glass border border-blue-500/20 text-xs">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
        </span>
        <div>
          <p className="font-semibold text-blue-400">Amoy Testnet</p>
          <p className="text-blue-400/70">Gas fees: FREE</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Blockchain Event Listener Service
 * 
 * This script continuously listens to blockchain events and syncs them to Supabase.
 * Run this as a background service: node scripts/event-listener.js
 */

require('dotenv').config({ path: '.env.local' });

// Import the event listener (using dynamic import for ESM)
async function main() {
  try {
    console.log('🚀 Starting Tivent Event Listener Service...\n');

    // Dynamic import for ESM modules
    const { startEventListener, syncHistoricalEvents, getLatestSyncedBlock } = await import('../src/lib/eventListener.ts');

    // Get latest synced block
    console.log('📊 Checking latest synced block...');
    const latestBlock = await getLatestSyncedBlock();
    console.log(`Latest synced block: ${latestBlock}\n`);

    // Sync historical events if needed
    if (latestBlock > 0n) {
      console.log('🔄 Syncing recent historical events...');
      const currentBlock = BigInt(Math.floor(Date.now() / 1000)); // Approximate current block
      await syncHistoricalEvents(latestBlock + 1n, currentBlock);
      console.log('');
    }

    // Start listening for new events
    console.log('🎧 Starting real-time event listener...\n');
    const unwatch = await startEventListener(latestBlock);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\n⏹️  Shutting down event listener...');
      unwatch();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n\n⏹️  Shutting down event listener...');
      unwatch();
      process.exit(0);
    });

    console.log('✅ Event listener is running. Press Ctrl+C to stop.\n');
    console.log('━'.repeat(60));
    console.log('LISTENING FOR EVENTS');
    console.log('━'.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the service
main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

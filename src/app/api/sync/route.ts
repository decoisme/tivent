import { NextRequest, NextResponse } from 'next/server';
import { syncHistoricalEvents, getLatestSyncedBlock } from '@/lib/eventListener';

// Mark this route as dynamic to avoid build-time execution
export const dynamic = 'force-dynamic';

/**
 * API endpoint to manually trigger blockchain sync
 * GET /api/sync?from=0&to=1000
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fromBlock = searchParams.get('from');
    const toBlock = searchParams.get('to');

    if (!fromBlock || !toBlock) {
      return NextResponse.json(
        { error: 'Missing from or to block parameters' },
        { status: 400 }
      );
    }

    const from = BigInt(fromBlock);
    const to = BigInt(toBlock);

    if (from > to) {
      return NextResponse.json(
        { error: 'from block must be less than or equal to to block' },
        { status: 400 }
      );
    }

    console.log(`Manual sync requested: blocks ${from} to ${to}`);

    await syncHistoricalEvents(from, to);

    return NextResponse.json({
      success: true,
      message: `Synced blocks ${from} to ${to}`,
      from: from.toString(),
      to: to.toString(),
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to get sync status
 */
export async function POST() {
  try {
    const latestBlock = await getLatestSyncedBlock();

    return NextResponse.json({
      success: true,
      latestSyncedBlock: latestBlock.toString(),
      message: 'Sync status retrieved',
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

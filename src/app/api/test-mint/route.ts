import { NextResponse } from 'next/server';

/**
 * Simple test endpoint to verify API routes work
 * GET /api/test-mint
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API routes are working!',
    timestamp: new Date().toISOString(),
    env_check: {
      has_platform_key: !!process.env.PLATFORM_PRIVATE_KEY,
      has_platform_address: !!process.env.PLATFORM_WALLET_ADDRESS,
      has_xendit_key: !!process.env.XENDIT_SECRET_KEY,
    },
  });
}

export async function POST() {
  return NextResponse.json({
    success: true,
    message: 'POST method works!',
    timestamp: new Date().toISOString(),
  });
}

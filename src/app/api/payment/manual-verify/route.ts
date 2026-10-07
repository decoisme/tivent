import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/payment/manual-verify
 * Manually trigger email verification for a payment
 * 
 * Body: { externalId: "TIVENT-xxx" }
 */
export async function POST(request: NextRequest) {
  try {
    const { externalId } = await request.json();

    if (!externalId) {
      return NextResponse.json(
        { error: 'External ID required', success: false },
        { status: 400 }
      );
    }

    console.log('[manual-verify] Processing:', externalId);

    // Get payment
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('external_id', externalId)
      .single();

    if (fetchError || !payment) {
      return NextResponse.json(
        { error: 'Payment not found', success: false },
        { status: 404 }
      );
    }

    // Check if already verified
    if (payment.email_verified) {
      return NextResponse.json({
        success: true,
        message: 'Email already verified',
        payment,
      });
    }

    // Send verification email
    console.log('[manual-verify] Sending verification email...');
    
    const baseUrl = request.headers.get('origin') || 
                    `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`;
    
    const sendResponse = await fetch(`${baseUrl}/api/payment/xendit/send-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ externalId }),
    });

    const sendResult = await sendResponse.json();

    if (sendResult.success) {
      // Update status
      await supabase
        .from('payments')
        .update({
          status: 'PAID_PENDING_VERIFICATION',
        })
        .eq('external_id', externalId);

      return NextResponse.json({
        success: true,
        message: 'Verification email sent successfully!',
        messageId: sendResult.messageId,
        sentTo: payment.buyer_email,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: sendResult.error,
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[manual-verify] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

/**
 * GET /api/payment/manual-verify?externalId=xxx
 * Get verification status
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const externalId = searchParams.get('externalId');

  if (!externalId) {
    return NextResponse.json(
      { error: 'External ID required' },
      { status: 400 }
    );
  }

  const { data: payment } = await supabase
    .from('payments')
    .select('external_id, buyer_email, status, email_verified, verification_token')
    .eq('external_id', externalId)
    .single();

  if (!payment) {
    return NextResponse.json(
      { error: 'Payment not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    payment,
  });
}

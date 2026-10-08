import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/payment/test-auto-mint
 * Test endpoint to create a payment and trigger auto-mint flow
 * FOR TESTING ONLY
 */
export async function POST(request: NextRequest) {
  try {
    const { eventId, ticketTypeId, buyerAddress, buyerEmail } = await request.json();

    if (!eventId || ticketTypeId === undefined || !buyerAddress || !buyerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields', success: false },
        { status: 400 }
      );
    }

    // Generate test payment
    const externalId = `TEST-${eventId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const verificationToken = crypto.randomBytes(32).toString('hex');

    console.log('[test-auto-mint] Creating test payment:', externalId);

    // Create payment record
    const { data: payment, error: insertError } = await supabase
      .from('payments')
      .insert({
        external_id: externalId,
        invoice_id: `test-invoice-${Date.now()}`,
        event_id: eventId,
        ticket_type_id: ticketTypeId,
        ticket_quantity: 1,
        buyer_email: buyerEmail,
        buyer_address: buyerAddress,
        amount_idr: 125000,
        amount_eth: 0.025,
        status: 'PAID', // Already marked as paid
        payment_method: 'TEST',
        verification_token: verificationToken,
        verification_sent_at: new Date().toISOString(), // Required for token expiry check
        email_verified: false,
        ticket_minted: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[test-auto-mint] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create test payment', success: false },
        { status: 500 }
      );
    }

    console.log('[test-auto-mint] Payment created:', payment.id);

    // Generate verification URL
    const baseUrl = `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}`;
    const verificationUrl = `${baseUrl}/api/payment/xendit/verify-email?token=${verificationToken}`;

    console.log('[test-auto-mint] Verification URL:', verificationUrl);

    return NextResponse.json({
      success: true,
      externalId,
      verificationToken,
      verificationUrl,
      message: 'Test payment created. Click verification URL to trigger auto-mint.',
    });
  } catch (error: any) {
    console.error('[test-auto-mint] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create test payment', success: false },
      { status: 500 }
    );
  }
}

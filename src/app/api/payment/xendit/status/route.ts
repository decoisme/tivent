import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/payment/xendit/status?externalId=xxx
 * Check payment status by external ID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const externalId = searchParams.get('externalId');

    if (!externalId) {
      return NextResponse.json(
        { error: 'External ID is required', success: false },
        { status: 400 }
      );
    }

    console.log('[payment-status] Checking payment:', externalId);

    // Query payment from database
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('external_id', externalId)
      .single();

    if (error) {
      console.error('[payment-status] DB error:', error);
      return NextResponse.json(
        { error: 'Payment not found', success: false },
        { status: 404 }
      );
    }

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found', success: false },
        { status: 404 }
      );
    }

    console.log('[payment-status] Payment found:', payment.status);

    return NextResponse.json({
      success: true,
      payment: {
        external_id: payment.external_id,
        invoice_id: payment.invoice_id,
        event_id: payment.event_id,
        ticket_type_id: payment.ticket_type_id,
        ticket_quantity: payment.ticket_quantity,
        buyer_email: payment.buyer_email,
        buyer_address: payment.buyer_address,
        amount_idr: payment.amount_idr,
        amount_eth: payment.amount_eth,
        status: payment.status,
        payment_method: payment.payment_method,
        ticket_minted: payment.ticket_minted,
        tx_hash: payment.tx_hash,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
      },
    });
  } catch (error: any) {
    console.error('[payment-status] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to check payment status', 
        success: false 
      },
      { status: 500 }
    );
  }
}

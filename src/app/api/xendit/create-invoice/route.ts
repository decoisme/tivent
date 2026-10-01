import { NextRequest, NextResponse } from 'next/server';
import { createXenditInvoice } from '@/lib/xendit';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Create Xendit invoice for ticket purchase
 * POST /api/xendit/create-invoice
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      eventId,
      ticketQuantity,
      pricePerTicket,
      payerEmail,
      walletAddress,
    } = body;

    // Validate input
    if (!eventId || !ticketQuantity || !pricePerTicket || !payerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate total amount in IDR
    const totalAmount = pricePerTicket * ticketQuantity;

    // Generate unique external ID
    const externalId = `TIVENT-${eventId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create invoice
    const invoice = await createXenditInvoice({
      externalId,
      amount: totalAmount,
      payerEmail,
      description: `Tivent - Event #${eventId} - ${ticketQuantity} ticket(s)`,
      eventId,
      ticketQuantity,
      successRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?invoice_id={INVOICE_ID}`,
      failureRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/failed?invoice_id={INVOICE_ID}`,
    });

    if (!invoice.success) {
      return NextResponse.json(
        { error: invoice.error },
        { status: 500 }
      );
    }

    // Store pending transaction in database
    const { error: dbError } = await supabase
      .from('pending_payments')
      .insert({
        invoice_id: invoice.invoiceId,
        external_id: externalId,
        event_id: eventId,
        ticket_quantity: ticketQuantity,
        amount_idr: totalAmount,
        payer_email: payerEmail,
        wallet_address: walletAddress || null,
        status: 'pending',
        invoice_url: invoice.invoiceUrl,
        expires_at: invoice.expiryDate,
        created_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error('Database error:', dbError);
    }

    return NextResponse.json({
      success: true,
      invoiceId: invoice.invoiceId,
      invoiceUrl: invoice.invoiceUrl,
      amount: invoice.amount,
      expiryDate: invoice.expiryDate,
    });
  } catch (error: any) {
    console.error('Create invoice error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

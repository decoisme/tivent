import { NextRequest, NextResponse } from 'next/server';
import { createXenditInvoice } from '@/lib/xendit';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/payment/xendit/create-invoice
 * Create Xendit invoice for ticket purchase with fiat
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      eventId,
      ticketTypeId,
      ticketQuantity,
      buyerEmail,
      buyerAddress,
      pricePerTicket,
    } = body;

    // Validation
    if (!eventId || ticketTypeId === undefined || !ticketQuantity || !buyerEmail || !pricePerTicket) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (ticketQuantity < 1 || ticketQuantity > 10) {
      return NextResponse.json(
        { error: 'Ticket quantity must be between 1 and 10' },
        { status: 400 }
      );
    }

    // Calculate amounts
    const totalPriceETH = pricePerTicket * ticketQuantity;
    // Convert ETH to IDR (mock rate: 1 ETH = 50,000,000 IDR)
    const ETH_IDR_RATE = 50000000;
    const totalPriceIDR = Math.round(totalPriceETH * ETH_IDR_RATE);

    // Generate unique external ID
    const externalId = `TIVENT-${eventId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Create Xendit invoice
    const invoiceResult = await createXenditInvoice({
      externalId,
      amount: totalPriceIDR,
      payerEmail: buyerEmail,
      description: `Tivent Event #${eventId} - ${ticketQuantity} Ticket(s)`,
      eventId,
      ticketQuantity,
      successRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?externalId=${externalId}`,
      failureRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/failed?externalId=${externalId}`,
    });

    if (!invoiceResult.success) {
      return NextResponse.json(
        { error: invoiceResult.error },
        { status: 500 }
      );
    }

    // Save payment record to database
    const { data: paymentRecord, error: dbError } = await supabase
      .from('payments')
      .insert({
        external_id: externalId,
        invoice_id: invoiceResult.invoiceId,
        event_id: eventId,
        ticket_type_id: ticketTypeId,
        ticket_quantity: ticketQuantity,
        buyer_email: buyerEmail,
        buyer_address: buyerAddress,
        amount_idr: totalPriceIDR,
        amount_eth: totalPriceETH,
        status: 'PENDING',
        invoice_url: invoiceResult.invoiceUrl,
        expiry_date: invoiceResult.expiryDate,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Don't fail the request if DB fails, invoice is already created
    }

    return NextResponse.json({
      success: true,
      externalId,
      invoiceId: invoiceResult.invoiceId,
      invoiceUrl: invoiceResult.invoiceUrl,
      amount: totalPriceIDR,
      currency: 'IDR',
      expiryDate: invoiceResult.expiryDate,
    });
  } catch (error: any) {
    console.error('Create invoice error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create invoice' },
      { status: 500 }
    );
  }
}

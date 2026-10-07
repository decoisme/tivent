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
      pricePerTicket, // Price in POL (for reference)
      priceIDR, // Flat IDR price from event metadata
    } = body;

    console.log('[create-invoice] Request:', { eventId, ticketTypeId, ticketQuantity, buyerEmail, priceIDR, hasAddress: !!buyerAddress });

    // Validation
    if (!eventId || ticketTypeId === undefined || !ticketQuantity || !buyerEmail || !priceIDR) {
      console.error('[create-invoice] Missing fields');
      return NextResponse.json(
        { error: 'Missing required fields', success: false },
        { status: 400 }
      );
    }

    if (ticketQuantity < 1 || ticketQuantity > 10) {
      console.error('[create-invoice] Invalid quantity:', ticketQuantity);
      return NextResponse.json(
        { error: 'Ticket quantity must be between 1 and 10', success: false },
        { status: 400 }
      );
    }

    // Use flat IDR price directly from event metadata
    const totalPriceIDR = Math.round(priceIDR * ticketQuantity);
    const totalPricePOL = pricePerTicket * ticketQuantity; // For reference only

    // Generate unique external ID
    const externalId = `TIVENT-${eventId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Detect base URL (use request host for correct redirect)
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    console.log('[create-invoice] Creating invoice:', { externalId, totalPriceIDR, baseUrl });

    // Create Xendit invoice
    const invoiceResult = await createXenditInvoice({
      externalId,
      amount: totalPriceIDR,
      payerEmail: buyerEmail,
      description: `Tivent Event #${eventId} - ${ticketQuantity} Ticket(s)`,
      eventId,
      ticketQuantity,
      successRedirectUrl: `${baseUrl}/payment/success?externalId=${externalId}`,
      failureRedirectUrl: `${baseUrl}/payment/failed?externalId=${externalId}`,
    });

    console.log('[create-invoice] Invoice result:', { success: invoiceResult.success });

    if (!invoiceResult.success) {
      console.error('[create-invoice] Xendit failed:', invoiceResult.error);
      return NextResponse.json(
        { error: invoiceResult.error || 'Xendit payment gateway not configured', success: false },
        { status: 500 }
      );
    }

    // Save payment record to database
    try {
      console.log('[create-invoice] Saving to database...', { externalId, totalPriceIDR });
      
      const paymentData = {
        external_id: externalId,
        invoice_id: invoiceResult.invoiceId,
        event_id: eventId,
        ticket_type_id: ticketTypeId,
        ticket_quantity: ticketQuantity,
        buyer_email: buyerEmail,
        buyer_address: buyerAddress || null,
        amount_idr: totalPriceIDR,
        amount_eth: totalPricePOL, // Actually POL, not ETH
        status: 'PENDING',
        invoice_url: invoiceResult.invoiceUrl,
        expiry_date: invoiceResult.expiryDate,
      };

      const { data: savedPayment, error: dbError } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single();

      if (dbError) {
        console.error('[create-invoice] DB error (non-blocking):', dbError);
      } else {
        console.log('[create-invoice] Payment saved to DB:', savedPayment?.id);
      }
    } catch (dbErr: any) {
      console.error('[create-invoice] DB exception (non-blocking):', dbErr.message);
    }

    console.log('[create-invoice] Success!');

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
    console.error('[create-invoice] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create invoice', 
        success: false,
        details: error.stack 
      },
      { status: 500 }
    );
  }
}

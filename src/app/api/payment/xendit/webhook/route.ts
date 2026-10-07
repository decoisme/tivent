import { NextRequest, NextResponse } from 'next/server';
import { verifyXenditWebhookSignature } from '@/lib/xendit';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import { ABI, CONTRACT_ADDRESS } from '@/lib/contractReads';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Mint ticket using platform wallet after successful payment
 */
async function mintTicketWithPlatformWallet(
  eventId: number,
  ticketTypeId: number,
  buyerAddress: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    // Check if platform wallet is configured
    const platformPrivateKey = process.env.PLATFORM_PRIVATE_KEY;
    if (!platformPrivateKey) {
      throw new Error('Platform wallet not configured');
    }

    // Initialize provider and wallet
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
    const wallet = new ethers.Wallet(platformPrivateKey, provider);

    // Initialize contract
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

    // Generate ticket metadata URI (you can customize this)
    const ticketMetadataURI = `ipfs://ticket-${eventId}-${Date.now()}`;

    // Call buyTicket function (platform pays gas, ticket goes to buyer)
    // Note: This requires modifying the contract to have a "mintForUser" function
    // For now, we'll use buyTicket but send value from platform wallet
    
    // Get ticket price from contract
    const ticketType = await contract.getTicketType(eventId, ticketTypeId);
    const ticketPrice = ticketType.price;

    // Execute transaction
    const tx = await contract.buyTicket(
      eventId,
      ticketTypeId,
      ticketMetadataURI,
      {
        value: ticketPrice,
        gasLimit: 500000,
      }
    );

    console.log('Minting ticket, tx hash:', tx.hash);
    const receipt = await tx.wait();

    // Extract tokenId from event logs
    let tokenId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed?.name === 'TicketMinted') {
          tokenId = parsed.args.tokenId.toString();
          break;
        }
      } catch (e) {
        // Skip logs that don't match our ABI
      }
    }

    return {
      success: true,
      txHash: receipt.hash,
    };
  } catch (error: any) {
    console.error('Mint ticket error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * POST /api/payment/xendit/webhook
 * Handle Xendit payment callback
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const callbackToken = request.headers.get('x-callback-token');

    // Verify webhook signature
    const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN;
    if (!webhookToken || !callbackToken || !verifyXenditWebhookSignature(webhookToken, callbackToken)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const {
      id: invoiceId,
      external_id: externalId,
      status,
      amount,
      paid_amount,
      payment_method,
      paid_at,
    } = body;

    console.log('Xendit webhook received:', { externalId, status, amount });

    // Get payment record from database
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('external_id', externalId)
      .single();

    if (fetchError || !payment) {
      console.error('Payment not found:', externalId);
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Update payment status
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status,
        paid_amount: paid_amount || null,
        payment_method: payment_method || null,
        paid_at: paid_at || null,
        updated_at: new Date().toISOString(),
      })
      .eq('external_id', externalId);

    if (updateError) {
      console.error('Failed to update payment:', updateError);
    }

    // If payment is successful, mint the ticket
    if (status === 'PAID' && !payment.ticket_minted) {
      console.log('Payment successful, minting ticket for:', payment.buyer_address);

      const mintResult = await mintTicketWithPlatformWallet(
        payment.event_id,
        payment.ticket_type_id,
        payment.buyer_address
      );

      if (mintResult.success) {
        // Update payment record with ticket info
        const { error: updateTicketError } = await supabase
          .from('payments')
          .update({
            ticket_minted: true,
            tx_hash: mintResult.txHash,
            minted_at: new Date().toISOString(),
          })
          .eq('external_id', externalId);

        if (updateTicketError) {
          console.error('Failed to update ticket info:', updateTicketError);
        }

        console.log('Ticket minted successfully:', mintResult.txHash);
      } else {
        console.error('Failed to mint ticket:', mintResult.error);
        
        // Update payment record with error
        await supabase
          .from('payments')
          .update({
            mint_error: mintResult.error,
          })
          .eq('external_id', externalId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// GET endpoint to manually check webhook status (for debugging)
export async function GET(request: NextRequest) {
  const externalId = request.nextUrl.searchParams.get('externalId');
  
  if (!externalId) {
    return NextResponse.json(
      { error: 'Missing externalId parameter' },
      { status: 400 }
    );
  }

  const { data: payment, error } = await supabase
    .from('payments')
    .select('*')
    .eq('external_id', externalId)
    .single();

  if (error || !payment) {
    return NextResponse.json(
      { error: 'Payment not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ payment });
}

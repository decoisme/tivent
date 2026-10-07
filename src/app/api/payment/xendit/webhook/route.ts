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
 * 
 * Process:
 * 1. Platform wallet calls buyTicket() - ticket minted to platform wallet
 * 2. Platform wallet transfers ticket to buyer's address
 */
export async function mintTicketWithPlatformWallet(
  eventId: number,
  ticketTypeId: number,
  buyerAddress: string
): Promise<{ success: boolean; txHash?: string; tokenId?: string; error?: string }> {
  try {
    console.log('[mintTicket] Starting mint process...');
    console.log('[mintTicket] Event ID:', eventId);
    console.log('[mintTicket] Ticket Type:', ticketTypeId);
    console.log('[mintTicket] Buyer Address:', buyerAddress);

    // Check if platform wallet is configured
    const platformPrivateKey = process.env.PLATFORM_PRIVATE_KEY;
    if (!platformPrivateKey) {
      throw new Error('Platform wallet not configured');
    }

    // Initialize provider and wallet
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
    const wallet = new ethers.Wallet(platformPrivateKey, provider);
    
    console.log('[mintTicket] Platform wallet:', wallet.address);

    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log('[mintTicket] Platform wallet balance:', ethers.formatEther(balance), 'POL');

    if (balance === 0n) {
      throw new Error('Platform wallet has no POL for gas fees');
    }

    // Initialize contract
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

    // Generate ticket metadata URI
    const ticketMetadataURI = `ipfs://ticket-${eventId}-${Date.now()}`;

    // Get ticket price from contract
    const ticketType = await contract.getTicketType(eventId, ticketTypeId);
    const ticketPrice = ticketType.price;

    console.log('[mintTicket] Ticket price:', ethers.formatEther(ticketPrice), 'POL');

    // Step 1: Buy ticket (mints to platform wallet)
    console.log('[mintTicket] Step 1: Buying ticket (minting to platform wallet)...');
    const buyTx = await contract.buyTicket(
      eventId,
      ticketTypeId,
      ticketMetadataURI,
      {
        value: ticketPrice,
        gasLimit: 500000,
      }
    );

    console.log('[mintTicket] Buy transaction sent:', buyTx.hash);
    const buyReceipt = await buyTx.wait();
    console.log('[mintTicket] Buy transaction confirmed in block:', buyReceipt.blockNumber);

    // Extract tokenId from event logs
    let tokenId: string | null = null;
    for (const log of buyReceipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed?.name === 'TicketMinted') {
          tokenId = parsed.args.tokenId.toString();
          console.log('[mintTicket] Token ID minted:', tokenId);
          break;
        }
      } catch (e) {
        // Skip logs that don't match our ABI
      }
    }

    if (!tokenId) {
      throw new Error('Failed to extract tokenId from transaction logs');
    }

    // Step 2: Transfer ticket from platform wallet to buyer
    console.log('[mintTicket] Step 2: Transferring ticket to buyer...');
    const transferTx = await contract.transferFrom(
      wallet.address, // from: platform wallet
      buyerAddress,   // to: buyer
      tokenId,        // tokenId
      {
        gasLimit: 200000,
      }
    );

    console.log('[mintTicket] Transfer transaction sent:', transferTx.hash);
    const transferReceipt = await transferTx.wait();
    console.log('[mintTicket] Transfer confirmed in block:', transferReceipt.blockNumber);

    // Verify ownership
    const owner = await contract.ownerOf(tokenId);
    console.log('[mintTicket] Ticket owner after transfer:', owner);
    console.log('[mintTicket] Expected owner (buyer):', buyerAddress);

    if (owner.toLowerCase() !== buyerAddress.toLowerCase()) {
      throw new Error(`Transfer verification failed: owner is ${owner}, expected ${buyerAddress}`);
    }

    console.log('[mintTicket] ✅ Ticket successfully minted and transferred!');
    console.log('[mintTicket] Buy TX:', buyReceipt.hash);
    console.log('[mintTicket] Transfer TX:', transferReceipt.hash);

    return {
      success: true,
      txHash: transferReceipt.hash, // Return transfer tx as main tx
      tokenId: tokenId,
    };
  } catch (error: any) {
    console.error('[mintTicket] ❌ Error:', error);
    console.error('[mintTicket] Error message:', error.message);
    console.error('[mintTicket] Error reason:', error.reason);
    console.error('[mintTicket] Error code:', error.code);
    
    return {
      success: false,
      error: error.reason || error.message || 'Unknown minting error',
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

    // If payment is successful, send verification email
    if (status === 'PAID' && !payment.email_verified) {
      console.log('Payment successful for:', payment.buyer_email);

      // Check if we should skip email verification (for testing)
      const skipEmailVerification = process.env.SKIP_EMAIL_VERIFICATION === 'true';

      if (skipEmailVerification) {
        console.log('[webhook] Email verification skipped (SKIP_EMAIL_VERIFICATION=true)');
        
        // Auto-verify email
        await supabase
          .from('payments')
          .update({
            email_verified: true,
            verified_at: new Date().toISOString(),
            status: 'VERIFIED',
          })
          .eq('external_id', externalId);
          
        // Continue to minting below
      } else {
        console.log('[webhook] Sending verification email to:', payment.buyer_email);

        // Send verification email
        try {
          const baseUrl = request.headers.get('origin') || 
                          `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}`;
          
          const sendResponse = await fetch(`${baseUrl}/api/payment/xendit/send-verification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ externalId }),
          });

          const sendResult = await sendResponse.json();
          
          if (sendResult.success) {
            console.log('[webhook] Verification email sent');
            
            // Update status to PAID_PENDING_VERIFICATION
            await supabase
              .from('payments')
              .update({
                status: 'PAID_PENDING_VERIFICATION',
              })
              .eq('external_id', externalId);
              
            // Exit early - wait for email verification
            return NextResponse.json({ success: true });
          } else {
            console.error('[webhook] Failed to send verification email:', sendResult.error);
            
            // Fallback: Auto-verify if email fails
            console.log('[webhook] Auto-verifying due to email failure');
            await supabase
              .from('payments')
              .update({
                email_verified: true,
                verified_at: new Date().toISOString(),
                status: 'VERIFIED',
              })
              .eq('external_id', externalId);
          }
        } catch (emailError) {
          console.error('[webhook] Error sending verification email:', emailError);
          
          // Fallback: Auto-verify if email fails
          console.log('[webhook] Auto-verifying due to email error');
          await supabase
            .from('payments')
            .update({
              email_verified: true,
              verified_at: new Date().toISOString(),
              status: 'VERIFIED',
            })
            .eq('external_id', externalId);
        }
      }
    }

    // Reload payment data after potential verification
    const { data: updatedPayment } = await supabase
      .from('payments')
      .select('*')
      .eq('external_id', externalId)
      .single();

    // Only mint ticket if email is verified
    if (status === 'PAID' && updatedPayment?.email_verified && !updatedPayment.ticket_minted) {
      console.log('Payment successful for:', externalId);

      // Check if buyer provided a wallet address
      if (!payment.buyer_address) {
        console.log('No buyer address provided, ticket will be minted manually later');
        
        // Update status to indicate ticket is pending manual claim
        await supabase
          .from('payments')
          .update({
            status: 'PAID_PENDING_MINT',
            updated_at: new Date().toISOString(),
          })
          .eq('external_id', externalId);
          
        return NextResponse.json({ 
          success: true, 
          message: 'Payment successful, ticket pending wallet connection' 
        });
      }

      console.log('Minting ticket for wallet:', payment.buyer_address);

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

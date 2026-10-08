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
 * Mint ticket using platform wallet after successful fiat payment
 * 
 * Process (FREE MINTING):
 * 1. Platform wallet calls mintTicketFree() - ticket minted directly to buyer
 * 2. No payment required - user already paid via fiat (Xendit)
 * 3. Platform only pays gas fees (~0.002 POL)
 */
export async function mintTicketWithPlatformWallet(
  eventId: number,
  ticketTypeId: number,
  buyerAddress: string
): Promise<{ success: boolean; txHash?: string; tokenId?: string; error?: string }> {
  try {
    console.log('[mintTicket] Starting FREE mint process...');
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

    // Check balance (only need gas, not ticket price!)
    const balance = await provider.getBalance(wallet.address);
    console.log('[mintTicket] Platform wallet balance:', ethers.formatEther(balance), 'POL');

    if (balance === 0n) {
      throw new Error('Platform wallet has no POL for gas fees');
    }

    // Minimum balance check: need at least 0.01 POL for gas
    const minBalance = ethers.parseEther('0.01');
    if (balance < minBalance) {
      console.warn('[mintTicket] ⚠️ Low balance warning: only', ethers.formatEther(balance), 'POL');
    }

    // Initialize contract
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

    // Generate ticket metadata URI
    const ticketMetadataURI = `ipfs://ticket-${eventId}-${Date.now()}`;

    // Normalize buyer address checksum
    const buyerAddressChecksummed = ethers.getAddress(buyerAddress);
    console.log('[mintTicket] Normalized buyer address:', buyerAddressChecksummed);

    // Call mintTicketFree (no payment required!)
    console.log('[mintTicket] Calling mintTicketFree (free minting, gas only)...');
    const mintTx = await contract.mintTicketFree(
      eventId,
      ticketTypeId,
      buyerAddressChecksummed, // mint directly to buyer
      ticketMetadataURI,
      {
        gasLimit: 300000, // Only pay for gas
        // NO value field - no payment!
      }
    );

    console.log('[mintTicket] Mint transaction sent:', mintTx.hash);
    const mintReceipt = await mintTx.wait();
    console.log('[mintTicket] Mint transaction confirmed in block:', mintReceipt.blockNumber);

    // Calculate gas cost
    const gasUsed = mintReceipt.gasUsed;
    const gasPrice = mintTx.gasPrice || 0n;
    const gasCost = gasUsed * gasPrice;
    const gasCostPOL = ethers.formatEther(gasCost);
    console.log('[mintTicket] ⛽ Gas used:', gasUsed.toString());
    console.log('[mintTicket] 💸 Gas cost:', gasCostPOL, 'POL (~$' + (parseFloat(gasCostPOL) * 0.5).toFixed(4) + ' USD)');

    // Extract tokenId from event logs
    let tokenId: string | null = null;
    for (const log of mintReceipt.logs) {
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

    // Verify ownership
    const owner = await contract.ownerOf(tokenId);
    console.log('[mintTicket] Ticket owner:', owner);
    console.log('[mintTicket] Expected owner:', buyerAddressChecksummed);

    if (owner.toLowerCase() !== buyerAddressChecksummed.toLowerCase()) {
      throw new Error(`Ownership verification failed: owner is ${owner}, expected ${buyerAddressChecksummed}`);
    }

    console.log('[mintTicket] ✅ Ticket successfully minted (FREE)!');
    console.log('[mintTicket] TX Hash:', mintReceipt.hash);
    console.log('[mintTicket] Token ID:', tokenId);
    console.log('[mintTicket] Owner:', owner);

    return {
      success: true,
      txHash: mintReceipt.hash,
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

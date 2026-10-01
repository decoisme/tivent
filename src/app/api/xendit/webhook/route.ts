import { NextRequest, NextResponse } from 'next/server';
import { verifyXenditWebhookSignature, getXenditInvoiceStatus } from '@/lib/xendit';
import { supabase } from '@/lib/supabase';
import { ethers } from 'ethers';

export const dynamic = 'force-dynamic';

/**
 * Xendit webhook handler for payment notifications
 * POST /api/xendit/webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const callbackToken = request.headers.get('x-callback-token') || '';

    // Verify webhook signature
    const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN || '';
    if (!verifyXenditWebhookSignature(webhookToken, callbackToken)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const { id: invoiceId, status, external_id, paid_amount } = body;

    console.log('Xendit webhook received:', { invoiceId, status, external_id });

    // Only process PAID invoices
    if (status !== 'PAID') {
      return NextResponse.json({ received: true, message: 'Not paid yet' });
    }

    // Get invoice details
    const invoiceStatus = await getXenditInvoiceStatus(invoiceId);
    if (!invoiceStatus.success) {
      console.error('Failed to get invoice status');
      return NextResponse.json(
        { error: 'Failed to verify payment' },
        { status: 500 }
      );
    }

    // Get pending payment from database
    const { data: pendingPayment, error: fetchError } = await supabase
      .from('pending_payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .single();

    if (fetchError || !pendingPayment) {
      console.error('Pending payment not found:', fetchError);
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

    // Check if already processed
    if (pendingPayment.status === 'completed') {
      return NextResponse.json({ 
        received: true, 
        message: 'Already processed' 
      });
    }

    // Update payment status to processing
    await supabase
      .from('pending_payments')
      .update({ 
        status: 'processing',
        paid_at: new Date().toISOString(),
        paid_amount: paid_amount,
      })
      .eq('invoice_id', invoiceId);

    // Execute blockchain transaction
    try {
      await executeBlockchainTransaction(pendingPayment);

      // Update status to completed
      await supabase
        .from('pending_payments')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('invoice_id', invoiceId);

      console.log('✅ Payment processed and blockchain transaction executed');

      return NextResponse.json({ 
        received: true, 
        message: 'Payment processed successfully' 
      });
    } catch (blockchainError: any) {
      console.error('Blockchain transaction failed:', blockchainError);

      // Update status to failed
      await supabase
        .from('pending_payments')
        .update({ 
          status: 'failed',
          error_message: blockchainError.message,
        })
        .eq('invoice_id', invoiceId);

      return NextResponse.json(
        { error: 'Blockchain transaction failed' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Execute blockchain transaction after payment
 */
async function executeBlockchainTransaction(pendingPayment: any) {
  const {
    event_id,
    ticket_quantity,
    wallet_address,
    payer_email,
  } = pendingPayment;

  // Initialize provider and wallet
  const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
  const platformWallet = new ethers.Wallet(
    process.env.PLATFORM_PRIVATE_KEY || '',
    provider
  );

  // Contract ABI (simplified)
  const contractABI = [
    'function buyTicket(uint256 eventId, uint256 ticketTypeId, string memory ticketMetadataURI) external payable',
  ];

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
  const contract = new ethers.Contract(contractAddress, contractABI, platformWallet);

  // Get event price from contract
  const eventData = await contract.events(event_id);
  const ticketPrice = eventData.ticketPrice;

  // Calculate total price
  const totalPrice = ticketPrice * BigInt(ticket_quantity);

  // Determine recipient wallet
  let recipientWallet = wallet_address;
  
  // If user doesn't have wallet, create custodial wallet
  if (!recipientWallet) {
    recipientWallet = await createCustodialWallet(payer_email);
  }

  // Purchase tickets (one by one or batch)
  for (let i = 0; i < ticket_quantity; i++) {
    const ticketMetadataURI = `ipfs://ticket-${event_id}-${Date.now()}-${i}`;
    
    const tx = await contract.buyTicket(
      event_id,
      0, // ticketTypeId
      ticketMetadataURI,
      { value: ticketPrice }
    );

    await tx.wait();

    console.log(`✓ Ticket ${i + 1}/${ticket_quantity} minted. Tx: ${tx.hash}`);

    // If custodial wallet, transfer to it
    if (!wallet_address && recipientWallet) {
      // Transfer NFT to custodial wallet
      // This would require additional contract call
    }
  }

  return true;
}

/**
 * Create custodial wallet for user
 */
async function createCustodialWallet(email: string): Promise<string> {
  // Generate new wallet
  const wallet = ethers.Wallet.createRandom();

  // Store in database (encrypted)
  const { error } = await supabase
    .from('custodial_wallets')
    .insert({
      email: email,
      wallet_address: wallet.address,
      encrypted_private_key: encryptPrivateKey(wallet.privateKey),
      created_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Failed to create custodial wallet:', error);
    throw new Error('Failed to create wallet');
  }

  console.log(`✓ Custodial wallet created: ${wallet.address}`);

  return wallet.address;
}

/**
 * Encrypt private key (simplified - use proper encryption in production)
 */
function encryptPrivateKey(privateKey: string): string {
  // TODO: Implement proper encryption (e.g., using crypto.js or KMS)
  // For now, this is a placeholder
  return Buffer.from(privateKey).toString('base64');
}

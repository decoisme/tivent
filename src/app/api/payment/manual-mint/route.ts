import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import { ABI, CONTRACT_ADDRESS } from '@/lib/contractReads';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/payment/manual-mint
 * Manually trigger ticket minting for verified payment
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

    console.log('[manual-mint] Processing:', externalId);

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

    // Validate payment
    if (!payment.email_verified) {
      return NextResponse.json(
        { error: 'Email not verified yet', success: false },
        { status: 400 }
      );
    }

    if (payment.ticket_minted) {
      return NextResponse.json({
        success: true,
        message: 'Ticket already minted',
        tx_hash: payment.tx_hash,
      });
    }

    if (!payment.buyer_address) {
      return NextResponse.json(
        { error: 'No wallet address provided', success: false },
        { status: 400 }
      );
    }

    // Check platform wallet
    const platformPrivateKey = process.env.PLATFORM_PRIVATE_KEY;
    if (!platformPrivateKey) {
      return NextResponse.json(
        { error: 'Platform wallet not configured', success: false },
        { status: 500 }
      );
    }

    console.log('[manual-mint] Platform wallet configured');

    // Initialize provider and wallet
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
    const wallet = new ethers.Wallet(platformPrivateKey, provider);

    console.log('[manual-mint] Platform wallet address:', wallet.address);

    // Check platform wallet balance
    const balance = await provider.getBalance(wallet.address);
    console.log('[manual-mint] Platform wallet balance:', ethers.formatEther(balance), 'POL');

    if (balance === 0n) {
      return NextResponse.json(
        { 
          error: 'Platform wallet has no POL for gas fees. Please fund the wallet.',
          platformWallet: wallet.address,
          success: false 
        },
        { status: 500 }
      );
    }

    // Initialize contract
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

    console.log('[manual-mint] Contract address:', CONTRACT_ADDRESS);
    console.log('[manual-mint] Buyer address:', payment.buyer_address);
    console.log('[manual-mint] Event ID:', payment.event_id);
    console.log('[manual-mint] Ticket type:', payment.ticket_type_id);

    // Get ticket price from contract
    const ticketType = await contract.getTicketType(payment.event_id, payment.ticket_type_id);
    const ticketPrice = ticketType.price;

    console.log('[manual-mint] Ticket price:', ethers.formatEther(ticketPrice), 'POL');

    // Generate metadata URI
    const metadataURI = `ipfs://ticket-${payment.event_id}-${Date.now()}`;

    // Step 1: Buy ticket (mints to platform wallet)
    console.log('[manual-mint] Step 1: Buying ticket (minting to platform wallet)...');
    
    const buyTx = await contract.buyTicket(
      payment.event_id,
      payment.ticket_type_id,
      metadataURI,
      {
        value: ticketPrice,
        gasLimit: 500000,
      }
    );

    console.log('[manual-mint] Buy transaction sent:', buyTx.hash);
    console.log('[manual-mint] Waiting for confirmation...');

    const buyReceipt = await buyTx.wait();

    console.log('[manual-mint] Buy transaction confirmed!');
    console.log('[manual-mint] Block:', buyReceipt.blockNumber);
    console.log('[manual-mint] Gas used:', buyReceipt.gasUsed.toString());

    // Extract tokenId from event logs
    let tokenId: string | null = null;
    for (const log of buyReceipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed?.name === 'TicketMinted') {
          tokenId = parsed.args.tokenId.toString();
          console.log('[manual-mint] Token ID:', tokenId);
          break;
        }
      } catch (e) {
        // Skip logs that don't match
      }
    }

    if (!tokenId) {
      throw new Error('Failed to extract tokenId from buy transaction');
    }

    // Step 2: Transfer ticket from platform wallet to buyer
    console.log('[manual-mint] Step 2: Transferring ticket to buyer...');
    
    // Normalize buyer address checksum
    const buyerAddressChecksummed = ethers.getAddress(payment.buyer_address);
    console.log('[manual-mint] Normalized buyer address:', buyerAddressChecksummed);
    
    const transferTx = await contract.transferFrom(
      wallet.address,              // from: platform wallet
      buyerAddressChecksummed,     // to: buyer (checksummed)
      tokenId,                     // tokenId
      {
        gasLimit: 200000,
      }
    );

    console.log('[manual-mint] Transfer transaction sent:', transferTx.hash);
    const receipt = await transferTx.wait();

    console.log('[manual-mint] Transfer confirmed!');
    console.log('[manual-mint] Block:', receipt.blockNumber);
    console.log('[manual-mint] Gas used:', receipt.gasUsed.toString());

    // Verify ownership
    const owner = await contract.ownerOf(tokenId);
    console.log('[manual-mint] Ticket owner after transfer:', owner);
    console.log('[manual-mint] Expected owner (buyer):', buyerAddressChecksummed);

    if (owner.toLowerCase() !== buyerAddressChecksummed.toLowerCase()) {
      throw new Error(`Transfer verification failed: owner is ${owner}, expected ${buyerAddressChecksummed}`);
    }

    console.log('[manual-mint] ✅ Ticket successfully minted and transferred!');

    // Update database
    await supabase
      .from('payments')
      .update({
        ticket_minted: true,
        tx_hash: receipt.hash, // Transfer tx hash (final transaction)
        minted_at: new Date().toISOString(),
        mint_error: null,
      })
      .eq('external_id', externalId);

    console.log('[manual-mint] Database updated');

    return NextResponse.json({
      success: true,
      message: 'Ticket minted and transferred successfully!',
      token_id: tokenId,
      buy_tx_hash: buyReceipt.hash,
      transfer_tx_hash: receipt.hash,
      block_number: receipt.blockNumber,
      gas_used: receipt.gasUsed.toString(),
      buy_tx_url: `https://amoy.polygonscan.com/tx/${buyReceipt.hash}`,
      transfer_tx_url: `https://amoy.polygonscan.com/tx/${receipt.hash}`,
      owner: payment.buyer_address,
    });

  } catch (error: any) {
    console.error('[manual-mint] Error:', error);
    
    // Save error to database
    try {
      const { externalId } = await request.json();
      await supabase
        .from('payments')
        .update({
          mint_error: error.message,
        })
        .eq('external_id', externalId);
    } catch (e) {
      // Ignore DB update error
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to mint ticket',
      details: error.reason || error.shortMessage,
      stack: error.stack,
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/payment/xendit/verify-email
 * Verify email with token
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token required', success: false },
        { status: 400 }
      );
    }

    console.log('[verify-email] Verifying token:', token);

    // Find payment by verification token
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('verification_token', token)
      .single();

    if (fetchError || !payment) {
      console.error('[verify-email] Payment not found:', fetchError);
      return NextResponse.json(
        { error: 'Invalid or expired verification token', success: false },
        { status: 404 }
      );
    }

    // Check if already verified
    if (payment.email_verified) {
      return NextResponse.json(
        { 
          success: true,
          message: 'Email already verified',
          payment: {
            external_id: payment.external_id,
            buyer_email: payment.buyer_email,
            verified_at: payment.verified_at,
          }
        },
        { status: 200 }
      );
    }

    // Check token expiry (24 hours)
    const tokenAge = Date.now() - new Date(payment.verification_sent_at).getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (tokenAge > maxAge) {
      return NextResponse.json(
        { error: 'Verification token expired', success: false },
        { status: 400 }
      );
    }

    // Mark as verified
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({
        email_verified: true,
        verified_at: new Date().toISOString(),
        status: 'VERIFIED',
      })
      .eq('verification_token', token)
      .select()
      .single();

    if (updateError) {
      console.error('[verify-email] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to verify email', success: false },
        { status: 500 }
      );
    }

    console.log('[verify-email] Email verified successfully:', payment.buyer_email);

    // Trigger ticket minting if buyer has wallet address
    if (updatedPayment.buyer_address) {
      console.log('[verify-email] Triggering ticket minting for wallet:', updatedPayment.buyer_address);
      
      try {
        // Import minting function
        const { mintTicketWithPlatformWallet } = await import('../webhook/route');
        
        const mintResult = await mintTicketWithPlatformWallet(
          updatedPayment.event_id,
          updatedPayment.ticket_type_id,
          updatedPayment.buyer_address
        );

        if (mintResult.success) {
          // Update payment with ticket info
          await supabase
            .from('payments')
            .update({
              ticket_minted: true,
              tx_hash: mintResult.txHash,
              minted_at: new Date().toISOString(),
            })
            .eq('verification_token', token);

          console.log('[verify-email] Ticket minted successfully:', mintResult.txHash);
        } else {
          console.error('[verify-email] Failed to mint ticket:', mintResult.error);
          
          // Save error for debugging
          await supabase
            .from('payments')
            .update({
              mint_error: mintResult.error,
            })
            .eq('verification_token', token);
        }
      } catch (mintError: any) {
        console.error('[verify-email] Mint error:', mintError);
        
        await supabase
          .from('payments')
          .update({
            mint_error: mintError.message,
          })
          .eq('verification_token', token);
      }
    } else {
      console.log('[verify-email] No wallet address provided, ticket will be claimed manually');
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
      payment: {
        external_id: updatedPayment.external_id,
        buyer_email: updatedPayment.buyer_email,
        verified_at: updatedPayment.verified_at,
        ticket_minted: updatedPayment.ticket_minted,
        buyer_address: updatedPayment.buyer_address,
      },
    });
  } catch (error: any) {
    console.error('[verify-email] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify email', success: false },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payment/xendit/verify-email?token=xxx
 * Verify email via URL click
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/payment/failed?reason=no-token', request.url));
  }

  // Verify using POST logic
  const verifyResponse = await POST(
    new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify({ token }),
      headers: request.headers,
    })
  );

  const result = await verifyResponse.json();

  if (result.success) {
    // Redirect to success page with external_id
    return NextResponse.redirect(
      new URL(`/payment/verified?externalId=${result.payment.external_id}`, request.url)
    );
  } else {
    // Redirect to failed page with error
    return NextResponse.redirect(
      new URL(`/payment/failed?reason=${encodeURIComponent(result.error)}`, request.url)
    );
  }
}

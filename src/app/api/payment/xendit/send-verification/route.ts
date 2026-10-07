import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/payment/xendit/send-verification
 * Send email verification after payment
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

    // Get payment record
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

    // Check if already verified
    if (payment.email_verified) {
      return NextResponse.json(
        { error: 'Email already verified', success: false },
        { status: 400 }
      );
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Update payment with verification token
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        verification_token: verificationToken,
        verification_sent_at: new Date().toISOString(),
      })
      .eq('external_id', externalId);

    if (updateError) {
      console.error('[send-verification] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to generate verification token', success: false },
        { status: 500 }
      );
    }

    // Generate verification URL
    const baseUrl = request.headers.get('origin') || 
                    `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}`;
    const verificationUrl = `${baseUrl}/payment/verify?token=${verificationToken}`;

    // TODO: Send actual email using Resend/Nodemailer
    // For now, we'll return the URL for testing
    console.log('[send-verification] Verification URL:', verificationUrl);
    console.log('[send-verification] Send to:', payment.buyer_email);

    // In production, uncomment and implement email sending:
    // await sendVerificationEmail(payment.buyer_email, verificationUrl);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent (simulated)',
      // For development/testing - REMOVE in production!
      debug: {
        verificationUrl,
        email: payment.buyer_email,
        note: 'Copy this URL to verify email in testing',
      },
    });
  } catch (error: any) {
    console.error('[send-verification] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send verification', success: false },
      { status: 500 }
    );
  }
}

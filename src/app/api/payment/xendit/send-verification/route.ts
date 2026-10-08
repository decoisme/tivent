import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email';

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
    // Smart base URL detection with production fallback
    let baseUrl = request.headers.get('origin') || 
                  `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}`;
    
    // If base URL is production domain but we're in Vercel preview deployment,
    // use the actual deployment URL for consistency
    const actualHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
    if (actualHost && actualHost.includes('vercel.app') && !actualHost.includes('tivent-chi')) {
      // We're in a specific deployment, use that URL
      baseUrl = `https://${actualHost}`;
    }
    
    console.log('[send-verification] Base URL:', baseUrl);
    console.log('[send-verification] Headers - host:', request.headers.get('host'));
    console.log('[send-verification] Headers - x-forwarded-host:', request.headers.get('x-forwarded-host'));
    
    const verificationUrl = `${baseUrl}/api/payment/xendit/verify-email?token=${verificationToken}`;
    console.log('[send-verification] Verification URL:', verificationUrl);

    // Send verification email
    console.log('[send-verification] Sending email to:', payment.buyer_email);
    
    const emailResult = await sendVerificationEmail({
      to: payment.buyer_email,
      verificationUrl,
      eventName: `Event #${payment.event_id}`,
      ticketQuantity: payment.ticket_quantity,
      amount: payment.amount_idr,
    });

    if (!emailResult.success) {
      console.error('[send-verification] Email send failed:', emailResult.error);
      return NextResponse.json(
        { 
          error: 'Failed to send verification email', 
          details: emailResult.error,
          success: false 
        },
        { status: 500 }
      );
    }

    console.log('[send-verification] Email sent successfully:', emailResult.messageId);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
      messageId: emailResult.messageId,
    });
  } catch (error: any) {
    console.error('[send-verification] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send verification', success: false },
      { status: 500 }
    );
  }
}

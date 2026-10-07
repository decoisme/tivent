import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/email';

/**
 * GET /api/test-email?email=test@example.com
 * Test email sending
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testEmail = searchParams.get('email') || 'test@example.com';

  console.log('[test-email] Testing email to:', testEmail);
  console.log('[test-email] RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
  console.log('[test-email] API key starts with:', process.env.RESEND_API_KEY?.substring(0, 5));

  try {
    const result = await sendVerificationEmail({
      to: testEmail,
      verificationUrl: 'http://localhost:3000/test-verification',
      eventName: 'Test Event',
      ticketQuantity: 1,
      amount: 50000,
    });

    console.log('[test-email] Result:', result);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully!',
        messageId: result.messageId,
        sentTo: testEmail,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        sentTo: testEmail,
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[test-email] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

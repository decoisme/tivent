import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendVerificationEmailParams {
  to: string;
  verificationUrl: string;
  eventName?: string;
  ticketQuantity?: number;
  amount?: number;
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail({
  to,
  verificationUrl,
  eventName = 'Event',
  ticketQuantity = 1,
  amount,
}: SendVerificationEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Tivent <onboarding@resend.dev>', // Change to your domain later
      to,
      subject: 'Verify your email - Tivent Ticket Purchase',
      html: getVerificationEmailTemplate({
        verificationUrl,
        eventName,
        ticketQuantity,
        amount,
      }),
    });

    if (error) {
      console.error('[email] Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log('[email] Verification email sent:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error('[email] Send error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Email template for verification
 */
function getVerificationEmailTemplate({
  verificationUrl,
  eventName,
  ticketQuantity,
  amount,
}: {
  verificationUrl: string;
  eventName: string;
  ticketQuantity: number;
  amount?: number;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - Tivent</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                🎫 Tivent
              </h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                Decentralized Event Ticketing
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              
              <!-- Title -->
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                Verify Your Email
              </h2>
              
              <!-- Message -->
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                Thank you for your purchase! To complete your ticket order and receive your NFT ticket, please verify your email address.
              </p>

              <!-- Order Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin: 20px 0; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px; color: #999999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                      Order Details
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">Event:</td>
                        <td align="right" style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${eventName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">Tickets:</td>
                        <td align="right" style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${ticketQuantity}x Ticket(s)</td>
                      </tr>
                      ${amount ? `
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">Amount:</td>
                        <td align="right" style="padding: 8px 0; color: #667eea; font-size: 14px; font-weight: 600;">Rp ${amount.toLocaleString('id-ID')}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Alternative Link -->
              <p style="margin: 20px 0 0; color: #999999; font-size: 13px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${verificationUrl}" style="color: #667eea; text-decoration: none; word-break: break-all;">
                  ${verificationUrl}
                </a>
              </p>

              <!-- Security Note -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff9e6; border-left: 3px solid #ffc107; margin: 30px 0 0; border-radius: 4px;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="margin: 0; color: #856404; font-size: 13px; line-height: 1.5;">
                      ⚠️ <strong>Security Notice:</strong> This verification link will expire in 24 hours. If you didn't make this purchase, please ignore this email.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #999999; font-size: 13px;">
                This is an automated email from Tivent. Please do not reply.
              </p>
              <p style="margin: 0; color: #cccccc; font-size: 12px;">
                © 2026 Tivent. Decentralized Event Ticketing Platform.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

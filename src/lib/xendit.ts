import Xendit from 'xendit-node';

// Initialize Xendit client (server-side only)
// Only initialize if valid secret key exists
let xenditClient: Xendit | null = null;

try {
  const secretKey = process.env.XENDIT_SECRET_KEY;
  if (secretKey && secretKey.startsWith('xnd_')) {
    xenditClient = new Xendit({
      secretKey: secretKey,
    });
  } else {
    console.warn('Xendit: Invalid or missing secret key. Fiat payments disabled.');
  }
} catch (error) {
  console.error('Xendit initialization error:', error);
}

/**
 * Create invoice for ticket purchase
 */
export async function createXenditInvoice(params: {
  externalId: string;
  amount: number;
  payerEmail: string;
  description: string;
  eventId: number;
  ticketQuantity: number;
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
}) {
  // Check if Xendit is initialized
  if (!xenditClient) {
    return {
      success: false,
      error: 'Xendit payment gateway is not configured. Please use cryptocurrency payment.',
    };
  }

  const { Invoice } = xenditClient;

  try {
    const invoice = await Invoice.createInvoice({
      data: {
        externalId: params.externalId,
        amount: params.amount,
        payerEmail: params.payerEmail,
        description: params.description,
        invoiceDuration: 86400, // 24 hours
        currency: 'IDR',
        successRedirectUrl: params.successRedirectUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
        failureRedirectUrl: params.failureRedirectUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/payment/failed`,
        items: [
          {
            name: params.description,
            quantity: params.ticketQuantity,
            price: params.amount / params.ticketQuantity,
            category: 'Event Ticket',
          },
        ],
      },
    });

    return {
      success: true,
      invoiceId: invoice.id,
      invoiceUrl: invoice.invoiceUrl,
      expiryDate: invoice.expiryDate,
      amount: invoice.amount,
    };
  } catch (error: any) {
    console.error('Xendit invoice creation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create invoice',
    };
  }
}

/**
 * Get invoice status
 */
export async function getXenditInvoiceStatus(invoiceId: string) {
  if (!xenditClient) {
    return {
      success: false,
      error: 'Xendit payment gateway is not configured.',
    };
  }

  const { Invoice } = xenditClient;

  try {
    const invoice = await Invoice.getInvoiceById({ invoiceId: invoiceId });

    return {
      success: true,
      status: invoice.status,
      amount: invoice.amount,
      externalId: invoice.externalId,
      paymentMethod: invoice.paymentMethod,
      created: invoice.created,
      updated: invoice.updated,
    };
  } catch (error: any) {
    console.error('Xendit invoice status error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get invoice status',
    };
  }
}

/**
 * Verify webhook callback signature
 */
export function verifyXenditWebhookSignature(
  webhookToken: string,
  callbackToken: string
): boolean {
  return webhookToken === callbackToken;
}

/**
 * Exchange rate helper (mock - in production use real API)
 * SERVER-SIDE ONLY - for Xendit invoice calculations
 */
export async function convertIDRtoETH(amountIDR: number): Promise<number> {
  // Mock conversion rate: 1 ETH = 50,000,000 IDR
  // In production, use real exchange rate API (e.g., CoinGecko, Binance)
  const ETH_IDR_RATE = 50000000;
  return amountIDR / ETH_IDR_RATE;
}

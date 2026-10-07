'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, ExternalLink, Ticket, ArrowRight } from 'lucide-react';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const externalId = searchParams.get('externalId');

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (externalId) {
      checkPaymentStatus();
    } else {
      setError('Invalid payment reference');
      setLoading(false);
    }
  }, [externalId]);

  const checkPaymentStatus = async () => {
    try {
      const response = await fetch(`/api/payment/xendit/webhook?externalId=${externalId}`);
      const data = await response.json();

      if (data.payment) {
        setPayment(data.payment);
      } else {
        setError('Payment not found');
      }
    } catch (err: any) {
      console.error('Error checking payment:', err);
      setError('Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="dp-surface p-12 max-w-md w-full text-center">
          <Loader2 size={32} className="mx-auto mb-4 animate-spin" style={{ color: 'var(--accent)' }} />
          <h2 className="text-[20px] font-semibold mb-2">Verifying Payment</h2>
          <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
            Please wait while we confirm your payment...
          </p>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="dp-surface p-12 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--error-muted)' }}>
            <ExternalLink size={28} style={{ color: 'var(--error)' }} />
          </div>
          <h2 className="text-[20px] font-semibold mb-2">Payment Not Found</h2>
          <p className="text-[14px] mb-6" style={{ color: 'var(--text-secondary)' }}>
            {error || 'We could not find your payment. Please contact support if you need assistance.'}
          </p>
          <button onClick={() => router.push('/events')} className="dp-btn-primary">
            Browse Events
          </button>
        </div>
      </div>
    );
  }

  const isPaid = payment.status === 'PAID';
  const isPending = payment.status === 'PENDING';
  const ticketMinted = payment.ticket_minted;

  return (
    <div className="min-h-screen pt-[72px] pb-16 px-4">
      <div className="dp-container max-w-[600px]">
        <div className="dp-surface p-8 text-center">
          {/* Success Icon */}
          <div
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{
              backgroundColor: isPaid ? 'var(--success-muted)' : isPending ? 'var(--warning-muted)' : 'var(--error-muted)',
            }}
          >
            {isPaid ? (
              <CheckCircle2 size={40} style={{ color: 'var(--success)' }} />
            ) : isPending ? (
              <Loader2 size={40} className="animate-spin" style={{ color: 'var(--warning)' }} />
            ) : (
              <ExternalLink size={40} style={{ color: 'var(--error)' }} />
            )}
          </div>

          {/* Title */}
          <h1 className="text-[28px] font-semibold mb-2">
            {isPaid ? 'Payment Successful!' : isPending ? 'Payment Pending' : 'Payment Failed'}
          </h1>

          <p className="text-[14px] mb-8" style={{ color: 'var(--text-secondary)' }}>
            {isPaid
              ? 'Your payment has been confirmed. Your ticket is being issued.'
              : isPending
              ? 'We are waiting for payment confirmation. This may take a few minutes.'
              : 'Your payment could not be processed. Please try again.'}
          </p>

          {/* Payment Details */}
          <div className="mb-8 p-6 rounded-lg text-left" style={{ backgroundColor: 'var(--surface)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-4" style={{ color: 'var(--text-muted)' }}>
              Payment Details
            </p>

            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Invoice ID</span>
                <span className="font-mono text-[12px]">{payment.invoice_id}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Amount</span>
                <span className="font-semibold">Rp {payment.amount_idr?.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Tickets</span>
                <span className="font-semibold">{payment.ticket_quantity}x Ticket(s)</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                <span
                  className="px-2 py-0.5 rounded text-[11px] font-medium"
                  style={{
                    backgroundColor: isPaid ? 'var(--success-muted)' : isPending ? 'var(--warning-muted)' : 'var(--error-muted)',
                    color: isPaid ? 'var(--success)' : isPending ? 'var(--warning)' : 'var(--error)',
                  }}
                >
                  {payment.status}
                </span>
              </div>
              {payment.payment_method && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Payment Method</span>
                  <span className="font-medium">{payment.payment_method}</span>
                </div>
              )}
            </div>
          </div>

          {/* Ticket Minting Status */}
          {isPaid && (
            <div
              className="mb-8 p-4 rounded-lg text-left"
              style={{
                backgroundColor: ticketMinted ? 'var(--success-muted)' : 'var(--accent-muted)',
                border: `1px solid ${ticketMinted ? 'var(--success)' : 'var(--accent)'}`,
              }}
            >
              <div className="flex items-center gap-3">
                {ticketMinted ? (
                  <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
                ) : (
                  <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent)' }} />
                )}
                <div className="flex-1">
                  <p className="text-[13px] font-semibold mb-0.5" style={{ color: ticketMinted ? 'var(--success)' : 'var(--accent)' }}>
                    {ticketMinted ? 'Ticket Issued!' : 'Issuing Your Ticket...'}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                    {ticketMinted
                      ? 'Your NFT ticket has been minted to your wallet.'
                      : 'Please wait, we are minting your NFT ticket on the blockchain. This may take 1-2 minutes.'}
                  </p>
                </div>
              </div>

              {payment.tx_hash && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <a
                    href={`https://amoy.polygonscan.com/tx/${payment.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[12px]"
                    style={{ color: 'var(--accent)' }}
                  >
                    <span>View on PolygonScan</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Email Confirmation */}
          {payment.buyer_email && (
            <div className="mb-8 p-4 rounded-lg text-left" style={{ backgroundColor: 'var(--surface)' }}>
              <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                📧 A confirmation email has been sent to <span className="font-medium">{payment.buyer_email}</span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {ticketMinted && payment.buyer_address && (
              <button
                onClick={() => router.push(`/tickets?address=${payment.buyer_address}`)}
                className="dp-btn-primary"
              >
                <Ticket size={16} />
                View My Tickets
                <ArrowRight size={14} />
              </button>
            )}

            <button onClick={() => router.push('/events')} className={ticketMinted ? 'dp-btn-secondary' : 'dp-btn-primary'}>
              Browse More Events
            </button>

            {isPending && (
              <button onClick={checkPaymentStatus} className="dp-btn-secondary">
                <Loader2 size={14} />
                Refresh Status
              </button>
            )}
          </div>

          {/* Help Text */}
          {!ticketMinted && isPaid && (
            <p className="text-[11px] mt-6" style={{ color: 'var(--text-muted)' }}>
              Taking too long? Contact support with invoice ID: {payment.invoice_id}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="dp-surface p-12 max-w-md w-full text-center">
          <Loader2 size={32} className="mx-auto mb-4 animate-spin" style={{ color: 'var(--accent)' }} />
          <h2 className="text-[20px] font-semibold mb-2">Verifying Payment</h2>
          <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
            Please wait while we confirm your payment...
          </p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

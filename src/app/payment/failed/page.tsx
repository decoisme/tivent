'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { XCircle, AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function PaymentFailedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const externalId = searchParams.get('externalId');

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<any>(null);

  useEffect(() => {
    if (externalId) {
      checkPaymentStatus();
    } else {
      setLoading(false);
    }
  }, [externalId]);

  const checkPaymentStatus = async () => {
    try {
      const response = await fetch(`/api/payment/xendit/webhook?externalId=${externalId}`);
      const data = await response.json();

      if (data.payment) {
        setPayment(data.payment);
      }
    } catch (err: any) {
      console.error('Error checking payment:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="dp-surface p-12 max-w-md w-full text-center">
          <div className="dp-skeleton h-20 w-20 rounded-full mx-auto mb-4" />
          <div className="dp-skeleton h-6 w-48 mx-auto mb-2" />
          <div className="dp-skeleton h-4 w-full" />
        </div>
      </div>
    );
  }

  const eventId = payment?.event_id;

  return (
    <div className="min-h-screen pt-[72px] pb-16 px-4">
      <div className="dp-container max-w-[600px]">
        <div className="dp-surface p-8 text-center">
          {/* Error Icon */}
          <div
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: 'var(--error-muted)' }}
          >
            <XCircle size={40} style={{ color: 'var(--error)' }} />
          </div>

          {/* Title */}
          <h1 className="text-[28px] font-semibold mb-2">Payment Failed</h1>

          <p className="text-[14px] mb-8" style={{ color: 'var(--text-secondary)' }}>
            We couldn't process your payment. This could be due to:
          </p>

          {/* Possible Reasons */}
          <div className="mb-8 p-6 rounded-lg text-left" style={{ backgroundColor: 'var(--surface)' }}>
            <ul className="space-y-3 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Payment was cancelled or expired</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Insufficient balance in your account</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Bank or payment provider declined the transaction</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Technical issue with the payment gateway</span>
              </li>
            </ul>
          </div>

          {/* Payment Details (if available) */}
          {payment && (
            <div className="mb-8 p-6 rounded-lg text-left" style={{ backgroundColor: 'var(--surface)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-4" style={{ color: 'var(--text-muted)' }}>
                Payment Reference
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
                  <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                  <span
                    className="px-2 py-0.5 rounded text-[11px] font-medium"
                    style={{
                      backgroundColor: 'var(--error-muted)',
                      color: 'var(--error)',
                    }}
                  >
                    {payment.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Warning Message */}
          <div className="mb-8 p-4 rounded-lg flex items-start gap-3 text-left" style={{ backgroundColor: 'var(--warning-muted)' }}>
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
            <div>
              <p className="text-[13px] font-semibold mb-1" style={{ color: 'var(--warning)' }}>
                No Charge Applied
              </p>
              <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                Don't worry, you have not been charged. No money was deducted from your account.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {eventId && (
              <button
                onClick={() => router.push(`/events/${eventId}/purchase`)}
                className="dp-btn-primary"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            )}

            <button onClick={() => router.push('/events')} className={eventId ? 'dp-btn-secondary' : 'dp-btn-primary'}>
              <ArrowLeft size={16} />
              Browse Events
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-[12px] mb-2" style={{ color: 'var(--text-secondary)' }}>
              Need help with your payment?
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Contact support: support@tivent.com
              {payment?.invoice_id && (
                <>
                  <br />
                  Reference: {payment.invoice_id}
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

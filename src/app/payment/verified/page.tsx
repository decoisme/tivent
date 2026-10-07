'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, Mail, Ticket, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

function VerifiedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const externalId = searchParams.get('externalId');

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<any>(null);

  useEffect(() => {
    if (externalId) {
      loadPayment();
    } else {
      setLoading(false);
    }
  }, [externalId]);

  const loadPayment = async () => {
    try {
      const response = await fetch(`/api/payment/xendit/status?externalId=${externalId}`);
      const data = await response.json();

      if (data.success) {
        setPayment(data.payment);
      }
    } catch (error) {
      console.error('Failed to load payment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-[72px] pb-16 px-4">
      <div className="dp-container max-w-[600px]">
        <div className="dp-surface p-8 text-center">
          {/* Success Icon */}
          <div
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: 'var(--success-muted)' }}
          >
            <Mail size={40} style={{ color: 'var(--success)' }} />
          </div>

          {/* Title */}
          <h1 className="text-[28px] font-semibold mb-2">
            Email Verified! ✅
          </h1>

          <p className="text-[14px] mb-8" style={{ color: 'var(--text-secondary)' }}>
            Your email has been successfully verified. Your ticket is being prepared.
          </p>

          {payment && (
            <>
              {/* Payment Details */}
              <div className="mb-8 p-6 rounded-lg text-left" style={{ backgroundColor: 'var(--surface)' }}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-4" style={{ color: 'var(--text-muted)' }}>
                  Order Details
                </p>

                <div className="space-y-3 text-[13px]">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Email</span>
                    <span className="font-medium">{payment.buyer_email}</span>
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
                        backgroundColor: 'var(--success-muted)',
                        color: 'var(--success)',
                      }}
                    >
                      VERIFIED
                    </span>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div
                className="mb-8 p-4 rounded-lg text-left"
                style={{
                  backgroundColor: 'var(--accent-muted)',
                  border: '1px solid var(--accent)',
                }}
              >
                <h3 className="text-[13px] font-semibold mb-2" style={{ color: 'var(--accent)' }}>
                  📝 What's Next?
                </h3>
                <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                  {payment.buyer_address ? (
                    <>
                      Your NFT ticket is being minted to your wallet: <br />
                      <code className="text-[11px] font-mono">{payment.buyer_address}</code>
                    </>
                  ) : (
                    <>
                      Connect your wallet to receive your NFT ticket. You can do this anytime by visiting your tickets page.
                    </>
                  )}
                </p>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {payment?.buyer_address && (
              <button
                onClick={() => router.push(`/tickets?address=${payment.buyer_address}`)}
                className="dp-btn-primary"
              >
                <Ticket size={16} />
                View My Tickets
                <ArrowRight size={14} />
              </button>
            )}

            {!payment?.buyer_address && (
              <button
                onClick={() => router.push(`/tickets?claimPayment=${externalId}`)}
                className="dp-btn-primary"
              >
                Connect Wallet & Claim Ticket
              </button>
            )}

            <button onClick={() => router.push('/events')} className="dp-btn-secondary">
              Browse More Events
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifiedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    }>
      <VerifiedContent />
    </Suspense>
  );
}

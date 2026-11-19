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
    <main className="min-h-screen px-4 py-10 sm:px-6 sm:py-16">
      <div className="dp-container max-w-5xl">
        <div className="mb-8 border-b pb-6" style={{ borderColor: 'var(--border)' }}>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>Tivent · Order desk</p>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">One step closer<span style={{ color: 'var(--accent)' }}>.</span></h1><p className="mt-3 max-w-lg text-[14px]" style={{ color: 'var(--text-secondary)' }}>Your email is verified. Your ticket is being prepared for the big day.</p></div><span className="dp-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>Email check / 02</span></div>
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-[0.7fr_1.3fr]">
          <aside className="dp-surface p-6 sm:p-7 lg:sticky lg:top-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--success-muted)' }}><CheckCircle2 size={24} style={{ color: 'var(--success)' }} /></div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>Verification complete</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">You’re all set.</h2>
            <p className="mt-3 text-[13px] leading-6" style={{ color: 'var(--text-secondary)' }}>Keep an eye on your inbox and wallet. Your ticket details will be available as soon as preparation is complete.</p>
            {payment && <div className="mt-6 border-t pt-5" style={{ borderColor: 'var(--border)' }}><p className="mb-1 text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>Verified for</p><p className="break-all text-[13px] font-medium">{payment.buyer_email}</p></div>}
          </aside>
          <div className="dp-surface p-6 sm:p-8 text-center">
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
    </main>
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

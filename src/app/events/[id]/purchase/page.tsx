'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useEventTicketing } from '@/hooks/useEventTicketing';
// Fraud detection temporarily disabled (requires Supabase setup)
// import { useFraudRisk, useTransactionAnalysis } from '@/hooks/useFraudDetection';
import { formatEther, parseEther } from 'viem';
import { readEvent } from '@/lib/contractReads';
import { FraudWarning, RiskIndicator } from '@/components/RiskBadge';
import { formatIDR } from '@/lib/currency';
import { useLivePrice } from '@/hooks/useLivePrice';
import {
  ArrowLeft,
  CreditCard,
  Wallet,
  MapPin,
  Calendar,
  Tag,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Minus,
  Plus,
  QrCode,
  ArrowRight,
  ExternalLink,
  Ticket,
} from 'lucide-react';

interface EventDetail {
  eventId: number;
  organizer: string;
  metadataURI: string;
  ticketPrice: bigint;
  maxTickets: number;
  ticketsSold: number;
  maxTicketsPerWallet: number;
  resalePriceCapBps: number;
  resaleDeadline: number;
  isPrimarySaleActive: boolean;
  isResaleActive: boolean;
  isCancelled: boolean;
  metadata?: {
    title: string;
    description: string;
    venue: string;
    startDate: string;
    endDate: string;
    imageUrl?: string;
  };
}

export default function PurchaseTicketPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = parseInt(params.id as string);

  const { isConnected, address, mounted } = useWallet();
  const { buyTicket, isPending, isConfirming, isConfirmed, hash, error } = useEventTicketing();
  const { rate: polRate, loading: priceLoading } = useLivePrice();
  
  // Temporarily disabled fraud detection (requires Supabase setup)
  // const { riskScore, isFlagged } = useFraudRisk(address);
  // const { analyzing, analysis, analyzeBeforeTransaction } = useTransactionAnalysis();
  const riskScore: any = null;
  const isFlagged = false;
  const analyzing = false;
  const analysis: any = null;
  const analyzeBeforeTransaction = async (...args: any[]) => ({ isSuspicious: false, riskScore: null });

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [purchaseError, setPurchaseError] = useState<string>('');
  const [showRiskWarning, setShowRiskWarning] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'crypto' | 'fiat'>('crypto'); // Force crypto for now
  const [email, setEmail] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (eventId && !isNaN(eventId)) loadEvent();
  }, [eventId]);

  useEffect(() => {
    // Only check connection after component is mounted
    if (!mounted) return;
    
    if (!isConnected) {
      console.log('[PurchasePage] Wallet not connected, redirecting...');
      router.push(`/events/${eventId}`);
    }
  }, [isConnected, mounted, eventId, router]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const eventData = await readEvent(eventId);
      if (!eventData) { setEvent(null); setLoading(false); return; }

      // Decode metadata from URI
      let metadata;
      const metadataURI = eventData[2] as string;
      
      try {
        if (metadataURI.startsWith('ipfs://Qm')) {
          // Extract base64 part after 'ipfs://Qm'
          const base64Part = metadataURI.replace('ipfs://Qm', '');
          
          // Decode base64 to binary string
          const decoded = atob(base64Part);
          
          // Decode URI component
          const jsonStr = decodeURIComponent(escape(decoded));
          
          // Parse JSON
          metadata = JSON.parse(jsonStr);
          console.log('[PurchasePage] Decoded metadata:', metadata);
        } else {
          throw new Error('Invalid metadata URI format');
        }
      } catch (err) {
        console.error('[PurchasePage] Metadata decode error:', err);
        // Fallback metadata
        metadata = {
          title: `Event #${eventId}`,
          description: 'Event description not available',
          venue: 'Venue TBD',
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
        };
      }

      setEvent({
        eventId,
        organizer: eventData[1] as string,
        metadataURI: eventData[2] as string,
        ticketPrice: eventData[3] as bigint,
        maxTickets: Number(eventData[4]),
        ticketsSold: Number(eventData[5]),
        maxTicketsPerWallet: Number(eventData[6]),
        resalePriceCapBps: Number(eventData[7]),
        resaleDeadline: Number(eventData[8]),
        isPrimarySaleActive: eventData[9] as boolean,
        isResaleActive: eventData[10] as boolean,
        isCancelled: eventData[11] as boolean,
        metadata,
      });
    } catch (error) {
      console.error('[PurchasePage] Load event error:', error);
      setEvent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (!event) return;
    const ticketsRemaining = event.maxTickets - event.ticketsSold;
    const maxAllowed = Math.min(event.maxTicketsPerWallet, ticketsRemaining);
    if (newQuantity >= 1 && newQuantity <= maxAllowed) {
      setQuantity(newQuantity);
      setPurchaseError('');
    }
  };

  const handlePurchase = async () => {
    if (!event) { setPurchaseError('Event not found'); return; }
    if (paymentMethod === 'crypto' && (!isConnected || !address)) { setPurchaseError('Please connect your wallet'); return; }
    if (paymentMethod === 'fiat' && !email) { setPurchaseError('Please enter your email'); return; }
    if (!event.isPrimarySaleActive) { setPurchaseError('Tickets are not available for sale'); return; }
    if (event.isCancelled) { setPurchaseError('This event has been cancelled'); return; }

    const ticketsRemaining = event.maxTickets - event.ticketsSold;
    if (quantity > ticketsRemaining) { setPurchaseError('Not enough tickets available'); return; }

    try {
      setPurchaseError('');
      if (paymentMethod === 'crypto' && address) {
        const fraudAnalysis: any = await analyzeBeforeTransaction(address, 'ticket_purchase', { eventId, quantity, price: event.ticketPrice });
        if (fraudAnalysis.riskScore && fraudAnalysis.riskScore.level === 'critical') {
          setPurchaseError('Transaction blocked: Critical fraud risk detected');
          setShowRiskWarning(true);
          return;
        }
        if (fraudAnalysis.isSuspicious) setShowRiskWarning(true);
      }

      if (paymentMethod === 'fiat') await handleFiatPayment();
      else await handleCryptoPayment();
    } catch (err: any) {
      setPurchaseError(err.message || 'Failed to purchase tickets');
    }
  };

  const handleFiatPayment = async () => {
    if (!event || !polRate) return;
    try {
      setProcessingPayment(true);
      const pricePOL = parseFloat(formatEther(event.ticketPrice));
      const priceIDR = Math.round(pricePOL * polRate);
      const totalIDR = priceIDR * quantity;

      const response = await fetch('/api/xendit/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, ticketQuantity: quantity, pricePerTicket: priceIDR, payerEmail: email, walletAddress: address || null }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to create payment');
      window.location.href = data.invoiceUrl;
    } catch (err: any) {
      setPurchaseError(err.message || 'Failed to initiate payment');
      setProcessingPayment(false);
    }
  };

  const handleCryptoPayment = async () => {
    if (!event) return;
    for (let i = 0; i < quantity; i++) {
      const ticketMetadataURI = `ipfs://ticket-${eventId}-${Date.now()}-${i}`;
      await buyTicket(eventId, 0, ticketMetadataURI, formatEther(event.ticketPrice));
    }
  };

  if (loading || !mounted) {
    return (
      <div className="min-h-screen pt-[72px] pb-16 px-4">
        <div className="dp-container max-w-[900px]">
          <div className="dp-skeleton h-6 w-32 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="dp-skeleton h-[180px] rounded-xl" />
              <div className="dp-skeleton h-[200px] rounded-xl" />
            </div>
            <div className="dp-skeleton h-[400px] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="dp-surface p-12 max-w-md w-full text-center">
          <Ticket size={28} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h2 className="text-[20px] font-semibold mb-2">Event Not Found</h2>
          <button onClick={() => router.push('/events')} className="dp-btn-primary">Browse Events</button>
        </div>
      </div>
    );
  }

  const ticketsRemaining = event.maxTickets - event.ticketsSold;
  const maxAllowed = Math.min(event.maxTicketsPerWallet, ticketsRemaining);
  const totalPrice = formatEther(event.ticketPrice * BigInt(quantity));
  const canPurchase = event.isPrimarySaleActive && !event.isCancelled && ticketsRemaining > 0;

  // Success state
  if (isConfirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="dp-surface p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ backgroundColor: 'var(--success-muted)' }}>
            <CheckCircle2 size={24} style={{ color: 'var(--success)' }} />
          </div>
          <h2 className="text-[22px] font-semibold mb-2">Your ticket is secured.</h2>
          <p className="text-[14px] mb-2" style={{ color: 'var(--text-secondary)' }}>
            {quantity} ticket{quantity > 1 ? 's' : ''} purchased successfully.
          </p>

          {/* Status indicators */}
          <div className="space-y-2 my-6 text-left">
            {[
              { label: 'Payment confirmed', done: true },
              { label: 'Ticket issued on-chain', done: true },
              { label: 'Ownership recorded', done: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-[13px]">
                <CheckCircle2 size={13} style={{ color: 'var(--success)' }} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {hash && (
            <p className="dp-mono text-[11px] mb-6 py-2 px-3 rounded-md" style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-muted)' }}>
              Tx: {hash.slice(0, 12)}...{hash.slice(-8)}
            </p>
          )}

          <div className="space-y-2">
            <button onClick={() => router.push('/tickets')} className="dp-btn-primary w-full">
              View My Ticket
            </button>
            <button onClick={() => router.push(`/events/${eventId}`)} className="dp-btn-secondary w-full">
              Back to Event
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-[72px] pb-16 px-4">
      <div className="dp-container max-w-[900px]">
        {/* Back */}
        <button onClick={() => router.back()} className="dp-btn-ghost mb-6" style={{ padding: '4px 0', color: 'var(--text-muted)' }}>
          <ArrowLeft size={14} /> Back
        </button>

        {/* Checkout flow indicator */}
        <div className="flex items-center gap-2 mb-8 text-[12px]" style={{ color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--accent)' }}>Select ticket</span>
          <ArrowRight size={10} />
          <span>Payment</span>
          <ArrowRight size={10} />
          <span>Verification</span>
          <ArrowRight size={10} />
          <span>Ticket issued</span>
        </div>

        <h1 className="text-[24px] font-semibold tracking-[-0.02em] mb-1">Checkout</h1>
        <p className="text-[14px] mb-8" style={{ color: 'var(--text-secondary)' }}>
          {event.metadata?.title || `Event #${eventId}`}
        </p>

        {/* Fraud warnings */}
        {showRiskWarning && analysis?.isSuspicious && analysis.riskScore && (
          <FraudWarning reasons={analysis.riskScore.reasons} score={analysis.riskScore.score} onClose={() => setShowRiskWarning(false)} />
        )}

        {isFlagged && riskScore && (
          <div className="mb-6 p-4 rounded-lg flex items-start gap-3" style={{ backgroundColor: 'var(--error-muted)', border: '1px solid rgba(196,91,91,0.2)' }}>
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--error)' }} />
            <div>
              <p className="text-[13px] font-medium" style={{ color: 'var(--error)' }}>Account Flagged</p>
              <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                This account has been flagged for suspicious activity.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Event summary */}
            <div className="dp-surface p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-3" style={{ color: 'var(--text-muted)' }}>Event</p>
              <div className="space-y-2 text-[13px]">
                <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <MapPin size={13} style={{ color: 'var(--text-muted)' }} />
                  {event.metadata?.venue || 'TBD'}
                </div>
                <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                  {event.metadata?.startDate
                    ? new Date(event.metadata.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                    : 'TBD'}
                </div>
                <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <Tag size={13} style={{ color: 'var(--text-muted)' }} />
                  {formatEther(event.ticketPrice)} POL per ticket
                </div>
              </div>
            </div>

            {/* Quantity */}
            <div className="dp-surface p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-4" style={{ color: 'var(--text-muted)' }}>Quantity</p>

              {!canPurchase ? (
                <div className="py-4 px-4 rounded-lg text-center" style={{ backgroundColor: 'var(--error-muted)' }}>
                  <p className="text-[13px]" style={{ color: 'var(--error)' }}>
                    {event.isCancelled ? 'Event cancelled' : ticketsRemaining === 0 ? 'Sold out' : 'Not available'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-[13px] mb-4" style={{ color: 'var(--text-secondary)' }}>
                    <span>Available: {ticketsRemaining}</span>
                    <span>Max per wallet: {event.maxTicketsPerWallet}</span>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                      className="dp-btn-secondary disabled:opacity-30"
                      style={{ padding: '10px 14px' }}
                    >
                      <Minus size={14} />
                    </button>
                    <div className="flex-1 text-center">
                      <p className="text-[32px] font-semibold">{quantity}</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>tickets</p>
                    </div>
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= maxAllowed}
                      className="dp-btn-secondary disabled:opacity-30"
                      style={{ padding: '10px 14px' }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((num) =>
                      num <= maxAllowed && (
                        <button
                          key={num}
                          onClick={() => handleQuantityChange(num)}
                          className={`flex-1 py-2 rounded-md text-[13px] font-medium transition-colors ${
                            quantity === num
                              ? 'text-white'
                              : ''
                          }`}
                          style={{
                            backgroundColor: quantity === num ? 'var(--accent)' : 'var(--surface-elevated)',
                            color: quantity === num ? '#fff' : 'var(--text-secondary)',
                          }}
                        >
                          {num}
                        </button>
                      )
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Buyer protection */}
            <div className="space-y-2">
              {[
                { icon: <Shield size={12} />, text: 'On-chain ticket prevents counterfeits' },
                { icon: <Tag size={12} />, text: `Resale capped at ${event.resalePriceCapBps / 100}% of original` },
                { icon: <CheckCircle2 size={12} />, text: 'Full refund if event is cancelled' },
                { icon: <QrCode size={12} />, text: 'Dynamic QR for secure venue entry' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--success)' }}>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar: Payment & Summary */}
          <div className="lg:col-span-1">
            <div className="dp-surface p-6 sticky top-[72px] space-y-5">
              {/* Payment method */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-3" style={{ color: 'var(--text-muted)' }}>Payment</p>
                <div className="space-y-2">
                  {/* Fiat payment temporarily disabled */}
                  {/* <button
                    onClick={() => setPaymentMethod('fiat')}
                    className="w-full p-3 rounded-lg text-left flex items-center gap-3 transition-colors"
                    style={{
                      backgroundColor: paymentMethod === 'fiat' ? 'var(--accent-muted)' : 'var(--surface-elevated)',
                      border: `1px solid ${paymentMethod === 'fiat' ? 'var(--accent)' : 'var(--border)'}`,
                    }}
                  >
                    <CreditCard size={16} style={{ color: paymentMethod === 'fiat' ? 'var(--accent)' : 'var(--text-muted)' }} />
                    <div>
                      <p className="text-[13px] font-medium">Rupiah (IDR)</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>QRIS, Bank Transfer, E-Wallet</p>
                    </div>
                  </button> */}
                  <button
                    onClick={() => setPaymentMethod('crypto')}
                    className="w-full p-3 rounded-lg text-left flex items-center gap-3 transition-colors"
                    style={{
                      backgroundColor: 'var(--accent-muted)',
                      border: '1px solid var(--accent)',
                    }}
                  >
                    <Wallet size={16} style={{ color: 'var(--accent)' }} />
                    <div>
                      <p className="text-[13px] font-medium">Cryptocurrency</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>MetaMask, WalletConnect - Pay with POL</p>
                    </div>
                  </button>
                </div>

                {/* {paymentMethod === 'fiat' && (
                  <div className="mt-3">
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="dp-input"
                    />
                    <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>For payment confirmation and ticket delivery.</p>
                  </div>
                )} */}

                {paymentMethod === 'crypto' && !isConnected && (
                  <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--warning-muted)', border: '1px solid rgba(196,153,59,0.2)' }}>
                    <p className="text-[12px]" style={{ color: 'var(--warning)' }}>Connect wallet to continue.</p>
                  </div>
                )}
              </div>

              <hr className="dp-divider" />

              {/* Order summary */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-3" style={{ color: 'var(--text-muted)' }}>Summary</p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-[13px]">
                    <span style={{ color: 'var(--text-secondary)' }}>Price per ticket</span>
                    <div className="text-right">
                      <p className="font-medium">{formatEther(event.ticketPrice)} POL</p>
                      {paymentMethod === 'fiat' && polRate && (
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          ≈ {formatIDR(Math.round(parseFloat(formatEther(event.ticketPrice)) * polRate))}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span style={{ color: 'var(--text-secondary)' }}>Quantity</span>
                    <span className="font-medium">{quantity}</span>
                  </div>
                  <hr className="dp-divider" />
                  <div className="flex justify-between text-[15px]">
                    <span className="font-semibold">Total</span>
                    <div className="text-right">
                      <p className="font-semibold">{totalPrice} POL</p>
                      {paymentMethod === 'fiat' && polRate && (
                        <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                          ≈ {formatIDR(Math.round(parseFloat(totalPrice) * polRate))}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {purchaseError && (
                <div className="p-3 rounded-lg text-[12px]" style={{ backgroundColor: 'var(--error-muted)', color: 'var(--error)' }}>
                  {purchaseError}
                </div>
              )}
              {error && (
                <div className="p-3 rounded-lg text-[12px]" style={{ backgroundColor: 'var(--error-muted)', color: 'var(--error)' }}>
                  {error.message || 'Transaction failed'}
                </div>
              )}

              {/* CTA */}
              {canPurchase ? (
                <>
                  <button
                    onClick={handlePurchase}
                    disabled={
                      (paymentMethod === 'crypto' && (isPending || isConfirming || !isConnected)) ||
                      (paymentMethod === 'fiat' && (!email || processingPayment)) ||
                      !canPurchase
                    }
                    className="dp-btn-primary w-full disabled:opacity-40"
                    style={{ padding: '14px 24px', fontSize: '15px' }}
                  >
                    {processingPayment ? (
                      <span className="flex items-center gap-2"><span className="dp-pulse">●</span> Creating payment...</span>
                    ) : isPending || isConfirming ? (
                      <span className="flex items-center gap-2"><span className="dp-pulse">●</span> {isPending ? 'Confirm in wallet...' : 'Processing...'}</span>
                    ) : (
                      <>Purchase {quantity} Ticket{quantity > 1 ? 's' : ''}</>
                    )}
                  </button>
                  <p className="text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>
                    {paymentMethod === 'fiat' ? 'You will be redirected to the payment page.' : 'You will be prompted to confirm in your wallet.'}
                  </p>
                </>
              ) : (
                <button disabled className="dp-btn-secondary w-full opacity-40 cursor-not-allowed" style={{ padding: '14px 24px' }}>
                  Not Available
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

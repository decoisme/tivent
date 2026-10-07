'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useEventTicketing } from '@/hooks/useEventTicketing';
// Fraud detection temporarily disabled (requires Supabase setup)
// import { useFraudRisk, useTransactionAnalysis } from '@/hooks/useFraudDetection';
import { formatEther, parseEther } from 'viem';
import { readEvent, readEventTicketTypes } from '@/lib/contractReads';
import { FraudWarning, RiskIndicator } from '@/components/RiskBadge';
import { formatIDR } from '@/lib/currency';
import { useLivePrice } from '@/hooks/useLivePrice';
import TicketSuccessModal from '@/components/TicketSuccessModal';
import PaymentMethodSelector from '@/components/PaymentMethodSelector';
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

interface TicketTypeInfo {
  typeId: number;
  name: string;
  description: string;
  priceIDR: number;
  pricePOL: string;
  maxSupply: number;
  sold: number;
  available: number;
  active: boolean;
}

interface EventDetail {
  eventId: number;
  organizer: string;
  metadataURI: string;
  ticketTypesCount: number;
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
    ticketTypes?: TicketTypeInfo[];
  };
  ticketTypes: TicketTypeInfo[];
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
  const [selectedType, setSelectedType] = useState<TicketTypeInfo | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [purchaseError, setPurchaseError] = useState<string>('');
  const [showRiskWarning, setShowRiskWarning] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'crypto' | 'fiat'>('crypto'); // Force crypto for now
  const [email, setEmail] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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

  // Show success modal when purchase is confirmed
  useEffect(() => {
    if (isConfirmed && !showSuccessModal) {
      setShowSuccessModal(true);
    }
  }, [isConfirmed, showSuccessModal]);

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
          const base64Part = metadataURI.replace('ipfs://Qm', '');
          const decoded = atob(base64Part);
          const jsonStr = decodeURIComponent(escape(decoded));
          metadata = JSON.parse(jsonStr);
          console.log('[PurchasePage] Decoded metadata:', metadata);
        } else {
          throw new Error('Invalid metadata URI format');
        }
      } catch (err) {
        console.error('[PurchasePage] Metadata decode error:', err);
        metadata = {
          title: `Event #${eventId}`,
          description: 'Event description not available',
          venue: 'Venue TBD',
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
          ticketTypes: [],
        };
      }

      // Read ticket types from contract
      const ticketTypesData = await readEventTicketTypes(eventId);
      console.log('[PurchasePage] Ticket types from contract:', ticketTypesData);
      
      // Use the same rate as create event form
      const POL_TO_IDR = polRate || 5000;
      
      const ticketTypes: TicketTypeInfo[] = ticketTypesData.map((typeData: any, index: number) => {
        console.log(`[PurchasePage] Processing ticket type ${index}:`, {
          typeData,
          typeId: typeData.typeId,
          name: typeData.name,
          price: typeData.price,
        });
        
        // Find corresponding metadata
        const metaType = metadata.ticketTypes?.find((t: any) => t.typeId === index) || {};
        
        // Get priceIDR from metadata, or convert from contract
        let priceIDR = metaType.priceIDR;
        if (!priceIDR || priceIDR === 0) {
          const priceInWei = typeData.price;
          const priceInPOL = Number(priceInWei) / 1e18;
          priceIDR = Math.round(priceInPOL * POL_TO_IDR);
        }
        
        return {
          typeId: Number(typeData.typeId),
          name: typeData.name as string,
          description: metaType.description || '',
          priceIDR,
          pricePOL: formatEther(typeData.price as bigint),
          maxSupply: Number(typeData.maxSupply),
          sold: Number(typeData.sold),
          available: Number(typeData.maxSupply) - Number(typeData.sold),
          active: typeData.active as boolean,
        };
      });
      
      console.log('[PurchasePage] ✅ Processed ticket types:', ticketTypes);

      const newEvent = {
        eventId,
        organizer: eventData[1] as string,
        metadataURI: eventData[2] as string,
        ticketTypesCount: Number(eventData[3]),
        maxTickets: Number(eventData[4]),
        ticketsSold: Number(eventData[5]),
        maxTicketsPerWallet: Number(eventData[6]),
        resalePriceCapBps: Number(eventData[7]),
        resaleDeadline: Number(eventData[8]),
        isPrimarySaleActive: eventData[9] as boolean,
        isResaleActive: eventData[10] as boolean,
        isCancelled: eventData[11] as boolean,
        metadata,
        ticketTypes,
      };

      setEvent(newEvent);

      // Auto-select first available ticket type
      const firstAvailable = ticketTypes.find(t => t.active && t.available > 0);
      if (firstAvailable) {
        setSelectedType(firstAvailable);
      }
    } catch (error) {
      console.error('[PurchasePage] Load event error:', error);
      setEvent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (!event || !selectedType) return;
    const ticketsRemaining = selectedType.available;
    const maxAllowed = Math.min(event.maxTicketsPerWallet, ticketsRemaining);
    if (newQuantity >= 1 && newQuantity <= maxAllowed) {
      setQuantity(newQuantity);
      setPurchaseError('');
    }
  };

  const handlePurchase = async () => {
    if (!event) { setPurchaseError('Event not found'); return; }
    if (!selectedType) { setPurchaseError('Please select a ticket type'); return; }
    if (paymentMethod === 'crypto' && (!isConnected || !address)) { setPurchaseError('Please connect your wallet'); return; }
    if (paymentMethod === 'fiat' && !email) { setPurchaseError('Please enter your email'); return; }
    if (!event.isPrimarySaleActive) { setPurchaseError('Tickets are not available for sale'); return; }
    if (event.isCancelled) { setPurchaseError('This event has been cancelled'); return; }

    const ticketsRemaining = selectedType.available;
    if (quantity > ticketsRemaining) { setPurchaseError('Not enough tickets available'); return; }

    try {
      setPurchaseError('');
      if (paymentMethod === 'crypto' && address) {
        const fraudAnalysis: any = await analyzeBeforeTransaction(address, 'ticket_purchase', { eventId, quantity, price: parseEther(selectedType.pricePOL) });
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
    if (!event || !selectedType) return;
    try {
      setProcessingPayment(true);
      const pricePOL = parseFloat(selectedType.pricePOL);
      const priceIDR = selectedType.priceIDR > 0 ? selectedType.priceIDR : Math.round(pricePOL * (polRate || 5000));

      const response = await fetch('/api/payment/xendit/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          ticketTypeId: selectedType.typeId,
          ticketQuantity: quantity,
          buyerEmail: email,
          buyerAddress: address || null,
          pricePerTicket: pricePOL,
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create payment invoice');
      }

      // Redirect to Xendit payment page
      window.location.href = data.invoiceUrl;
    } catch (err: any) {
      setPurchaseError(err.message || 'Failed to initiate payment');
      setProcessingPayment(false);
    }
  };

  const handleCryptoPayment = async () => {
    if (!event || !selectedType) return;
    for (let i = 0; i < quantity; i++) {
      const ticketMetadataURI = `ipfs://ticket-${eventId}-${Date.now()}-${i}`;
      await buyTicket(eventId, selectedType.typeId, ticketMetadataURI, selectedType.pricePOL);
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

  const ticketsRemaining = selectedType?.available || 0;
  const maxAllowed = selectedType ? Math.min(event.maxTicketsPerWallet, ticketsRemaining) : 0;
  const totalPrice = selectedType ? (parseFloat(selectedType.pricePOL) * quantity).toFixed(6) : '0';
  const canPurchase = event.isPrimarySaleActive && !event.isCancelled && selectedType && selectedType.active && selectedType.available > 0;

  // Success state
  // Success handled by TicketSuccessModal below, no need for early return

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
              </div>
            </div>

            {/* Ticket Type Selection */}
            <div className="dp-surface p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-4" style={{ color: 'var(--text-muted)' }}>Select Ticket Type</p>
              
              {event.ticketTypes.length === 0 ? (
                <div className="py-4 px-4 rounded-lg text-center" style={{ backgroundColor: 'var(--error-muted)' }}>
                  <p className="text-[13px]" style={{ color: 'var(--error)' }}>No ticket types available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {event.ticketTypes.map((type) => (
                    <button
                      key={type.typeId}
                      onClick={() => {
                        setSelectedType(type);
                        setQuantity(1);
                        setPurchaseError('');
                      }}
                      disabled={!type.active || type.available <= 0}
                      className="w-full p-4 rounded-lg text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: selectedType?.typeId === type.typeId ? 'var(--accent-muted)' : 'var(--surface-elevated)',
                        border: `1px solid ${selectedType?.typeId === type.typeId ? 'var(--accent)' : 'var(--border)'}`,
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-[15px] font-semibold mb-1">{type.name}</h3>
                          {type.description && (
                            <p className="text-[12px] mb-2" style={{ color: 'var(--text-muted)' }}>
                              {type.description}
                            </p>
                          )}
                        </div>
                        {!type.active || type.available <= 0 ? (
                          <span className="text-[11px] px-2 py-1 rounded" style={{ backgroundColor: 'var(--error-muted)', color: 'var(--error)' }}>
                            {!type.active ? 'Inactive' : 'Sold Out'}
                          </span>
                        ) : (
                          <span className="text-[11px] px-2 py-1 rounded" style={{ backgroundColor: 'var(--success-muted)', color: 'var(--success)' }}>
                            {type.available} left
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-[16px] font-semibold">{type.pricePOL} POL</span>
                        {type.priceIDR > 0 && polRate && (
                          <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                            ≈ {formatIDR(type.priceIDR)}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quantity */}
            <div className="dp-surface p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-4" style={{ color: 'var(--text-muted)' }}>Quantity</p>

              {!selectedType ? (
                <div className="py-4 px-4 rounded-lg text-center" style={{ backgroundColor: 'var(--warning-muted)' }}>
                  <p className="text-[13px]" style={{ color: 'var(--warning)' }}>
                    Please select a ticket type first
                  </p>
                </div>
              ) : !canPurchase ? (
                <div className="py-4 px-4 rounded-lg text-center" style={{ backgroundColor: 'var(--error-muted)' }}>
                  <p className="text-[13px]" style={{ color: 'var(--error)' }}>
                    {event.isCancelled ? 'Event cancelled' : selectedType.available === 0 ? 'Sold out' : 'Not available'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-[13px] mb-4" style={{ color: 'var(--text-secondary)' }}>
                    <span>Available: {selectedType.available}</span>
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
              <PaymentMethodSelector
                selectedMethod={paymentMethod}
                onMethodChange={setPaymentMethod}
                email={email}
                onEmailChange={setEmail}
                isConnected={isConnected}
                disabled={!canPurchase}
              />

              <hr className="dp-divider" />

              {/* Order summary */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-3" style={{ color: 'var(--text-muted)' }}>Summary</p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-[13px]">
                    <span style={{ color: 'var(--text-secondary)' }}>Ticket type</span>
                    <span className="font-medium">{selectedType?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span style={{ color: 'var(--text-secondary)' }}>Price per ticket</span>
                    <div className="text-right">
                      {selectedType ? (
                        <>
                          <p className="font-medium">{selectedType.pricePOL} POL</p>
                          {paymentMethod === 'fiat' && selectedType.priceIDR > 0 && (
                            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                              ≈ {formatIDR(selectedType.priceIDR)}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="font-medium" style={{ color: 'var(--text-muted)' }}>-</p>
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
                      {selectedType ? (
                        <>
                          <p className="font-semibold">{totalPrice} POL</p>
                          {paymentMethod === 'fiat' && selectedType.priceIDR > 0 && (
                            <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                              ≈ {formatIDR(selectedType.priceIDR * quantity)}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="font-semibold" style={{ color: 'var(--text-muted)' }}>-</p>
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

      {/* Success Modal */}
      {event && selectedType && (
        <TicketSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          event={{
            eventId: event.eventId,
            metadata: event.metadata,
          }}
          ticketType={{
            name: selectedType.name,
          }}
          quantity={quantity}
          transactionHash={hash}
          walletAddress={address}
        />
      )}
    </div>
  );
}

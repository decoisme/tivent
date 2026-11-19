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
      
      // Use flat IDR price from event metadata
      const priceIDR = selectedType.priceIDR;

      const response = await fetch('/api/payment/xendit/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          ticketTypeId: selectedType.typeId,
          ticketQuantity: quantity,
          buyerEmail: email,
          buyerAddress: address || null,
          pricePerTicket: pricePOL, // For reference
          priceIDR: priceIDR, // Flat IDR price from event creation
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
      <main className="min-h-screen px-4 pb-20 pt-24 md:pt-28">
        <div className="dp-container max-w-[1120px]">
          <div className="dp-skeleton mb-8 h-4 w-24" />
          <div className="dp-skeleton mb-6 h-32 rounded-3xl" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3"><div className="space-y-5 lg:col-span-2"><div className="dp-skeleton h-52 rounded-2xl" /><div className="dp-skeleton h-64 rounded-2xl" /></div><div className="dp-skeleton h-[480px] rounded-2xl" /></div>
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-20">
        <div className="dp-surface w-full max-w-lg rounded-3xl px-7 py-14 text-center md:px-12">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }}><Ticket size={28} /></div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Checkout unavailable</p>
          <h2 className="mb-6 text-3xl font-semibold tracking-[-0.05em]">Event Not Found</h2>
          <button onClick={() => router.push('/events')} className="dp-btn-primary">Browse Events</button>
        </div>
      </main>
    );
  }

  const ticketsRemaining = selectedType?.available || 0;
  const maxAllowed = selectedType ? Math.min(event.maxTicketsPerWallet, ticketsRemaining) : 0;
  const totalPrice = selectedType ? (parseFloat(selectedType.pricePOL) * quantity).toFixed(6) : '0';
  const canPurchase = event.isPrimarySaleActive && !event.isCancelled && selectedType && selectedType.active && selectedType.available > 0;

  // Success state
  // Success handled by TicketSuccessModal below, no need for early return

  return (
    <main className="min-h-screen px-4 pb-20 pt-24 md:pt-28">
      <div className="dp-container max-w-[1120px]">
        <button onClick={() => router.back()} className="dp-btn-ghost mb-7" style={{ padding: '4px 0', color: 'var(--text-muted)' }}><ArrowLeft size={14} /> Back</button>

        <section className="mb-8 rounded-[26px] border px-5 py-6 md:px-8 md:py-8" style={{ borderColor: 'var(--border)', background: 'radial-gradient(ellipse at 90% 0%, var(--accent-muted), transparent 38%), var(--surface)' }}>
          <div className="mb-5 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--accent)' }}>01 · Select ticket</span><ArrowRight size={12} /><span>02 · Payment</span><ArrowRight size={12} /><span>03 · Verification</span><ArrowRight size={12} /><span>04 · Ticket issued</span>
          </div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>Secure your place</p>
          <h1 className="mb-2 text-3xl font-semibold tracking-[-0.05em] md:text-4xl">Checkout</h1>
          <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>{event.metadata?.title || `Event #${eventId}`}</p>
        </section>

        {showRiskWarning && analysis?.isSuspicious && analysis.riskScore && (
          <div className="mb-5"><FraudWarning reasons={analysis.riskScore.reasons} score={analysis.riskScore.score} onClose={() => setShowRiskWarning(false)} /></div>
        )}

        {isFlagged && riskScore && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl p-4" style={{ backgroundColor: 'var(--error-muted)', border: '1px solid rgba(196,91,91,0.2)' }}>
            <AlertTriangle size={17} className="mt-0.5 shrink-0" style={{ color: 'var(--error)' }} />
            <div><p className="text-[13px] font-semibold" style={{ color: 'var(--error)' }}>Account Flagged</p><p className="mt-1 text-[12px]" style={{ color: 'var(--text-secondary)' }}>This account has been flagged for suspicious activity.</p></div>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <section className="dp-surface rounded-2xl p-5 md:p-6">
              <div className="mb-4 flex items-center justify-between gap-3"><div><p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>Your event</p><h2 className="text-lg font-semibold tracking-[-0.03em]">The details</h2></div><Ticket size={18} style={{ color: 'var(--text-muted)' }} /></div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-xl p-4" style={{ backgroundColor: 'var(--surface-elevated)' }}><MapPin size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} /><span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{event.metadata?.venue || 'TBD'}</span></div>
                <div className="flex items-start gap-3 rounded-xl p-4" style={{ backgroundColor: 'var(--surface-elevated)' }}><Calendar size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} /><span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{event.metadata?.startDate ? new Date(event.metadata.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'TBD'}</span></div>
              </div>
            </section>

            <section className="dp-surface rounded-2xl p-5 md:p-6">
              <div className="mb-5"><p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>Step 1</p><h2 className="text-xl font-semibold tracking-[-0.04em]">Choose your ticket</h2></div>
              {event.ticketTypes.length === 0 ? (
                <div className="rounded-xl p-5 text-center" style={{ backgroundColor: 'var(--error-muted)' }}><p className="text-[13px]" style={{ color: 'var(--error)' }}>No ticket types available</p></div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {event.ticketTypes.map((type) => (
                    <button
                      key={type.typeId}
                      onClick={() => { setSelectedType(type); setQuantity(1); setPurchaseError(''); }}
                      disabled={!type.active || type.available <= 0}
                      className="w-full rounded-xl border p-4 text-left transition-all hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ backgroundColor: selectedType?.typeId === type.typeId ? 'var(--accent-muted)' : 'var(--surface-elevated)', borderColor: selectedType?.typeId === type.typeId ? 'var(--accent)' : 'var(--border)' }}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1"><div className="mb-2 flex flex-wrap items-center gap-2"><h3 className="text-[15px] font-semibold">{type.name}</h3>{!type.active || type.available <= 0 ? <span className="rounded-full px-2.5 py-1 text-[10px]" style={{ backgroundColor: 'var(--error-muted)', color: 'var(--error)' }}>{!type.active ? 'Inactive' : 'Sold Out'}</span> : <span className="rounded-full px-2.5 py-1 text-[10px]" style={{ backgroundColor: 'var(--success-muted)', color: 'var(--success)' }}>{type.available} left</span>}</div>{type.description && <p className="text-[12px] leading-5" style={{ color: 'var(--text-muted)' }}>{type.description}</p>}</div>
                        <div className="shrink-0 sm:text-right"><p className="text-lg font-semibold">{type.pricePOL} POL</p>{type.priceIDR > 0 && polRate && <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>≈ {formatIDR(type.priceIDR)}</p>}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="dp-surface rounded-2xl p-5 md:p-6">
              <div className="mb-5"><p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>Step 2</p><h2 className="text-xl font-semibold tracking-[-0.04em]">Set quantity</h2></div>
              {!selectedType ? (
                <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'var(--warning-muted)' }}><p className="text-[13px]" style={{ color: 'var(--warning)' }}>Please select a ticket type first</p></div>
              ) : !canPurchase ? (
                <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'var(--error-muted)' }}><p className="text-[13px]" style={{ color: 'var(--error)' }}>{event.isCancelled ? 'Event cancelled' : selectedType.available === 0 ? 'Sold out' : 'Not available'}</p></div>
              ) : (
                <>
                  <div className="mb-4 flex flex-wrap justify-between gap-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}><span>Available: {selectedType.available}</span><span>Max per wallet: {event.maxTicketsPerWallet}</span></div>
                  <div className="mb-5 flex items-center gap-4 rounded-xl p-3" style={{ backgroundColor: 'var(--surface-elevated)' }}>
                    <button onClick={() => handleQuantityChange(quantity - 1)} disabled={quantity <= 1} className="dp-btn-secondary h-11 w-11 disabled:opacity-30" aria-label="Decrease quantity"><Minus size={14} /></button>
                    <div className="flex-1 text-center"><p className="text-3xl font-semibold tracking-[-0.04em]">{quantity}</p><p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>tickets</p></div>
                    <button onClick={() => handleQuantityChange(quantity + 1)} disabled={quantity >= maxAllowed} className="dp-btn-secondary h-11 w-11 disabled:opacity-30" aria-label="Increase quantity"><Plus size={14} /></button>
                  </div>
                  <div className="flex gap-2">{[1, 2, 3, 4].map((num) => num <= maxAllowed && <button key={num} onClick={() => handleQuantityChange(num)} className="flex-1 rounded-lg py-2.5 text-[13px] font-medium transition-colors" style={{ backgroundColor: quantity === num ? 'var(--accent)' : 'var(--surface-elevated)', color: quantity === num ? '#fff' : 'var(--text-secondary)' }}>{num}</button>)}</div>
                </>
              )}
            </section>

            <section className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.17em]" style={{ color: 'var(--text-muted)' }}>Your purchase is protected</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{[
                { icon: <Shield size={13} />, text: 'On-chain ticket prevents counterfeits' },
                { icon: <Tag size={13} />, text: `Resale capped at ${event.resalePriceCapBps / 100}% of original` },
                { icon: <CheckCircle2 size={13} />, text: 'Full refund if event is cancelled' },
                { icon: <QrCode size={13} />, text: 'Dynamic QR for secure venue entry' },
              ].map((item, i) => <div key={i} className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}><span style={{ color: 'var(--success)' }}>{item.icon}</span><span>{item.text}</span></div>)}</div>
            </section>
          </div>

          <aside className="lg:col-span-1">
            <div className="dp-surface space-y-5 rounded-2xl p-5 lg:sticky lg:top-24 md:p-6">
              <div><p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>Step 3 · Payment</p><PaymentMethodSelector selectedMethod={paymentMethod} onMethodChange={setPaymentMethod} email={email} onEmailChange={setEmail} isConnected={isConnected} disabled={!canPurchase} /></div>
              <hr className="dp-divider" />
              <div>
                <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>Order summary</p>
                <div className="space-y-3">
                  <div className="flex justify-between gap-3 text-[12px]"><span style={{ color: 'var(--text-secondary)' }}>Ticket type</span><span className="text-right font-medium">{selectedType?.name || '-'}</span></div>
                  <div className="flex justify-between gap-3 text-[12px]"><span style={{ color: 'var(--text-secondary)' }}>Price per ticket</span><div className="text-right">{selectedType ? <><p className="font-medium">{selectedType.pricePOL} POL</p>{paymentMethod === 'fiat' && selectedType.priceIDR > 0 && <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>≈ {formatIDR(selectedType.priceIDR)}</p>}</> : <p className="font-medium" style={{ color: 'var(--text-muted)' }}>-</p>}</div></div>
                  <div className="flex justify-between gap-3 text-[12px]"><span style={{ color: 'var(--text-secondary)' }}>Quantity</span><span className="font-medium">{quantity}</span></div>
                  <hr className="dp-divider" />
                  <div className="flex items-start justify-between gap-3"><span className="text-[13px] font-semibold">Total</span><div className="text-right">{selectedType ? <><p className="text-lg font-semibold">{totalPrice} POL</p>{paymentMethod === 'fiat' && selectedType.priceIDR > 0 && <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>≈ {formatIDR(selectedType.priceIDR * quantity)}</p>}</> : <p className="font-semibold" style={{ color: 'var(--text-muted)' }}>-</p>}</div></div>
                </div>
              </div>

              {purchaseError && <div className="rounded-xl p-3 text-[12px]" style={{ backgroundColor: 'var(--error-muted)', color: 'var(--error)' }}>{purchaseError}</div>}
              {error && <div className="rounded-xl p-3 text-[12px]" style={{ backgroundColor: 'var(--error-muted)', color: 'var(--error)' }}>{error.message || 'Transaction failed'}</div>}

              {canPurchase ? (
                <>
                  <button onClick={handlePurchase} disabled={(paymentMethod === 'crypto' && (isPending || isConfirming || !isConnected)) || (paymentMethod === 'fiat' && (!email || processingPayment)) || !canPurchase} className="dp-btn-primary w-full disabled:opacity-40" style={{ padding: '14px 24px', fontSize: '14px' }}>
                    {processingPayment ? <span className="flex items-center justify-center gap-2"><span className="dp-pulse">●</span> Creating payment...</span> : isPending || isConfirming ? <span className="flex items-center justify-center gap-2"><span className="dp-pulse">●</span> {isPending ? 'Confirm in wallet...' : 'Processing...'}</span> : <>Purchase {quantity} Ticket{quantity > 1 ? 's' : ''}</>}
                  </button>
                  <p className="text-center text-[10px] leading-5" style={{ color: 'var(--text-muted)' }}>{paymentMethod === 'fiat' ? 'You will be redirected to the payment page.' : 'You will be prompted to confirm in your wallet.'}</p>
                </>
              ) : <button disabled className="dp-btn-secondary w-full cursor-not-allowed opacity-40" style={{ padding: '14px 24px' }}>Not Available</button>}
            </div>
          </aside>
        </div>
      </div>

      {event && selectedType && (
        <TicketSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          event={{ eventId: event.eventId, metadata: event.metadata }}
          ticketType={{ name: selectedType.name }}
          quantity={quantity}
          transactionHash={hash}
          walletAddress={address}
        />
      )}
    </main>
  );
}

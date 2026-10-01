'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useEventTicketing } from '@/hooks/useEventTicketing';
import { readTicket, readEvent, readTicketOwner, readListing } from '@/lib/contractReads';
import { formatEther, parseEther } from 'viem';
import { MapPin, Clock, XCircle } from 'lucide-react';

interface TicketDetail {
  tokenId: number;
  eventId: number;
  originalPrice: bigint;
  resaleCount: number;
  maxResaleCount: number;
  redeemed: boolean;
  active: boolean;
  owner: string;
  eventData?: {
    title: string;
    venue: string;
    startDate: string;
    resalePriceCapBps: number;
    resaleDeadline: number;
    isCancelled: boolean;
  };
  listingData?: {
    price: bigint;
    active: boolean;
  };
}

export default function ResaleManagementPage() {
  const router = useRouter();
  const params = useParams();
  const tokenId = parseInt(params.id as string);
  
  const { isConnected, address, mounted } = useWallet();
  const { listForResale, cancelResale, isPending, isConfirming, isConfirmed, hash, error } = useEventTicketing();
  
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [resalePrice, setResalePrice] = useState('');
  const [priceError, setPriceError] = useState('');
  const [mode, setMode] = useState<'list' | 'cancel'>('list');

  useEffect(() => {
    if (tokenId && !isNaN(tokenId)) {
      loadTicket();
    }
  }, [tokenId, address]);

  useEffect(() => {
    // Only check connection after component is mounted
    if (!mounted) return;
    
    if (!isConnected) {
      console.log('[Resale Page] Wallet not connected, redirecting...');
      router.push(`/tickets/${tokenId}`);
    }
  }, [isConnected, mounted, tokenId, router]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      
      const ticketData = await readTicket(tokenId);
      if (!ticketData) {
        setTicket(null);
        setLoading(false);
        return;
      }

      const owner = await readTicketOwner(tokenId);
      if (!owner) {
        setTicket(null);
        setLoading(false);
        return;
      }

      const userIsOwner = address && owner.toLowerCase() === address.toLowerCase();
      setIsOwner(!!userIsOwner);

      if (!userIsOwner) {
        router.push(`/tickets/${tokenId}`);
        return;
      }

      const eventId = Number(ticketData[0]);
      const eventData = await readEvent(eventId);
      const listingData = await readListing(tokenId);

      // Decode event metadata
      let eventMetadata = {
        title: `Event #${eventId}`,
        venue: 'Venue TBD',
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        resalePriceCapBps: eventData ? Number(eventData[7]) : 11000,
        resaleDeadline: eventData ? Number(eventData[8]) : 0,
        isCancelled: eventData ? (eventData[11] as boolean) : false,
      };

      if (eventData) {
        const metadataURI = eventData[2] as string;
        
        try {
          if (metadataURI.startsWith('ipfs://Qm')) {
            const base64Part = metadataURI.replace('ipfs://Qm', '');
            const decoded = atob(base64Part);
            const jsonStr = decodeURIComponent(escape(decoded));
            const metadata = JSON.parse(jsonStr);
            
            eventMetadata = {
              title: metadata.title || eventMetadata.title,
              venue: metadata.venue || eventMetadata.venue,
              startDate: metadata.startDate || eventMetadata.startDate,
              resalePriceCapBps: Number(eventData[7]),
              resaleDeadline: Number(eventData[8]),
              isCancelled: eventData[11] as boolean,
            };
            
            console.log('[Resale Page] Decoded metadata:', metadata);
          }
        } catch (err) {
          console.error('[Resale Page] Metadata decode error:', err);
        }
      }

      setTicket({
        tokenId,
        eventId: Number(ticketData[0]),
        originalPrice: ticketData[2] as bigint,
        resaleCount: Number(ticketData[3]),
        maxResaleCount: Number(ticketData[4]),
        redeemed: ticketData[5] as boolean,
        active: ticketData[6] as boolean,
        owner,
        eventData: eventMetadata,
        listingData: listingData && listingData[3] ? {
          price: listingData[2] as bigint,
          active: listingData[3] as boolean,
        } : undefined,
      });

      // Set mode based on listing status
      if (listingData && listingData[3]) {
        setMode('cancel');
        setResalePrice(formatEther(listingData[2] as bigint));
      }
    } catch (error) {
      console.error('Error loading ticket:', error);
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  const validatePrice = (priceEth: string): boolean => {
    if (!ticket) return false;

    setPriceError('');
    
    const price = parseFloat(priceEth);
    if (isNaN(price) || price <= 0) {
      setPriceError('Please enter a valid price');
      return false;
    }

    // Check price cap
    const maxPriceBigInt = (ticket.originalPrice * BigInt(ticket.eventData!.resalePriceCapBps)) / BigInt(10000);
    const maxPriceEth = parseFloat(formatEther(maxPriceBigInt));
    
    if (price > maxPriceEth) {
      setPriceError(`Price cannot exceed ${maxPriceEth.toFixed(4)} POL (${ticket.eventData!.resalePriceCapBps / 100}% of original)`);
      return false;
    }

    // Check resale deadline
    const now = Math.floor(Date.now() / 1000);
    if (now > ticket.eventData!.resaleDeadline) {
      setPriceError('Resale deadline has passed');
      return false;
    }

    return true;
  };

  const handleListForResale = async () => {
    if (!ticket || !validatePrice(resalePrice)) return;

    try {
      await listForResale(tokenId, resalePrice);
    } catch (err: any) {
      console.error('Error listing for resale:', err);
    }
  };

  const handleCancelResale = async () => {
    if (!ticket) return;

    try {
      await cancelResale(tokenId);
    } catch (err: any) {
      console.error('Error cancelling resale:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock size={64} className="mx-auto mb-4 animate-pulse text-primary" />
          <p className="text-muted-foreground">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass rounded-xl p-12 max-w-md w-full text-center">
          <XCircle size={64} className="mx-auto mb-4 text-destructive" />
          <h2 className="text-2xl font-bold mb-2">Ticket Not Found</h2>
          <p className="text-muted-foreground mb-6">
            This ticket doesn't exist or you don't own it.
          </p>
          <button
            onClick={() => router.push('/tickets')}
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          >
            Back to My Tickets
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (isConfirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass rounded-xl p-12 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">
            {mode === 'list' ? 'Listed Successfully!' : 'Listing Cancelled'}
          </h2>
          <p className="text-muted-foreground mb-4">
            {mode === 'list'
              ? `Your ticket is now listed for ${resalePrice} POL`
              : 'Your ticket is no longer listed for sale'}
          </p>
          <p className="text-sm text-muted-foreground mb-6 font-mono break-all">
            Tx: {hash?.slice(0, 10)}...{hash?.slice(-8)}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push(`/tickets/${tokenId}`)}
              className="dp-btn-primary w-full"
            >
              View Ticket
            </button>
            <button
              onClick={() => router.push('/tickets')}
              className="w-full px-6 py-3 rounded-lg glass hover:glass-hover transition-all"
            >
              Back to My Tickets
            </button>
          </div>
        </div>
      </div>
    );
  }

  const canList = ticket.active && !ticket.redeemed && !ticket.eventData?.isCancelled &&
                 ticket.resaleCount < ticket.maxResaleCount;
  
  const maxPrice = formatEther((ticket.originalPrice * BigInt(ticket.eventData!.resalePriceCapBps)) / BigInt(10000));
  const resaleDeadlinePassed = Math.floor(Date.now() / 1000) > ticket.eventData!.resaleDeadline;

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/tickets/${tokenId}`)}
          className="dp-btn-ghost mb-6"
          style={{ padding: '4px 0', color: 'var(--text-muted)' }}
        >
          ← Back to Ticket
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {ticket.listingData?.active ? 'Manage Resale Listing' : 'List Ticket for Resale'}
          </h1>
          <p className="text-muted-foreground">
            Ticket #{ticket.tokenId} • {ticket.eventData?.title}
          </p>
          {ticket.eventData?.venue && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1 justify-center">
              <MapPin size={14} />
              {ticket.eventData.venue}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Listing */}
            {ticket.listingData?.active && (
              <div className="glass rounded-xl p-6 border-2 border-blue-500/30">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Currently Listed</h2>
                  <span className="px-3 py-1 rounded-lg text-sm bg-green-500/20 text-green-400">
                    Active
                  </span>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-1">Listed Price</p>
                  <p className="text-3xl font-bold">{formatEther(ticket.listingData.price)} POL</p>
                </div>
                <button
                  onClick={() => setMode('cancel')}
                  className="w-full px-6 py-3 rounded-lg bg-destructive text-white hover:bg-destructive/90 transition-all"
                  disabled={isPending || isConfirming}
                >
                  {isPending || isConfirming ? (
                    <span className="flex items-center justify-center gap-2">
                      <Clock size={16} className="animate-spin" />
                      {isPending ? 'Confirm in Wallet...' : 'Cancelling...'}
                    </span>
                  ) : (
                    'Cancel Listing'
                  )}
                </button>
              </div>
            )}

            {/* Listing Form */}
            {!ticket.listingData?.active && (
              <div className="glass rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-6">Set Resale Price</h2>

                {!canList ? (
                  <div className="p-4 bg-destructive/20 rounded-lg text-center">
                    <p className="text-destructive mb-2">Cannot list this ticket</p>
                    <p className="text-sm text-muted-foreground">
                      {ticket.redeemed
                        ? 'Ticket has been used'
                        : !ticket.active
                        ? 'Ticket is inactive'
                        : ticket.eventData?.isCancelled
                        ? 'Event has been cancelled'
                        : resaleDeadlinePassed
                        ? 'Resale deadline has passed'
                        : 'Maximum resale count reached'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-2">
                        Price (POL) *
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={resalePrice}
                        onChange={(e) => {
                          setResalePrice(e.target.value);
                          setPriceError('');
                        }}
                        onBlur={() => validatePrice(resalePrice)}
                        className="w-full px-4 py-3 rounded-lg bg-muted border border-border focus:border-primary focus:outline-none text-lg"
                        placeholder="0.1"
                      />
                      {priceError && (
                        <p className="text-destructive text-sm mt-2">{priceError}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Maximum allowed: {maxPrice} POL ({ticket.eventData!.resalePriceCapBps / 100}% of original)
                      </p>
                    </div>

                    <div className="flex gap-2 mb-6">
                      <button
                        onClick={() => setResalePrice(formatEther(ticket.originalPrice))}
                        className="flex-1 px-4 py-2 rounded-lg glass hover:glass-hover transition-all text-sm"
                      >
                        Same as Paid
                      </button>
                      <button
                        onClick={() => setResalePrice(maxPrice)}
                        className="flex-1 px-4 py-2 rounded-lg glass hover:glass-hover transition-all text-sm"
                      >
                        Maximum Price
                      </button>
                    </div>

                    {error && (
                      <div className="mb-4 p-3 bg-destructive/20 rounded-lg text-sm text-destructive">
                        {error.message || 'Transaction failed'}
                      </div>
                    )}

                    <button
                      onClick={handleListForResale}
                      disabled={isPending || isConfirming || !resalePrice || !!priceError}
                      className="dp-btn-primary w-full"
                    >
                      {isPending || isConfirming ? (
                        <span className="flex items-center justify-center gap-2">
                          <Clock size={16} className="animate-spin" />
                          {isPending ? 'Confirm in Wallet...' : 'Listing...'}
                        </span>
                      ) : (
                        'List for Resale'
                      )}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Resale Rules */}
            <div className="glass rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Resale Rules</h2>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>
                    Price cap: Maximum {ticket.eventData!.resalePriceCapBps / 100}% of original price
                    ({maxPrice} POL)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>
                    Resale deadline: {ticket.eventData?.startDate 
                      ? new Date(ticket.eventData.startDate).toLocaleDateString()
                      : 'TBD'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>
                    Resale count: {ticket.resaleCount} of {ticket.maxResaleCount} allowed
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>
                    Atomic escrow ensures safe transfer and instant payment
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass rounded-xl p-6 sticky top-24">
              <h3 className="text-lg font-semibold mb-4">Ticket Summary</h3>
              
              <div className="space-y-3 mb-6 pb-6 border-b border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Token ID</span>
                  <span className="font-semibold">#{ticket.tokenId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Original Price</span>
                  <span className="font-semibold">{formatEther(ticket.originalPrice)} POL</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Resale Count</span>
                  <span className="font-semibold">{ticket.resaleCount}/{ticket.maxResaleCount}</span>
                </div>
              </div>

              {resalePrice && !priceError && (
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-2">You'll receive</p>
                  <p className="text-2xl font-bold">{resalePrice} POL</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    After successful sale
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Protection</p>
                <ul className="space-y-1 text-xs">
                  <li className="flex items-center gap-1">
                    <span className="text-green-400">✓</span>
                    <span>Atomic escrow</span>
                  </li>
                  <li className="flex items-center gap-1">
                    <span className="text-green-400">✓</span>
                    <span>Instant payment</span>
                  </li>
                  <li className="flex items-center gap-1">
                    <span className="text-green-400">✓</span>
                    <span>No chargebacks</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

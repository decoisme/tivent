'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useEventTicketing } from '@/hooks/useEventTicketing';
import { useTicketOwnershipHistory, useProvenanceVerification } from '@/hooks/useOwnershipHistory';
import { readTicket, readEvent, readTicketOwner, readListing } from '@/lib/contractReads';
import { formatEther, parseEther } from 'viem';
import { 
  MapPin, 
  Clock, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  Tag, 
  Ban,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Calendar,
  Ticket,
  AlertTriangle,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { OwnershipTimeline, OwnershipStatsCard, ProvenanceCard } from '@/components/OwnershipTimeline';

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
  const { ownershipChain, loading: historyLoading } = useTicketOwnershipHistory(tokenId);
  const { provenance } = useProvenanceVerification(tokenId);
  
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [resalePrice, setResalePrice] = useState('');
  const [priceError, setPriceError] = useState('');
  const [mode, setMode] = useState<'list' | 'cancel'>('list');
  const [showHistory, setShowHistory] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin" style={{ color: 'var(--primary)' }} />
          <p className="text-[14px]" style={{ color: 'var(--text-muted)' }}>Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="dp-card rounded-xl p-12 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-[#EF4444]" />
          <h2 className="text-[24px] font-bold mb-2">Ticket Not Found</h2>
          <p className="text-[14px] mb-6" style={{ color: 'var(--text-muted)' }}>
            This ticket doesn't exist or you don't own it.
          </p>
          <button
            onClick={() => router.push('/tickets')}
            className="dp-btn-primary"
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
        <div className="dp-card rounded-xl p-12 max-w-md w-full text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-[#10B981]" />
          <h2 className="text-[24px] font-bold mb-2">
            {mode === 'list' ? 'Listed Successfully!' : 'Listing Cancelled'}
          </h2>
          <p className="text-[14px] mb-4" style={{ color: 'var(--text-muted)' }}>
            {mode === 'list'
              ? `Your ticket is now listed for ${resalePrice} POL`
              : 'Your ticket is no longer listed for sale'}
          </p>
          <p className="text-[12px] mb-6 font-mono break-all" style={{ color: 'var(--text-muted)' }}>
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
              className="w-full px-6 py-3 rounded-lg dp-card hover:opacity-80 transition-all text-[14px]"
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
    <div className="min-h-screen py-8 px-4 page-enter-active relative" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Ticket Decoration - Left Side with Scalloped Edge */}
      <div className="fixed left-0 top-0 bottom-0 w-8 pointer-events-none hidden lg:block">
        <svg
          className="w-full h-full"
          viewBox="0 0 32 1000"
          preserveAspectRatio="none"
          fill="#EE7D3A"
          opacity="0.3"
        >
          {/* Scalloped Edge Pattern - curves inward to the right */}
          <path d="
            M 0,0
            L 32,0
            L 32,10
            C 32,10 16,12.5 16,15
            C 16,17.5 32,20 32,20
            L 32,30
            C 32,30 16,32.5 16,35
            C 16,37.5 32,40 32,40
            L 32,50
            C 32,50 16,52.5 16,55
            C 16,57.5 32,60 32,60
            L 32,70
            C 32,70 16,72.5 16,75
            C 16,77.5 32,80 32,80
            L 32,90
            C 32,90 16,92.5 16,95
            C 16,97.5 32,100 32,100
            L 32,110
            C 32,110 16,112.5 16,115
            C 16,117.5 32,120 32,120
            L 32,130
            C 32,130 16,132.5 16,135
            C 16,137.5 32,140 32,140
            L 32,150
            C 32,150 16,152.5 16,155
            C 16,157.5 32,160 32,160
            L 32,170
            C 32,170 16,172.5 16,175
            C 16,177.5 32,180 32,180
            L 32,190
            C 32,190 16,192.5 16,195
            C 16,197.5 32,200 32,200
            L 32,210
            C 32,210 16,212.5 16,215
            C 16,217.5 32,220 32,220
            L 32,230
            C 32,230 16,232.5 16,235
            C 16,237.5 32,240 32,240
            L 32,250
            C 32,250 16,252.5 16,255
            C 16,257.5 32,260 32,260
            L 32,270
            C 32,270 16,272.5 16,275
            C 16,277.5 32,280 32,280
            L 32,290
            C 32,290 16,292.5 16,295
            C 16,297.5 32,300 32,300
            L 32,310
            C 32,310 16,312.5 16,315
            C 16,317.5 32,320 32,320
            L 32,330
            C 32,330 16,332.5 16,335
            C 16,337.5 32,340 32,340
            L 32,350
            C 32,350 16,352.5 16,355
            C 16,357.5 32,360 32,360
            L 32,370
            C 32,370 16,372.5 16,375
            C 16,377.5 32,380 32,380
            L 32,390
            C 32,390 16,392.5 16,395
            C 16,397.5 32,400 32,400
            L 32,410
            C 32,410 16,412.5 16,415
            C 16,417.5 32,420 32,420
            L 32,430
            C 32,430 16,432.5 16,435
            C 16,437.5 32,440 32,440
            L 32,450
            C 32,450 16,452.5 16,455
            C 16,457.5 32,460 32,460
            L 32,470
            C 32,470 16,472.5 16,475
            C 16,477.5 32,480 32,480
            L 32,490
            C 32,490 16,492.5 16,495
            C 16,497.5 32,500 32,500
            L 32,510
            C 32,510 16,512.5 16,515
            C 16,517.5 32,520 32,520
            L 32,530
            C 32,530 16,532.5 16,535
            C 16,537.5 32,540 32,540
            L 32,550
            C 32,550 16,552.5 16,555
            C 16,557.5 32,560 32,560
            L 32,570
            C 32,570 16,572.5 16,575
            C 16,577.5 32,580 32,580
            L 32,590
            C 32,590 16,592.5 16,595
            C 16,597.5 32,600 32,600
            L 32,610
            C 32,610 16,612.5 16,615
            C 16,617.5 32,620 32,620
            L 32,630
            C 32,630 16,632.5 16,635
            C 16,637.5 32,640 32,640
            L 32,650
            C 32,650 16,652.5 16,655
            C 16,657.5 32,660 32,660
            L 32,670
            C 32,670 16,672.5 16,675
            C 16,677.5 32,680 32,680
            L 32,690
            C 32,690 16,692.5 16,695
            C 16,697.5 32,700 32,700
            L 32,710
            C 32,710 16,712.5 16,715
            C 16,717.5 32,720 32,720
            L 32,730
            C 32,730 16,732.5 16,735
            C 16,737.5 32,740 32,740
            L 32,750
            C 32,750 16,752.5 16,755
            C 16,757.5 32,760 32,760
            L 32,770
            C 32,770 16,772.5 16,775
            C 16,777.5 32,780 32,780
            L 32,790
            C 32,790 16,792.5 16,795
            C 16,797.5 32,800 32,800
            L 32,810
            C 32,810 16,812.5 16,815
            C 16,817.5 32,820 32,820
            L 32,830
            C 32,830 16,832.5 16,835
            C 16,837.5 32,840 32,840
            L 32,850
            C 32,850 16,852.5 16,855
            C 16,857.5 32,860 32,860
            L 32,870
            C 32,870 16,872.5 16,875
            C 16,877.5 32,880 32,880
            L 32,890
            C 32,890 16,892.5 16,895
            C 16,897.5 32,900 32,900
            L 32,910
            C 32,910 16,912.5 16,915
            C 16,917.5 32,920 32,920
            L 32,930
            C 32,930 16,932.5 16,935
            C 16,937.5 32,940 32,940
            L 32,950
            C 32,950 16,952.5 16,955
            C 16,957.5 32,960 32,960
            L 32,970
            C 32,970 16,972.5 16,975
            C 16,977.5 32,980 32,980
            L 32,990
            C 32,990 16,992.5 16,995
            C 16,997.5 32,1000 32,1000
            L 0,1000
            Z
          " />
        </svg>
      </div>

      {/* Ticket Decoration - Right Side with Scalloped Edge (Mirror) */}
      <div className="fixed right-0 top-0 bottom-0 w-8 pointer-events-none hidden lg:block">
        <svg
          className="w-full h-full"
          viewBox="0 0 32 1000"
          preserveAspectRatio="none"
          fill="#EE7D3A"
          opacity="0.3"
        >
          {/* Scalloped Edge Pattern - curves inward to the left (mirror) */}
          <path d="
            M 32,0
            L 0,0
            L 0,10
            C 0,10 16,12.5 16,15
            C 16,17.5 0,20 0,20
            L 0,30
            C 0,30 16,32.5 16,35
            C 16,37.5 0,40 0,40
            L 0,50
            C 0,50 16,52.5 16,55
            C 16,57.5 0,60 0,60
            L 0,70
            C 0,70 16,72.5 16,75
            C 16,77.5 0,80 0,80
            L 0,90
            C 0,90 16,92.5 16,95
            C 16,97.5 0,100 0,100
            L 0,110
            C 0,110 16,112.5 16,115
            C 16,117.5 0,120 0,120
            L 0,130
            C 0,130 16,132.5 16,135
            C 16,137.5 0,140 0,140
            L 0,150
            C 0,150 16,152.5 16,155
            C 16,157.5 0,160 0,160
            L 0,170
            C 0,170 16,172.5 16,175
            C 16,177.5 0,180 0,180
            L 0,190
            C 0,190 16,192.5 16,195
            C 16,197.5 0,200 0,200
            L 0,210
            C 0,210 16,212.5 16,215
            C 16,217.5 0,220 0,220
            L 0,230
            C 0,230 16,232.5 16,235
            C 16,237.5 0,240 0,240
            L 0,250
            C 0,250 16,252.5 16,255
            C 16,257.5 0,260 0,260
            L 0,270
            C 0,270 16,272.5 16,275
            C 16,277.5 0,280 0,280
            L 0,290
            C 0,290 16,292.5 16,295
            C 16,297.5 0,300 0,300
            L 0,310
            C 0,310 16,312.5 16,315
            C 16,317.5 0,320 0,320
            L 0,330
            C 0,330 16,332.5 16,335
            C 16,337.5 0,340 0,340
            L 0,350
            C 0,350 16,352.5 16,355
            C 16,357.5 0,360 0,360
            L 0,370
            C 0,370 16,372.5 16,375
            C 16,377.5 0,380 0,380
            L 0,390
            C 0,390 16,392.5 16,395
            C 16,397.5 0,400 0,400
            L 0,410
            C 0,410 16,412.5 16,415
            C 16,417.5 0,420 0,420
            L 0,430
            C 0,430 16,432.5 16,435
            C 16,437.5 0,440 0,440
            L 0,450
            C 0,450 16,452.5 16,455
            C 16,457.5 0,460 0,460
            L 0,470
            C 0,470 16,472.5 16,475
            C 16,477.5 0,480 0,480
            L 0,490
            C 0,490 16,492.5 16,495
            C 16,497.5 0,500 0,500
            L 0,510
            C 0,510 16,512.5 16,515
            C 16,517.5 0,520 0,520
            L 0,530
            C 0,530 16,532.5 16,535
            C 16,537.5 0,540 0,540
            L 0,550
            C 0,550 16,552.5 16,555
            C 16,557.5 0,560 0,560
            L 0,570
            C 0,570 16,572.5 16,575
            C 16,577.5 0,580 0,580
            L 0,590
            C 0,590 16,592.5 16,595
            C 16,597.5 0,600 0,600
            L 0,610
            C 0,610 16,612.5 16,615
            C 16,617.5 0,620 0,620
            L 0,630
            C 0,630 16,632.5 16,635
            C 16,637.5 0,640 0,640
            L 0,650
            C 0,650 16,652.5 16,655
            C 16,657.5 0,660 0,660
            L 0,670
            C 0,670 16,672.5 16,675
            C 16,677.5 0,680 0,680
            L 0,690
            C 0,690 16,692.5 16,695
            C 16,697.5 0,700 0,700
            L 0,710
            C 0,710 16,712.5 16,715
            C 16,717.5 0,720 0,720
            L 0,730
            C 0,730 16,732.5 16,735
            C 16,737.5 0,740 0,740
            L 0,750
            C 0,750 16,752.5 16,755
            C 16,757.5 0,760 0,760
            L 0,770
            C 0,770 16,772.5 16,775
            C 16,777.5 0,780 0,780
            L 0,790
            C 0,790 16,792.5 16,795
            C 16,797.5 0,800 0,800
            L 0,810
            C 0,810 16,812.5 16,815
            C 16,817.5 0,820 0,820
            L 0,830
            C 0,830 16,832.5 16,835
            C 16,837.5 0,840 0,840
            L 0,850
            C 0,850 16,852.5 16,855
            C 16,857.5 0,860 0,860
            L 0,870
            C 0,870 16,872.5 16,875
            C 16,877.5 0,880 0,880
            L 0,890
            C 0,890 16,892.5 16,895
            C 16,897.5 0,900 0,900
            L 0,910
            C 0,910 16,912.5 16,915
            C 16,917.5 0,920 0,920
            L 0,930
            C 0,930 16,932.5 16,935
            C 16,937.5 0,940 0,940
            L 0,950
            C 0,950 16,952.5 16,955
            C 16,957.5 0,960 0,960
            L 0,970
            C 0,970 16,972.5 16,975
            C 16,977.5 0,980 0,980
            L 0,990
            C 0,990 16,992.5 16,995
            C 16,997.5 0,1000 0,1000
            L 32,1000
            Z
          " />
        </svg>
      </div>

      <div className="dp-container max-w-5xl mx-auto relative z-10">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push(`/tickets/${tokenId}`)}
            className="flex items-center gap-2 text-[13px] transition-opacity hover:opacity-80"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <div className="flex items-center gap-2">
            {ticket.listingData?.active && (
              <span className="px-2 py-1 rounded text-[11px] font-medium" style={{ backgroundColor: 'var(--primary-bg)', color: 'var(--primary)' }}>
                Listed
              </span>
            )}
          </div>
        </div>

        {/* Compact Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          {/* Main Content */}
          <div className="space-y-4">
            {/* Ticket Info Card - Compact */}
            <div className="dp-surface p-5">
              <h2 className="text-[16px] font-semibold mb-4">{ticket.eventData?.title}</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-start gap-2">
                  <MapPin size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Venue</p>
                    <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{ticket.eventData?.venue || 'TBD'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Date</p>
                    <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                      {ticket.eventData?.startDate
                        ? new Date(ticket.eventData.startDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'TBD'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t grid grid-cols-2 gap-3" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Token ID</p>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>#{ticket.tokenId}</p>
                </div>
                <div>
                  <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Resale Count</p>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{ticket.resaleCount}/{ticket.maxResaleCount}</p>
                </div>
                <div>
                  <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Original Price</p>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{formatEther(ticket.originalPrice)} POL</p>
                </div>
                <div>
                  <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Max Price Cap</p>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--accent)' }}>{maxPrice} POL</p>
                </div>
              </div>
            </div>

            {/* Current Listing - if active */}
            {ticket.listingData?.active && (
              <div className="dp-surface p-5 border-2" style={{ borderColor: 'var(--primary)' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Currently Listed
                  </p>
                  <CheckCircle2 size={14} style={{ color: 'var(--primary)' }} />
                </div>
                <p className="text-[28px] font-bold mb-1" style={{ color: 'var(--primary)' }}>
                  {formatEther(ticket.listingData.price)} POL
                </p>
                <p className="text-[11px] mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Active on marketplace
                </p>
                <button
                  onClick={handleCancelResale}
                  className="w-full text-[13px] py-2.5 rounded-lg transition-all border flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: 'var(--surface-hover)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                  disabled={isPending || isConfirming}
                >
                  {isPending || isConfirming ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {isPending ? 'Confirm...' : 'Cancelling...'}
                    </>
                  ) : (
                    <>
                      <Ban className="w-3.5 h-3.5" />
                      Cancel Listing
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Listing Form - compact */}
            {!ticket.listingData?.active && (
              <div className="dp-surface p-5">
                <h3 className="text-[14px] font-semibold mb-4">Set Resale Price</h3>

                {!canList ? (
                  <div className="p-4 rounded-lg text-center border" style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border)' }}>
                    <AlertTriangle className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-[12px] font-medium mb-1">Cannot list this ticket</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
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
                    <div className="mb-4">
                      <label className="block text-[11px] font-medium mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        Price (POL) <span style={{ color: 'var(--primary)' }}>*</span>
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
                        className="w-full px-4 py-2.5 rounded-lg border text-[15px] focus:outline-none transition-colors"
                        style={{ 
                          backgroundColor: 'var(--input-bg)', 
                          borderColor: priceError ? 'var(--primary)' : 'var(--border)',
                          color: 'var(--text-primary)'
                        }}
                        placeholder="0.100"
                      />
                      {priceError && (
                        <p className="text-[11px] mt-1.5 flex items-center gap-1" style={{ color: 'var(--primary)' }}>
                          <AlertTriangle className="w-3 h-3" />
                          {priceError}
                        </p>
                      )}
                      <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                        Max: {maxPrice} POL ({ticket.eventData!.resalePriceCapBps / 100}% cap)
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <button
                        onClick={() => setResalePrice(formatEther(ticket.originalPrice))}
                        className="px-3 py-2 rounded-lg text-[11px] font-medium transition-all border hover:opacity-70"
                        style={{ 
                          backgroundColor: 'var(--surface-hover)', 
                          borderColor: 'var(--border)',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        Same Price
                      </button>
                      <button
                        onClick={() => setResalePrice(maxPrice)}
                        className="px-3 py-2 rounded-lg text-[11px] font-medium transition-all border hover:opacity-70"
                        style={{ 
                          backgroundColor: 'var(--surface-hover)', 
                          borderColor: 'var(--border)',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        Max Price
                      </button>
                    </div>

                    {error && (
                      <div className="mb-3 p-2.5 rounded-lg text-[11px] flex items-start gap-1.5 border" style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span>{error.message || 'Transaction failed'}</span>
                      </div>
                    )}

                    <button
                      onClick={handleListForResale}
                      disabled={isPending || isConfirming || !resalePrice || !!priceError}
                      className="dp-btn-primary w-full flex items-center justify-center gap-2 text-[13px] py-2.5"
                    >
                      {isPending || isConfirming ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          {isPending ? 'Confirm...' : 'Listing...'}
                        </>
                      ) : (
                        <>
                          <Tag className="w-3.5 h-3.5" />
                          List for Resale
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Ownership History - compact collapsible */}
            <div className="dp-surface p-4">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between text-left"
              >
                <h3 className="text-[13px] font-semibold">Ownership History</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {showHistory ? 'Hide' : 'Show'}
                  </span>
                  {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>

              {showHistory && (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                  {historyLoading ? (
                    <div className="space-y-2">
                      {[1, 2].map((i) => <div key={i} className="h-10 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-hover)' }} />)}
                    </div>
                  ) : ownershipChain ? (
                    <div className="space-y-4">
                      {ownershipChain.priceHistory && (
                        <OwnershipStatsCard stats={{
                          totalTransfers: ownershipChain.totalTransfers,
                          totalResales: ownershipChain.totalResales,
                          originalPrice: ownershipChain.priceHistory.originalPrice,
                          currentPrice: ownershipChain.priceHistory.currentPrice,
                          highestPrice: ownershipChain.priceHistory.highestPrice,
                          totalVolume: ownershipChain.priceHistory.totalVolume,
                        }} />
                      )}
                      <OwnershipTimeline history={ownershipChain.history} />
                      {provenance && <ProvenanceCard provenance={provenance} />}
                    </div>
                  ) : (
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      No history available
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Resale Rules - compact */}
            <div className="dp-surface p-5">
              <h3 className="text-[14px] font-semibold mb-3">Resale Rules</h3>
              <ul className="space-y-2.5 text-[11px]">
                <li className="flex items-start gap-2">
                  <TrendingUp className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Max {ticket.eventData!.resalePriceCapBps / 100}% of original ({maxPrice} POL)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Calendar className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Until {ticket.eventData?.startDate 
                      ? new Date(ticket.eventData.startDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })
                      : 'event date'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Atomic escrow protection
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Sidebar - Compact Sticky */}
          <div className="lg:w-[340px]">
            <div className="dp-surface p-5 space-y-4 sticky top-20">
              {resalePrice && !priceError ? (
                <>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                      You'll Receive
                    </p>
                    <p className="text-[28px] font-bold tracking-[-0.02em] break-words" style={{ color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                      {parseFloat(resalePrice).toFixed(4)} POL
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                      After successful sale
                    </p>
                  </div>

                  <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                      Protection
                    </p>
                    <ul className="space-y-1.5 text-[11px]">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} style={{ color: 'var(--success)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>Atomic escrow</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} style={{ color: 'var(--success)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>Instant payment</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} style={{ color: 'var(--success)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>No chargebacks</span>
                      </li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <Tag size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Enter a price to see details
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

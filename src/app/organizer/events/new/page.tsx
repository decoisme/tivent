'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useEventTicketing } from '@/hooks/useEventTicketing';
import { useLivePrice } from '@/hooks/useLivePrice';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { CustomTimePicker } from '@/components/ui/CustomTimePicker';
import { Clock } from 'lucide-react';

export default function CreateEventPage() {
  const router = useRouter();
  const { isConnected, address } = useWallet();
  const { createEvent, isPending, isConfirming, isConfirmed, hash } = useEventTicketing();
  const { rate: polRate, loading: priceLoading } = useLivePrice();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    imageUrl: '',
    ticketPriceIDR: '', // Changed to IDR
    maxTickets: '',
    maxTicketsPerWallet: '4',
    resalePriceCap: '110', // 110%
    resaleDeadlineHours: '2', // 2 hours before event
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Use live POL/IDR rate, fallback to 5000 if not loaded yet
  const POL_TO_IDR = polRate || 5000;
  const IDR_TO_POL = 1 / POL_TO_IDR;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.venue.trim()) newErrors.venue = 'Venue is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';

    const ticketPriceIDR = parseFloat(formData.ticketPriceIDR);
    if (!formData.ticketPriceIDR || isNaN(ticketPriceIDR) || ticketPriceIDR <= 0) {
      newErrors.ticketPriceIDR = 'Valid ticket price is required';
    }
    if (ticketPriceIDR < 10000) {
      newErrors.ticketPriceIDR = 'Minimum ticket price is Rp 10,000';
    }

    const maxTickets = parseInt(formData.maxTickets);
    if (!formData.maxTickets || isNaN(maxTickets) || maxTickets <= 0) {
      newErrors.maxTickets = 'Valid max tickets is required';
    }

    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
    
    if (startDateTime <= new Date()) {
      newErrors.startDate = 'Event must start in the future';
    }

    if (endDateTime <= startDateTime) {
      newErrors.endDate = 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    if (!validate()) return;

    try {
      // Calculate resale deadline (event start - X hours)
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const resaleDeadlineHours = parseInt(formData.resaleDeadlineHours);
      const resaleDeadline = Math.floor(startDateTime.getTime() / 1000) - (resaleDeadlineHours * 3600);

      // Convert IDR to POL for blockchain
      const ticketPriceIDR = parseFloat(formData.ticketPriceIDR);
      const ticketPricePOL = (ticketPriceIDR * IDR_TO_POL).toFixed(6); // Convert to POL

      // Create metadata object (in production, upload to IPFS)
      const metadata = {
        title: formData.title,
        description: formData.description,
        venue: formData.venue,
        startDate: `${formData.startDate}T${formData.startTime}`,
        endDate: `${formData.endDate}T${formData.endTime}`,
        imageUrl: formData.imageUrl,
        ticketPriceIDR: ticketPriceIDR, // Store IDR price in metadata
      };

      // Mock IPFS URI (in production, upload to IPFS first)
      // Using btoa for browser-safe base64 encoding
      const metadataString = JSON.stringify(metadata);
      const base64 = typeof window !== 'undefined' 
        ? btoa(unescape(encodeURIComponent(metadataString)))
        : metadataString;
      
      // Store full base64 without truncation or character replacement
      const metadataURI = `ipfs://Qm${base64}`;

      // Convert resale cap to basis points (110% = 11000)
      const resalePriceCapBps = parseInt(formData.resalePriceCap) * 100;

      console.log('Creating event with:', {
        metadataURI,
        ticketPriceIDR: `Rp ${ticketPriceIDR.toLocaleString('id-ID')}`,
        ticketPricePOL: `${ticketPricePOL} POL`,
        maxTickets: parseInt(formData.maxTickets),
        maxTicketsPerWallet: parseInt(formData.maxTicketsPerWallet),
        resalePriceCapBps,
        resaleDeadline,
      });

      await createEvent(
        metadataURI,
        ticketPricePOL, // Send POL price to smart contract
        parseInt(formData.maxTickets),
        parseInt(formData.maxTicketsPerWallet),
        resalePriceCapBps,
        resaleDeadline
      );
    } catch (error: any) {
      console.error('Error creating event:', error);
      alert(`Error: ${error.message || 'Failed to create event'}`);
    }
  };

  // Redirect after successful creation
  if (isConfirmed && hash) {
    setTimeout(() => {
      router.push('/organizer');
    }, 3000);
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass rounded-xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Wallet Required</h2>
          <p className="text-muted-foreground mb-6">
            Please connect your wallet to create an event
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (isConfirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass rounded-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">Event Created!</h2>
          <p className="text-muted-foreground mb-2">
            Your event has been successfully created on the blockchain.
          </p>
          <p className="text-sm text-muted-foreground mb-6 font-mono break-all">
            Tx: {hash?.slice(0, 10)}...{hash?.slice(-8)}
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-bold mb-2">Create New Event</h1>
          <p className="text-muted-foreground">
            Fill in the details to create your event on the blockchain
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="glass rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium mb-2">
                Event Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="dp-input"
                placeholder="Jakarta Music Festival 2026"
              />
              {errors.title && (
                <p className="text-destructive text-sm mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="dp-input resize-none"
                placeholder="Describe your event..."
              />
              {errors.description && (
                <p className="text-destructive text-sm mt-1">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Venue *
              </label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                className="dp-input"
                placeholder="Jakarta International Stadium"
              />
              {errors.venue && (
                <p className="text-destructive text-sm mt-1">{errors.venue}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Event Image URL (optional)
              </label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className="dp-input"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="glass rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Date & Time</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <CustomDatePicker
                  label="Start Date *"
                  value={formData.startDate}
                  onChange={(value) => {
                    setFormData((prev) => ({ ...prev, startDate: value }));
                    if (errors.startDate) {
                      setErrors((prev) => ({ ...prev, startDate: '' }));
                    }
                  }}
                  placeholder="Select start date"
                  minDate={new Date().toISOString().split('T')[0]}
                />
                {errors.startDate && (
                  <p className="text-destructive text-sm mt-1">{errors.startDate}</p>
                )}
              </div>

              <div>
                <CustomTimePicker
                  label="Start Time *"
                  value={formData.startTime}
                  onChange={(value) => {
                    setFormData((prev) => ({ ...prev, startTime: value }));
                    if (errors.startTime) {
                      setErrors((prev) => ({ ...prev, startTime: '' }));
                    }
                  }}
                  placeholder="Select start time"
                  minuteStep={15}
                />
                {errors.startTime && (
                  <p className="text-destructive text-sm mt-1">{errors.startTime}</p>
                )}
              </div>

              <div>
                <CustomDatePicker
                  label="End Date *"
                  value={formData.endDate}
                  onChange={(value) => {
                    setFormData((prev) => ({ ...prev, endDate: value }));
                    if (errors.endDate) {
                      setErrors((prev) => ({ ...prev, endDate: '' }));
                    }
                  }}
                  placeholder="Select end date"
                  minDate={formData.startDate || new Date().toISOString().split('T')[0]}
                />
                {errors.endDate && (
                  <p className="text-destructive text-sm mt-1">{errors.endDate}</p>
                )}
              </div>

              <div>
                <CustomTimePicker
                  label="End Time *"
                  value={formData.endTime}
                  onChange={(value) => {
                    setFormData((prev) => ({ ...prev, endTime: value }));
                    if (errors.endTime) {
                      setErrors((prev) => ({ ...prev, endTime: '' }));
                    }
                  }}
                  placeholder="Select end time"
                  minuteStep={15}
                />
                {errors.endTime && (
                  <p className="text-destructive text-sm mt-1">{errors.endTime}</p>
                )}
              </div>
            </div>
          </div>

          {/* Ticketing Configuration */}
          <div className="glass rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Ticketing Configuration</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Ticket Price (IDR) *
                </label>
                <div className="flex items-center gap-0 rounded-lg border border-border bg-card/50 backdrop-blur-md focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <span className="flex items-center justify-center px-3 text-muted-foreground text-sm font-medium border-r border-border bg-muted/30 h-full rounded-l-lg min-w-[50px]">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    name="ticketPriceIDR"
                    value={formData.ticketPriceIDR}
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      handleChange({ target: { name: 'ticketPriceIDR', value } } as any);
                    }}
                    className="flex-1 px-4 py-2.5 bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground"
                    placeholder="50000"
                    style={{
                      WebkitAppearance: 'none',
                      MozAppearance: 'textfield',
                    }}
                  />
                </div>
                {formData.ticketPriceIDR && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    ≈ {(parseFloat(formData.ticketPriceIDR) * IDR_TO_POL).toFixed(6)} POL
                    {priceLoading && ' (loading rate...)'}
                    {!priceLoading && polRate && (
                      <span className="ml-1" style={{ color: 'var(--success)' }}>• live</span>
                    )}
                  </p>
                )}
                {errors.ticketPriceIDR && (
                  <p className="text-destructive text-sm mt-1">{errors.ticketPriceIDR}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Maximum Tickets *
                </label>
                <input
                  type="number"
                  name="maxTickets"
                  value={formData.maxTickets}
                  onChange={handleChange}
                  className="dp-input"
                  placeholder="1000"
                />
                {errors.maxTickets && (
                  <p className="text-destructive text-sm mt-1">{errors.maxTickets}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Max Tickets Per Wallet
                </label>
                <input
                  type="number"
                  name="maxTicketsPerWallet"
                  value={formData.maxTicketsPerWallet}
                  onChange={handleChange}
                  className="dp-input"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Anti-scalping: Limit purchases per wallet
                </p>
              </div>
            </div>
          </div>

          {/* Anti-Scalping Rules */}
          <div className="glass rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Anti-Scalping Rules</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Resale Price Cap (%)
                </label>
                <input
                  type="number"
                  name="resalePriceCap"
                  value={formData.resalePriceCap}
                  onChange={handleChange}
                  className="dp-input"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum resale markup (e.g., 110% = 10% profit max)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Resale Deadline (hours before event)
                </label>
                <input
                  type="number"
                  name="resaleDeadlineHours"
                  value={formData.resaleDeadlineHours}
                  onChange={handleChange}
                  className="dp-input"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Resale closes X hours before event starts
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 rounded-lg glass hover:glass-hover transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || isConfirming}
              className="dp-btn-primary flex-1"
            >
              {isPending || isConfirming ? (
                <span className="flex items-center justify-center gap-2">
                  <Clock size={16} className="animate-spin" />
                  {isPending ? 'Confirm in Wallet...' : 'Creating Event...'}
                </span>
              ) : (
                'Create Event'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useEventTicketing } from '@/hooks/useEventTicketing';
import { useLivePrice } from '@/hooks/useLivePrice';
import { formatIDR } from '@/lib/currency';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { CustomTimePicker } from '@/components/ui/CustomTimePicker';
import { 
  Clock, 
  Plus, 
  Trash2, 
  GripVertical, 
  Calendar,
  MapPin,
  FileText,
  Image as ImageIcon,
  Ticket,
  Shield,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Info,
} from 'lucide-react';

interface TicketType {
  id: string;
  name: string;
  priceIDR: string;
  maxSupply: string;
  description: string;
}

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
    maxTicketsPerWallet: '4',
    resalePriceCap: '110', // 110%
    resaleDeadlineHours: '2', // 2 hours before event
  });

  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    {
      id: 'default-1',
      name: 'Regular',
      priceIDR: '50000',
      maxSupply: '100',
      description: 'Standard admission ticket'
    }
  ]);

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

  const addTicketType = () => {
    if (ticketTypes.length >= 10) {
      alert('Maximum 10 ticket types per event');
      return;
    }
    setTicketTypes([
      ...ticketTypes,
      {
        id: `type-${Date.now()}`,
        name: '',
        priceIDR: '',
        maxSupply: '',
        description: ''
      }
    ]);
  };

  const removeTicketType = (id: string) => {
    if (ticketTypes.length === 1) {
      alert('At least one ticket type is required');
      return;
    }
    setTicketTypes(ticketTypes.filter((t) => t.id !== id));
  };

  const updateTicketType = (id: string, field: keyof TicketType, value: string) => {
    setTicketTypes(
      ticketTypes.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
    // Clear ticket type errors
    if (errors[`ticketType-${id}`]) {
      setErrors((prev) => ({ ...prev, [`ticketType-${id}`]: '' }));
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

    // Validate ticket types
    const ticketTypeNames = new Set<string>();
    ticketTypes.forEach((type, index) => {
      if (!type.name.trim()) {
        newErrors[`ticketType-${type.id}`] = 'Ticket type name is required';
      } else if (ticketTypeNames.has(type.name.toLowerCase())) {
        newErrors[`ticketType-${type.id}`] = 'Duplicate ticket type name';
      } else {
        ticketTypeNames.add(type.name.toLowerCase());
      }

      const priceIDR = parseFloat(type.priceIDR);
      if (!type.priceIDR || isNaN(priceIDR) || priceIDR <= 0) {
        newErrors[`ticketType-${type.id}`] = 'Valid ticket price is required';
      } else if (priceIDR < 10000) {
        newErrors[`ticketType-${type.id}`] = 'Minimum price is Rp 10,000';
      }

      const maxSupply = parseInt(type.maxSupply);
      if (!type.maxSupply || isNaN(maxSupply) || maxSupply <= 0) {
        newErrors[`ticketType-${type.id}`] = 'Valid max supply is required';
      } else if (maxSupply > 100000) {
        newErrors[`ticketType-${type.id}`] = 'Max supply per type is 100,000';
      }
    });

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

      // Prepare ticket types for metadata
      const ticketTypesMetadata = ticketTypes.map((type, index) => ({
        typeId: index,
        name: type.name,
        description: type.description,
        priceIDR: parseFloat(type.priceIDR),
        pricePOL: (parseFloat(type.priceIDR) * IDR_TO_POL).toFixed(6),
        maxSupply: parseInt(type.maxSupply),
      }));

      // Create metadata object
      const metadata = {
        title: formData.title,
        description: formData.description,
        venue: formData.venue,
        startDate: `${formData.startDate}T${formData.startTime}`,
        endDate: `${formData.endDate}T${formData.endTime}`,
        imageUrl: formData.imageUrl,
        ticketTypes: ticketTypesMetadata,
      };

      // Encode metadata
      const metadataString = JSON.stringify(metadata);
      console.log('📝 Metadata object before encode:', metadata);
      console.log('📝 Metadata JSON string:', metadataString);
      console.log('📝 Metadata has ticketTypes?', 'ticketTypes' in metadata, metadata.ticketTypes);
      
      const base64 = typeof window !== 'undefined' 
        ? btoa(unescape(encodeURIComponent(metadataString)))
        : metadataString;
      
      console.log('📝 Base64 encoded:', base64.substring(0, 100) + '...');
      const metadataURI = `ipfs://Qm${base64}`;
      console.log('📝 Final metadataURI:', metadataURI.substring(0, 100) + '...');
      
      // Test decode to verify
      try {
        const testDecode = atob(base64);
        const testJsonStr = decodeURIComponent(escape(testDecode));
        const testParsed = JSON.parse(testJsonStr);
        console.log('✅ Test decode successful:', testParsed);
        console.log('✅ Decoded has ticketTypes?', 'ticketTypes' in testParsed, testParsed.ticketTypes);
      } catch (err) {
        console.error('❌ Test decode failed:', err);
      }

      // Prepare ticket types for smart contract
      const ticketTypeInputs = ticketTypes.map((type) => ({
        name: type.name,
        price: BigInt(Math.round((parseFloat(type.priceIDR) * IDR_TO_POL) * 1e18)), // Convert to wei as BigInt
        maxSupply: BigInt(parseInt(type.maxSupply)),
      }));

      // Convert resale cap to basis points (110% = 11000)
      const resalePriceCapBps = parseInt(formData.resalePriceCap) * 100;

      console.log('Creating event with ticket types:', {
        metadataURI,
        ticketTypes: ticketTypesMetadata,
        maxTicketsPerWallet: parseInt(formData.maxTicketsPerWallet),
        resalePriceCapBps,
        resaleDeadline,
      });

      // IMPORTANT: Contract must support createEventWithTypes
      // If using old contract, this will fail. Deploy new contract first!
      try {
        await createEvent(
          metadataURI,
          ticketTypeInputs,
          parseInt(formData.maxTicketsPerWallet),
          resalePriceCapBps,
          resaleDeadline
        );
      } catch (error: any) {
        console.error('Error creating event:', error);
        
        // Check if error is due to old contract
        if (error.message?.includes('execution reverted')) {
          alert(
            'Error: Smart contract needs to be updated.\n\n' +
            'The deployed contract does not support multiple ticket types yet. ' +
            'Please deploy the updated smart contract with:\n\n' +
            'cd contracts && npx hardhat run scripts/deploy-amoy.js --network amoy\n\n' +
            'Then update NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local'
          );
        }
        throw error;
      }
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
        <div className="dp-surface p-12 max-w-md w-full text-center">
          <Shield size={28} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h2 className="text-[20px] font-semibold mb-2">Wallet Required</h2>
          <p className="text-[14px] mb-6" style={{ color: 'var(--text-secondary)' }}>
            Connect your wallet to create an event
          </p>
          <button
            onClick={() => router.push('/')}
            className="dp-btn-primary"
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
        <div className="dp-surface p-12 max-w-md w-full text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--success-muted)' }}>
            <CheckCircle2 size={24} style={{ color: 'var(--success)' }} />
          </div>
          <h2 className="text-[22px] font-semibold mb-2">Event Created!</h2>
          <p className="text-[14px] mb-2" style={{ color: 'var(--text-secondary)' }}>
            Your event has been successfully created on the blockchain.
          </p>
          {hash && (
            <p className="dp-mono text-[11px] mb-6 py-2 px-3 rounded-md" style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-muted)' }}>
              Tx: {hash.slice(0, 10)}...{hash.slice(-8)}
            </p>
          )}
          <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  const totalTickets = ticketTypes.reduce((sum, type) => sum + (parseInt(type.maxSupply) || 0), 0);
  const lowestPrice = Math.min(...ticketTypes.map(t => parseFloat(t.priceIDR) || Infinity).filter(p => p !== Infinity));
  const highestPrice = Math.max(...ticketTypes.map(t => parseFloat(t.priceIDR) || 0));

  return (
    <div className="min-h-screen pt-[72px] pb-16 px-4">
      <div className="dp-container max-w-[1200px]">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="dp-btn-ghost mb-6"
          style={{ padding: '4px 0', color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="mb-8">
          <h1 className="text-[28px] md:text-[32px] font-semibold tracking-[-0.03em] mb-2">
            Create New Event
          </h1>
          <p className="text-[15px]" style={{ color: 'var(--text-secondary)' }}>
            Set up your event with on-chain ticketing and anti-scalping protection
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6" id="create-event-form">
              {/* Basic Information */}
              <div className="dp-surface p-6">
                <div className="flex items-center gap-2 mb-5">
                  <FileText size={16} style={{ color: 'var(--accent)' }} />
                  <h2 className="text-[16px] font-semibold">Basic Information</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium mb-2">
                      Event Title <span style={{ color: 'var(--error)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="dp-input"
                      placeholder="e.g. Jakarta Music Festival 2026"
                    />
                    {errors.title && (
                      <p className="text-[12px] mt-1.5 flex items-center gap-1" style={{ color: 'var(--error)' }}>
                        <AlertCircle size={12} />
                        {errors.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium mb-2">
                      Description <span style={{ color: 'var(--error)' }}>*</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="dp-input resize-none"
                      placeholder="Describe your event, what attendees can expect..."
                    />
                    {errors.description && (
                      <p className="text-[12px] mt-1.5 flex items-center gap-1" style={{ color: 'var(--error)' }}>
                        <AlertCircle size={12} />
                        {errors.description}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-medium mb-2">
                        Venue <span style={{ color: 'var(--error)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="venue"
                        value={formData.venue}
                        onChange={handleChange}
                        className="dp-input"
                        placeholder="e.g. Jakarta International Stadium"
                      />
                      {errors.venue && (
                        <p className="text-[12px] mt-1.5 flex items-center gap-1" style={{ color: 'var(--error)' }}>
                          <AlertCircle size={12} />
                          {errors.venue}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[13px] font-medium mb-2">
                        Event Image URL
                      </label>
                      <input
                        type="url"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleChange}
                        className="dp-input"
                        placeholder="https://..."
                      />
                      <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                        Optional - displayed on event card
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div className="dp-surface p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Calendar size={16} style={{ color: 'var(--accent)' }} />
                  <h2 className="text-[16px] font-semibold">Date & Time</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <CustomDatePicker
                      label="Start Date"
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
                      <p className="text-[12px] mt-1.5 flex items-center gap-1" style={{ color: 'var(--error)' }}>
                        <AlertCircle size={12} />
                        {errors.startDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <CustomTimePicker
                      label="Start Time"
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
                      <p className="text-[12px] mt-1.5 flex items-center gap-1" style={{ color: 'var(--error)' }}>
                        <AlertCircle size={12} />
                        {errors.startTime}
                      </p>
                    )}
                  </div>

                  <div>
                    <CustomDatePicker
                      label="End Date"
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
                      <p className="text-[12px] mt-1.5 flex items-center gap-1" style={{ color: 'var(--error)' }}>
                        <AlertCircle size={12} />
                        {errors.endDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <CustomTimePicker
                      label="End Time"
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
                      <p className="text-[12px] mt-1.5 flex items-center gap-1" style={{ color: 'var(--error)' }}>
                        <AlertCircle size={12} />
                        {errors.endTime}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Ticket Types */}
              <div className="dp-surface p-6">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-start gap-2">
                    <Ticket size={16} style={{ color: 'var(--accent)' }} className="mt-0.5" />
                    <div>
                      <h2 className="text-[16px] font-semibold">Ticket Types</h2>
                      <p className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Create different ticket tiers (Regular, VIP, VVIP, etc.)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addTicketType}
                    disabled={ticketTypes.length >= 10}
                    className="dp-btn-secondary text-[13px] flex items-center gap-1.5 flex-shrink-0"
                    style={{ padding: '8px 14px' }}
                  >
                    <Plus size={14} />
                    Add Type
                  </button>
                </div>

                <div className="space-y-3">
                  {ticketTypes.map((type, index) => (
                    <div 
                      key={type.id} 
                      className="p-4 rounded-lg" 
                      style={{ 
                        backgroundColor: 'var(--surface-elevated)',
                        border: errors[`ticketType-${type.id}`] ? '1px solid var(--error)' : '1px solid var(--border)'
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <GripVertical size={14} style={{ color: 'var(--text-muted)' }} />
                          <span className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>
                            TICKET TYPE #{index + 1}
                          </span>
                        </div>
                        {ticketTypes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTicketType(type.id)}
                            className="dp-btn-ghost p-1.5 hover:bg-error/10"
                            style={{ color: 'var(--error)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[12px] font-medium mb-1.5">
                            Name <span style={{ color: 'var(--error)' }}>*</span>
                          </label>
                          <input
                            type="text"
                            value={type.name}
                            onChange={(e) => updateTicketType(type.id, 'name', e.target.value)}
                            className="dp-input text-[14px]"
                            placeholder="e.g. Regular, VIP, VVIP"
                            style={{ padding: '8px 12px' }}
                          />
                        </div>

                        <div>
                          <label className="block text-[12px] font-medium mb-1.5">
                            Price (IDR) <span style={{ color: 'var(--error)' }}>*</span>
                          </label>
                          <div className="flex items-center gap-0 rounded-lg" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
                            <span className="flex items-center justify-center px-3 text-[13px] font-medium h-full min-w-[50px]" style={{ 
                              color: 'var(--text-muted)', 
                              borderRight: '1px solid var(--border)',
                              backgroundColor: 'var(--surface-elevated)'
                            }}>
                              Rp
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={type.priceIDR}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                updateTicketType(type.id, 'priceIDR', value);
                              }}
                              className="flex-1 px-3 py-2 bg-transparent border-0 outline-none text-[14px]"
                              placeholder="50000"
                            />
                          </div>
                          {type.priceIDR && !isNaN(parseFloat(type.priceIDR)) && (
                            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                              ≈ {(parseFloat(type.priceIDR) * IDR_TO_POL).toFixed(6)} POL
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[12px] font-medium mb-1.5">
                            Max Supply <span style={{ color: 'var(--error)' }}>*</span>
                          </label>
                          <input
                            type="number"
                            value={type.maxSupply}
                            onChange={(e) => updateTicketType(type.id, 'maxSupply', e.target.value)}
                            className="dp-input text-[14px]"
                            placeholder="100"
                            style={{ padding: '8px 12px' }}
                          />
                        </div>

                        <div>
                          <label className="block text-[12px] font-medium mb-1.5">
                            Description
                          </label>
                          <input
                            type="text"
                            value={type.description}
                            onChange={(e) => updateTicketType(type.id, 'description', e.target.value)}
                            className="dp-input text-[14px]"
                            placeholder="Optional description"
                            style={{ padding: '8px 12px' }}
                          />
                        </div>
                      </div>

                      {errors[`ticketType-${type.id}`] && (
                        <p className="text-[12px] mt-3 flex items-center gap-1" style={{ color: 'var(--error)' }}>
                          <AlertCircle size={12} />
                          {errors[`ticketType-${type.id}`]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {ticketTypes.length < 10 && (
                  <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px dashed var(--border)' }}>
                    <p className="text-[12px] text-center" style={{ color: 'var(--text-muted)' }}>
                      <Info size={12} className="inline mr-1" />
                      You can add up to 10 different ticket types
                    </p>
                  </div>
                )}

                <hr className="dp-divider my-5" />

                <div>
                  <label className="block text-[13px] font-medium mb-2">
                    Max Tickets Per Wallet <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="maxTicketsPerWallet"
                    value={formData.maxTicketsPerWallet}
                    onChange={handleChange}
                    className="dp-input"
                    min="1"
                    max="100"
                  />
                  <p className="text-[11px] mt-1.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <Shield size={11} />
                    Anti-scalping: Limits total purchases per wallet across all ticket types
                  </p>
                </div>
              </div>

              {/* Anti-Scalping Rules */}
              <div className="dp-surface p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Shield size={16} style={{ color: 'var(--accent)' }} />
                  <h2 className="text-[16px] font-semibold">Anti-Scalping Protection</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium mb-2">
                      Resale Price Cap (%)
                    </label>
                    <input
                      type="number"
                      name="resalePriceCap"
                      value={formData.resalePriceCap}
                      onChange={handleChange}
                      className="dp-input"
                      min="100"
                      max="200"
                    />
                    <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                      Maximum resale markup (e.g., 110% = max 10% profit)
                    </p>
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium mb-2">
                      Resale Deadline (hours before)
                    </label>
                    <input
                      type="number"
                      name="resaleDeadlineHours"
                      value={formData.resaleDeadlineHours}
                      onChange={handleChange}
                      className="dp-input"
                      min="0"
                      max="72"
                    />
                    <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                      Resale closes X hours before event starts
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-1">
            <div className="dp-surface p-6 sticky top-[88px] space-y-5">
              <div>
                <h3 className="text-[15px] font-semibold mb-4">Event Summary</h3>
                
                {formData.title ? (
                  <div className="mb-4">
                    <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>Event Title</p>
                    <p className="text-[14px] font-medium">{formData.title}</p>
                  </div>
                ) : (
                  <div className="mb-4 p-3 rounded-lg text-center" style={{ backgroundColor: 'var(--surface-elevated)' }}>
                    <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Fill in event details</p>
                  </div>
                )}

                {formData.startDate && formData.startTime && (
                  <div className="mb-4">
                    <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>Date & Time</p>
                    <p className="text-[13px]">
                      {new Date(`${formData.startDate}T${formData.startTime}`).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                      {formData.startTime}
                    </p>
                  </div>
                )}

                {formData.venue && (
                  <div className="mb-4">
                    <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>Venue</p>
                    <p className="text-[13px]">{formData.venue}</p>
                  </div>
                )}
              </div>

              <hr className="dp-divider" />

              <div>
                <h3 className="text-[13px] font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>TICKET TYPES</h3>
                {ticketTypes.some(t => t.name && t.priceIDR && t.maxSupply) ? (
                  <div className="space-y-2">
                    {ticketTypes.filter(t => t.name && t.priceIDR).map((type, i) => (
                      <div key={type.id} className="flex justify-between text-[12px]">
                        <span className="font-medium">{type.name || `Type ${i + 1}`}</span>
                        <div className="text-right">
                          {type.priceIDR && (
                            <p className="font-medium">{formatIDR(parseFloat(type.priceIDR))}</p>
                          )}
                          {type.maxSupply && (
                            <p style={{ color: 'var(--text-muted)' }}>{type.maxSupply} tickets</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>No ticket types configured</p>
                )}

                {totalTickets > 0 && (
                  <>
                    <hr className="dp-divider my-3" />
                    <div className="flex justify-between text-[13px]">
                      <span className="font-semibold">Total Tickets</span>
                      <span className="font-semibold">{totalTickets.toLocaleString()}</span>
                    </div>
                    {lowestPrice !== highestPrice && lowestPrice !== Infinity && (
                      <div className="flex justify-between text-[12px] mt-1">
                        <span style={{ color: 'var(--text-muted)' }}>Price Range</span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {formatIDR(lowestPrice)} - {formatIDR(highestPrice)}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <hr className="dp-divider" />

              <div className="space-y-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex items-center gap-2">
                  <Shield size={11} style={{ color: 'var(--success)' }} />
                  <span>On-chain ownership verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield size={11} style={{ color: 'var(--success)' }} />
                  <span>Anti-scalping protection</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield size={11} style={{ color: 'var(--success)' }} />
                  <span>Secure QR code entry system</span>
                </div>
              </div>

              <button
                type="submit"
                form="create-event-form"
                disabled={isPending || isConfirming}
                className="dp-btn-primary w-full"
                style={{ padding: '14px 24px' }}
              >
                {isPending || isConfirming ? (
                  <span className="flex items-center justify-center gap-2">
                    <Clock size={14} className="dp-pulse" />
                    {isPending ? 'Confirm in Wallet...' : 'Creating Event...'}
                  </span>
                ) : (
                  'Create Event'
                )}
              </button>

              <button
                type="button"
                onClick={() => router.back()}
                className="dp-btn-secondary w-full"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

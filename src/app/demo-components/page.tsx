'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { CustomTimePicker } from '@/components/ui/CustomTimePicker';
import { ArrowLeft } from 'lucide-react';

export default function DemoComponentsPage() {
  const router = useRouter();

  // Select state
  const [category, setCategory] = useState('music');
  const [ticketType, setTicketType] = useState('');

  // Date state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Time state
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const categoryOptions = [
    { value: 'music', label: 'Music Festival' },
    { value: 'sports', label: 'Sports Event' },
    { value: 'conference', label: 'Conference' },
    { value: 'theater', label: 'Theater & Arts' },
    { value: 'food', label: 'Food & Drink' },
  ];

  const ticketTypeOptions = [
    { value: 'vip', label: 'VIP - Premium Access' },
    { value: 'general', label: 'General Admission' },
    { value: 'earlybird', label: 'Early Bird Special' },
    { value: 'student', label: 'Student Discount' },
  ];

  return (
    <main className="min-h-screen py-12 px-4" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="dp-container max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-6 text-[14px] hover:opacity-80 transition-opacity"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="mb-8">
          <h1 className="text-[36px] font-semibold tracking-[-0.03em] mb-2" style={{ color: 'var(--text-primary)' }}>
            Custom Form Components
          </h1>
          <p className="text-[15px]" style={{ color: 'var(--text-secondary)' }}>
            Professional custom dropdown, date picker, and time picker matching DecentraPass design system.
          </p>
        </div>

        {/* Demo Sections */}
        <div className="space-y-8">
          {/* Custom Select */}
          <section className="dp-surface p-6">
            <h2 className="text-[20px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Custom Select Dropdown
            </h2>
            <p className="text-[13px] mb-6" style={{ color: 'var(--text-muted)' }}>
              Custom styled dropdown with smooth animations and keyboard support
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CustomSelect
                label="Event Category"
                options={categoryOptions}
                value={category}
                onChange={setCategory}
                placeholder="Choose a category"
              />

              <CustomSelect
                label="Ticket Type"
                options={ticketTypeOptions}
                value={ticketType}
                onChange={setTicketType}
                placeholder="Select ticket type"
              />
            </div>

            {/* Selected Values Display */}
            {(category || ticketType) && (
              <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--accent-subtle)' }}>
                <p className="text-[12px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Selected Values
                </p>
                <div className="space-y-1">
                  {category && (
                    <p className="text-[13px]" style={{ color: 'var(--accent)' }}>
                      Category: <span className="font-semibold">{categoryOptions.find(o => o.value === category)?.label}</span>
                    </p>
                  )}
                  {ticketType && (
                    <p className="text-[13px]" style={{ color: 'var(--accent)' }}>
                      Ticket: <span className="font-semibold">{ticketTypeOptions.find(o => o.value === ticketType)?.label}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Custom Date Picker */}
          <section className="dp-surface p-6">
            <h2 className="text-[20px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Custom Date Picker
            </h2>
            <p className="text-[13px] mb-6" style={{ color: 'var(--text-muted)' }}>
              Interactive calendar with min/max date constraints and today highlight
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CustomDatePicker
                label="Event Start Date"
                value={startDate}
                onChange={setStartDate}
                placeholder="Select start date"
                minDate={new Date().toISOString().split('T')[0]}
              />

              <CustomDatePicker
                label="Event End Date"
                value={endDate}
                onChange={setEndDate}
                placeholder="Select end date"
                minDate={startDate || new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Selected Dates Display */}
            {(startDate || endDate) && (
              <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--accent-subtle)' }}>
                <p className="text-[12px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Selected Dates
                </p>
                <div className="space-y-1">
                  {startDate && (
                    <p className="text-[13px]" style={{ color: 'var(--accent)' }}>
                      Start: <span className="font-semibold">{new Date(startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </p>
                  )}
                  {endDate && (
                    <p className="text-[13px]" style={{ color: 'var(--accent)' }}>
                      End: <span className="font-semibold">{new Date(endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </p>
                  )}
                  {startDate && endDate && (
                    <p className="text-[13px] mt-2" style={{ color: 'var(--text-muted)' }}>
                      Duration: {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Custom Time Picker */}
          <section className="dp-surface p-6">
            <h2 className="text-[20px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Custom Time Picker
            </h2>
            <p className="text-[13px] mb-6" style={{ color: 'var(--text-muted)' }}>
              Time spinner with presets and minute step control
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CustomTimePicker
                label="Start Time"
                value={startTime}
                onChange={setStartTime}
                placeholder="Select start time"
                minuteStep={15}
              />

              <CustomTimePicker
                label="End Time"
                value={endTime}
                onChange={setEndTime}
                placeholder="Select end time"
                minuteStep={15}
              />
            </div>

            {/* Selected Times Display */}
            {(startTime || endTime) && (
              <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--accent-subtle)' }}>
                <p className="text-[12px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Selected Times
                </p>
                <div className="space-y-1">
                  {startTime && (
                    <p className="text-[13px]" style={{ color: 'var(--accent)' }}>
                      Start: <span className="font-semibold">{startTime}</span> (24-hour format)
                    </p>
                  )}
                  {endTime && (
                    <p className="text-[13px]" style={{ color: 'var(--accent)' }}>
                      End: <span className="font-semibold">{endTime}</span> (24-hour format)
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Complete Form Example */}
          <section className="dp-surface p-6">
            <h2 className="text-[20px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Complete Event Form
            </h2>
            <p className="text-[13px] mb-6" style={{ color: 'var(--text-muted)' }}>
              All selected values in a ready-to-submit format
            </p>

            <div className="p-4 rounded-lg font-mono text-[12px]" style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}>
              <pre>
{JSON.stringify(
  {
    category,
    ticketType,
    startDate,
    endDate,
    startTime,
    endTime,
    eventDateTime: startDate && startTime ? `${startDate}T${startTime}:00` : null,
  },
  null,
  2
)}
              </pre>
            </div>

            <button
              className="dp-btn-primary mt-4"
              onClick={() => alert('Form data ready to submit!')}
            >
              Submit Event
            </button>
          </section>

          {/* Features List */}
          <section className="dp-surface p-6">
            <h2 className="text-[20px] font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Features
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Custom Styled', desc: 'Matches DecentraPass design system' },
                { title: 'Keyboard Support', desc: 'Arrow keys, Enter, Escape' },
                { title: 'Smooth Animations', desc: '200ms ease transitions' },
                { title: 'Click Outside Close', desc: 'Automatic dropdown close' },
                { title: 'Min/Max Dates', desc: 'Date range constraints' },
                { title: 'Time Presets', desc: 'Quick select common times' },
                { title: 'Minute Steps', desc: 'Configurable minute intervals' },
                { title: 'Today/Now Buttons', desc: 'Quick current selection' },
              ].map((feature, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-muted)' }}>
                    <span className="text-[11px] font-bold" style={{ color: 'var(--accent)' }}>✓</span>
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {feature.title}
                    </h3>
                    <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

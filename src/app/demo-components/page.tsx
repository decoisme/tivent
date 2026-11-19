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
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-14" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="dp-container max-w-6xl mx-auto">
        <button onClick={() => router.back()} className="dp-btn-ghost mb-8" style={{ padding: '4px 0', color: 'var(--text-muted)' }}><ArrowLeft size={14} /> Back to previous page</button>
        <header className="mb-9 border-b pb-7" style={{ borderColor: 'var(--border)' }}>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>Tivent / Design lab</p>
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div><h1 className="text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Form components<span style={{ color: 'var(--accent)' }}>.</span></h1><p className="mt-3 max-w-2xl text-[14px] leading-6" style={{ color: 'var(--text-secondary)' }}>A working field kit for building event listings. Explore the controls, change values and inspect the resulting form data.</p></div>
            <span className="dp-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>Interactive specimen / 01—05</span>
          </div>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[210px_minmax(0,1fr)]">
          <aside className="dp-surface p-5 lg:sticky lg:top-8">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>On this page</p>
            <nav className="space-y-1 text-[12px]">
              {[['#select-demo', '01 · Select menus'], ['#date-demo', '02 · Date fields'], ['#time-demo', '03 · Time fields'], ['#form-demo', '04 · Event payload'], ['#features-demo', '05 · Principles']].map(([href, label]) => <a key={href} href={href} className="block rounded-lg px-3 py-2 transition-colors hover:bg-[var(--surface-hover)]" style={{ color: 'var(--text-secondary)' }}>{label}</a>)}
            </nav>
            <div className="mt-5 border-t pt-4" style={{ borderColor: 'var(--border)' }}><p className="text-[11px] leading-5" style={{ color: 'var(--text-muted)' }}>Changes are reflected instantly in the specimen and serialized preview.</p></div>
          </aside>

          <div className="space-y-5">
          {/* Custom Select */}
          <section id="select-demo" className="dp-surface p-5 sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4"><div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--accent)' }}>01 / Select</p>
            <h2 className="text-[20px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Custom Select Dropdown
            </h2>
            <p className="text-[13px] mb-6" style={{ color: 'var(--text-muted)' }}>
              Custom styled dropdown with smooth animations and keyboard support
            </p></div><span className="dp-mono hidden text-[11px] sm:block" style={{ color: 'var(--text-muted)' }}>A—01</span></div>

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
          <section id="date-demo" className="dp-surface p-5 sm:p-7">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--accent)' }}>02 / Date</p>
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
          <section id="time-demo" className="dp-surface p-5 sm:p-7">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--accent)' }}>03 / Time</p>
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
          <section id="form-demo" className="dp-surface p-5 sm:p-7">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--accent)' }}>04 / Payload</p>
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
          <section id="features-demo" className="dp-surface p-5 sm:p-7">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--accent)' }}>05 / Principles</p>
            <h2 className="text-[20px] font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Features
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Custom Styled', desc: 'Matches Tivent design system' },
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
      </div>
    </main>
  );
}

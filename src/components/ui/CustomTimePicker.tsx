'use client';

import { useState, useRef, useEffect } from 'react';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';

interface CustomTimePickerProps {
  value: string; // HH:MM format (24-hour)
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  minuteStep?: number; // e.g., 15 for 00, 15, 30, 45
}

export function CustomTimePicker({
  value,
  onChange,
  label,
  placeholder = 'Select time',
  disabled = false,
  minuteStep = 15,
}: CustomTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse current value
  const [hours, minutes] = value ? value.split(':').map(Number) : [12, 0];

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
  };

  const handleHourChange = (delta: number) => {
    let newHour = hours + delta;
    if (newHour < 0) newHour = 23;
    if (newHour > 23) newHour = 0;
    onChange(`${newHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
  };

  const handleMinuteChange = (delta: number) => {
    let newMinute = minutes + delta;
    let newHour = hours;

    if (newMinute < 0) {
      newMinute = 60 - minuteStep;
      newHour = hours - 1;
      if (newHour < 0) newHour = 23;
    }
    if (newMinute > 59) {
      newMinute = 0;
      newHour = hours + 1;
      if (newHour > 23) newHour = 0;
    }

    onChange(`${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`);
  };

  const handlePresetSelect = (presetValue: string) => {
    onChange(presetValue);
    setIsOpen(false);
  };

  const presets = [
    { label: '9:00 AM', value: '09:00' },
    { label: '12:00 PM', value: '12:00' },
    { label: '3:00 PM', value: '15:00' },
    { label: '6:00 PM', value: '18:00' },
    { label: '9:00 PM', value: '21:00' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all"
        style={{
          backgroundColor: 'var(--surface)',
          border: `1px solid ${isOpen ? 'var(--accent)' : 'var(--border)'}`,
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span className="text-[14px]">{value ? formatTime(value) : placeholder}</span>
        <Clock size={16} style={{ color: 'var(--text-muted)' }} />
      </button>

      {/* Time Picker Dropdown */}
      {isOpen && (
        <div
          className="absolute z-50 mt-2 p-4 rounded-lg shadow-lg"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            border: '1px solid var(--border)',
            animation: 'slideDown 200ms ease',
            minWidth: '280px',
          }}
        >
          {/* Time Spinners */}
          <div className="flex items-center justify-center gap-4 mb-4">
            {/* Hours Spinner */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => handleHourChange(1)}
                className="p-2 rounded-lg hover:bg-surface transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <ChevronUp size={18} />
              </button>
              <div
                className="w-16 h-16 flex items-center justify-center rounded-lg text-[24px] font-semibold"
                style={{
                  backgroundColor: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                  border: '1px solid var(--accent)',
                }}
              >
                {hours.toString().padStart(2, '0')}
              </div>
              <button
                type="button"
                onClick={() => handleHourChange(-1)}
                className="p-2 rounded-lg hover:bg-surface transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <ChevronDown size={18} />
              </button>
              <span className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                Hours
              </span>
            </div>

            {/* Separator */}
            <div className="text-[24px] font-semibold" style={{ color: 'var(--text-muted)' }}>
              :
            </div>

            {/* Minutes Spinner */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => handleMinuteChange(minuteStep)}
                className="p-2 rounded-lg hover:bg-surface transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <ChevronUp size={18} />
              </button>
              <div
                className="w-16 h-16 flex items-center justify-center rounded-lg text-[24px] font-semibold"
                style={{
                  backgroundColor: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                  border: '1px solid var(--accent)',
                }}
              >
                {minutes.toString().padStart(2, '0')}
              </div>
              <button
                type="button"
                onClick={() => handleMinuteChange(-minuteStep)}
                className="p-2 rounded-lg hover:bg-surface transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <ChevronDown size={18} />
              </button>
              <span className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                Minutes
              </span>
            </div>
          </div>

          {/* Current Selection Display */}
          <div
            className="text-center py-2 rounded-lg mb-4"
            style={{
              backgroundColor: 'var(--surface)',
              color: 'var(--text-primary)',
            }}
          >
            <span className="text-[14px] font-medium">{formatTime(value)}</span>
          </div>

          {/* Preset Times */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              Quick Select
            </p>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => {
                const isSelected = preset.value === value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handlePresetSelect(preset.value)}
                    className="py-2 px-3 rounded-lg text-[13px] font-medium transition-all"
                    style={{
                      backgroundColor: isSelected ? 'var(--accent-muted)' : 'var(--surface)',
                      color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                      border: isSelected ? '1px solid var(--accent)' : '1px solid transparent',
                    }}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Now Button */}
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              const h = now.getHours();
              const m = Math.floor(now.getMinutes() / minuteStep) * minuteStep;
              onChange(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
            }}
            className="w-full mt-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
            style={{
              backgroundColor: 'var(--accent-muted)',
              color: 'var(--accent)',
            }}
          >
            Now
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

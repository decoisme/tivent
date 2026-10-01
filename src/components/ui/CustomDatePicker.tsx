'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // ISO date string (YYYY-MM-DD)
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
}

export function CustomDatePicker({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  minDate,
  maxDate,
  disabled = false,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];

    // Add empty slots for days before the first day
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const handleDateSelect = (day: number) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const selectedDate = new Date(year, month, day);
    const dateStr = selectedDate.toISOString().split('T')[0];

    // Check min/max constraints
    if (minDate && dateStr < minDate) return;
    if (maxDate && dateStr > maxDate) return;

    onChange(dateStr);
    setIsOpen(false);
  };

  const handleMonthChange = (delta: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setViewDate(newDate);
  };

  const isDateDisabled = (day: number) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];

    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  };

  const isDateSelected = (day: number) => {
    if (!value) return false;
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    return dateStr === value;
  };

  const isToday = (day: number) => {
    const today = new Date();
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const days = getDaysInMonth(viewDate);
  const monthYear = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

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
        <span className="text-[14px]">{value ? formatDate(value) : placeholder}</span>
        <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div
          className="absolute z-50 mt-2 p-4 rounded-lg shadow-lg"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            border: '1px solid var(--border)',
            animation: 'slideDown 200ms ease',
            minWidth: '320px',
          }}
        >
          {/* Month/Year Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => handleMonthChange(-1)}
              className="p-2 rounded-lg hover:bg-surface transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              {monthYear}
            </span>
            <button
              type="button"
              onClick={() => handleMonthChange(1)}
              className="p-2 rounded-lg hover:bg-surface transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div
                key={day}
                className="text-center text-[11px] font-semibold py-2"
                style={{ color: 'var(--text-muted)' }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} />;
              }

              const selected = isDateSelected(day);
              const today = isToday(day);
              const disabledDate = isDateDisabled(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => !disabledDate && handleDateSelect(day)}
                  disabled={disabledDate}
                  className="aspect-square rounded-lg text-[13px] font-medium transition-all"
                  style={{
                    backgroundColor: selected
                      ? 'var(--accent)'
                      : today
                      ? 'var(--accent-subtle)'
                      : 'transparent',
                    color: selected
                      ? 'white'
                      : today
                      ? 'var(--accent)'
                      : disabledDate
                      ? 'var(--text-muted)'
                      : 'var(--text-secondary)',
                    cursor: disabledDate ? 'not-allowed' : 'pointer',
                    opacity: disabledDate ? 0.3 : 1,
                    border: today && !selected ? '1px solid var(--accent)' : '1px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!selected && !disabledDate) {
                      e.currentTarget.style.backgroundColor = 'var(--surface)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selected && !disabledDate) {
                      e.currentTarget.style.backgroundColor = today ? 'var(--accent-subtle)' : 'transparent';
                    }
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Today Button */}
          <button
            type="button"
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              onChange(today);
              setIsOpen(false);
            }}
            className="w-full mt-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
            style={{
              backgroundColor: 'var(--accent-muted)',
              color: 'var(--accent)',
            }}
          >
            Today
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

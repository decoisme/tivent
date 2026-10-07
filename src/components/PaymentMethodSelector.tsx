'use client';

import { useState } from 'react';
import { CreditCard, Wallet, Check } from 'lucide-react';

interface PaymentMethodSelectorProps {
  selectedMethod: 'crypto' | 'fiat';
  onMethodChange: (method: 'crypto' | 'fiat') => void;
  email?: string;
  onEmailChange?: (email: string) => void;
  isConnected?: boolean;
  disabled?: boolean;
}

export default function PaymentMethodSelector({
  selectedMethod,
  onMethodChange,
  email,
  onEmailChange,
  isConnected,
  disabled = false,
}: PaymentMethodSelectorProps) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-3" style={{ color: 'var(--text-muted)' }}>
        Payment Method
      </p>
      <div className="space-y-3">
        {/* Crypto Payment */}
        <button
          onClick={() => !disabled && onMethodChange('crypto')}
          disabled={disabled}
          className="w-full p-4 rounded-lg text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: selectedMethod === 'crypto' ? 'var(--accent-muted)' : 'var(--surface-elevated)',
            border: `1.5px solid ${selectedMethod === 'crypto' ? 'var(--accent)' : 'var(--border)'}`,
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                backgroundColor: selectedMethod === 'crypto' ? 'var(--accent)' : 'var(--surface)',
                border: `1.5px solid ${selectedMethod === 'crypto' ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {selectedMethod === 'crypto' && <Check size={12} style={{ color: '#fff' }} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Wallet size={16} style={{ color: selectedMethod === 'crypto' ? 'var(--accent)' : 'var(--text-muted)' }} />
                <p className="text-[14px] font-semibold">Cryptocurrency</p>
              </div>
              <p className="text-[12px] mb-2" style={{ color: 'var(--text-secondary)' }}>
                Pay with POL using MetaMask or WalletConnect
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: 'var(--success-muted)', color: 'var(--success)' }}>
                  Instant
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: 'var(--success-muted)', color: 'var(--success)' }}>
                  No fees
                </span>
              </div>
            </div>
          </div>

          {selectedMethod === 'crypto' && !isConnected && (
            <div className="mt-3 p-2 rounded text-[11px]" style={{ backgroundColor: 'var(--warning-muted)', color: 'var(--warning)' }}>
              ⚠️ Please connect your wallet to continue
            </div>
          )}
        </button>

        {/* Fiat Payment */}
        <button
          onClick={() => !disabled && onMethodChange('fiat')}
          disabled={disabled}
          className="w-full p-4 rounded-lg text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: selectedMethod === 'fiat' ? 'var(--accent-muted)' : 'var(--surface-elevated)',
            border: `1.5px solid ${selectedMethod === 'fiat' ? 'var(--accent)' : 'var(--border)'}`,
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                backgroundColor: selectedMethod === 'fiat' ? 'var(--accent)' : 'var(--surface)',
                border: `1.5px solid ${selectedMethod === 'fiat' ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {selectedMethod === 'fiat' && <Check size={12} style={{ color: '#fff' }} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard size={16} style={{ color: selectedMethod === 'fiat' ? 'var(--accent)' : 'var(--text-muted)' }} />
                <p className="text-[14px] font-semibold">Rupiah (IDR)</p>
              </div>
              <p className="text-[12px] mb-2" style={{ color: 'var(--text-secondary)' }}>
                QRIS, Bank Transfer, E-Wallet, Credit Card
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }}>
                  QRIS
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }}>
                  GoPay
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }}>
                  OVO
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }}>
                  Dana
                </span>
              </div>
            </div>
          </div>
        </button>

        {/* Email input for fiat payment */}
        {selectedMethod === 'fiat' && (
          <div className="pt-2">
            <label className="block text-[12px] font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Email Address <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              type="email"
              value={email || ''}
              onChange={(e) => onEmailChange?.(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3 rounded-lg text-[13px]"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
            <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
              Payment invoice and ticket will be sent to this email
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

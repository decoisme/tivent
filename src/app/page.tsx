'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WalletButton } from '@/components/WalletButton';
import { MobileMenu } from '@/components/MobileMenu';
import { NetworkWarning } from '@/components/NetworkWarning';
import { TestnetBadge } from '@/components/TestnetBadge';
import {
  Search,
  Ticket,
  RefreshCw,
  ArrowRight,
  Shield,
  CheckCircle2,
  QrCode,
  ArrowLeftRight,
  ChevronRight,
  Bell,
  Plus,
  Activity,
  Menu,
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen">
      {/* ─── Network Warning ─── */}
      <NetworkWarning />
      
      {/* ─── Navigation ─── */}
      <nav className="sticky top-0 left-0 right-0 z-50 border-b" style={{ backgroundColor: 'rgba(13,13,13,0.85)', backdropFilter: 'blur(12px)', borderColor: 'var(--border)' }}>
        <div className="dp-container flex items-center justify-between h-[56px]">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <img src="/tivent-logo.png" alt="Tivent" className="h-8 w-auto" />
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              <button onClick={() => router.push('/events')} className="dp-tab">Explore</button>
              <button onClick={() => router.push('/tickets')} className="dp-tab">My Tickets</button>
              <button onClick={() => router.push('/resale')} className="dp-tab">Resale</button>
              <button onClick={() => router.push('/organizer')} className="dp-tab">My Activity</button>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button className="dp-btn-ghost p-2 hidden sm:inline-flex" style={{ padding: '8px' }}>
              <Bell size={16} />
            </button>
            <WalletButton />
            <button
              onClick={() => router.push('/organizer/events/new')}
              className="dp-btn-primary hidden sm:inline-flex"
              style={{ padding: '8px 14px', fontSize: '13px' }}
            >
              <Plus size={14} />
              Create Event
            </button>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden dp-btn-ghost p-2"
              style={{ padding: '8px' }}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* ─── Hero Section ─── */}
      <section className="pt-[120px] pb-[80px] px-4">
        <div className="dp-container">
          <div className="max-w-[720px]">
            <h1
              className="text-[40px] md:text-[56px] font-semibold leading-[1.08] tracking-[-0.035em] mb-5"
              style={{ color: 'var(--text-primary)' }}
            >
              Own your ticket.{' '}
              <span style={{ color: 'var(--text-muted)' }}>Verify every transfer.</span>
            </h1>
            <p
              className="text-[17px] md:text-[19px] leading-[1.6] mb-8 max-w-[560px]"
              style={{ color: 'var(--text-secondary)' }}
            >
              Buy, resell, and verify event tickets with on-chain ownership and secure transactions.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push('/events')}
                className="dp-btn-primary"
                style={{ padding: '12px 24px', fontSize: '15px' }}
              >
                Explore Events
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => router.push('/partner')}
                className="dp-btn-secondary"
                style={{ padding: '12px 24px', fontSize: '15px' }}
              >
                Become a Partner
              </button>
            </div>
          </div>

          {/* Hero visual: compact ticket preview */}
          <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ticket card preview */}
            <div className="dp-surface p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1" style={{ color: 'var(--text-muted)' }}>
                    Digital Pass
                  </p>
                  <h3 className="text-[18px] font-semibold tracking-[-0.02em]">
                    Jakarta Music Festival 2026
                  </h3>
                </div>
                <span className="dp-badge dp-badge-active">Active</span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-5">
                <div>
                  <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>Date</p>
                  <p className="text-[13px] font-medium">Dec 15, 2026</p>
                </div>
                <div>
                  <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>Venue</p>
                  <p className="text-[13px] font-medium">JIS Arena</p>
                </div>
                <div>
                  <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>Ticket</p>
                  <p className="text-[13px] font-medium">VIP · A-12</p>
                </div>
              </div>

              <hr className="dp-divider mb-5" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-muted)' }}>
                    <QrCode size={18} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Ticket ID</p>
                    <p className="dp-mono" style={{ color: 'var(--text-secondary)' }}>#TKT-0x8f2a...c91d</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} style={{ color: 'var(--accent)' }} />
                  <span className="text-[11px] font-medium" style={{ color: 'var(--accent)' }}>Verified</span>
                </div>
              </div>
            </div>

            {/* Ownership metadata preview */}
            <div className="dp-surface p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-4" style={{ color: 'var(--text-muted)' }}>
                Ownership Record
              </p>

              <div className="space-y-4">
                {[
                  { label: 'Issued by', value: 'Jakarta Events Co.', badge: 'Organizer' },
                  { label: 'Purchased by', value: '0x8f2a...c91d', time: 'Oct 28, 2026 · 14:32' },
                  { label: 'Current owner', value: '0x8f2a...c91d', time: 'Active since purchase', current: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center mt-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: item.current ? 'var(--accent)' : 'var(--border)',
                          boxShadow: item.current ? '0 0 6px rgba(201,121,69,0.4)' : 'none',
                        }}
                      />
                      {i < 2 && <div className="w-px h-8 mt-1" style={{ backgroundColor: 'var(--border)' }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[13px] font-medium">{item.label}</p>
                        {item.badge && (
                          <span className="dp-badge dp-badge-verified">{item.badge}</span>
                        )}
                      </div>
                      <p className="dp-mono" style={{ color: 'var(--text-secondary)' }}>{item.value}</p>
                      {item.time && (
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.time}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <hr className="dp-divider my-5" />

              <div className="flex items-center gap-2">
                <Shield size={13} style={{ color: 'var(--success)' }} />
                <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  On-chain verified · Polygon Network · Tx 0xab12...ef34
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-[80px] px-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="dp-container">
          <div className="mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--accent)' }}>
              How it works
            </p>
            <h2 className="text-[28px] md:text-[32px] font-semibold tracking-[-0.03em]">
              From purchase to entry, verified at every step.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                icon: <Search size={20} />,
                step: '01',
                title: 'Browse events',
                desc: 'Discover verified events with transparent pricing and availability.',
              },
              {
                icon: <Ticket size={20} />,
                step: '02',
                title: 'Purchase tickets',
                desc: 'Pay with QRIS, bank transfer, or e-wallet. Ticket minted on-chain automatically.',
              },
              {
                icon: <QrCode size={20} />,
                step: '03',
                title: 'Get your pass',
                desc: 'Receive a dynamic QR pass that refreshes every 30 seconds for security.',
              },
              {
                icon: <CheckCircle2 size={20} />,
                step: '04',
                title: 'Verified entry',
                desc: 'Gate staff scan and verify ownership on-chain. No fakes, no duplicates.',
              },
            ].map((item, i) => (
              <div key={i} className="group">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
                >
                  {item.icon}
                </div>
                <p className="text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                  {item.step}
                </p>
                <h3 className="text-[15px] font-semibold mb-2 tracking-[-0.01em]">{item.title}</h3>
                <p className="text-[13px] leading-[1.6]" style={{ color: 'var(--text-secondary)' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Security / Verification ─── */}
      <section className="py-[80px] px-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="dp-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--accent)' }}>
                Security
              </p>
              <h2 className="text-[28px] md:text-[32px] font-semibold tracking-[-0.03em] mb-4">
                Trust built into every ticket.
              </h2>
              <p className="text-[15px] leading-[1.7] mb-8" style={{ color: 'var(--text-secondary)' }}>
                Every ticket is an on-chain asset with cryptographic proof of ownership. Smart contracts enforce fair resale pricing, and dynamic QR codes prevent screenshot fraud.
              </p>

              <div className="space-y-4">
                {[
                  { icon: <Shield size={16} />, title: 'Verified ownership', desc: 'Each ticket is linked to a unique wallet address, verifiable on the blockchain.' },
                  { icon: <ArrowLeftRight size={16} />, title: 'Fair resale', desc: 'Smart contract price caps prevent scalping. Resale rules are enforced automatically.' },
                  { icon: <RefreshCw size={16} />, title: 'Dynamic QR', desc: 'QR codes refresh every 30 seconds and cannot be screenshotted or duplicated.' },
                  { icon: <Activity size={16} />, title: 'Fraud detection', desc: 'Automated pattern analysis flags suspicious activity before it becomes a problem.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 py-3">
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-muted)' }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-[14px] font-medium mb-1">{item.title}</h4>
                      <p className="text-[13px] leading-[1.6]" style={{ color: 'var(--text-secondary)' }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Protocol rules preview */}
            <div className="dp-surface p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-5" style={{ color: 'var(--text-muted)' }}>
                Smart Contract Rules
              </p>

              <div className="space-y-3">
                <div className="dp-protocol-rule">
                  <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>Purchase limit</p>
                  <p className="text-[15px] font-semibold">4 tickets / wallet</p>
                </div>
                <div className="dp-protocol-rule">
                  <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>Resale cap</p>
                  <p className="text-[15px] font-semibold">Maximum 10% markup</p>
                </div>
                <div className="dp-protocol-rule">
                  <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>Resale deadline</p>
                  <p className="text-[15px] font-semibold">2 hours before event</p>
                </div>
              </div>

              <hr className="dp-divider my-5" />

              <p className="text-[12px] leading-[1.6]" style={{ color: 'var(--text-muted)' }}>
                These rules are enforced by an immutable smart contract deployed on-chain. They cannot be changed after deployment and apply equally to all participants.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-12 px-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="dp-container">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <p className="text-[14px] font-semibold mb-1">Tivent</p>
              <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                Verified event ticketing with on-chain ownership.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={() => router.push('/events')} className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Events</button>
              <button onClick={() => router.push('/resale')} className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Resale</button>
              <button onClick={() => router.push('/partner')} className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Partner</button>
              <button onClick={() => router.push('/gate')} className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Scanner</button>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── Testnet Badge ─── */}
      <TestnetBadge />
    </main>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WalletButton } from '@/components/WalletButton';
import { MobileMenu } from '@/components/MobileMenu';
import { NetworkWarning } from '@/components/NetworkWarning';
import { TestnetBadge } from '@/components/TestnetBadge';
import KineticGrid from '@/components/ui/kinetic-grid';
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
    <KineticGrid>
      {/* ─── Network Warning ─── */}
      <NetworkWarning />
      
      {/* ─── Navigation - Fixed positioning ─── */}
      <nav className="fixed top-0 left-0 right-0 z-[60] border-b" style={{ backgroundColor: 'rgba(13,13,13,0.95)', backdropFilter: 'blur(12px)', borderColor: 'var(--border)' }}>
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

    <main className="min-h-screen relative pt-[56px]">
      {/* pt-[56px] to offset fixed navbar height */}
      {/* Content with higher z-index */}
      <div className="relative z-10">

      {/* ─── Hero Section - Ticket Style ─── */}
      <section className="py-[60px] px-4">
        <div className="dp-container max-w-5xl">
          {/* Main Ticket Body */}
          <div className="dp-surface p-8 md:p-12 relative overflow-hidden">
            {/* Ticket Header - Like concert ticket top section */}
            <div className="mb-8">
              <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                  <img src="/tivent-logo.png" alt="Tivent" className="h-16 md:h-20 w-auto mb-4" />
                  <p className="text-[15px] md:text-[17px] leading-[1.5]" style={{ color: 'var(--text-secondary)' }}>
                    Blockchain-Verified Event Ticketing Platform
                  </p>
                </div>
                
                {/* QR Code placeholder */}
                <div className="w-24 h-24 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--surface-elevated)', border: '2px solid var(--border)' }}>
                  <QrCode size={48} style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>

              {/* Ticket details grid - compact like real ticket */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1" style={{ color: 'var(--text-muted)' }}>Event Type</p>
                  <p className="text-[14px] font-bold" style={{ color: 'var(--text-primary)' }}>All Events</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1" style={{ color: 'var(--text-muted)' }}>Network</p>
                  <p className="text-[14px] font-bold" style={{ color: 'var(--text-primary)' }}>Polygon</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1" style={{ color: 'var(--text-muted)' }}>Status</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--primary)' }} />
                    <p className="text-[14px] font-bold" style={{ color: 'var(--primary)' }}>Live</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1" style={{ color: 'var(--text-muted)' }}>Entry</p>
                  <p className="text-[14px] font-bold" style={{ color: 'var(--text-primary)' }}>Verified</p>
                </div>
              </div>
            </div>

            {/* Main value proposition */}
            <div className="mb-10">
              <h2 className="text-[24px] md:text-[32px] font-semibold leading-[1.2] tracking-[-0.02em] mb-4" style={{ color: 'var(--text-primary)' }}>
                Own your ticket.<br />
                <span style={{ color: 'var(--text-muted)' }}>Verify every transfer.</span>
              </h2>
              <p className="text-[15px] leading-[1.6] max-w-[600px]" style={{ color: 'var(--text-secondary)' }}>
                Buy, resell, and verify event tickets with on-chain ownership and secure transactions. Every ticket is a digital asset with cryptographic proof.
              </p>
            </div>

            {/* Call to actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push('/events')}
                className="dp-btn-primary flex items-center gap-2"
                style={{ padding: '12px 24px', fontSize: '14px', fontWeight: '600' }}
              >
                <Ticket size={16} />
                Explore Events
              </button>
              <button
                onClick={() => router.push('/marketplace')}
                className="dp-btn-secondary flex items-center gap-2"
                style={{ padding: '12px 24px', fontSize: '14px' }}
              >
                <ArrowLeftRight size={16} />
                Resale Market
              </button>
              <button
                onClick={() => router.push('/partner')}
                className="dp-btn-ghost"
                style={{ padding: '12px 24px', fontSize: '14px' }}
              >
                Become Partner
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Ticket serial number - bottom right like real tickets */}
            <div className="absolute bottom-4 right-6 text-right hidden md:block">
              <p className="text-[9px] font-mono uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>
                Series #0001-POLY
              </p>
            </div>
          </div>

          {/* Horizontal Perforation Line - Ticket Tear Line */}
          <div className="relative h-8 flex items-center">
            <div className="absolute left-0 right-0 flex items-center justify-center">
              <svg width="100%" height="2" className="overflow-visible">
                <line
                  x1="0"
                  y1="1"
                  x2="100%"
                  y2="1"
                  stroke="#EE7D3A"
                  strokeWidth="1.5"
                  strokeDasharray="8,8"
                  opacity="0.4"
                />
              </svg>
            </div>
            {/* Circle cutouts on left and right */}
            <div className="absolute -left-4 w-8 h-8 rounded-full" style={{ backgroundColor: 'var(--bg)' }} />
            <div className="absolute -right-4 w-8 h-8 rounded-full" style={{ backgroundColor: 'var(--bg)' }} />
          </div>

          {/* Bottom Stub - Features Grid */}
          <div className="dp-surface p-8 md:p-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-6" style={{ color: 'var(--text-muted)' }}>
              Platform Features
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Shield size={20} />,
                  title: 'On-chain Ownership',
                  desc: 'Every ticket is an NFT with cryptographic proof',
                  badge: 'Secure'
                },
                {
                  icon: <ArrowLeftRight size={20} />,
                  title: 'Fair Resale Market',
                  desc: 'Smart contract enforced price caps prevent scalping',
                  badge: 'Protected'
                },
                {
                  icon: <RefreshCw size={20} />,
                  title: 'Dynamic QR Codes',
                  desc: 'Refresh every 30s to prevent fraud and duplicates',
                  badge: 'Anti-fraud'
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--primary)' }}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider" style={{ backgroundColor: 'var(--primary-bg)', color: 'var(--primary)' }}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[12px] leading-[1.5]" style={{ color: 'var(--text-secondary)' }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats bar - like ticket admission info */}
            <div className="mt-8 pt-6 grid grid-cols-3 gap-4 text-center" style={{ borderTop: '1px solid var(--border)' }}>
              <div>
                <p className="text-[20px] md:text-[24px] font-bold mb-1" style={{ color: 'var(--primary)' }}>10K+</p>
                <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Tickets Sold</p>
              </div>
              <div>
                <p className="text-[20px] md:text-[24px] font-bold mb-1" style={{ color: 'var(--primary)' }}>99.8%</p>
                <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Fraud Prevention</p>
              </div>
              <div>
                <p className="text-[20px] md:text-[24px] font-bold mb-1" style={{ color: 'var(--primary)' }}>100%</p>
                <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Transparent</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works - Ticket Flow Style ─── */}
      <section className="py-[60px] px-4">
        <div className="dp-container max-w-5xl">
          <div className="dp-surface p-8 md:p-10">
            <div className="mb-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2" style={{ color: 'var(--primary)' }}>
                Ticket Journey
              </p>
              <h2 className="text-[24px] md:text-[32px] font-semibold tracking-[-0.02em]">
                From purchase to entry, verified at every step.
              </h2>
            </div>

            {/* Timeline style flow */}
            <div className="space-y-6">
              {[
                {
                  icon: <Search size={18} />,
                  step: '01',
                  title: 'Browse Events',
                  desc: 'Discover verified events with transparent pricing and availability.',
                },
                {
                  icon: <Ticket size={18} />,
                  step: '02',
                  title: 'Purchase Tickets',
                  desc: 'Pay with QRIS, bank transfer, or e-wallet. Ticket minted on-chain automatically.',
                },
                {
                  icon: <QrCode size={18} />,
                  step: '03',
                  title: 'Get Your Pass',
                  desc: 'Receive a dynamic QR pass that refreshes every 30 seconds for security.',
                },
                {
                  icon: <CheckCircle2 size={18} />,
                  step: '04',
                  title: 'Verified Entry',
                  desc: 'Gate staff scan and verify ownership on-chain. No fakes, no duplicates.',
                },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex items-start gap-4">
                    {/* Step indicator */}
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--primary-bg)', color: 'var(--primary)' }}>
                        {item.icon}
                      </div>
                      {i < 3 && (
                        <div className="w-px h-8 my-2" style={{ backgroundColor: 'var(--border)' }} />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-bold tracking-wider px-2 py-1 rounded" style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-muted)' }}>
                          {item.step}
                        </span>
                        <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-[13px] leading-[1.6]" style={{ color: 'var(--text-secondary)' }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom action */}
            <div className="mt-8 pt-6 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                Ready to get started?
              </p>
              <button
                onClick={() => router.push('/events')}
                className="dp-btn-primary"
                style={{ padding: '10px 20px', fontSize: '13px' }}
              >
                Browse Events
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Security Features - Ticket Terms Style ─── */}
      <section className="py-[60px] px-4">
        <div className="dp-container max-w-5xl">
          <div className="dp-surface p-8 md:p-10">
            <div className="mb-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2" style={{ color: 'var(--primary)' }}>
                Security & Protection
              </p>
              <h2 className="text-[24px] md:text-[32px] font-semibold tracking-[-0.02em] mb-3">
                Trust built into every ticket.
              </h2>
              <p className="text-[14px] leading-[1.6] max-w-[600px]" style={{ color: 'var(--text-secondary)' }}>
                Every ticket is an on-chain asset with cryptographic proof of ownership. Smart contracts enforce fair resale pricing.
              </p>
            </div>

            {/* Two column layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {[
                { 
                  icon: <Shield size={16} />, 
                  title: 'Verified Ownership', 
                  desc: 'Each ticket linked to unique wallet address, verifiable on blockchain.' 
                },
                { 
                  icon: <ArrowLeftRight size={16} />, 
                  title: 'Fair Resale', 
                  desc: 'Smart contract price caps prevent scalping. Rules enforced automatically.' 
                },
                { 
                  icon: <RefreshCw size={16} />, 
                  title: 'Dynamic QR', 
                  desc: 'QR codes refresh every 30 seconds. Cannot be screenshotted or duplicated.' 
                },
                { 
                  icon: <Activity size={16} />, 
                  title: 'Fraud Detection', 
                  desc: 'Automated pattern analysis flags suspicious activity before issues arise.' 
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--surface-elevated)' }}>
                  <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--primary-bg)', color: 'var(--primary)' }}>
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-[13px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{item.title}</h4>
                    <p className="text-[12px] leading-[1.5]" style={{ color: 'var(--text-secondary)' }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Contract rules - like ticket terms and conditions */}
            <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px dashed var(--border)' }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-4" style={{ color: 'var(--text-muted)' }}>
                Smart Contract Rules
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>Purchase Limit</p>
                  <p className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>4 tickets / wallet</p>
                </div>
                <div>
                  <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>Resale Cap</p>
                  <p className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>Max 10% markup</p>
                </div>
                <div>
                  <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>Resale Deadline</p>
                  <p className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>2hrs before event</p>
                </div>
              </div>

              <p className="text-[11px] leading-[1.6] mt-4 pt-4" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
                Rules enforced by immutable smart contract on Polygon. Cannot be changed after deployment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer - Ticket Bottom Info Style ─── */}
      <footer className="py-8 px-4" style={{ borderTop: '1px dashed var(--border)' }}>
        <div className="dp-container max-w-5xl">
          <div className="dp-surface p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <img src="/tivent-logo.png" alt="Tivent" className="h-6 w-auto" />
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider" style={{ backgroundColor: 'var(--primary-bg)', color: 'var(--primary)' }}>
                    TESTNET
                  </span>
                </div>
                <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                  Verified event ticketing with on-chain ownership.
                </p>
                <p className="text-[10px] mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
                  Polygon Amoy Network · Smart Contract 0xF296...fA3C
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <button onClick={() => router.push('/events')} className="text-[12px] font-medium hover:opacity-70 transition-opacity" style={{ color: 'var(--text-secondary)' }}>Events</button>
                <button onClick={() => router.push('/marketplace')} className="text-[12px] font-medium hover:opacity-70 transition-opacity" style={{ color: 'var(--text-secondary)' }}>Marketplace</button>
                <button onClick={() => router.push('/partner')} className="text-[12px] font-medium hover:opacity-70 transition-opacity" style={{ color: 'var(--text-secondary)' }}>Partner</button>
                <button onClick={() => router.push('/gate')} className="text-[12px] font-medium hover:opacity-70 transition-opacity" style={{ color: 'var(--text-secondary)' }}>Scanner</button>
              </div>
            </div>

            <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-3" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-[10px] text-center md:text-left" style={{ color: 'var(--text-muted)' }}>
                © 2026 Tivent. Built for transparent, fraud-free ticketing.
              </p>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={12} style={{ color: 'var(--primary)' }} />
                <span className="text-[10px] font-medium" style={{ color: 'var(--primary)' }}>
                  Blockchain Verified Platform
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── Testnet Badge ─── */}
      <TestnetBadge />
      </div> {/* Close content wrapper */}
    </main>
    </KineticGrid>
  );
}

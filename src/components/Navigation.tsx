'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WalletButton } from '@/components/WalletButton';
import { MobileMenu } from '@/components/MobileMenu';
import { Bell, Plus, Menu } from 'lucide-react';

export function Navigation() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b"
        style={{
          backgroundColor: 'rgba(13,13,13,0.85)',
          backdropFilter: 'blur(12px)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="dp-container flex items-center justify-between h-[56px]">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => router.push('/')}
              className="text-[15px] font-semibold tracking-[-0.02em] hover:opacity-80 transition-opacity"
              style={{ color: 'var(--text-primary)' }}
            >
              DecentraPass
            </button>
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              <button onClick={() => router.push('/events')} className="dp-tab">
                Explore
              </button>
              <button onClick={() => router.push('/tickets')} className="dp-tab">
                My Tickets
              </button>
              <button onClick={() => router.push('/resale')} className="dp-tab">
                Resale
              </button>
              <button onClick={() => router.push('/partner')} className="dp-tab">
                Partner with Us
              </button>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button
              className="dp-btn-ghost p-2 hidden sm:inline-flex"
              style={{ padding: '8px' }}
              aria-label="Notifications"
            >
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
    </>
  );
}

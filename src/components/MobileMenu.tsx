'use client';

import { useRouter } from 'next/navigation';
import { X, Home, Calendar, Ticket, RefreshCw, User, Plus, Shield, ScanLine } from 'lucide-react';
import { useEffect } from 'react';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const router = useRouter();

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleNavigate = (path: string) => {
    router.push(path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'fadeIn 200ms ease' }}
      />

      {/* Menu Panel */}
      <div
        className="fixed inset-y-0 right-0 w-[280px] z-50 md:hidden"
        style={{
          backgroundColor: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          animation: 'slideInRight 250ms ease',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between h-[56px] px-5"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <span className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            Menu
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-elevated transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-4">
          <div className="space-y-1">
            {/* Primary Navigation */}
            <div className="mb-6">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.06em] px-3 mb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                Navigation
              </p>
              
              <button
                onClick={() => handleNavigate('/')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-surface-elevated"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Home size={18} />
                <span className="text-[14px] font-medium">Home</span>
              </button>

              <button
                onClick={() => handleNavigate('/events')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-surface-elevated"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Calendar size={18} />
                <span className="text-[14px] font-medium">Explore Events</span>
              </button>

              <button
                onClick={() => handleNavigate('/tickets')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-surface-elevated"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Ticket size={18} />
                <span className="text-[14px] font-medium">My Tickets</span>
              </button>

              <button
                onClick={() => handleNavigate('/resale')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-surface-elevated"
                style={{ color: 'var(--text-secondary)' }}
              >
                <RefreshCw size={18} />
                <span className="text-[14px] font-medium">Resale Market</span>
              </button>

              <button
                onClick={() => handleNavigate('/partner')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-surface-elevated"
                style={{ color: 'var(--text-secondary)' }}
              >
                <User size={18} />
                <span className="text-[14px] font-medium">Partner with Us</span>
              </button>
            </div>

            {/* Organizer Actions */}
            <div className="mb-6">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.06em] px-3 mb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                Quick Actions
              </p>

              <button
                onClick={() => handleNavigate('/organizer/events/new')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
                style={{
                  backgroundColor: 'var(--accent-muted)',
                  color: 'var(--accent)',
                }}
              >
                <Plus size={18} />
                <span className="text-[14px] font-medium">Create Event</span>
              </button>
            </div>

            {/* Utility */}
            <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.06em] px-3 mb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                Tools
              </p>

              <button
                onClick={() => handleNavigate('/gate')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-surface-elevated"
                style={{ color: 'var(--text-secondary)' }}
              >
                <ScanLine size={18} />
                <span className="text-[14px] font-medium">Gate Scanner</span>
              </button>

              <button
                onClick={() => handleNavigate('/admin/fraud')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-surface-elevated"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Shield size={18} />
                <span className="text-[14px] font-medium">Admin Panel</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Footer Info */}
        <div
          className="absolute bottom-0 left-0 right-0 p-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <p className="text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>
            DecentraPass v1.0
          </p>
          <p className="text-[10px] text-center mt-1" style={{ color: 'var(--text-muted)' }}>
            Powered by Blockchain
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}

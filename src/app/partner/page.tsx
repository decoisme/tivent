'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { 
  UserPlus, 
  Building2, 
  Shield, 
  CheckCircle2, 
  ArrowRight,
  Users,
  Calendar,
  ScanLine,
  Sparkles
} from 'lucide-react';

export default function PartnerPage() {
  const router = useRouter();
  const { isConnected, address } = useWallet();
  const [selectedRole, setSelectedRole] = useState<'organizer' | 'gate-officer' | null>(null);

  const handleSelectRole = (role: 'organizer' | 'gate-officer') => {
    setSelectedRole(role);
    
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    // Navigate based on role
    if (role === 'organizer') {
      router.push('/organizer');
    } else {
      router.push('/gate');
    }
  };

  return (
    <main className="min-h-screen py-20 px-4" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="dp-container max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full" style={{ backgroundColor: 'var(--accent-subtle)' }}>
            <Sparkles size={16} style={{ color: 'var(--accent)' }} />
            <span className="text-[12px] font-medium uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
              Join Our Platform
            </span>
          </div>
          
          <h1 className="text-[48px] font-semibold tracking-[-0.03em] mb-4" style={{ color: 'var(--text-primary)' }}>
            Partner with Us
          </h1>
          
          <p className="text-[16px] max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Join DecentraPass as an event organizer or gate officer. 
            Create unforgettable experiences and help build the future of decentralized ticketing.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Event Organizer Card */}
          <div 
            className="dp-surface p-8 border-2 transition-all cursor-pointer hover:scale-[1.02]"
            style={{ 
              borderColor: selectedRole === 'organizer' ? 'var(--accent)' : 'var(--border)',
            }}
            onClick={() => setSelectedRole('organizer')}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--accent-subtle)' }}>
                <Building2 size={24} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <h3 className="text-[24px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Event Organizer
                </h3>
                <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                  Create and manage events
                </p>
              </div>
            </div>

            <p className="text-[14px] mb-6" style={{ color: 'var(--text-secondary)' }}>
              Host concerts, conferences, festivals, and more. Manage ticket sales, 
              prevent scalping, and get paid instantly on-chain.
            </p>

            {/* Features */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                  Create unlimited events
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                  Set custom ticket prices & limits
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                  Control resale rules & price caps
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                  Instant on-chain payments
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                  Real-time analytics dashboard
                </span>
              </div>
            </div>

            <button
              onClick={() => handleSelectRole('organizer')}
              className="dp-btn-primary w-full"
              disabled={!isConnected}
            >
              <span className="flex items-center justify-center gap-2">
                {isConnected ? 'Become an Organizer' : 'Connect Wallet First'}
                <ArrowRight size={16} />
              </span>
            </button>
          </div>

          {/* Gate Officer Card */}
          <div 
            className="dp-surface p-8 border-2 transition-all cursor-pointer hover:scale-[1.02]"
            style={{ 
              borderColor: selectedRole === 'gate-officer' ? 'var(--accent)' : 'var(--border)',
            }}
            onClick={() => setSelectedRole('gate-officer')}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--accent-subtle)' }}>
                <Shield size={24} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <h3 className="text-[24px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Gate Officer
                </h3>
                <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                  Verify and redeem tickets
                </p>
              </div>
            </div>

            <p className="text-[14px] mb-6" style={{ color: 'var(--text-secondary)' }}>
              Work at event venues to scan and verify tickets. Help ensure smooth entry 
              and prevent fraud with blockchain-verified credentials.
            </p>

            {/* Features */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                  Scan QR codes instantly
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                  Verify ticket authenticity
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                  Redeem tickets on-chain
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                  Prevent duplicate entries
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                  Work flexible shifts
                </span>
              </div>
            </div>

            <button
              onClick={() => handleSelectRole('gate-officer')}
              className="w-full text-[14px] py-3 rounded-lg transition-all font-medium"
              disabled={!isConnected}
              style={{
                backgroundColor: isConnected ? 'var(--surface-hover)' : 'var(--surface)',
                color: isConnected ? 'var(--text-primary)' : 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}
              onMouseEnter={(e) => {
                if (isConnected) {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <span className="flex items-center justify-center gap-2">
                {isConnected ? 'Become a Gate Officer' : 'Connect Wallet First'}
                <ArrowRight size={16} />
              </span>
            </button>
          </div>
        </div>

        {/* How It Works */}
        <div className="text-center mb-12">
          <h2 className="text-[32px] font-semibold tracking-[-0.03em] mb-8" style={{ color: 'var(--text-primary)' }}>
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-[20px] font-bold" style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                1
              </div>
              <h3 className="text-[18px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Connect Your Wallet
              </h3>
              <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
                Use MetaMask or any Web3 wallet to connect to DecentraPass
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-[20px] font-bold" style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                2
              </div>
              <h3 className="text-[18px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Choose Your Role
              </h3>
              <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
                Select whether you want to be an organizer or gate officer
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-[20px] font-bold" style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                3
              </div>
              <h3 className="text-[18px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Start Working
              </h3>
              <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
                Begin creating events or verifying tickets immediately
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="dp-surface p-8 mb-12">
          <h2 className="text-[24px] font-semibold tracking-[-0.03em] mb-6 text-center" style={{ color: 'var(--text-primary)' }}>
            Why Partner with DecentraPass?
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <Users size={32} className="mx-auto mb-3" style={{ color: 'var(--accent)' }} />
              <div className="text-[28px] font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                100%
              </div>
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                Decentralized & Transparent
              </p>
            </div>

            <div className="text-center">
              <Calendar size={32} className="mx-auto mb-3" style={{ color: 'var(--accent)' }} />
              <div className="text-[28px] font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Instant
              </div>
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                Payments On-Chain
              </p>
            </div>

            <div className="text-center">
              <Shield size={32} className="mx-auto mb-3" style={{ color: 'var(--accent)' }} />
              <div className="text-[28px] font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Secure
              </div>
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                Blockchain Verification
              </p>
            </div>

            <div className="text-center">
              <ScanLine size={32} className="mx-auto mb-3" style={{ color: 'var(--accent)' }} />
              <div className="text-[28px] font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Easy
              </div>
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                QR Code Scanning
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        {!isConnected && (
          <div className="text-center p-8 rounded-xl" style={{ backgroundColor: 'var(--accent-subtle)', border: '1px solid var(--accent)' }}>
            <h3 className="text-[20px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Ready to Get Started?
            </h3>
            <p className="text-[14px] mb-4" style={{ color: 'var(--text-secondary)' }}>
              Connect your wallet to choose your role and start partnering with DecentraPass
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => document.querySelector<HTMLButtonElement>('[aria-label="Connect Wallet"]')?.click()}
                className="dp-btn-primary"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

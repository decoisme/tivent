'use client';

import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { Shield, Users, Settings, BarChart3, Lock } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { isConnected } = useWallet();

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="dp-surface p-12 max-w-md w-full text-center">
          <Lock size={28} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h2 className="text-[20px] font-semibold mb-2">Authentication Required</h2>
          <p className="text-[14px] mb-6" style={{ color: 'var(--text-secondary)' }}>
            Connect your wallet to access the admin dashboard.
          </p>
          <button onClick={() => router.push('/')} className="dp-btn-primary">Go to Home</button>
        </div>
      </div>
    );
  }

  const adminCards = [
    {
      title: 'Gate Officers',
      description: 'Manage authorized personnel for ticket scanning',
      icon: Shield,
      path: '/admin/gate-officers',
      color: 'var(--accent)',
      available: true,
    },
    {
      title: 'Fraud Detection',
      description: 'Monitor and manage fraud detection system',
      icon: BarChart3,
      path: '/admin/fraud',
      color: '#ef4444',
      available: true,
    },
    {
      title: 'Events Management',
      description: 'Manage all events and settings',
      icon: Settings,
      path: '/admin/events',
      color: '#8b5cf6',
      available: false,
    },
    {
      title: 'Users Management',
      description: 'Manage user accounts and permissions',
      icon: Users,
      path: '/admin/users',
      color: '#10b981',
      available: false,
    },
  ];

  return (
    <div className="min-h-screen pt-[72px] pb-16 px-4">
      <div className="dp-container max-w-[1200px]">
        <div className="mb-8">
          <h1 className="text-[32px] font-semibold tracking-[-0.02em] mb-2">
            Admin Dashboard
          </h1>
          <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
            Manage system settings and authorized personnel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminCards.map((card) => (
            <button
              key={card.path}
              onClick={() => card.available && router.push(card.path)}
              disabled={!card.available}
              className="dp-surface p-6 text-left transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                border: '1px solid var(--border)',
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${card.color}20`,
                  }}
                >
                  <card.icon size={24} style={{ color: card.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[18px] font-semibold mb-1">
                    {card.title}
                    {!card.available && (
                      <span className="ml-2 text-[11px] font-normal px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--surface)', color: 'var(--text-muted)' }}>
                        Coming Soon
                      </span>
                    )}
                  </h3>
                  <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                    {card.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 dp-surface p-6">
          <h3 className="text-[16px] font-semibold mb-4">Quick Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
              <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                Contract Address
              </p>
              <p className="font-mono text-[12px] break-all">
                {process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}
              </p>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
              <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                Network
              </p>
              <p className="text-[13px] font-medium">
                Polygon Amoy Testnet
              </p>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
              <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                Chain ID
              </p>
              <p className="text-[13px] font-medium">
                80002
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

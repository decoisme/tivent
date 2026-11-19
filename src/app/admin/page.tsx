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
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="dp-container max-w-[1200px]">
        <div className="mb-10 border-b pb-8" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[11px] uppercase tracking-[0.2em] font-semibold mb-3" style={{ color: 'var(--accent)' }}>TIVENT / CONTROL ROOM</p>
          <h1 className="text-[36px] md:text-[48px] font-semibold tracking-[-0.04em] mb-3">
            Admin Dashboard
          </h1>
          <p className="text-[14px] md:text-[16px] max-w-xl" style={{ color: 'var(--text-secondary)' }}>
            Manage system settings and authorized personnel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adminCards.map((card) => (
            <button
              key={card.path}
              onClick={() => card.available && router.push(card.path)}
              disabled={!card.available}
              className="dp-surface p-6 md:p-8 text-left transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 group min-h-[176px]"
              style={{
                border: '1px solid var(--border)',
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${card.color}20`,
                  }}
                >
                  <card.icon size={24} style={{ color: card.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[20px] font-semibold mb-2 tracking-[-0.02em]">
                    {card.title}
                    {!card.available && (
                      <span className="ml-2 text-[10px] font-normal px-2 py-1 rounded-full uppercase tracking-wide" style={{ backgroundColor: 'var(--surface)', color: 'var(--text-muted)' }}>
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
        <div className="mt-10 dp-surface p-6 md:p-8">
          <div className="flex items-end justify-between mb-5 gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] mb-2" style={{ color: 'var(--accent)' }}>Environment</p>
              <h3 className="text-[20px] font-semibold">Quick Info</h3>
            </div>
            <span className="dp-badge dp-badge-active">Polygon Amoy</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
              <p className="text-[10px] uppercase tracking-[0.14em] mb-2" style={{ color: 'var(--text-muted)' }}>
                Contract Address
              </p>
              <p className="font-mono text-[12px] break-all">
                {process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}
              </p>
            </div>
            <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
              <p className="text-[10px] uppercase tracking-[0.14em] mb-2" style={{ color: 'var(--text-muted)' }}>
                Network
              </p>
              <p className="text-[13px] font-medium">
                Polygon Amoy Testnet
              </p>
            </div>
            <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
              <p className="text-[10px] uppercase tracking-[0.14em] mb-2" style={{ color: 'var(--text-muted)' }}>
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

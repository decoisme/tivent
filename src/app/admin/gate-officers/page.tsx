'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useGateOfficers } from '@/hooks/useGateOfficers';
import { Shield, Plus, Trash2, CheckCircle2, XCircle, AlertTriangle, UserCheck, ArrowLeft } from 'lucide-react';
import { isAddress } from 'viem';

export default function GateOfficersPage() {
  const router = useRouter();
  const { isConnected, address } = useWallet();
  const { 
    isOwner,
    isLoadingOwner,
    owner: contractOwner,
    checkIsGateOfficer,
    addGateOfficer, 
    removeGateOfficer,
    isPending,
    isConfirming,
    isConfirmed,
    error 
  } = useGateOfficers();

  const [newOfficerAddress, setNewOfficerAddress] = useState('');
  const [officers, setOfficers] = useState<{ address: string; isActive: boolean }[]>([]);
  const [checkingAddress, setCheckingAddress] = useState('');
  const [lastAction, setLastAction] = useState<'add' | 'remove' | null>(null);

  // Clear form after successful transaction
  useEffect(() => {
    if (isConfirmed) {
      setNewOfficerAddress('');
      setCheckingAddress('');
      // Refresh the officer being checked
      if (lastAction === 'add' && checkingAddress) {
        checkOfficerStatus(checkingAddress);
      }
      setLastAction(null);
    }
  }, [isConfirmed]);

  const handleAddOfficer = async () => {
    if (!newOfficerAddress || !isAddress(newOfficerAddress)) {
      alert('Please enter a valid Ethereum address');
      return;
    }

    try {
      setLastAction('add');
      await addGateOfficer(newOfficerAddress as `0x${string}`);
    } catch (err) {
      console.error('Failed to add gate officer:', err);
      setLastAction(null);
    }
  };

  const handleRemoveOfficer = async (officerAddress: string) => {
    if (!confirm(`Remove gate officer ${officerAddress}?`)) return;

    try {
      setLastAction('remove');
      await removeGateOfficer(officerAddress as `0x${string}`);
      // Remove from local list
      setOfficers(officers.filter(o => o.address.toLowerCase() !== officerAddress.toLowerCase()));
    } catch (err) {
      console.error('Failed to remove gate officer:', err);
      setLastAction(null);
    }
  };

  const checkOfficerStatus = async (addr: string) => {
    if (!isAddress(addr)) return;

    const isOfficer = await checkIsGateOfficer(addr as `0x${string}`);
    
    // Update or add to list
    setOfficers(prev => {
      const existing = prev.find(o => o.address.toLowerCase() === addr.toLowerCase());
      if (existing) {
        return prev.map(o => 
          o.address.toLowerCase() === addr.toLowerCase() 
            ? { ...o, isActive: isOfficer }
            : o
        );
      } else {
        return [...prev, { address: addr, isActive: isOfficer }];
      }
    });
  };

  const handleCheckStatus = async () => {
    if (!checkingAddress || !isAddress(checkingAddress)) {
      alert('Please enter a valid Ethereum address');
      return;
    }

    await checkOfficerStatus(checkingAddress);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="dp-surface p-12 max-w-md w-full text-center">
          <Shield size={28} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h2 className="text-[20px] font-semibold mb-2">Authentication Required</h2>
          <p className="text-[14px] mb-6" style={{ color: 'var(--text-secondary)' }}>
            Connect your wallet to access gate officer management.
          </p>
          <button onClick={() => router.push('/')} className="dp-btn-primary">Go to Home</button>
        </div>
      </div>
    );
  }

  if (isLoadingOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="dp-surface p-12 max-w-md w-full text-center">
          <Shield size={28} className="mx-auto mb-4 animate-pulse" style={{ color: 'var(--accent)' }} />
          <h2 className="text-[20px] font-semibold mb-2">Loading...</h2>
          <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
            Verifying contract ownership
          </p>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="dp-surface p-12 max-w-md w-full text-center">
          <AlertTriangle size={28} className="mx-auto mb-4" style={{ color: 'var(--warning)' }} />
          <h2 className="text-[20px] font-semibold mb-2">Access Denied</h2>
          <p className="text-[14px] mb-4" style={{ color: 'var(--text-secondary)' }}>
            Only the contract owner can manage gate officers.
          </p>
          <div className="text-[12px] font-mono p-3 rounded mb-4" style={{ backgroundColor: 'var(--surface)', color: 'var(--text-muted)' }}>
            <p className="mb-1">Your address:</p>
            <p className="text-[11px]">{address}</p>
            <p className="mt-2 mb-1">Contract owner:</p>
            <p className="text-[11px]">{contractOwner || 'Loading...'}</p>
          </div>
          <button onClick={() => router.push('/')} className="dp-btn-primary">Go to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-[72px] pb-16 px-4">
      <div className="dp-container max-w-[1000px]">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="dp-btn-ghost mb-3"
            style={{ padding: '4px 0', color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={14} /> Back to Admin
          </button>
          <div className="flex items-center gap-3 mb-2">
            <Shield size={28} style={{ color: 'var(--accent)' }} />
            <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Gate Officer Management</h1>
          </div>
          <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
            Manage authorized personnel who can scan and redeem tickets at event gates.
          </p>
        </div>

        {/* Success Message */}
        {isConfirmed && (
          <div className="mb-6 p-4 rounded-lg flex items-center gap-3" style={{ backgroundColor: 'var(--success-muted)', border: '1px solid var(--success)' }}>
            <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
            <div>
              <p className="text-[13px] font-semibold" style={{ color: 'var(--success)' }}>
                {lastAction === 'add' ? 'Gate officer added successfully!' : 'Gate officer removed successfully!'}
              </p>
              <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                Changes have been recorded on the blockchain.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg flex items-center gap-3" style={{ backgroundColor: 'var(--error-muted)', border: '1px solid var(--error)' }}>
            <XCircle size={18} style={{ color: 'var(--error)' }} />
            <div>
              <p className="text-[13px] font-semibold" style={{ color: 'var(--error)' }}>
                Transaction failed
              </p>
              <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                {error.message || 'An error occurred'}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add New Gate Officer */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: 'var(--text-muted)' }}>
              Add Gate Officer
            </p>
            <div className="dp-surface p-6">
              <div className="flex items-center gap-3 mb-4">
                <Plus size={20} style={{ color: 'var(--accent)' }} />
                <h3 className="text-[16px] font-semibold">Authorize New Officer</h3>
              </div>
              
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Wallet Address
                </label>
                <input
                  type="text"
                  value={newOfficerAddress}
                  onChange={(e) => setNewOfficerAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 rounded-lg font-mono text-[13px]"
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  disabled={isPending || isConfirming}
                />
                <p className="mt-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Enter the Ethereum wallet address of the person you want to authorize.
                </p>
              </div>

              <button
                onClick={handleAddOfficer}
                disabled={!newOfficerAddress || isPending || isConfirming}
                className="dp-btn-primary w-full"
              >
                {isPending || isConfirming ? (
                  <>
                    {isPending ? 'Confirm in Wallet...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    <Plus size={14} /> Add Gate Officer
                  </>
                )}
              </button>

              <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--warning-muted)' }}>
                <p className="text-[11px] flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <AlertTriangle size={12} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '1px' }} />
                  Only add trusted individuals. Gate officers can redeem tickets and allow entry to events.
                </p>
              </div>
            </div>
          </div>

          {/* Check Officer Status */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: 'var(--text-muted)' }}>
              Check Officer Status
            </p>
            <div className="dp-surface p-6">
              <div className="flex items-center gap-3 mb-4">
                <UserCheck size={20} style={{ color: 'var(--accent)' }} />
                <h3 className="text-[16px] font-semibold">Verify Authorization</h3>
              </div>
              
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Wallet Address
                </label>
                <input
                  type="text"
                  value={checkingAddress}
                  onChange={(e) => setCheckingAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 rounded-lg font-mono text-[13px]"
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <button
                onClick={handleCheckStatus}
                disabled={!checkingAddress}
                className="dp-btn-secondary w-full"
              >
                <Shield size={14} /> Check Status
              </button>

              <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Verify if a wallet address is currently authorized as a gate officer.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Officer List */}
        {officers.length > 0 && (
          <div className="mt-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: 'var(--text-muted)' }}>
              Checked Officers ({officers.length})
            </p>
            <div className="dp-surface">
              {officers.map((officer, index) => (
                <div
                  key={officer.address}
                  className="flex items-center justify-between p-4"
                  style={{
                    borderBottom: index < officers.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: officer.isActive ? 'var(--success-muted)' : 'var(--error-muted)',
                      }}
                    >
                      {officer.isActive ? (
                        <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                      ) : (
                        <XCircle size={18} style={{ color: 'var(--error)' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[13px] truncate">{officer.address}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Status: <span style={{ color: officer.isActive ? 'var(--success)' : 'var(--error)' }}>
                          {officer.isActive ? 'Authorized' : 'Not Authorized'}
                        </span>
                      </p>
                    </div>
                  </div>
                  {officer.isActive && (
                    <button
                      onClick={() => handleRemoveOfficer(officer.address)}
                      disabled={isPending || isConfirming}
                      className="dp-btn-ghost"
                      style={{ color: 'var(--error)', padding: '8px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 dp-surface p-6">
          <h3 className="text-[16px] font-semibold mb-4 flex items-center gap-2">
            <Shield size={18} style={{ color: 'var(--accent)' }} />
            How Gate Officer Authorization Works
          </h3>
          <div className="space-y-3 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            <div className="flex gap-3">
              <span className="text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }}>
                1
              </span>
              <p>Add the wallet address of the person who will be scanning tickets at your event.</p>
            </div>
            <div className="flex gap-3">
              <span className="text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }}>
                2
              </span>
              <p>The gate officer must connect their wallet to access the scanner at <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--surface)' }}>/gate</code></p>
            </div>
            <div className="flex gap-3">
              <span className="text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }}>
                3
              </span>
              <p>Only authorized addresses can successfully redeem tickets and mark them as used.</p>
            </div>
            <div className="flex gap-3">
              <span className="text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }}>
                4
              </span>
              <p>You can remove authorization at any time. Changes take effect immediately on-chain.</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/gate')}
            className="dp-btn-secondary"
          >
            <Shield size={14} /> Go to Gate Scanner
          </button>
          <button
            onClick={() => router.push('/admin')}
            className="dp-btn-secondary"
          >
            <ArrowLeft size={14} /> Back to Admin Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

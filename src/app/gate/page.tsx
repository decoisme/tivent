'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { QRScanner } from '@/components/QRScanner';
import { parseQRData, validateQRPayload } from '@/lib/qrcode';
import { readTicket, readTicketOwner } from '@/lib/contractReads';
import {
  Lock,
  CheckCircle2,
  XCircle,
  ScanLine,
  Wifi,
  User,
  Ticket,
  Shield,
  ArrowLeft,
  RotateCcw,
  UserCheck,
} from 'lucide-react';

interface VerificationResult {
  success: boolean;
  tokenId?: number;
  owner?: string;
  eventId?: number;
  message: string;
  errorType?: 'INVALID_QR' | 'EXPIRED_QR' | 'ALREADY_USED' | 'INVALID_OWNER' | 'INACTIVE';
  details?: {
    redeemed: boolean;
    active: boolean;
    resaleCount: number;
  };
}

export default function GateScannerPage() {
  const router = useRouter();
  const { isConnected, address } = useWallet();

  const [scanning, setScanning] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleScan = async (qrData: string) => {
    setScanning(false);
    setVerifying(true);
    setResult(null);

    try {
      const payload = parseQRData(qrData);
      if (!payload) {
        setResult({ success: false, message: 'Invalid QR code format', errorType: 'INVALID_QR' });
        setVerifying(false);
        return;
      }

      const isValid = await validateQRPayload(payload);
      if (!isValid) {
        setResult({ success: false, tokenId: payload.tokenId, message: 'QR code expired or invalid signature', errorType: 'EXPIRED_QR' });
        setVerifying(false);
        return;
      }

      const ticketData = await readTicket(payload.tokenId);
      if (!ticketData) {
        setResult({ success: false, tokenId: payload.tokenId, message: 'Ticket not found on blockchain', errorType: 'INVALID_QR' });
        setVerifying(false);
        return;
      }

      const owner = await readTicketOwner(payload.tokenId);
      if (!owner || owner.toLowerCase() !== payload.owner.toLowerCase()) {
        setResult({ success: false, tokenId: payload.tokenId, owner: payload.owner, message: 'Ownership verification failed', errorType: 'INVALID_OWNER' });
        setVerifying(false);
        return;
      }

      const redeemed = ticketData[5] as boolean;
      if (redeemed) {
        setResult({
          success: false, tokenId: payload.tokenId, owner: payload.owner, eventId: Number(ticketData[0]),
          message: 'Ticket already used', errorType: 'ALREADY_USED',
          details: { redeemed: true, active: ticketData[6] as boolean, resaleCount: Number(ticketData[3]) },
        });
        setVerifying(false);
        return;
      }

      const active = ticketData[6] as boolean;
      if (!active) {
        setResult({
          success: false, tokenId: payload.tokenId, owner: payload.owner, eventId: Number(ticketData[0]),
          message: 'Ticket is not active', errorType: 'INACTIVE',
          details: { redeemed: false, active: false, resaleCount: Number(ticketData[3]) },
        });
        setVerifying(false);
        return;
      }

      setResult({
        success: true, tokenId: payload.tokenId, owner: payload.owner, eventId: Number(ticketData[0]),
        message: 'Valid ticket — ready for entry',
        details: { redeemed: false, active: true, resaleCount: Number(ticketData[3]) },
      });
    } catch (error) {
      console.error('Verification error:', error);
      setResult({ success: false, message: 'Verification failed: ' + (error as Error).message });
    } finally {
      setVerifying(false);
    }
  };

  const handleScanAnother = () => {
    setScanning(true);
    setResult(null);
  };

  const handleRedeemTicket = () => {
    if (result?.tokenId) {
      router.push(`/gate/redeem/${result.tokenId}?owner=${result.owner}`);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="dp-surface p-12 max-w-md w-full text-center">
          <Lock size={28} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h2 className="text-[20px] font-semibold mb-2">Authentication Required</h2>
          <p className="text-[14px] mb-6" style={{ color: 'var(--text-secondary)' }}>
            Connect your wallet to access the gate scanner.
          </p>
          <button onClick={() => router.push('/')} className="dp-btn-primary">Go to Home</button>
        </div>
      </div>
    );
  }

  const getErrorLabel = (type?: string) => {
    switch (type) {
      case 'INVALID_QR': return 'INVALID TICKET';
      case 'EXPIRED_QR': return 'QR EXPIRED';
      case 'ALREADY_USED': return 'ALREADY USED';
      case 'INVALID_OWNER': return 'INVALID OWNER';
      case 'INACTIVE': return 'INACTIVE TICKET';
      default: return 'INVALID';
    }
  };

  return (
    <div className="min-h-screen pt-[72px] pb-16 px-4">
      <div className="dp-container max-w-[900px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => router.push('/')}
              className="dp-btn-ghost mb-2"
              style={{ padding: '4px 0', color: 'var(--text-muted)' }}
            >
              <ArrowLeft size={14} /> Exit Scanner
            </button>
            <h1 className="text-[24px] font-semibold tracking-[-0.02em]">Gate Scanner</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md" style={{ backgroundColor: 'var(--surface)' }}>
              <div className="dp-status-dot dp-status-dot-active" />
              <span className="text-[11px] font-medium">Connected</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md" style={{ backgroundColor: 'var(--surface)' }}>
              <User size={12} style={{ color: 'var(--text-muted)' }} />
              <span className="dp-mono text-[11px]">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scanner */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: 'var(--text-muted)' }}>
              Camera
            </p>
            {scanning ? (
              <div className="dp-surface overflow-hidden" style={{ borderRadius: '12px' }}>
                <QRScanner onScan={handleScan} />
              </div>
            ) : (
              <div className="dp-surface p-12 text-center">
                {verifying ? (
                  <>
                    <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center dp-pulse" style={{ backgroundColor: 'var(--accent-muted)' }}>
                      <ScanLine size={20} style={{ color: 'var(--accent)' }} />
                    </div>
                    <p className="text-[16px] font-semibold mb-1">Verifying ticket...</p>
                    <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Checking blockchain data</p>
                  </>
                ) : result ? (
                  <>
                    <div
                      className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                      style={{
                        backgroundColor: result.success ? 'var(--success-muted)' : 'var(--error-muted)',
                      }}
                    >
                      {result.success ? (
                        <CheckCircle2 size={24} style={{ color: 'var(--success)' }} />
                      ) : (
                        <XCircle size={24} style={{ color: 'var(--error)' }} />
                      )}
                    </div>
                    <p className="text-[18px] font-semibold mb-1" style={{ color: result.success ? 'var(--success)' : 'var(--error)' }}>
                      {result.success ? 'VALID TICKET' : getErrorLabel(result.errorType)}
                    </p>
                    <p className="text-[13px] mb-6" style={{ color: 'var(--text-secondary)' }}>{result.message}</p>
                    <button onClick={handleScanAnother} className="dp-btn-secondary">
                      <RotateCcw size={13} /> Scan Another
                    </button>
                  </>
                ) : null}
              </div>
            )}
          </div>

          {/* Result Details */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: 'var(--text-muted)' }}>
              Verification Result
            </p>
            {!result ? (
              <div className="dp-surface p-12 text-center">
                <ScanLine size={28} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                  Scan a QR code to see verification details.
                </p>
              </div>
            ) : (
              <div
                className="dp-surface p-6"
                style={{
                  borderColor: result.success ? 'var(--success)' : 'var(--error)',
                  borderWidth: '1px',
                }}
              >
                {/* Status banner */}
                <div
                  className="p-4 rounded-lg mb-5 flex items-center gap-3"
                  style={{
                    backgroundColor: result.success ? 'var(--success-muted)' : 'var(--error-muted)',
                  }}
                >
                  {result.success ? (
                    <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                  ) : (
                    <XCircle size={18} style={{ color: 'var(--error)' }} />
                  )}
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: result.success ? 'var(--success)' : 'var(--error)' }}>
                      {result.success ? 'VALID' : getErrorLabel(result.errorType)}
                    </p>
                    <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{result.message}</p>
                  </div>
                </div>

                {/* Details */}
                {result.tokenId && (
                  <div className="space-y-3 mb-5">
                    <div className="flex justify-between text-[13px]">
                      <span style={{ color: 'var(--text-muted)' }}>Ticket ID</span>
                      <span className="dp-mono font-medium">#{result.tokenId}</span>
                    </div>
                    {result.eventId && (
                      <div className="flex justify-between text-[13px]">
                        <span style={{ color: 'var(--text-muted)' }}>Event ID</span>
                        <span className="dp-mono font-medium">#{result.eventId}</span>
                      </div>
                    )}
                    {result.owner && (
                      <div className="flex justify-between text-[13px]">
                        <span style={{ color: 'var(--text-muted)' }}>Owner</span>
                        <span className="dp-mono">{result.owner.slice(0, 8)}...{result.owner.slice(-6)}</span>
                      </div>
                    )}
                    {result.details && (
                      <>
                        <hr className="dp-divider" />
                        <div className="flex justify-between text-[13px]">
                          <span style={{ color: 'var(--text-muted)' }}>Entry status</span>
                          <span className="font-medium" style={{ color: result.details.redeemed ? 'var(--error)' : 'var(--success)' }}>
                            {result.details.redeemed ? 'Already entered' : 'Not yet entered'}
                          </span>
                        </div>
                        <div className="flex justify-between text-[13px]">
                          <span style={{ color: 'var(--text-muted)' }}>Ticket active</span>
                          <span className="font-medium">{result.details.active ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex justify-between text-[13px]">
                          <span style={{ color: 'var(--text-muted)' }}>Resale count</span>
                          <span className="font-medium">{result.details.resaleCount}×</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Admit Guest */}
                {result.success && (
                  <button
                    onClick={handleRedeemTicket}
                    className="dp-btn-primary w-full"
                    style={{ padding: '14px 24px', fontSize: '15px' }}
                  >
                    <UserCheck size={16} /> Admit Guest
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Security checks */}
        <div className="mt-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: 'var(--text-muted)' }}>
            Security Checks Performed
          </p>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              'QR signature',
              'Timestamp (30s window)',
              'Blockchain ownership',
              'Duplicate prevention',
              'Ticket status',
            ].map((check, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-md text-[12px]" style={{ backgroundColor: 'var(--surface)' }}>
                <Shield size={11} style={{ color: 'var(--success)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>{check}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

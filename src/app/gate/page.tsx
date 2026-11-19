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
    <main className="min-h-screen px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <div className="dp-container max-w-6xl">
        <header className="mb-8 border-b pb-6" style={{ borderColor: 'var(--border)' }}>
          <div className="mb-8 flex items-center justify-between gap-4">
            <button onClick={() => router.push('/')} className="dp-btn-ghost" style={{ padding: '4px 0', color: 'var(--text-muted)' }}>
              <ArrowLeft size={14} /> Exit scanner
            </button>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px]" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                <div className="dp-status-dot dp-status-dot-active" /> <span>Gate online</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border px-3 py-1.5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                <User size={12} style={{ color: 'var(--text-muted)' }} />
                <span className="dp-mono text-[11px]">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>Tivent · Venue operations</p>
              <h1 className="text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Gate check-in<span style={{ color: 'var(--accent)' }}>.</span></h1>
              <p className="mt-3 max-w-xl text-[14px]" style={{ color: 'var(--text-secondary)' }}>Scan a guest pass to verify ownership, validity and entry status on-chain.</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>
              <span className="dp-mono">01</span><span className="h-px w-10" style={{ backgroundColor: 'var(--border)' }} /><span>Live verification</span>
            </div>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="dp-surface overflow-hidden">
            <div className="flex items-center justify-between border-b px-5 py-4 sm:px-6" style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>01 / Scan pass</p>
                <h2 className="mt-1 text-[16px] font-semibold">Camera reader</h2>
              </div>
              <Wifi size={16} style={{ color: 'var(--success)' }} />
            </div>
            {scanning ? (
              <div className="overflow-hidden"><QRScanner onScan={handleScan} /></div>
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center p-8 text-center sm:p-12">
                {verifying ? (
                  <>
                    <div className="dp-pulse mb-5 flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--accent-muted)' }}><ScanLine size={22} style={{ color: 'var(--accent)' }} /></div>
                    <p className="text-[17px] font-semibold">Verifying ticket...</p>
                    <p className="mt-2 text-[13px]" style={{ color: 'var(--text-muted)' }}>Checking blockchain data</p>
                  </>
                ) : result ? (
                  <>
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: result.success ? 'var(--success-muted)' : 'var(--error-muted)' }}>
                      {result.success ? <CheckCircle2 size={28} style={{ color: 'var(--success)' }} /> : <XCircle size={28} style={{ color: 'var(--error)' }} />}
                    </div>
                    <p className="text-[20px] font-semibold tracking-[-0.03em]" style={{ color: result.success ? 'var(--success)' : 'var(--error)' }}>{result.success ? 'VALID TICKET' : getErrorLabel(result.errorType)}</p>
                    <p className="mb-6 mt-2 max-w-sm text-[13px]" style={{ color: 'var(--text-secondary)' }}>{result.message}</p>
                    <button onClick={handleScanAnother} className="dp-btn-secondary"><RotateCcw size={13} /> Scan another</button>
                  </>
                ) : null}
              </div>
            )}
          </section>

          <section className="dp-surface min-h-[360px] p-5 sm:p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>02 / Admission</p>
                <h2 className="mt-1 text-[16px] font-semibold">Verification record</h2>
              </div>
              {result && <span className="dp-mono text-[11px]" style={{ color: result.success ? 'var(--success)' : 'var(--error)' }}>{result.success ? 'APPROVED' : 'REVIEW'}</span>}
            </div>
            {!result ? (
              <div className="flex min-h-[250px] flex-col items-center justify-center border-y text-center" style={{ borderColor: 'var(--border)' }}>
                <ScanLine size={30} className="mb-4" style={{ color: 'var(--text-muted)' }} />
                <p className="max-w-[240px] text-[13px] leading-6" style={{ color: 'var(--text-muted)' }}>Ticket details and admission status will appear here after scanning.</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start gap-3 rounded-xl p-4" style={{ backgroundColor: result.success ? 'var(--success-muted)' : 'var(--error-muted)' }}>
                  {result.success ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--success)' }} /> : <XCircle size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--error)' }} />}
                  <div><p className="text-[13px] font-semibold" style={{ color: result.success ? 'var(--success)' : 'var(--error)' }}>{result.success ? 'Valid pass' : getErrorLabel(result.errorType)}</p><p className="mt-1 text-[12px] leading-5" style={{ color: 'var(--text-secondary)' }}>{result.message}</p></div>
                </div>
                {result.tokenId && <dl className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex justify-between gap-4 py-3 text-[13px]"><dt style={{ color: 'var(--text-muted)' }}>Ticket ID</dt><dd className="dp-mono font-medium">#{result.tokenId}</dd></div>
                  {result.eventId && <div className="flex justify-between gap-4 py-3 text-[13px]"><dt style={{ color: 'var(--text-muted)' }}>Event ID</dt><dd className="dp-mono font-medium">#{result.eventId}</dd></div>}
                  {result.owner && <div className="flex justify-between gap-4 py-3 text-[13px]"><dt style={{ color: 'var(--text-muted)' }}>Holder</dt><dd className="dp-mono text-right">{result.owner.slice(0, 8)}...{result.owner.slice(-6)}</dd></div>}
                  {result.details && <>
                    <div className="flex justify-between gap-4 py-3 text-[13px]"><dt style={{ color: 'var(--text-muted)' }}>Entry status</dt><dd className="font-medium" style={{ color: result.details.redeemed ? 'var(--error)' : 'var(--success)' }}>{result.details.redeemed ? 'Already entered' : 'Not yet entered'}</dd></div>
                    <div className="flex justify-between gap-4 py-3 text-[13px]"><dt style={{ color: 'var(--text-muted)' }}>Ticket active</dt><dd className="font-medium">{result.details.active ? 'Yes' : 'No'}</dd></div>
                    <div className="flex justify-between gap-4 py-3 text-[13px]"><dt style={{ color: 'var(--text-muted)' }}>Resale count</dt><dd className="font-medium">{result.details.resaleCount}×</dd></div>
                  </>}
                </dl>}
                {result.success && <button onClick={handleRedeemTicket} className="dp-btn-primary w-full" style={{ padding: '14px 24px', fontSize: '15px' }}><UserCheck size={16} /> Admit guest</button>}
              </div>
            )}
          </section>
        </div>

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between"><p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>Trust & safety</p><span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Checks run on every scan</span></div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {['QR signature', 'Timestamp (30s window)', 'Blockchain ownership', 'Duplicate prevention', 'Ticket status'].map((check, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border px-3 py-3 text-[12px]" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}><Shield size={12} style={{ color: 'var(--success)' }} /><span style={{ color: 'var(--text-secondary)' }}>{check}</span></div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

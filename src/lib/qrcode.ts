import QRCode from 'qrcode';

/**
 * Generate a dynamic QR code payload with timestamp
 * This prevents screenshot fraud by including current timestamp
 */
export interface QRPayload {
  tokenId: number;
  owner: string;
  timestamp: number;
  signature: string;
}

/**
 * Generate signature for QR payload to prevent tampering
 * Uses SubtleCrypto for browser compatibility
 */
export async function generateQRSignature(
  tokenId: number,
  owner: string,
  timestamp: number
): Promise<string> {
  // In production, use proper cryptographic signing with private key
  // For now, use a simple hash-based approach with SubtleCrypto
  const data = `${tokenId}-${owner}-${timestamp}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  // Use SubtleCrypto API (browser-compatible)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex.slice(0, 16);
}

/**
 * Create QR payload with current timestamp
 */
export async function createQRPayload(tokenId: number, owner: string): Promise<QRPayload> {
  const timestamp = Date.now();
  const signature = await generateQRSignature(tokenId, owner, timestamp);
  
  return {
    tokenId,
    owner,
    timestamp,
    signature,
  };
}

/**
 * Validate QR payload
 * Checks signature and timestamp validity (must be within last 30 seconds)
 */
export async function validateQRPayload(payload: QRPayload): Promise<boolean> {
  // Check signature
  const expectedSignature = await generateQRSignature(
    payload.tokenId,
    payload.owner,
    payload.timestamp
  );
  
  if (payload.signature !== expectedSignature) {
    return false;
  }

  // Check timestamp (must be within last 30 seconds)
  const now = Date.now();
  const timeDiff = now - payload.timestamp;
  const maxAge = 30 * 1000; // 30 seconds
  
  if (timeDiff < 0 || timeDiff > maxAge) {
    return false;
  }

  return true;
}

/**
 * Generate QR code as data URL
 */
export async function generateQRCode(payload: QRPayload): Promise<string> {
  try {
    const dataString = JSON.stringify(payload);
    const qrDataUrl = await QRCode.toDataURL(dataString, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 400,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Parse QR code data
 */
export function parseQRData(qrData: string): QRPayload | null {
  try {
    const payload = JSON.parse(qrData) as QRPayload;
    
    // Validate structure
    if (
      typeof payload.tokenId !== 'number' ||
      typeof payload.owner !== 'string' ||
      typeof payload.timestamp !== 'number' ||
      typeof payload.signature !== 'string'
    ) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('Error parsing QR data:', error);
    return null;
  }
}

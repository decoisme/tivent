/**
 * Currency conversion and formatting utilities
 * Uses live prices from CoinGecko API
 */

// Cache for price data
let priceCache: {
  rate: number;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 60 * 1000; // 1 minute cache

/**
 * Fetch live POL/IDR rate from CoinGecko
 */
async function fetchLivePOLRate(): Promise<number> {
  try {
    // Check cache first
    if (priceCache && Date.now() - priceCache.timestamp < CACHE_DURATION) {
      return priceCache.rate;
    }

    // Fetch from CoinGecko (free API, no key needed)
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=polygon-ecosystem-token&vs_currencies=idr',
      { 
        next: { revalidate: 60 }, // Cache for 60 seconds in Next.js
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch price');
    }

    const data = await response.json();
    const rate = data['polygon-ecosystem-token']?.idr;

    if (!rate) {
      throw new Error('Invalid price data');
    }

    // Update cache
    priceCache = {
      rate,
      timestamp: Date.now(),
    };

    return rate;
  } catch (error) {
    console.error('Failed to fetch live POL rate:', error);
    // Fallback to default rate if API fails
    return 5000; // 1 POL = Rp 5,000 (fallback)
  }
}

/**
 * Convert POL to IDR using live rate
 * @param amountPOL - Amount in POL
 * @param liveRate - Optional: pre-fetched live rate to avoid multiple API calls
 */
export async function convertPOLtoIDR(
  amountPOL: number,
  liveRate?: number
): Promise<number> {
  const rate = liveRate ?? (await fetchLivePOLRate());
  return Math.round(amountPOL * rate);
}

/**
 * Convert IDR to POL using live rate
 * @param amountIDR - Amount in IDR
 * @param liveRate - Optional: pre-fetched live rate to avoid multiple API calls
 */
export async function convertIDRtoPOL(
  amountIDR: number,
  liveRate?: number
): Promise<number> {
  const rate = liveRate ?? (await fetchLivePOLRate());
  return amountIDR / rate;
}

/**
 * Get current POL/IDR exchange rate
 */
export async function getPOLRate(): Promise<number> {
  return fetchLivePOLRate();
}

/**
 * Format currency IDR
 */
export function formatIDR(amount: number | undefined | null): string {
  // Safety check for undefined, null, or NaN
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'Rp 0';
  }
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format POL amount
 */
export function formatPOL(amount: number): string {
  return `${amount.toFixed(4)} POL`;
}

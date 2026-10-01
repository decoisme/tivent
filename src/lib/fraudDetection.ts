import { supabase } from './supabase';

/**
 * Risk levels for fraud detection
 */
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Fraud detection flags
 */
export enum FraudFlag {
  RAPID_PURCHASING = 'rapid_purchasing',
  EXCESSIVE_RESALE = 'excessive_resale',
  PRICE_MANIPULATION = 'price_manipulation',
  SUSPICIOUS_PATTERN = 'suspicious_pattern',
  BOT_BEHAVIOR = 'bot_behavior',
  WASH_TRADING = 'wash_trading',
  ACCOUNT_ABUSE = 'account_abuse',
}

/**
 * Risk score calculation result
 */
export interface RiskScore {
  score: number; // 0-100
  level: RiskLevel;
  flags: FraudFlag[];
  reasons: string[];
  timestamp: Date;
}

/**
 * Calculate risk score for a wallet address
 */
export async function calculateRiskScore(
  walletAddress: string
): Promise<RiskScore> {
  const flags: FraudFlag[] = [];
  const reasons: string[] = [];
  let score = 0;

  try {
    // Check 1: Rapid purchasing pattern (multiple purchases in short time)
    const rapidPurchasing = await checkRapidPurchasing(walletAddress);
    if (rapidPurchasing.isRisky) {
      flags.push(FraudFlag.RAPID_PURCHASING);
      reasons.push(rapidPurchasing.reason);
      score += 25;
    }

    // Check 2: Excessive resale activity
    const excessiveResale = await checkExcessiveResale(walletAddress);
    if (excessiveResale.isRisky) {
      flags.push(FraudFlag.EXCESSIVE_RESALE);
      reasons.push(excessiveResale.reason);
      score += 30;
    }

    // Check 3: Price manipulation
    const priceManipulation = await checkPriceManipulation(walletAddress);
    if (priceManipulation.isRisky) {
      flags.push(FraudFlag.PRICE_MANIPULATION);
      reasons.push(priceManipulation.reason);
      score += 35;
    }

    // Check 4: Bot-like behavior
    const botBehavior = await checkBotBehavior(walletAddress);
    if (botBehavior.isRisky) {
      flags.push(FraudFlag.BOT_BEHAVIOR);
      reasons.push(botBehavior.reason);
      score += 40;
    }

    // Check 5: Wash trading (buying and selling to same addresses)
    const washTrading = await checkWashTrading(walletAddress);
    if (washTrading.isRisky) {
      flags.push(FraudFlag.WASH_TRADING);
      reasons.push(washTrading.reason);
      score += 45;
    }

    // Cap score at 100
    score = Math.min(score, 100);

    // Determine risk level
    let level: RiskLevel;
    if (score >= 75) {
      level = RiskLevel.CRITICAL;
    } else if (score >= 50) {
      level = RiskLevel.HIGH;
    } else if (score >= 25) {
      level = RiskLevel.MEDIUM;
    } else {
      level = RiskLevel.LOW;
    }

    return {
      score,
      level,
      flags,
      reasons,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error calculating risk score:', error);
    return {
      score: 0,
      level: RiskLevel.LOW,
      flags: [],
      reasons: ['Error calculating risk score'],
      timestamp: new Date(),
    };
  }
}

/**
 * Check for rapid purchasing pattern
 */
async function checkRapidPurchasing(
  walletAddress: string
): Promise<{ isRisky: boolean; reason: string }> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('blockchain_transactions')
    .select('*')
    .eq('user_address', walletAddress.toLowerCase())
    .eq('transaction_type', 'ticket_purchase')
    .gte('timestamp', oneHourAgo);

  if (error || !data) {
    return { isRisky: false, reason: '' };
  }

  // Flag if more than 10 purchases in 1 hour
  if (data.length > 10) {
    return {
      isRisky: true,
      reason: `${data.length} ticket purchases in last hour (possible bot)`,
    };
  }

  // Check if purchases are within very short intervals (< 5 seconds)
  if (data.length >= 3) {
    const timestamps = data
      .map((tx) => new Date(tx.timestamp).getTime())
      .sort((a, b) => a - b);

    let rapidCount = 0;
    for (let i = 1; i < timestamps.length; i++) {
      if (timestamps[i] - timestamps[i - 1] < 5000) {
        rapidCount++;
      }
    }

    if (rapidCount >= 2) {
      return {
        isRisky: true,
        reason: `Multiple purchases within 5 seconds (bot-like behavior)`,
      };
    }
  }

  return { isRisky: false, reason: '' };
}

/**
 * Check for excessive resale activity
 */
async function checkExcessiveResale(
  walletAddress: string
): Promise<{ isRisky: boolean; reason: string }> {
  // Get all tickets owned by this wallet
  const { data: tickets, error: ticketError } = await supabase
    .from('ticket_metadata')
    .select('token_id, original_owner, current_owner, purchase_count')
    .eq('current_owner', walletAddress.toLowerCase());

  if (ticketError || !tickets) {
    return { isRisky: false, reason: '' };
  }

  // Get resale listings by this wallet
  const { data: listings, error: listingError } = await supabase
    .from('resale_listings')
    .select('*')
    .eq('seller_address', walletAddress.toLowerCase());

  if (listingError || !listings) {
    return { isRisky: false, reason: '' };
  }

  // Calculate resale ratio
  const ownedCount = tickets.length;
  const listedCount = listings.filter((l) => l.is_active).length;
  const soldCount = listings.filter((l) => !l.is_active && l.sold_at).length;

  // Flag if more than 80% of tickets are listed for resale
  if (ownedCount > 0 && listedCount / ownedCount > 0.8) {
    return {
      isRisky: true,
      reason: `${Math.round((listedCount / ownedCount) * 100)}% of tickets listed for resale (scalping behavior)`,
    };
  }

  // Flag if user has sold more than 15 tickets (professional scalper)
  if (soldCount > 15) {
    return {
      isRisky: true,
      reason: `${soldCount} tickets resold (professional scalping)`,
    };
  }

  return { isRisky: false, reason: '' };
}

/**
 * Check for price manipulation
 */
async function checkPriceManipulation(
  walletAddress: string
): Promise<{ isRisky: boolean; reason: string }> {
  // Get resale listings with price info
  const { data: listings, error } = await supabase
    .from('resale_listings')
    .select('token_id, price, ticket_metadata(original_price)')
    .eq('seller_address', walletAddress.toLowerCase());

  if (error || !listings || listings.length === 0) {
    return { isRisky: false, reason: '' };
  }

  let extremePriceCount = 0;

  for (const listing of listings) {
    const originalPrice = BigInt(
      (listing as any).ticket_metadata?.original_price || '0'
    );
    const resalePrice = BigInt(listing.price);

    if (originalPrice === 0n) continue;

    // Calculate markup percentage
    const markup =
      Number((resalePrice - originalPrice) * 100n) / Number(originalPrice);

    // Flag if price is more than 300% of original
    if (markup > 300) {
      extremePriceCount++;
    }
  }

  // Flag if more than 50% of listings have extreme markup
  if (extremePriceCount > 0 && extremePriceCount / listings.length > 0.5) {
    return {
      isRisky: true,
      reason: `${extremePriceCount} listings with >300% markup (price gouging)`,
    };
  }

  return { isRisky: false, reason: '' };
}

/**
 * Check for bot-like behavior
 */
async function checkBotBehavior(
  walletAddress: string
): Promise<{ isRisky: boolean; reason: string }> {
  // Get transaction history
  const { data: transactions, error } = await supabase
    .from('blockchain_transactions')
    .select('*')
    .eq('user_address', walletAddress.toLowerCase())
    .order('timestamp', { ascending: true })
    .limit(50);

  if (error || !transactions || transactions.length < 5) {
    return { isRisky: false, reason: '' };
  }

  // Check for uniform time intervals (bot pattern)
  const intervals: number[] = [];
  for (let i = 1; i < transactions.length; i++) {
    const interval =
      new Date(transactions[i].timestamp).getTime() -
      new Date(transactions[i - 1].timestamp).getTime();
    intervals.push(interval);
  }

  if (intervals.length >= 4) {
    // Calculate variance in intervals
    const mean =
      intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const variance =
      intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      intervals.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / mean;

    // Low variance suggests automated behavior
    if (coefficientOfVariation < 0.1 && intervals.length >= 5) {
      return {
        isRisky: true,
        reason: `Highly uniform transaction timing (automated bot detected)`,
      };
    }
  }

  // Check if account is very new with high activity
  const accountAge =
    Date.now() - new Date(transactions[0].timestamp).getTime();
  const ageInHours = accountAge / (1000 * 60 * 60);

  if (ageInHours < 24 && transactions.length > 20) {
    return {
      isRisky: true,
      reason: `New account (<24h) with ${transactions.length} transactions (bot farm)`,
    };
  }

  return { isRisky: false, reason: '' };
}

/**
 * Check for wash trading
 */
async function checkWashTrading(
  walletAddress: string
): Promise<{ isRisky: boolean; reason: string }> {
  // Get tickets that were resold by this wallet
  const { data: soldListings, error } = await supabase
    .from('resale_listings')
    .select('token_id, buyer_address, seller_address')
    .eq('seller_address', walletAddress.toLowerCase())
    .not('buyer_address', 'is', null);

  if (error || !soldListings || soldListings.length < 2) {
    return { isRisky: false, reason: '' };
  }

  // Get tickets purchased by this wallet
  const { data: purchases, error: purchaseError } = await supabase
    .from('blockchain_transactions')
    .select('metadata')
    .eq('user_address', walletAddress.toLowerCase())
    .eq('transaction_type', 'ticket_purchase');

  if (purchaseError || !purchases) {
    return { isRisky: false, reason: '' };
  }

  // Check if wallet is trading with same addresses repeatedly
  const buyerAddresses = soldListings.map((l) => l.buyer_address.toLowerCase());
  const uniqueBuyers = new Set(buyerAddresses);
  const repeatBuyers = buyerAddresses.length - uniqueBuyers.size;

  if (repeatBuyers >= 3) {
    return {
      isRisky: true,
      reason: `Repeated trading with same ${repeatBuyers} addresses (wash trading)`,
    };
  }

  return { isRisky: false, reason: '' };
}

/**
 * Flag a wallet address for fraud
 */
export async function flagWalletForFraud(
  walletAddress: string,
  riskScore: RiskScore,
  reportedBy?: string
): Promise<void> {
  try {
    const { error } = await supabase.from('fraud_flags').insert({
      wallet_address: walletAddress.toLowerCase(),
      flag_type: riskScore.flags[0] || FraudFlag.SUSPICIOUS_PATTERN,
      risk_score: riskScore.score,
      risk_level: riskScore.level,
      reason: riskScore.reasons.join('; '),
      flagged_by: reportedBy || 'system',
      is_resolved: false,
      flagged_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error flagging wallet:', error);
    }
  } catch (error) {
    console.error('Error flagging wallet for fraud:', error);
  }
}

/**
 * Get fraud flags for a wallet
 */
export async function getWalletFraudFlags(walletAddress: string) {
  const { data, error } = await supabase
    .from('fraud_flags')
    .select('*')
    .eq('wallet_address', walletAddress.toLowerCase())
    .order('flagged_at', { ascending: false });

  if (error) {
    console.error('Error getting fraud flags:', error);
    return [];
  }

  return data || [];
}

/**
 * Check if a wallet is flagged for fraud
 */
export async function isWalletFlagged(walletAddress: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('fraud_flags')
    .select('id')
    .eq('wallet_address', walletAddress.toLowerCase())
    .eq('is_resolved', false)
    .limit(1);

  if (error) {
    console.error('Error checking wallet flag:', error);
    return false;
  }

  return (data?.length || 0) > 0;
}

/**
 * Analyze transaction for suspicious activity
 */
export async function analyzeTransaction(
  walletAddress: string,
  transactionType: string,
  metadata?: any
): Promise<{ isSuspicious: boolean; reason?: string; riskScore?: RiskScore }> {
  // Calculate risk score
  const riskScore = await calculateRiskScore(walletAddress);

  // Automatically flag high-risk and critical accounts
  if (riskScore.level === RiskLevel.HIGH || riskScore.level === RiskLevel.CRITICAL) {
    await flagWalletForFraud(walletAddress, riskScore);

    return {
      isSuspicious: true,
      reason: `High risk detected: ${riskScore.reasons.join(', ')}`,
      riskScore,
    };
  }

  // Medium risk - flag but allow transaction
  if (riskScore.level === RiskLevel.MEDIUM) {
    return {
      isSuspicious: true,
      reason: `Medium risk: ${riskScore.reasons.join(', ')}`,
      riskScore,
    };
  }

  return {
    isSuspicious: false,
    riskScore,
  };
}

/**
 * Get fraud statistics
 */
export async function getFraudStatistics() {
  try {
    const { data: flags, error } = await supabase
      .from('fraud_flags')
      .select('risk_level, flag_type, is_resolved');

    if (error || !flags) {
      return {
        totalFlags: 0,
        activeFlags: 0,
        resolvedFlags: 0,
        byRiskLevel: {},
        byFlagType: {},
      };
    }

    const activeFlags = flags.filter((f) => !f.is_resolved).length;
    const resolvedFlags = flags.filter((f) => f.is_resolved).length;

    const byRiskLevel = flags.reduce((acc: any, flag) => {
      acc[flag.risk_level] = (acc[flag.risk_level] || 0) + 1;
      return acc;
    }, {});

    const byFlagType = flags.reduce((acc: any, flag) => {
      acc[flag.flag_type] = (acc[flag.flag_type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalFlags: flags.length,
      activeFlags,
      resolvedFlags,
      byRiskLevel,
      byFlagType,
    };
  } catch (error) {
    console.error('Error getting fraud statistics:', error);
    return {
      totalFlags: 0,
      activeFlags: 0,
      resolvedFlags: 0,
      byRiskLevel: {},
      byFlagType: {},
    };
  }
}

# Fraud Detection & Risk Scoring System

## Overview

Tivent includes a comprehensive fraud detection system that monitors user behavior, identifies suspicious patterns, and automatically flags high-risk activities. The system helps protect the platform from scalpers, bots, price manipulation, and other fraudulent activities.

## Features

### 1. **Multi-Layer Risk Analysis**

The system analyzes multiple behavioral patterns:

- **Rapid Purchasing**: Detects bot-like bulk buying
- **Excessive Resale**: Identifies professional scalpers
- **Price Manipulation**: Flags extreme price gouging (>300% markup)
- **Bot Behavior**: Detects automated/scripted activities
- **Wash Trading**: Identifies circular trading patterns
- **Account Abuse**: Flags suspicious new accounts

### 2. **Risk Scoring (0-100)**

Each wallet address is assigned a risk score based on detected patterns:

- **0-24**: Low Risk ✓ (Normal behavior)
- **25-49**: Medium Risk ⚠ (Monitored)
- **50-74**: High Risk ⚠ (Flagged, transactions allowed)
- **75-100**: Critical Risk 🚨 (Flagged, high-risk transactions blocked)

### 3. **Automated Flagging**

- Wallets with High or Critical risk levels are automatically flagged
- System generates detailed reports with detected patterns
- Admins can review, resolve, or escalate flags
- Timestamp tracking for audit trails

### 4. **Real-Time Transaction Analysis**

Before each purchase, the system:
1. Analyzes the buyer's wallet history
2. Calculates current risk score
3. Checks existing fraud flags
4. Blocks critical-risk transactions
5. Warns users about medium/high-risk accounts

## Risk Detection Logic

### Rapid Purchasing Detection

```typescript
// Flags if:
- More than 10 purchases in 1 hour
- Multiple purchases within 5 seconds (bot pattern)
```

**Score Impact**: +25 points

### Excessive Resale Detection

```typescript
// Flags if:
- >80% of owned tickets listed for resale
- More than 15 tickets resold (professional scalper)
```

**Score Impact**: +30 points

### Price Manipulation Detection

```typescript
// Flags if:
- >50% of listings have >300% markup from original price
```

**Score Impact**: +35 points

### Bot Behavior Detection

```typescript
// Flags if:
- Transaction intervals highly uniform (low variance)
- New account (<24h) with >20 transactions
```

**Score Impact**: +40 points

### Wash Trading Detection

```typescript
// Flags if:
- Repeated trading with same 3+ addresses
```

**Score Impact**: +45 points

## Usage

### For Users

**Check Your Risk Score**:
```typescript
import { useFraudRisk } from '@/hooks/useFraudDetection';

function MyComponent() {
  const { riskScore, isFlagged } = useFraudRisk(walletAddress);
  
  return (
    <div>
      <p>Risk Level: {riskScore?.level}</p>
      <p>Score: {riskScore?.score}/100</p>
    </div>
  );
}
```

**Analyze Transaction Before Purchase**:
```typescript
import { useTransactionAnalysis } from '@/hooks/useFraudDetection';

function PurchasePage() {
  const { analyzeBeforeTransaction } = useTransactionAnalysis();
  
  const handlePurchase = async () => {
    const analysis = await analyzeBeforeTransaction(
      walletAddress,
      'ticket_purchase',
      { eventId, quantity, price }
    );
    
    if (analysis.riskScore.level === 'critical') {
      alert('Transaction blocked: High fraud risk');
      return;
    }
    
    // Proceed with purchase...
  };
}
```

### For Admins

**Access Admin Panel**:
- Navigate to `/admin/fraud`
- View all fraud flags and statistics
- Filter by status (active/resolved) and risk level
- Search specific wallet addresses

**Review Flagged Wallets**:
- Click "View Details" on any flag
- See complete risk assessment
- Review activity summary
- View flag history
- Mark flags as resolved/unresolved

**API Functions**:

```typescript
// Calculate risk score
const riskScore = await calculateRiskScore(walletAddress);

// Get fraud flags
const flags = await getWalletFraudFlags(walletAddress);

// Check if flagged
const isFlagged = await isWalletFlagged(walletAddress);

// Manual flag
await flagWalletForFraud(walletAddress, riskScore, 'admin@tivent.com');

// Get statistics
const stats = await getFraudStatistics();
```

## Database Schema

### fraud_flags Table

```sql
CREATE TABLE fraud_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address VARCHAR(42) NOT NULL,
  flag_type VARCHAR(50) NOT NULL,
  risk_score INTEGER NOT NULL,
  risk_level VARCHAR(20) NOT NULL,
  reason TEXT NOT NULL,
  flagged_by VARCHAR(255) DEFAULT 'system',
  is_resolved BOOLEAN DEFAULT FALSE,
  flagged_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolved_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Integration Points

### 1. Ticket Purchase Flow
- Pre-purchase risk analysis
- Display warnings for medium/high risk
- Block critical risk transactions

### 2. Resale Listing
- Analyze seller history before allowing listing
- Flag excessive resale behavior
- Monitor price markup patterns

### 3. Event Listener
- Record all transactions in database
- Enable historical pattern analysis
- Track wallet activity over time

## Performance Considerations

- Risk scores are calculated on-demand (not cached)
- Database queries are optimized with indexes
- Pattern detection uses recent activity (last hour/day)
- Admin dashboard pagination for large datasets

## Future Enhancements

### Planned Features:
1. **Machine Learning**: Train models on historical fraud data
2. **IP Address Tracking**: Detect Sybil attacks
3. **Device Fingerprinting**: Identify bot farms
4. **Network Analysis**: Graph analysis of trading networks
5. **Reputation System**: Long-term trust scores
6. **Appeal Process**: Allow users to contest flags
7. **Automated Refunds**: For fraud victims
8. **Predictive Alerts**: Warn before risky behavior occurs

### Configuration Options:
```typescript
// Future: Configurable thresholds
const config = {
  rapidPurchaseThreshold: 10,
  rapidPurchaseWindow: 3600, // 1 hour
  resaleRatioThreshold: 0.8,
  priceMarkupThreshold: 3.0,
  // ...
};
```

## Security Best Practices

1. **Admin Access Control**: Restrict fraud management to authorized admins
2. **Audit Trails**: Log all flag resolutions and modifications
3. **Rate Limiting**: Prevent abuse of risk calculation APIs
4. **Privacy**: Hash or encrypt sensitive wallet data
5. **Appeal Process**: Allow users to dispute false positives

## Testing

### Manual Testing:

1. **Rapid Purchase Test**:
   - Buy 11+ tickets within 1 hour
   - Should trigger rapid_purchasing flag

2. **Excessive Resale Test**:
   - List >80% of owned tickets for resale
   - Should trigger excessive_resale flag

3. **Price Manipulation Test**:
   - List tickets at >300% original price
   - Should trigger price_manipulation flag

### Unit Tests (Future):

```typescript
describe('Fraud Detection', () => {
  it('should detect rapid purchasing', async () => {
    const score = await calculateRiskScore(testWallet);
    expect(score.flags).toContain(FraudFlag.RAPID_PURCHASING);
  });
  
  it('should block critical risk transactions', async () => {
    const analysis = await analyzeTransaction(criticalRiskWallet, 'purchase');
    expect(analysis.isSuspicious).toBe(true);
  });
});
```

## Support

For questions or issues with fraud detection:
- Review admin panel: `/admin/fraud`
- Check wallet details: `/admin/fraud/[address]`
- Contact system administrator

## License

This fraud detection system is part of the Tivent platform and is proprietary software.

---

**Last Updated**: 2024
**Version**: 1.0.0

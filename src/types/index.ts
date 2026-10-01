// Core types for the Tivent platform

export interface Event {
  id: string;
  blockchainEventId: number;
  organizerWallet: string;
  title: string;
  description: string;
  venue: string;
  startAt: Date;
  endAt: Date;
  imageUrl?: string;
  metadataUri: string;
  ticketPrice: bigint;
  maxTickets: number;
  ticketsSold: number;
  maxTicketsPerWallet: number;
  resalePriceCap: bigint;
  resaleDeadline: number;
  primarySaleActive: boolean;
  resaleActive: boolean;
  cancelled: boolean;
  createdAt: Date;
}

export interface TicketMetadata {
  id: string;
  tokenId: number;
  eventId: string;
  ticketType: string;
  seat?: string;
  metadataUri: string;
}

export interface TicketData {
  eventId: number;
  ticketTypeId: number;
  originalPrice: bigint;
  redeemed: boolean;
  active: boolean;
}

export interface ResaleListing {
  ticketId: number;
  seller: string;
  price: bigint;
  active: boolean;
}

export enum TicketStatus {
  AVAILABLE = 'AVAILABLE',
  SOLD = 'SOLD',
  LISTED_FOR_RESALE = 'LISTED_FOR_RESALE',
  RESOLD = 'RESOLD',
  ACTIVE = 'ACTIVE',
  REDEEMED = 'REDEEMED',
  CANCELLED = 'CANCELLED',
  EVENT_CANCELLED = 'EVENT_CANCELLED',
  REFUNDABLE = 'REFUNDABLE',
  REFUNDED = 'REFUNDED',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface FraudFlag {
  id: string;
  walletAddress: string;
  riskScore: number;
  riskLevel: RiskLevel;
  reason: string;
  status: 'ACTIVE' | 'RESOLVED' | 'DISMISSED';
  createdAt: Date;
}

export interface GateDevice {
  id: string;
  deviceName: string;
  eventId: string;
  authorizedWallet: string;
  active: boolean;
  createdAt: Date;
}

export interface ScanLog {
  id: string;
  ticketId: number;
  gateDeviceId: string;
  result: 'VALID' | 'INVALID';
  reason?: string;
  timestamp: Date;
}

export interface QRVerificationPayload {
  ticketId: number;
  wallet: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
  signature: string;
}

export interface BlockchainTransaction {
  id: string;
  txHash: string;
  type: 'MINT' | 'TRANSFER' | 'LIST' | 'DELIST' | 'PURCHASE' | 'REDEEM' | 'REFUND';
  tokenId?: number;
  fromAddress: string;
  toAddress: string;
  blockNumber: number;
  createdAt: Date;
}

export interface UserProfile {
  id: string;
  walletAddress: string;
  displayName?: string;
  role: 'BUYER' | 'ORGANIZER' | 'GATE_OFFICER' | 'ADMIN';
  createdAt: Date;
}

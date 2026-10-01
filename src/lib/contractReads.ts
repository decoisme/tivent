import { createPublicClient, http, type Address } from 'viem';
import { polygonAmoy } from 'viem/chains';

// Contract ABI for read operations
const EVENT_TICKETING_ABI = [
  {
    name: 'eventCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'events',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'eventId', type: 'uint256' }],
    outputs: [
      { name: 'eventId', type: 'uint256' },
      { name: 'organizer', type: 'address' },
      { name: 'metadataURI', type: 'string' },
      { name: 'ticketPrice', type: 'uint256' },
      { name: 'maxTickets', type: 'uint256' },
      { name: 'ticketsSold', type: 'uint256' },
      { name: 'maxTicketsPerWallet', type: 'uint256' },
      { name: 'resalePriceCap', type: 'uint256' },
      { name: 'resaleDeadline', type: 'uint256' },
      { name: 'primarySaleActive', type: 'bool' },
      { name: 'resaleActive', type: 'bool' },
      { name: 'cancelled', type: 'bool' },
    ],
  },
  {
    name: 'tickets',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      { name: 'eventId', type: 'uint256' },
      { name: 'ticketTypeId', type: 'uint256' },
      { name: 'originalPrice', type: 'uint256' },
      { name: 'resaleCount', type: 'uint8' },
      { name: 'maxResaleCount', type: 'uint8' },
      { name: 'redeemed', type: 'bool' },
      { name: 'active', type: 'bool' },
    ],
  },
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'address' }],
  },
  {
    name: 'listings',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      { name: 'ticketId', type: 'uint256' },
      { name: 'seller', type: 'address' },
      { name: 'price', type: 'uint256' },
      { name: 'active', type: 'bool' },
    ],
  },
  {
    name: 'isTicketValid',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'bool' }],
  },
] as const;

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000') as Address;

// Use Polygon Amoy testnet (Mumbai is deprecated)
const chain = polygonAmoy;

// Create public client for reading contract data
const publicClient = createPublicClient({
  chain,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://poly-amoy-testnet.api.pocket.network'),
});

/**
 * Read the total number of events
 */
export async function readEventCount(): Promise<bigint> {
  try {
    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: EVENT_TICKETING_ABI,
      functionName: 'eventCount',
    });
    return result;
  } catch (error) {
    console.error('Error reading event count:', error);
    return 0n;
  }
}

/**
 * Read event data by event ID
 */
export async function readEvent(eventId: number) {
  try {
    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: EVENT_TICKETING_ABI,
      functionName: 'events',
      args: [BigInt(eventId)],
    });
    return result;
  } catch (error) {
    console.error(`Error reading event ${eventId}:`, error);
    return null;
  }
}

/**
 * Read ticket data by token ID
 */
export async function readTicket(tokenId: number) {
  try {
    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: EVENT_TICKETING_ABI,
      functionName: 'tickets',
      args: [BigInt(tokenId)],
    });
    return result;
  } catch (error) {
    console.error(`Error reading ticket ${tokenId}:`, error);
    return null;
  }
}

/**
 * Read ticket owner by token ID
 */
export async function readTicketOwner(tokenId: number): Promise<Address | null> {
  try {
    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: EVENT_TICKETING_ABI,
      functionName: 'ownerOf',
      args: [BigInt(tokenId)],
    });
    return result;
  } catch (error) {
    console.error(`Error reading ticket owner ${tokenId}:`, error);
    return null;
  }
}

/**
 * Read listing data by token ID
 */
export async function readListing(tokenId: number) {
  try {
    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: EVENT_TICKETING_ABI,
      functionName: 'listings',
      args: [BigInt(tokenId)],
    });
    return result;
  } catch (error) {
    console.error(`Error reading listing ${tokenId}:`, error);
    return null;
  }
}

/**
 * Check if ticket is valid
 */
export async function readIsTicketValid(tokenId: number): Promise<boolean> {
  try {
    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: EVENT_TICKETING_ABI,
      functionName: 'isTicketValid',
      args: [BigInt(tokenId)],
    });
    return result;
  } catch (error) {
    console.error(`Error checking ticket validity ${tokenId}:`, error);
    return false;
  }
}

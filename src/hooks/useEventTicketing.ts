import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, type Address } from 'viem';
import { useState } from 'react';

// Contract ABI - will be imported from generated types after deployment
// For now, we'll define the key functions
const EVENT_TICKETING_ABI = [
  // Read functions
  {
    name: 'eventCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'ticketCount',
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
  // Write functions
  {
    name: 'createEvent',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'metadataURI', type: 'string' },
      { name: 'ticketPrice', type: 'uint256' },
      { name: 'maxTickets', type: 'uint256' },
      { name: 'maxTicketsPerWallet', type: 'uint256' },
      { name: 'resalePriceCap', type: 'uint256' },
      { name: 'resaleDeadline', type: 'uint256' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'buyTicket',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'eventId', type: 'uint256' },
      { name: 'ticketTypeId', type: 'uint256' },
      { name: 'ticketMetadataURI', type: 'string' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'listForResale',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'price', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'cancelResale',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'buyResale',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'redeemTicket',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'holder', type: 'address' },
    ],
    outputs: [],
  },
  {
    name: 'cancelEvent',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'eventId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'claimRefund',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [],
  },
] as const;

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '') as Address;

/**
 * Hook for interacting with EventTicketing contract
 */
export function useEventTicketing() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  // Read functions
  const useEventCount = () => {
    return useReadContract({
      address: CONTRACT_ADDRESS,
      abi: EVENT_TICKETING_ABI,
      functionName: 'eventCount',
    });
  };

  const useTicketCount = () => {
    return useReadContract({
      address: CONTRACT_ADDRESS,
      abi: EVENT_TICKETING_ABI,
      functionName: 'ticketCount',
    });
  };

  const useEvent = (eventId: bigint | number | undefined) => {
    return useReadContract({
      address: CONTRACT_ADDRESS,
      abi: EVENT_TICKETING_ABI,
      functionName: 'events',
      args: eventId !== undefined ? [BigInt(eventId)] : undefined,
      query: {
        enabled: eventId !== undefined,
      },
    });
  };

  const useTicket = (tokenId: bigint | number | undefined) => {
    return useReadContract({
      address: CONTRACT_ADDRESS,
      abi: EVENT_TICKETING_ABI,
      functionName: 'tickets',
      args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
      query: {
        enabled: tokenId !== undefined,
      },
    });
  };

  const useTicketOwner = (tokenId: bigint | number | undefined) => {
    return useReadContract({
      address: CONTRACT_ADDRESS,
      abi: EVENT_TICKETING_ABI,
      functionName: 'ownerOf',
      args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
      query: {
        enabled: tokenId !== undefined,
      },
    });
  };

  const useListing = (tokenId: bigint | number | undefined) => {
    return useReadContract({
      address: CONTRACT_ADDRESS,
      abi: EVENT_TICKETING_ABI,
      functionName: 'listings',
      args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
      query: {
        enabled: tokenId !== undefined,
      },
    });
  };

  const useIsTicketValid = (tokenId: bigint | number | undefined) => {
    return useReadContract({
      address: CONTRACT_ADDRESS,
      abi: EVENT_TICKETING_ABI,
      functionName: 'isTicketValid',
      args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
      query: {
        enabled: tokenId !== undefined,
      },
    });
  };

  // Write functions
  const createEvent = async (
    metadataURI: string,
    ticketPriceEth: string,
    maxTickets: number,
    maxTicketsPerWallet: number,
    resalePriceCapBps: number,
    resaleDeadline: number
  ) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: EVENT_TICKETING_ABI,
      functionName: 'createEvent',
      args: [
        metadataURI,
        parseEther(ticketPriceEth),
        BigInt(maxTickets),
        BigInt(maxTicketsPerWallet),
        BigInt(resalePriceCapBps),
        BigInt(resaleDeadline),
      ],
      gas: BigInt(800000), // Higher gas limit for event creation
      maxFeePerGas: BigInt(250000000000), // 250 Gwei max fee
      maxPriorityFeePerGas: BigInt(250000000000), // 250 Gwei priority fee
    });
  };

  const buyTicket = async (
    eventId: number,
    ticketTypeId: number,
    ticketMetadataURI: string,
    priceEth: string
  ) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: EVENT_TICKETING_ABI,
      functionName: 'buyTicket',
      args: [BigInt(eventId), BigInt(ticketTypeId), ticketMetadataURI],
      value: parseEther(priceEth),
      gas: BigInt(500000), // Set explicit gas limit
      maxFeePerGas: BigInt(250000000000), // 250 Gwei max fee
      maxPriorityFeePerGas: BigInt(250000000000), // 250 Gwei priority fee
    });
  };

  const listForResale = async (tokenId: number, priceEth: string) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: EVENT_TICKETING_ABI,
      functionName: 'listForResale',
      args: [BigInt(tokenId), parseEther(priceEth)],
      gas: BigInt(300000), // Gas limit for listing
      maxFeePerGas: BigInt(250000000000), // 250 Gwei
      maxPriorityFeePerGas: BigInt(250000000000), // 250 Gwei
    });
  };

  const cancelResale = async (tokenId: number) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: EVENT_TICKETING_ABI,
      functionName: 'cancelResale',
      args: [BigInt(tokenId)],
      gas: BigInt(200000), // Gas limit for cancelling
      maxFeePerGas: BigInt(250000000000), // 250 Gwei
      maxPriorityFeePerGas: BigInt(250000000000), // 250 Gwei
    });
  };

  const buyResale = async (tokenId: number, priceEth: string) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: EVENT_TICKETING_ABI,
      functionName: 'buyResale',
      args: [BigInt(tokenId)],
      value: parseEther(priceEth),
      gas: BigInt(400000),
      maxFeePerGas: BigInt(250000000000),
      maxPriorityFeePerGas: BigInt(250000000000),
    });
  };

  const redeemTicket = async (tokenId: number, holder: Address) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: EVENT_TICKETING_ABI,
      functionName: 'redeemTicket',
      args: [BigInt(tokenId), holder],
      gas: BigInt(200000),
      maxFeePerGas: BigInt(250000000000),
      maxPriorityFeePerGas: BigInt(250000000000),
    });
  };

  const cancelEvent = async (eventId: number) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: EVENT_TICKETING_ABI,
      functionName: 'cancelEvent',
      args: [BigInt(eventId)],
      gas: BigInt(300000),
      maxFeePerGas: BigInt(250000000000),
      maxPriorityFeePerGas: BigInt(250000000000),
    });
  };

  const claimRefund = async (tokenId: number) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: EVENT_TICKETING_ABI,
      functionName: 'claimRefund',
      args: [BigInt(tokenId)],
      gas: BigInt(250000),
      maxFeePerGas: BigInt(250000000000),
      maxPriorityFeePerGas: BigInt(250000000000),
    });
  };

  return {
    // Read hooks
    useEventCount,
    useTicketCount,
    useEvent,
    useTicket,
    useTicketOwner,
    useListing,
    useIsTicketValid,

    // Simplified read functions (async)
    readEventCount: async () => {
      // This is a workaround for server-side or imperative reads
      // In production, use proper contract reads with viem
      return undefined;
    },
    readEvent: async (eventId: number) => {
      // This is a workaround for server-side or imperative reads
      // In production, use proper contract reads with viem
      return undefined;
    },

    // Write functions
    createEvent,
    buyTicket,
    listForResale,
    cancelResale,
    buyResale,
    redeemTicket,
    cancelEvent,
    claimRefund,

    // Transaction state
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error,

    // Contract info
    contractAddress: CONTRACT_ADDRESS,
  };
}

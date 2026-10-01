import { ethers } from "hardhat";

/**
 * Helper functions for contract interaction and testing
 */

export async function getSigners() {
  return await ethers.getSigners();
}

export async function deployEventTicketing() {
  const EventTicketing = await ethers.getContractFactory("EventTicketing");
  const contract = await EventTicketing.deploy();
  await contract.waitForDeployment();
  return contract;
}

export function parseEther(value: string) {
  return ethers.parseEther(value);
}

export function formatEther(value: bigint) {
  return ethers.formatEther(value);
}

export async function getCurrentTimestamp() {
  const block = await ethers.provider.getBlock("latest");
  return block?.timestamp || 0;
}

export async function increaseTime(seconds: number) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
}

export async function mineBlocks(blocks: number) {
  for (let i = 0; i < blocks; i++) {
    await ethers.provider.send("evm_mine", []);
  }
}

// Helper to create event metadata URI
export function createEventMetadataURI(eventData: {
  title: string;
  description: string;
  venue: string;
  date: string;
  imageUrl?: string;
}): string {
  // In production, this would upload to IPFS
  // For now, return a mock URI
  const metadata = JSON.stringify(eventData);
  return `ipfs://mock-hash-${Buffer.from(metadata).toString('base64').slice(0, 20)}`;
}

// Helper to create ticket metadata URI
export function createTicketMetadataURI(ticketData: {
  eventId: number;
  ticketType: string;
  seat?: string;
}): string {
  const metadata = JSON.stringify(ticketData);
  return `ipfs://ticket-${Buffer.from(metadata).toString('base64').slice(0, 20)}`;
}

// Calculate basis points (for resale cap)
export function toBasisPoints(percentage: number): number {
  return Math.floor(percentage * 100);
}

// Convert basis points back to percentage
export function fromBasisPoints(basisPoints: number): number {
  return basisPoints / 100;
}

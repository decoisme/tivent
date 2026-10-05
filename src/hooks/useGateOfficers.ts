import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { type Address } from 'viem';
import { useWallet } from './useWallet';
import { CONTRACT_ADDRESS, ABI } from '@/lib/contractReads';

/**
 * Hook for managing gate officers
 * Only contract owner can add/remove gate officers
 */
export function useGateOfficers() {
  const { address } = useWallet();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  // Check if current user is contract owner
  const { data: owner, isLoading: isLoadingOwner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'owner',
  });

  const isOwner = !isLoadingOwner && owner && address ? 
    (owner as string).toLowerCase() === address.toLowerCase() : false;

  // Check if an address is a gate officer
  const checkIsGateOfficer = async (officerAddress: Address): Promise<boolean> => {
    try {
      // Use viem to read contract directly
      const { createPublicClient, http } = await import('viem');
      const { polygonAmoy } = await import('viem/chains');
      
      const publicClient = createPublicClient({
        chain: polygonAmoy,
        transport: http(process.env.NEXT_PUBLIC_RPC_URL),
      });

      const result = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'gateOfficers',
        args: [officerAddress],
      });

      return result as boolean;
    } catch (error) {
      console.error('Error checking gate officer:', error);
      return false;
    }
  };

  // Add gate officer
  const addGateOfficer = async (officerAddress: Address) => {
    if (!isOwner) {
      throw new Error('Only contract owner can add gate officers');
    }

    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'addGateOfficer',
      args: [officerAddress],
      gas: BigInt(150000),
      maxFeePerGas: BigInt(250000000000), // 250 Gwei
      maxPriorityFeePerGas: BigInt(250000000000),
    });
  };

  // Remove gate officer
  const removeGateOfficer = async (officerAddress: Address) => {
    if (!isOwner) {
      throw new Error('Only contract owner can remove gate officers');
    }

    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'removeGateOfficer',
      args: [officerAddress],
      gas: BigInt(100000),
      maxFeePerGas: BigInt(250000000000), // 250 Gwei
      maxPriorityFeePerGas: BigInt(250000000000),
    });
  };

  return {
    isOwner,
    isLoadingOwner,
    owner: owner as string | undefined,
    checkIsGateOfficer,
    addGateOfficer,
    removeGateOfficer,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error,
  };
}

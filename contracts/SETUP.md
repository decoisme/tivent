# Hardhat Development Environment Setup

This document outlines the complete Hardhat setup for Tivent smart contracts.

## Installed Packages

### Core Dependencies
- `hardhat@3.18.0` - Ethereum development environment
- `@nomicfoundation/hardhat-toolbox@7.0.0` - Essential Hardhat plugins bundle
- `@nomicfoundation/hardhat-ethers@4.2.0` - Ethers.js plugin for Hardhat
- `ethers@6.17.0` - Ethereum library for interacting with blockchain

### Production Dependencies
- `@openzeppelin/contracts@5.6.1` - Secure, audited smart contract library

### Development Dependencies
- `typescript@5.7.3` - TypeScript compiler
- `@types/node@26.6.3` - Node.js type definitions
- `ts-node@10.9.2` - TypeScript execution environment

## Project Structure

```
contracts/
├── contracts/              # Solidity smart contracts
├── test/                  # Contract tests (Mocha + Chai)
├── scripts/               # Deployment and interaction scripts
│   ├── deploy.ts         # Main deployment script
│   ├── helpers.ts        # Helper functions
│   └── interact.ts       # Contract interaction examples
├── cache/                # Hardhat cache (gitignored)
├── artifacts/            # Compiled contracts (gitignored)
├── typechain-types/      # Generated TypeScript types (gitignored)
├── hardhat.config.ts     # Hardhat configuration
├── tsconfig.json         # TypeScript configuration
├── package.json          # Dependencies and scripts
├── .env.example          # Environment variables template
└── README.md             # Documentation
```

## Configuration

### hardhat.config.ts

- **Solidity Version**: 0.8.20 with optimizer enabled (200 runs)
- **Networks Configured**:
  - `hardhat` - Local development network (chainId: 1337)
  - `localhost` - Hardhat node (http://127.0.0.1:8545)
  - `sepolia` - Ethereum Sepolia testnet (chainId: 11155111)
- **Paths**: Custom paths for contracts, tests, cache, and artifacts
- **Gas Reporter**: Optional gas usage reporting
- **Etherscan**: Contract verification support

### Environment Variables

Required variables (see `.env.example`):
- `SEPOLIA_RPC_URL` - Alchemy/Infura RPC endpoint
- `PRIVATE_KEY` - Deployment account private key
- `ETHERSCAN_API_KEY` - For contract verification
- `REPORT_GAS` - Enable/disable gas reporting

## Available Scripts

```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Generate coverage report
npm run test:coverage

# Start local blockchain node
npm run node

# Deploy to local network
npm run deploy:local

# Deploy to Sepolia testnet
npm run deploy:sepolia
```

## Features

### Testing Framework
- **Mocha** - Test framework
- **Chai** - Assertion library
- **Hardhat Network** - Built-in Ethereum network for testing
- **TypeScript** - Type-safe test development

### Hardhat Toolbox Includes
- `@nomicfoundation/hardhat-network-helpers` - Network manipulation
- `@nomicfoundation/hardhat-chai-matchers` - Custom Chai matchers
- `hardhat-gas-reporter` - Gas usage reporting
- `solidity-coverage` - Code coverage
- `@typechain/hardhat` - TypeScript bindings generator
- `@nomicfoundation/hardhat-verify` - Etherscan verification

### Helper Functions

Located in `scripts/helpers.ts`:
- `deployEventTicketing()` - Deploy contract instance
- `parseEther()` / `formatEther()` - ETH conversion
- `getCurrentTimestamp()` - Get block timestamp
- `increaseTime()` - Time manipulation for testing
- `mineBlocks()` - Mine multiple blocks
- `createEventMetadataURI()` - Generate event metadata
- `toBasisPoints()` / `fromBasisPoints()` - Percentage conversion

## Development Workflow

### 1. Write Contract
Create Solidity files in `contracts/` directory

### 2. Compile
```bash
npm run compile
```
Generates:
- Artifacts in `artifacts/`
- TypeScript types in `typechain-types/`

### 3. Write Tests
Create test files in `test/` directory using TypeScript

### 4. Run Tests
```bash
npm run test
```

### 5. Check Coverage
```bash
npm run test:coverage
```

### 6. Deploy Locally
Terminal 1:
```bash
npm run node
```

Terminal 2:
```bash
npm run deploy:local
```

### 7. Deploy to Testnet
```bash
npm run deploy:sepolia
```

### 8. Verify Contract
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## Security Best Practices

✅ Uses OpenZeppelin audited contracts  
✅ ReentrancyGuard on payment functions  
✅ Access control with Ownable  
✅ Input validation  
✅ Checks-effects-interactions pattern  
✅ SafeMath (built into Solidity 0.8+)  
✅ Gas optimization with compiler settings  

## Network Information

### Sepolia Testnet
- **Chain ID**: 11155111
- **RPC**: https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
- **Faucet**: https://sepoliafaucet.com/
- **Explorer**: https://sepolia.etherscan.io/

### Local Development
- **Chain ID**: 1337
- **RPC**: http://127.0.0.1:8545
- **Accounts**: 20 pre-funded accounts with 10,000 ETH each

## Troubleshooting

### Compilation Errors
- Check Solidity version compatibility
- Ensure all imports are correct
- Clear cache: `npx hardhat clean`

### Test Failures
- Check network state between tests
- Use `beforeEach` to reset state
- Verify account balances

### Deployment Issues
- Ensure sufficient testnet ETH
- Check RPC URL is correct
- Verify private key has no leading '0x'
- Confirm network configuration in hardhat.config.ts

## Next Steps

1. Implement `EventTicketing.sol` smart contract
2. Add comprehensive test suite
3. Deploy to testnet
4. Integrate with frontend
5. Audit before mainnet deployment

## Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Solidity Documentation](https://docs.soliditylang.org/)

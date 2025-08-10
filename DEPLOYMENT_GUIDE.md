# Deployment Guide for Monad Brick Breaker

## Smart Contract Deployment with Remix

### Step 1: Prepare the Contract
1. Copy the contract code from `contracts/BrickBreakerLeaderboardV2.sol` (improved version)
2. Open [Remix IDE](https://remix.ethereum.org/)
3. Create a new file named `BrickBreakerLeaderboardV2.sol`
4. Paste the contract code

**Note:** The V2 contract has improved leaderboard logic:
- Each player appears only once with their highest score
- Leaderboard is limited to top 100 players
- More gas-efficient updates

### Step 2: Compile the Contract
1. Go to the "Solidity Compiler" tab
2. Select compiler version `0.8.19`
3. Enable optimization (200 runs)
4. Click "Compile BrickBreakerLeaderboardV2.sol"

### Step 3: Deploy to Monad
1. Go to the "Deploy & Run Transactions" tab
2. Set Environment to "Injected Provider - MetaMask"
3. Make sure MetaMask is connected to Monad network
4. Select `BrickBreakerLeaderboardV2` contract
5. Click "Deploy"
6. Confirm the transaction in MetaMask

### Step 4: Configure the Frontend
After deployment, you need to update the frontend with the contract address:

1. Copy the deployed contract address
2. Update `public/contractInfo.json` with your contract address:

```json
{
  "address": "YOUR_DEPLOYED_CONTRACT_ADDRESS",
  "network": "monad_testnet",
  "deployedAt": "2024-01-XX"
}
```

### Step 5: Update Network Configuration (if needed)
If the Monad network details are different, update `src/blockchain.js`:

```javascript
const MONAD_NETWORKS = {
    testnet: {
        chainId: '0xa1f6', // Update with actual chain ID
        chainName: 'Monad Testnet',
        nativeCurrency: {
            name: 'MON',
            symbol: 'MON',
            decimals: 18
        },
        rpcUrls: ['https://actual-testnet-rpc.monad.xyz'], // Update with actual RPC
        blockExplorerUrls: ['https://actual-testnet-explorer.monad.xyz'] // Update with actual explorer
    }
};
```

## Running the Game

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

## Testing the Smart Contract

You can test the contract functions directly in Remix:

### 1. Register a Player
- Function: `registerPlayer`
- Parameters: `_playerName` (string) - e.g., "Alice"

### 2. Submit a Score
- Function: `submitScore`
- Parameters: 
  - `_score` (uint256) - e.g., 1500
  - `_playerName` (string) - e.g., "Alice"

### 3. Get Top Players
- Function: `getTopPlayers`
- Parameters: `_count` (uint256) - e.g., 10

### 4. Get Player Stats
- Function: `getPlayerStats`
- Parameters: `_player` (address) - your wallet address

## Monad Network Setup for Users

Users will need to add the Monad network to MetaMask. The game will automatically prompt them to add it, but you can also provide manual instructions:

### Manual Network Addition
1. Open MetaMask
2. Click "Add Network"
3. Enter the following details:
   - Network Name: Monad Testnet
   - RPC URL: [Actual Monad Testnet RPC]
   - Chain ID: [Actual Chain ID]
   - Currency Symbol: MON
   - Block Explorer: [Actual Explorer URL]

## Game Features

### Core Gameplay
- Classic brick breaker mechanics
- Progressive difficulty (more bricks per level)
- Score system based on bricks destroyed and level completion
- Lives system (3 lives per game)

### Blockchain Features
- Wallet connection with MetaMask
- Score submission to blockchain
- Global leaderboard (top 100 players)
- Personal statistics and ranking
- Score history tracking

### Leaderboard System
- **Top 100**: Shows the highest score from each player (no duplicates)
  - Each player appears only once with their best score
  - Automatically loads without wallet connection
  - Real-time updates from blockchain
- **My Rank**: Shows personal statistics including:
  - Current rank among all players
  - Personal high score
  - Total games played
  - Complete score history

### Key Features
- **Public Leaderboard**: Anyone can view the leaderboard without connecting a wallet
- **Unique Players**: Each player appears only once with their highest score
- **Real-time Data**: Fetched directly from the blockchain via RPC
- **Gas Optimized**: Only updates leaderboard on new high scores

## Security Considerations

1. **Score Validation**: The smart contract accepts any score value. In a production environment, you might want to implement additional validation or use commit-reveal schemes.

2. **Gas Optimization**: The leaderboard is limited to 1000 entries to manage gas costs.

3. **Player Names**: Limited to 32 characters to prevent abuse.

## Troubleshooting

### Common Issues

1. **"Contract not initialized"**: Make sure the contract is deployed and `contractInfo.json` is created with the correct address.

2. **"Failed to connect wallet"**: Ensure MetaMask is installed and the Monad network is added.

3. **"Transaction failed"**: Check that you have enough MON tokens for gas fees.

4. **Leaderboard not loading**: Verify the contract address and network configuration.

### Debug Mode
Open browser console (F12) to see detailed error messages and transaction logs.

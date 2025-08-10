# Monad Brick Breaker Game

A blockchain-based Brick Breaker game built on the Monad blockchain with a robust leaderboard system.

## Features

- Classic Brick Breaker gameplay
- Blockchain integration with Monad
- Global leaderboard showing top 100 players
- Personal ranking system for individual players
- Highest score tracking across all games
- Secure score submission to blockchain

## Project Structure

```
brick breaker/
├── contracts/          # Smart contracts
├── src/               # Frontend game code
├── scripts/           # Deployment scripts
├── test/              # Contract tests
└── artifacts/         # Compiled contracts
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env
   ```

3. Fill in your private key and RPC URLs in `.env`

4. Compile contracts:
   ```bash
   npm run compile
   ```

5. Run tests:
   ```bash
   npm run test
   ```

6. Start development server:
   ```bash
   npm run dev
   ```

## Deployment

Deploy to Monad testnet:
```bash
npx hardhat run scripts/deploy.js --network monad_testnet
```

Deploy to Monad mainnet:
```bash
npx hardhat run scripts/deploy.js --network monad_mainnet
```

## Game Rules

- Break all bricks to complete a level
- Don't let the ball fall below the paddle
- Score increases based on bricks broken and level completion
- Final scores are submitted to the blockchain leaderboard

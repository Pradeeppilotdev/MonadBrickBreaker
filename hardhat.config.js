require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    monad_testnet: {
      url: "https://testnet-rpc.monad.xyz", // Replace with actual Monad testnet RPC
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 41454 // Replace with actual Monad testnet chain ID
    },
    monad_mainnet: {
      url: "https://rpc.monad.xyz", // Replace with actual Monad mainnet RPC
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 34443 // Replace with actual Monad mainnet chain ID
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

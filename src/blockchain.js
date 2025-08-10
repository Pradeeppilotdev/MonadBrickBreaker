import { ethers } from 'ethers';

// Contract ABI - This will be generated after contract compilation
const LEADERBOARD_ABI = [
    "function registerPlayer(string memory _playerName) external",
    "function submitScore(uint256 _score, string memory _playerName) external",
    "function getTopPlayers(uint256 _count) external view returns (tuple(address playerAddress, string playerName, uint256 score, uint256 timestamp)[])",
    "function getPlayerRank(address _player) external view returns (uint256)",
    "function getPlayerStats(address _player) external view returns (tuple(address playerAddress, string playerName, uint256 highestScore, uint256 totalGames, uint256 lastGameTimestamp))",
    "function getPlayerScoreHistory(address _player) external view returns (uint256[])",
    "function getLeaderboardLength() external view returns (uint256)",
    "event ScoreSubmitted(address indexed player, string playerName, uint256 score, uint256 timestamp)",
    "event NewHighScore(address indexed player, string playerName, uint256 newHighScore)",
    "event PlayerRegistered(address indexed player, string playerName)"
];

// Monad network configuration
const MONAD_NETWORKS = {
    testnet: {
        chainId: '0x279F', // 10143 in hex
        chainName: 'Monad Testnet',
        nativeCurrency: {
            name: 'MON',
            symbol: 'MON',
            decimals: 18
        },
        rpcUrls: ['https://testnet-rpc.monad.xyz'],
        blockExplorerUrls: ['https://testnet-explorer.monad.xyz']
    },
    mainnet: {
        chainId: '0x86bb', // 34443 in hex (placeholder)
        chainName: 'Monad Mainnet',
        nativeCurrency: {
            name: 'MON',
            symbol: 'MON',
            decimals: 18
        },
        rpcUrls: ['https://rpc.monad.xyz'], // Placeholder
        blockExplorerUrls: ['https://explorer.monad.xyz'] // Placeholder
    }
};

export class BlockchainService {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.userAddress = null;
        this.isConnected = false;
        this.contractAddress = null;
        this.network = 'testnet'; // Default to testnet
        this.LEADERBOARD_ABI = LEADERBOARD_ABI; // Expose ABI for external use

        this.loadContractInfo();
    }
    
    async loadContractInfo() {
        try {
            // Try multiple possible paths for contractInfo.json
            const possiblePaths = [
                '/contractInfo.json',           // Public folder (served at root)
                './contractInfo.json',          // Same directory
                '../contractInfo.json',         // Parent directory
                '/public/contractInfo.json'     // Public folder explicitly
            ];

            for (const path of possiblePaths) {
                try {
                    console.log(`Trying to load contract info from: ${path}`);
                    const response = await fetch(path);
                    if (response.ok) {
                        const contractInfo = await response.json();
                        this.contractAddress = contractInfo.address;
                        console.log('Contract address loaded:', this.contractAddress);
                        return true;
                    }
                } catch (err) {
                    console.log(`Failed to load from ${path}:`, err.message);
                    continue;
                }
            }
            
            throw new Error('Contract info not found in any expected location');
        } catch (error) {
            console.warn('Contract info not found. Using fallback address.', error);
            // Use the known contract address as fallback
            this.contractAddress = "0xc4105981E05680501471c1D7f8F214115D5A2F4e";
            return true;
        }
    }
    
    async connectWallet() {
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask is not installed');
            }

            // Make sure contract info is loaded first
            if (!this.contractAddress) {
                await this.loadContractInfo();
            }

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                throw new Error('No accounts found');
            }

            // Create provider and signer
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();
            this.userAddress = accounts[0];

            // Check if we're on the correct network
            await this.switchToMonadNetwork();

            // Initialize contract if address is available
            if (this.contractAddress) {
                this.contract = new ethers.Contract(
                    this.contractAddress,
                    LEADERBOARD_ABI,
                    this.signer
                );
                console.log('Contract initialized with address:', this.contractAddress);
            } else {
                console.warn('Contract address not found. Please check contractInfo.json');
            }

            this.isConnected = true;
            
            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnect();
                } else {
                    this.userAddress = accounts[0];
                    this.connectWallet(); // Reconnect with new account
                }
            });
            
            // Listen for network changes
            window.ethereum.on('chainChanged', () => {
                window.location.reload(); // Reload page on network change
            });
            
            return {
                address: this.userAddress,
                isConnected: true
            };
            
        } catch (error) {
            console.error('Error connecting wallet:', error);
            throw error;
        }
    }
    
    async switchToMonadNetwork() {
        try {
            const networkConfig = MONAD_NETWORKS[this.network];
            
            // Try to switch to Monad network
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: networkConfig.chainId }]
            });
            
        } catch (switchError) {
            // If network doesn't exist, add it
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [MONAD_NETWORKS[this.network]]
                    });
                } catch (addError) {
                    console.error('Error adding Monad network:', addError);
                    throw addError;
                }
            } else {
                console.error('Error switching to Monad network:', switchError);
                throw switchError;
            }
        }
    }
    
    disconnect() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.userAddress = null;
        this.isConnected = false;
    }
    
    async registerPlayer(playerName) {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }
        
        try {
            const tx = await this.contract.registerPlayer(playerName);
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error('Error registering player:', error);
            throw error;
        }
    }
    
    async submitScore(score, playerName) {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }
        
        try {
            const tx = await this.contract.submitScore(score, playerName);
            const receipt = await tx.wait();
            
            // Listen for events
            const scoreSubmittedEvent = receipt.logs.find(
                log => log.fragment && log.fragment.name === 'ScoreSubmitted'
            );
            
            return {
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                events: receipt.logs
            };
        } catch (error) {
            console.error('Error submitting score:', error);
            throw error;
        }
    }
    
    async getTopPlayers(count = 100) {
        try {
            // Create a read-only contract instance if we don't have one
            let contractToUse = this.contract;

            if (!contractToUse && this.contractAddress) {
                // Create read-only provider for public data
                const publicProvider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
                contractToUse = new ethers.Contract(
                    this.contractAddress,
                    LEADERBOARD_ABI,
                    publicProvider
                );
            }

            if (!contractToUse) {
                throw new Error('Contract not available');
            }

            const players = await contractToUse.getTopPlayers(count);
            return players.map((player, index) => ({
                rank: index + 1,
                address: player.playerAddress,
                name: player.playerName,
                score: Number(player.score),
                timestamp: Number(player.timestamp),
                date: new Date(Number(player.timestamp) * 1000).toLocaleDateString()
            }));
        } catch (error) {
            console.error('Error getting top players:', error);
            throw error;
        }
    }
    
    async getPlayerRank(playerAddress = null) {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }
        
        const address = playerAddress || this.userAddress;
        if (!address) {
            throw new Error('No player address provided');
        }
        
        try {
            const rank = await this.contract.getPlayerRank(address);
            return Number(rank);
        } catch (error) {
            console.error('Error getting player rank:', error);
            throw error;
        }
    }
    
    async getPlayerStats(playerAddress = null) {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }
        
        const address = playerAddress || this.userAddress;
        if (!address) {
            throw new Error('No player address provided');
        }
        
        try {
            const stats = await this.contract.getPlayerStats(address);
            return {
                address: stats.playerAddress,
                name: stats.playerName,
                highestScore: Number(stats.highestScore),
                totalGames: Number(stats.totalGames),
                lastGameTimestamp: Number(stats.lastGameTimestamp),
                lastGameDate: stats.lastGameTimestamp > 0 
                    ? new Date(Number(stats.lastGameTimestamp) * 1000).toLocaleDateString()
                    : 'Never'
            };
        } catch (error) {
            console.error('Error getting player stats:', error);
            throw error;
        }
    }
    
    async getPlayerScoreHistory(playerAddress = null) {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }

        const address = playerAddress || this.userAddress;
        if (!address) {
            throw new Error('No player address provided');
        }

        try {
            const scores = await this.contract.getPlayerScoreHistory(address);
            return scores.map(score => Number(score));
        } catch (error) {
            console.error('Error getting player score history:', error);
            throw error;
        }
    }

    async getLeaderboardLength() {
        try {
            // Create a read-only contract instance if we don't have one
            let contractToUse = this.contract;

            if (!contractToUse && this.contractAddress) {
                // Create read-only provider for public data
                const publicProvider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
                contractToUse = new ethers.Contract(
                    this.contractAddress,
                    LEADERBOARD_ABI,
                    publicProvider
                );
            }

            if (!contractToUse) {
                throw new Error('Contract not available');
            }

            const length = await contractToUse.getLeaderboardLength();
            return Number(length);
        } catch (error) {
            console.error('Error getting leaderboard length:', error);
            throw error;
        }
    }
    
    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    
    async getTransactionStatus(txHash) {
        if (!this.provider) {
            throw new Error('Provider not initialized');
        }
        
        try {
            const receipt = await this.provider.getTransactionReceipt(txHash);
            return {
                status: receipt ? (receipt.status === 1 ? 'success' : 'failed') : 'pending',
                blockNumber: receipt?.blockNumber,
                gasUsed: receipt?.gasUsed?.toString()
            };
        } catch (error) {
            console.error('Error getting transaction status:', error);
            throw error;
        }
    }
}
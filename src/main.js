import { BrickBreakerGame } from './game.js';
import { BlockchainService } from './blockchain.js';
import { ethers } from 'ethers';

class GameApp {
    constructor() {
        this.game = null;
        this.blockchain = new BlockchainService();
        this.gameLoop = null;
        this.isGameRunning = false;
        
        // DOM elements
        this.canvas = document.getElementById('game-canvas');
        this.connectWalletBtn = document.getElementById('connect-wallet');
        this.disconnectWalletBtn = document.getElementById('disconnect-wallet');
        this.walletInfo = document.getElementById('wallet-info');
        this.walletAddress = document.getElementById('wallet-address');
        this.startGameBtn = document.getElementById('start-game');
        this.pauseGameBtn = document.getElementById('pause-game');
        this.submitScoreBtn = document.getElementById('submit-score');
        this.gameOverModal = document.getElementById('game-over');
        this.playAgainBtn = document.getElementById('play-again');
        this.submitFinalScoreBtn = document.getElementById('submit-final-score');
        this.playerNameInput = document.getElementById('player-name');
        
        // Score display elements
        this.currentScoreEl = document.getElementById('current-score');
        this.currentLevelEl = document.getElementById('current-level');
        this.currentLivesEl = document.getElementById('current-lives');
        this.highScoreEl = document.getElementById('high-score');
        this.finalScoreEl = document.getElementById('final-score');
        this.finalLevelEl = document.getElementById('final-level');
        
        // Leaderboard elements
        this.top100Tab = document.getElementById('top-100-tab');
        this.myRankTab = document.getElementById('my-rank-tab');
        this.top100Leaderboard = document.getElementById('top-100-leaderboard');
        this.myRankLeaderboard = document.getElementById('my-rank-leaderboard');
        this.leaderboardTable = document.getElementById('leaderboard-table');
        this.leaderboardBody = document.getElementById('leaderboard-body');
        this.loadingLeaderboard = document.getElementById('loading-leaderboard');
        
        // My stats elements
        this.myRankEl = document.getElementById('my-rank');
        this.myHighScoreEl = document.getElementById('my-high-score');
        this.myTotalGamesEl = document.getElementById('my-total-games');
        this.scoreHistoryList = document.getElementById('score-history-list');
        
        this.initializeGame();
        this.setupEventListeners();
        this.loadLeaderboard();
    }
    
    initializeGame() {
        this.game = new BrickBreakerGame(this.canvas);
        this.updateGameDisplay();
        
        // Load high score from localStorage
        const savedHighScore = localStorage.getItem('brickBreakerHighScore');
        if (savedHighScore) {
            this.highScoreEl.textContent = savedHighScore;
        }
    }
    
    setupEventListeners() {
        // Wallet connection
        this.connectWalletBtn.addEventListener('click', () => this.connectWallet());
        this.disconnectWalletBtn.addEventListener('click', () => this.disconnectWallet());
        
        // Game controls
        this.startGameBtn.addEventListener('click', () => this.startGame());
        this.pauseGameBtn.addEventListener('click', () => this.pauseGame());
        this.submitScoreBtn.addEventListener('click', () => this.submitScore());
        
        // Game over modal
        this.playAgainBtn.addEventListener('click', () => this.playAgain());
        this.submitFinalScoreBtn.addEventListener('click', () => this.submitFinalScore());
        
        // Leaderboard tabs
        this.top100Tab.addEventListener('click', () => this.showTop100());
        this.myRankTab.addEventListener('click', () => this.showMyRank());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ') {
                e.preventDefault();
                if (this.game.gameState === 'menu') {
                    this.startGame();
                } else if (this.game.gameState === 'playing' || this.game.gameState === 'paused') {
                    this.pauseGame();
                }
            }
        });
    }
    
    async connectWallet() {
        try {
            this.connectWalletBtn.disabled = true;
            this.connectWalletBtn.textContent = 'Connecting...';
            
            const result = await this.blockchain.connectWallet();
            
            this.walletAddress.textContent = this.blockchain.formatAddress(result.address);
            this.connectWalletBtn.style.display = 'none';
            this.walletInfo.style.display = 'flex';
            
            // Load player stats
            await this.loadPlayerStats();
            
            console.log('Wallet connected:', result.address);
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            alert('Failed to connect wallet: ' + error.message);
        } finally {
            this.connectWalletBtn.disabled = false;
            this.connectWalletBtn.textContent = 'Connect Wallet';
        }
    }
    
    disconnectWallet() {
        this.blockchain.disconnect();
        this.connectWalletBtn.style.display = 'block';
        this.walletInfo.style.display = 'none';
        this.resetPlayerStats();
    }
    
    startGame() {
        this.game.start();
        this.startGameBtn.style.display = 'none';
        this.pauseGameBtn.style.display = 'inline-block';
        this.submitScoreBtn.style.display = 'none';
        
        if (!this.isGameRunning) {
            this.isGameRunning = true;
            this.gameLoop = setInterval(() => this.updateGame(), 1000 / 60); // 60 FPS
        }
    }
    
    pauseGame() {
        this.game.pause();
        if (this.game.gameState === 'paused') {
            this.pauseGameBtn.textContent = 'Resume';
        } else {
            this.pauseGameBtn.textContent = 'Pause';
        }
    }
    
    updateGame() {
        this.game.update();
        this.game.render();
        this.updateGameDisplay();
        
        if (this.game.gameState === 'gameOver') {
            this.endGame();
        }
    }
    
    endGame() {
        this.isGameRunning = false;
        clearInterval(this.gameLoop);
        
        this.startGameBtn.style.display = 'inline-block';
        this.pauseGameBtn.style.display = 'none';
        this.submitScoreBtn.style.display = 'inline-block';
        
        // Show game over modal
        const gameState = this.game.getGameState();
        this.finalScoreEl.textContent = gameState.score;
        this.finalLevelEl.textContent = gameState.level;
        this.gameOverModal.style.display = 'flex';
        
        // Update high score if needed
        const currentHighScore = parseInt(this.highScoreEl.textContent);
        if (gameState.score > currentHighScore) {
            this.highScoreEl.textContent = gameState.score;
            localStorage.setItem('brickBreakerHighScore', gameState.score.toString());
        }
    }
    
    playAgain() {
        this.gameOverModal.style.display = 'none';
        this.game.reset();
        this.updateGameDisplay();
    }
    
    updateGameDisplay() {
        const gameState = this.game.getGameState();
        this.currentScoreEl.textContent = gameState.score;
        this.currentLevelEl.textContent = gameState.level;
        this.currentLivesEl.textContent = gameState.lives;
    }
    
    async submitFinalScore() {
        const playerName = this.playerNameInput.value.trim();
        if (!playerName) {
            alert('Please enter your name');
            return;
        }
        
        if (!this.blockchain.isConnected) {
            alert('Please connect your wallet first');
            return;
        }
        
        try {
            this.submitFinalScoreBtn.disabled = true;
            this.submitFinalScoreBtn.textContent = 'Submitting...';
            
            const gameState = this.game.getGameState();
            const result = await this.blockchain.submitScore(gameState.score, playerName);
            
            console.log('Score submitted:', result);
            alert('Score submitted successfully to the blockchain!');
            
            this.gameOverModal.style.display = 'none';
            this.game.reset();
            this.updateGameDisplay();
            
            // Refresh leaderboard and player stats
            await this.loadLeaderboard();
            await this.loadPlayerStats();
            
        } catch (error) {
            console.error('Failed to submit score:', error);
            alert('Failed to submit score: ' + error.message);
        } finally {
            this.submitFinalScoreBtn.disabled = false;
            this.submitFinalScoreBtn.textContent = 'Submit to Leaderboard';
        }
    }
    
    async submitScore() {
        const playerName = this.playerNameInput.value.trim() || 'Anonymous';
        
        if (!this.blockchain.isConnected) {
            alert('Please connect your wallet first');
            return;
        }
        
        try {
            this.submitScoreBtn.disabled = true;
            this.submitScoreBtn.textContent = 'Submitting...';
            
            const gameState = this.game.getGameState();
            const result = await this.blockchain.submitScore(gameState.score, playerName);
            
            console.log('Score submitted:', result);
            alert('Score submitted successfully to the blockchain!');
            
            // Refresh leaderboard and player stats
            await this.loadLeaderboard();
            await this.loadPlayerStats();
            
        } catch (error) {
            console.error('Failed to submit score:', error);
            alert('Failed to submit score: ' + error.message);
        } finally {
            this.submitScoreBtn.disabled = false;
            this.submitScoreBtn.textContent = 'Submit Score to Blockchain';
        }
    }

    async loadLeaderboard() {
        try {
            this.loadingLeaderboard.style.display = 'block';
            this.leaderboardTable.style.display = 'none';

            // Try to load contract info if not already loaded
            if (!this.blockchain.contractAddress) {
                const loaded = await this.blockchain.loadContractInfo();
                if (!loaded) {
                    this.loadingLeaderboard.textContent = 'Contract not deployed yet. Please deploy the contract first.';
                    return;
                }
            }

            // Initialize read-only contract if contractAddress is set but contract is null
            if (this.blockchain.contractAddress && !this.blockchain.contract) {
                const publicProvider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
                this.blockchain.contract = new ethers.Contract(
                    this.blockchain.contractAddress,
                    this.blockchain.LEADERBOARD_ABI,
                    publicProvider
                );
                console.log('Read-only contract initialized for leaderboard');
            }

            // Load leaderboard (works without wallet connection)
            const topPlayers = await this.blockchain.getTopPlayers(100);
            this.displayLeaderboard(topPlayers);

        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            this.loadingLeaderboard.textContent = 'Failed to load leaderboard: ' + error.message;
        }
    }

    displayLeaderboard(players) {
        this.leaderboardBody.innerHTML = '';

        if (players.length === 0) {
            this.loadingLeaderboard.textContent = 'No scores yet - Be the first to play!';
            return;
        }

        players.forEach(player => {
            const row = document.createElement('tr');

            // Highlight current user's row if wallet is connected
            const isCurrentUser = this.blockchain.isConnected &&
                                 player.address.toLowerCase() === this.blockchain.userAddress?.toLowerCase();

            if (isCurrentUser) {
                row.classList.add('current-user-row');
            }

            row.innerHTML = `
                <td>${player.rank}</td>
                <td>${player.name}${isCurrentUser ? ' (You)' : ''}</td>
                <td>${player.score.toLocaleString()}</td>
                <td>${player.date}</td>
            `;
            this.leaderboardBody.appendChild(row);
        });

        this.loadingLeaderboard.style.display = 'none';
        this.leaderboardTable.style.display = 'table';
    }

    async loadPlayerStats() {
        if (!this.blockchain.isConnected) {
            this.resetPlayerStats();
            return;
        }

        try {
            // Ensure contract is initialized
            if (!this.blockchain.contract && this.blockchain.contractAddress) {
                this.blockchain.contract = new ethers.Contract(
                    this.blockchain.contractAddress,
                    this.blockchain.LEADERBOARD_ABI,
                    this.blockchain.signer
                );
                console.log('Contract initialized in loadPlayerStats');
            }

            if (!this.blockchain.contract) {
                console.warn('Contract not available for loading player stats');
                this.resetPlayerStats();
                return;
            }

            const [stats, rank, scoreHistory] = await Promise.all([
                this.blockchain.getPlayerStats(),
                this.blockchain.getPlayerRank(),
                this.blockchain.getPlayerScoreHistory()
            ]);

            this.myRankEl.textContent = rank > 0 ? rank : 'Unranked';
            this.myHighScoreEl.textContent = stats.highestScore.toLocaleString();
            this.myTotalGamesEl.textContent = stats.totalGames;

            this.displayScoreHistory(scoreHistory);

        } catch (error) {
            console.error('Failed to load player stats:', error);
            this.resetPlayerStats();
        }
    }

    displayScoreHistory(scores) {
        this.scoreHistoryList.innerHTML = '';

        if (scores.length === 0) {
            this.scoreHistoryList.innerHTML = '<div class="score-history-item">No games played yet</div>';
            return;
        }

        scores.reverse().forEach((score, index) => {
            const item = document.createElement('div');
            item.className = 'score-history-item';
            item.innerHTML = `
                <span>Game ${scores.length - index}</span>
                <span>${score.toLocaleString()}</span>
            `;
            this.scoreHistoryList.appendChild(item);
        });
    }

    resetPlayerStats() {
        this.myRankEl.textContent = '-';
        this.myHighScoreEl.textContent = '0';
        this.myTotalGamesEl.textContent = '0';
        this.scoreHistoryList.innerHTML = '<div class="score-history-item">Connect wallet to view stats</div>';
    }

    showTop100() {
        this.top100Tab.classList.add('active');
        this.myRankTab.classList.remove('active');
        this.top100Leaderboard.style.display = 'block';
        this.myRankLeaderboard.style.display = 'none';
    }

    showMyRank() {
        this.myRankTab.classList.add('active');
        this.top100Tab.classList.remove('active');
        this.myRankLeaderboard.style.display = 'block';
        this.top100Leaderboard.style.display = 'none';

        // Refresh player stats when viewing
        this.loadPlayerStats();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GameApp();
});

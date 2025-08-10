// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract BrickBreakerLeaderboardV2 {
    struct Player {
        address playerAddress;
        string playerName;
        uint256 highestScore;
        uint256 totalGames;
        uint256 lastGameTimestamp;
    }
    
    struct LeaderboardEntry {
        address playerAddress;
        string playerName;
        uint256 score;
        uint256 timestamp;
    }
    
    // State variables
    mapping(address => Player) public players;
    mapping(address => uint256[]) public playerScoreHistory;
    LeaderboardEntry[] public leaderboard;
    
    address public owner;
    uint256 public totalPlayers;
    uint256 public totalGames;
    
    // Events
    event ScoreSubmitted(address indexed player, string playerName, uint256 score, uint256 timestamp);
    event NewHighScore(address indexed player, string playerName, uint256 newHighScore);
    event PlayerRegistered(address indexed player, string playerName);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function registerPlayer(string memory _playerName) external {
        require(bytes(_playerName).length > 0, "Player name cannot be empty");
        require(bytes(_playerName).length <= 32, "Player name too long");
        
        if (players[msg.sender].playerAddress == address(0)) {
            totalPlayers++;
            emit PlayerRegistered(msg.sender, _playerName);
        }
        
        players[msg.sender] = Player({
            playerAddress: msg.sender,
            playerName: _playerName,
            highestScore: players[msg.sender].highestScore,
            totalGames: players[msg.sender].totalGames,
            lastGameTimestamp: players[msg.sender].lastGameTimestamp
        });
    }
    
    function _registerPlayerInternal(string memory _playerName) internal {
        require(bytes(_playerName).length > 0, "Player name cannot be empty");
        require(bytes(_playerName).length <= 32, "Player name too long");
        
        if (players[msg.sender].playerAddress == address(0)) {
            totalPlayers++;
            emit PlayerRegistered(msg.sender, _playerName);
        }
        
        players[msg.sender] = Player({
            playerAddress: msg.sender,
            playerName: _playerName,
            highestScore: players[msg.sender].highestScore,
            totalGames: players[msg.sender].totalGames,
            lastGameTimestamp: players[msg.sender].lastGameTimestamp
        });
    }
    
    function submitScore(uint256 _score, string memory _playerName) external {
        require(_score > 0, "Score must be greater than 0");
        require(bytes(_playerName).length > 0, "Player name cannot be empty");
        
        // Register player if not already registered
        if (players[msg.sender].playerAddress == address(0)) {
            _registerPlayerInternal(_playerName);
        }
        
        // Update player stats
        players[msg.sender].totalGames++;
        players[msg.sender].lastGameTimestamp = block.timestamp;
        playerScoreHistory[msg.sender].push(_score);
        totalGames++;
        
        // Check for new high score
        if (_score > players[msg.sender].highestScore) {
            players[msg.sender].highestScore = _score;
            emit NewHighScore(msg.sender, _playerName, _score);
            
            // Only update leaderboard if this is a new high score
            _updateLeaderboard(msg.sender, _playerName, _score);
        }
        
        emit ScoreSubmitted(msg.sender, _playerName, _score, block.timestamp);
    }
    
    function _updateLeaderboard(address _player, string memory _playerName, uint256 _score) internal {
        // Check if player already exists in leaderboard
        int256 existingIndex = -1;
        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].playerAddress == _player) {
                existingIndex = int256(i);
                break;
            }
        }
        
        // If player exists, remove the old entry
        if (existingIndex >= 0) {
            // Shift elements to remove the old entry
            for (uint256 i = uint256(existingIndex); i < leaderboard.length - 1; i++) {
                leaderboard[i] = leaderboard[i + 1];
            }
            leaderboard.pop();
        }
        
        LeaderboardEntry memory newEntry = LeaderboardEntry({
            playerAddress: _player,
            playerName: _playerName,
            score: _score,
            timestamp: block.timestamp
        });
        
        // Find the correct position to insert
        uint256 insertIndex = leaderboard.length;
        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (_score > leaderboard[i].score) {
                insertIndex = i;
                break;
            }
        }
        
        // Insert the new entry
        leaderboard.push(newEntry);
        
        // Shift elements to maintain order
        for (uint256 i = leaderboard.length - 1; i > insertIndex; i--) {
            leaderboard[i] = leaderboard[i - 1];
        }
        leaderboard[insertIndex] = newEntry;
        
        // Keep only top 100 entries to manage gas costs
        if (leaderboard.length > 100) {
            leaderboard.pop();
        }
    }
    
    function getTopPlayers(uint256 _count) external view returns (LeaderboardEntry[] memory) {
        require(_count > 0, "Count must be greater than 0");
        
        uint256 returnCount = _count > leaderboard.length ? leaderboard.length : _count;
        LeaderboardEntry[] memory topPlayers = new LeaderboardEntry[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            topPlayers[i] = leaderboard[i];
        }
        
        return topPlayers;
    }
    
    function getPlayerRank(address _player) external view returns (uint256) {
        uint256 playerHighScore = players[_player].highestScore;
        if (playerHighScore == 0) {
            return 0; // Player not found or no scores
        }

        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].playerAddress == _player) {
                return i + 1;
            }
        }

        return 0; // Player not in top 100
    }
    
    function getPlayerStats(address _player) external view returns (Player memory) {
        return players[_player];
    }
    
    function getPlayerScoreHistory(address _player) external view returns (uint256[] memory) {
        return playerScoreHistory[_player];
    }
    
    function getLeaderboardLength() external view returns (uint256) {
        return leaderboard.length;
    }
    
    // Emergency functions for owner
    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    function updateOwner(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        owner = _newOwner;
    }
}

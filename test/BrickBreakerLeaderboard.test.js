const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BrickBreakerLeaderboard", function () {
  let leaderboard;
  let owner;
  let player1;
  let player2;
  let player3;

  beforeEach(async function () {
    [owner, player1, player2, player3] = await ethers.getSigners();
    
    const BrickBreakerLeaderboard = await ethers.getContractFactory("BrickBreakerLeaderboard");
    leaderboard = await BrickBreakerLeaderboard.deploy();
    await leaderboard.waitForDeployment();
  });

  describe("Player Registration", function () {
    it("Should register a new player", async function () {
      await leaderboard.connect(player1).registerPlayer("Alice");
      
      const playerStats = await leaderboard.getPlayerStats(player1.address);
      expect(playerStats.playerName).to.equal("Alice");
      expect(playerStats.playerAddress).to.equal(player1.address);
      expect(playerStats.highestScore).to.equal(0);
      expect(playerStats.totalGames).to.equal(0);
    });

    it("Should not allow empty player name", async function () {
      await expect(
        leaderboard.connect(player1).registerPlayer("")
      ).to.be.revertedWith("Player name cannot be empty");
    });

    it("Should not allow player name longer than 32 characters", async function () {
      const longName = "a".repeat(33);
      await expect(
        leaderboard.connect(player1).registerPlayer(longName)
      ).to.be.revertedWith("Player name too long");
    });
  });

  describe("Score Submission", function () {
    beforeEach(async function () {
      await leaderboard.connect(player1).registerPlayer("Alice");
      await leaderboard.connect(player2).registerPlayer("Bob");
      await leaderboard.connect(player3).registerPlayer("Charlie");
    });

    it("Should submit a score and update player stats", async function () {
      await leaderboard.connect(player1).submitScore(1000, "Alice");
      
      const playerStats = await leaderboard.getPlayerStats(player1.address);
      expect(playerStats.highestScore).to.equal(1000);
      expect(playerStats.totalGames).to.equal(1);
      
      const totalGames = await leaderboard.totalGames();
      expect(totalGames).to.equal(1);
    });

    it("Should update highest score when new score is higher", async function () {
      await leaderboard.connect(player1).submitScore(1000, "Alice");
      await leaderboard.connect(player1).submitScore(1500, "Alice");
      
      const playerStats = await leaderboard.getPlayerStats(player1.address);
      expect(playerStats.highestScore).to.equal(1500);
      expect(playerStats.totalGames).to.equal(2);
    });

    it("Should not update highest score when new score is lower", async function () {
      await leaderboard.connect(player1).submitScore(1500, "Alice");
      await leaderboard.connect(player1).submitScore(1000, "Alice");
      
      const playerStats = await leaderboard.getPlayerStats(player1.address);
      expect(playerStats.highestScore).to.equal(1500);
      expect(playerStats.totalGames).to.equal(2);
    });

    it("Should not allow zero score", async function () {
      await expect(
        leaderboard.connect(player1).submitScore(0, "Alice")
      ).to.be.revertedWith("Score must be greater than 0");
    });

    it("Should emit ScoreSubmitted event", async function () {
      await expect(leaderboard.connect(player1).submitScore(1000, "Alice"))
        .to.emit(leaderboard, "ScoreSubmitted")
        .withArgs(player1.address, "Alice", 1000, await time.latest() + 1);
    });

    it("Should emit NewHighScore event for new high score", async function () {
      await expect(leaderboard.connect(player1).submitScore(1000, "Alice"))
        .to.emit(leaderboard, "NewHighScore")
        .withArgs(player1.address, "Alice", 1000);
    });
  });

  describe("Leaderboard", function () {
    beforeEach(async function () {
      await leaderboard.connect(player1).submitScore(1500, "Alice");
      await leaderboard.connect(player2).submitScore(2000, "Bob");
      await leaderboard.connect(player3).submitScore(1000, "Charlie");
    });

    it("Should return top players in correct order", async function () {
      const topPlayers = await leaderboard.getTopPlayers(3);
      
      expect(topPlayers.length).to.equal(3);
      expect(topPlayers[0].playerName).to.equal("Bob");
      expect(topPlayers[0].score).to.equal(2000);
      expect(topPlayers[1].playerName).to.equal("Alice");
      expect(topPlayers[1].score).to.equal(1500);
      expect(topPlayers[2].playerName).to.equal("Charlie");
      expect(topPlayers[2].score).to.equal(1000);
    });

    it("Should return correct player rank", async function () {
      const aliceRank = await leaderboard.getPlayerRank(player1.address);
      const bobRank = await leaderboard.getPlayerRank(player2.address);
      const charlieRank = await leaderboard.getPlayerRank(player3.address);
      
      expect(bobRank).to.equal(1);
      expect(aliceRank).to.equal(2);
      expect(charlieRank).to.equal(3);
    });

    it("Should return 0 rank for unregistered player", async function () {
      const [, , , , unregisteredPlayer] = await ethers.getSigners();
      const rank = await leaderboard.getPlayerRank(unregisteredPlayer.address);
      expect(rank).to.equal(0);
    });
  });

  describe("Score History", function () {
    it("Should track player score history", async function () {
      await leaderboard.connect(player1).submitScore(1000, "Alice");
      await leaderboard.connect(player1).submitScore(1500, "Alice");
      await leaderboard.connect(player1).submitScore(1200, "Alice");
      
      const scoreHistory = await leaderboard.getPlayerScoreHistory(player1.address);
      expect(scoreHistory.length).to.equal(3);
      expect(scoreHistory[0]).to.equal(1000);
      expect(scoreHistory[1]).to.equal(1500);
      expect(scoreHistory[2]).to.equal(1200);
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to update owner address", async function () {
      await leaderboard.connect(owner).updateOwner(player1.address);
      const newOwner = await leaderboard.owner();
      expect(newOwner).to.equal(player1.address);
    });

    it("Should not allow non-owner to update owner address", async function () {
      await expect(
        leaderboard.connect(player1).updateOwner(player2.address)
      ).to.be.revertedWith("Only owner can call this function");
    });
  });
});

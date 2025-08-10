const hre = require("hardhat");

async function main() {
  console.log("Deploying BrickBreakerLeaderboard contract...");

  // Get the ContractFactory and Signers here.
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy the contract
  const BrickBreakerLeaderboard = await hre.ethers.getContractFactory("BrickBreakerLeaderboard");
  const leaderboard = await BrickBreakerLeaderboard.deploy();

  await leaderboard.waitForDeployment();

  const contractAddress = await leaderboard.getAddress();
  console.log("BrickBreakerLeaderboard deployed to:", contractAddress);

  // Save the contract address to a file for frontend use
  const fs = require('fs');
  const contractInfo = {
    address: contractAddress,
    network: hre.network.name,
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    './public/contractInfo.json',
    JSON.stringify(contractInfo, null, 2)
  );

  console.log("Contract info saved to public/contractInfo.json");

  // Verify the contract on block explorer if not on hardhat network
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await leaderboard.deploymentTransaction().wait(5);
    
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("Contract verified on block explorer");
    } catch (error) {
      console.log("Error verifying contract:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

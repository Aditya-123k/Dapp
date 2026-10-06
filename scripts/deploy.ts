import { network } from "hardhat";

async function main() {
  // In Hardhat 3, ethers is accessed through the network connection
  const connection = await network.create();
  const { ethers } = connection as any;

  const [client, freelancer] = await ethers.getSigners();

  console.log("Deploying contract with account:", client.address);
  console.log("Designated freelancer address:", freelancer.address);

  const FreelanceEscrow = await ethers.getContractFactory("FreelanceEscrow");
  const escrow = await FreelanceEscrow.deploy(
    freelancer.address,
    "Web3 Marketplace Dashboard & Payment Gateway"
  );

  await escrow.waitForDeployment();
  const address = await escrow.getAddress();

  console.log("-----------------------------------------------");
  console.log("FreelanceEscrow deployed successfully at:", address);
  console.log("-----------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
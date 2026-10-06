import hre from "hardhat";

async function main() {
  // @ts-ignore
  const ethers = hre.ethers || (await import("hardhat")).ethers;
  
  // If still undefined, get it directly from hre's runtime
  const { getSigners, getContractFactory } = (hre as any).ethers;

  const [client, freelancer] = await getSigners();

  console.log("Deploying contract with account:", client.address);
  console.log("Designated freelancer address:", freelancer.address);

  const FreelanceEscrow = await getContractFactory("FreelanceEscrow");
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
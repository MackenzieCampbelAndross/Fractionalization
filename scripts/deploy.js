import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("Deploying MetaVaultBond to network...");

  const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);

  const wallet = new ethers.Wallet(
    process.env.BACKEND_PRIVATE_KEY,
    provider
  );

  console.log("Deploying with account:", wallet.address);

  const artifact = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../artifacts/contracts/MetaVaultBond.sol/MetaVaultBond.json")
    )
  );

  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    wallet
  );

  const contract = await factory.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();

  console.log("Bond deployed to:", address);

  // ---- Auto update .env ----
  const envPath = path.join(__dirname, "..", ".env");

  let env = fs.readFileSync(envPath, "utf8");

  if (env.includes("BOND_CONTRACT_ADDRESS=")) {
    env = env.replace(
      /BOND_CONTRACT_ADDRESS=.*/g,
      `BOND_CONTRACT_ADDRESS=${address}`
    );
  } else {
    env += `\nBOND_CONTRACT_ADDRESS=${address}\n`;
  }

  fs.writeFileSync(envPath, env);

  console.log("Updated .env with new contract address");
}

main().catch(console.error);

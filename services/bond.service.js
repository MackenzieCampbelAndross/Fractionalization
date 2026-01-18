import "dotenv/config";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load artifact manually
const artifactPath = path.join(
  __dirname,
  "../artifacts/contracts/MetaVaultBond.sol/MetaVaultBond.json"
);

const bondArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

const RPC_URL = "http://127.0.0.1:8545";
const BOND_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

export const bondContract = new ethers.Contract(
  BOND_ADDRESS,
  bondArtifact.abi,
  signer
);

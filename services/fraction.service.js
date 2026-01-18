import Pool from "../models/Pool.js";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load ABI
const abiPath = path.join(__dirname, "../artifacts/contracts/MetaVaultBond.sol/MetaVaultBond.json");
const artifact = JSON.parse(fs.readFileSync(abiPath, "utf8"));
const ABI = artifact.abi;

// Connect chain
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

const wallet = new ethers.Wallet(process.env.BACKEND_PRIVATE_KEY, provider);

// IMPORTANT — your current deployed address
const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

// Hard proof
console.log("Contract loaded. ABI entries:", contract.interface.fragments.map(f => f.name));


export async function sealAndFractionalize(poolId) {
  const pool = await Pool.findById(poolId);
  if (!pool) throw new Error("Pool not found");

  if (pool.chainBondId !== undefined && pool.chainBondId !== null) {
    console.log("Already minted:", pool.chainBondId);
    return pool;
  }

  // Seal locally
  pool.state = "SEALED";
  pool.maturityDate = new Date(Date.now() + 60 * 1000);
  await pool.save();

  // Mint on-chain — using real signature
  const bondId = Date.now(); // unique for demo
  const bondValue = pool.targetAmount;
  const maturityTime = Math.floor(pool.maturityDate.getTime() / 1000);

  const tx = await contract.mintBond(bondId, bondValue, maturityTime);
  await tx.wait();

  pool.chainBondId = bondId;
  await pool.save();

  console.log("Bond minted on-chain:", bondId);

  return pool;
}

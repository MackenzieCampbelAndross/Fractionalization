import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend root
dotenv.config({ path: path.join(__dirname, "../.env") });

// Load ABI
const abiPath = path.join(__dirname, "../MetaVaultBond_abi.json");
const ABI = JSON.parse(fs.readFileSync(abiPath, "utf8"));

// ───────────── VALIDATIONS ─────────────

if (!process.env.ALCHEMY_URL) {
  console.error("❌ Missing ALCHEMY_URL in .env");
  process.exit(1);
}

if (!process.env.BACKEND_PRIVATE_KEY) {
  console.error("❌ Missing BACKEND_PRIVATE_KEY in .env");
  process.exit(1);
}

if (!process.env.BOND_CONTRACT_ADDRESS) {
  console.error("❌ Missing BOND_CONTRACT_ADDRESS in .env");
  process.exit(1);
}

if (!ethers.isAddress(process.env.BOND_CONTRACT_ADDRESS)) {
  console.error("❌ Invalid BOND_CONTRACT_ADDRESS in .env");
  process.exit(1);
}

// ───────────── PROVIDER (SEPOLIA ON-CHAIN) ─────────────

const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);

const wallet = new ethers.Wallet(
  process.env.BACKEND_PRIVATE_KEY,
  provider
);

// ───────────── CONTRACT INSTANCE ─────────────

const contract = new ethers.Contract(
  process.env.BOND_CONTRACT_ADDRESS,
  ABI,
  wallet
);

console.log("🔗 Chain Service Connected to:", process.env.BOND_CONTRACT_ADDRESS);

// ───────────── EXPORTED HELPERS ─────────────

export async function verifyBondMaturity(bondId) {
  try {
    return await contract.isMatured(bondId);
  } catch (err) {
    console.error("verifyBondMaturity error:", err);
    throw err;
  }
}

export const mintBond = async (bondId, amount, maturity) => {
  try {
    const feeData = await provider.getFeeData();

    // IMPORTANT: use "pending" to skip stuck txs
    const nonce = await provider.getTransactionCount(
      wallet.address,
      "pending"
    );

    console.log("Using nonce:", nonce);

    const tx = await contract.mintBond(
      bondId,
      amount,
      maturity,
      {
        nonce,
        maxFeePerGas: feeData.maxFeePerGas * 200n / 100n,        // 2x
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas * 200n / 100n
      }
    );

    console.log("Mint TX sent:", tx.hash);

    await tx.wait();

    return tx.hash;

  } catch (error) {
    console.error("CHAIN SERVICE MINT ERROR:", error);

    if (error.code === "REPLACEMENT_UNDERPRICED") {
      console.log("Retrying mint with MAX bump...");

      const feeData = await provider.getFeeData();

      const nonce = await provider.getTransactionCount(
        wallet.address,
        "pending"
      );

      const tx = await contract.mintBond(
        bondId,
        amount,
        maturity,
        {
          nonce,
          maxFeePerGas: feeData.maxFeePerGas * 350n / 100n,       // 3.5x
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas * 350n / 100n
        }
      );

      await tx.wait();
      return tx.hash;
    }

    throw error;
  }
};




export async function distributeUnits(bondId, investor, amount) {
  try {
    const tx = await contract.distribute(bondId, investor, amount);
    return await tx.wait();
  } catch (err) {
    console.error("distributeUnits error:", err);
    throw err;
  }
}

export async function depositYield(bondId, amountInWei) {
  try {
    const tx = await contract.depositYield(bondId, {
      value: amountInWei,
    });
    return await tx.wait();
  } catch (err) {
    console.error("depositYield error:", err);
    throw err;
  }
}

export async function claimPayout(bondId) {
  try {
    const tx = await contract.claim(bondId);
    return await tx.wait();
  } catch (err) {
    console.error("claimPayout error:", err);
    throw err;
  }
}

// Export raw instances if controllers need them
export { contract, provider, wallet };

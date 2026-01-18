import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import Bond from "../models/Bond.js";
import Pool from "../models/Pool.js";

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
        maxFeePerGas: feeData.maxFeePerGas * 200n / 100n,
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
          maxFeePerGas: feeData.maxFeePerGas * 350n / 100n,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas * 350n / 100n
        }
      );

      await tx.wait();
      return tx.hash;
    }

    throw error;
  }
};

// ───────────── MAIN TOKENIZATION API ─────────────

export const tokenizeBond = async (req, res) => {
  try {
    const {
      poolId,
      bondName,
      issuerId,
      issuerName,
      faceValue,
      expectedReturnRate,
      minContribution,
      ipfsHash,
      onChainHash,
      maturityTimestamp
    } = req.body;

    if (!poolId) {
      return res.status(400).json({ error: "poolId is required" });
    }

    const bondId = Math.floor(Math.random() * 1000000);

    const maturityTime =
      maturityTimestamp || Math.floor(Date.now() / 1000) + 86400;

    console.log("Minting bond on-chain...");
    console.log("bondId:", bondId);
    console.log("faceValue:", faceValue);
    console.log("maturity:", maturityTime);

    const txHash = await mintBond(bondId, faceValue, maturityTime);

    console.log("Bond minted on-chain successfully");

    const bond = await Bond.create({
      bondId,
      bondName,
      issuerId,
      issuerName,
      faceValue,
      expectedReturnRate,
      minContribution,
      ipfsHash,
      onChainHash,
      mintTxHash: txHash
    });

    console.log("Bond saved in DB:", bond._id);

    const updatedPool = await Pool.findByIdAndUpdate(
      poolId,
      {
        bondId,
        bondName,
        issuerId,
        issuerName,
        expectedReturnRate,
        targetAmount: faceValue,
        minContribution,
        maturityDate: new Date(maturityTime * 1000),
        state: "OPEN",
        cid: ipfsHash,
        localHash: onChainHash
      },
      { new: true }
    );

    if (!updatedPool) {
      return res.status(404).json({ error: "Pool not found" });
    }

    console.log("Pool updated with bond:", updatedPool._id);

    res.json({
      success: true,
      bondId,
      txHash,
      pool: updatedPool
    });

  } catch (err) {
    console.error("TOKENIZE ERROR:", err);

    res.status(500).json({
      error: "Tokenization failed",
      details: err.message
    });
  }
};

// Export raw instances if needed elsewhere
export { contract, provider, wallet };

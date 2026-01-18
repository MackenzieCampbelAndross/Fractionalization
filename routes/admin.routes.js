import express from "express";
import Pool from "../models/Pool.js";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load ABI
const MetaVaultBondABI = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../MetaVaultBond_abi.json"), "utf-8")
);

const router = express.Router();

// Ethers v6 setup
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const wallet = new ethers.Wallet(process.env.BACKEND_PRIVATE_KEY, provider);

// ⚠️ Make sure this address matches your latest deployment
const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

const contract = new ethers.Contract(CONTRACT_ADDRESS, MetaVaultBondABI, wallet);

// 🔧 One-time repair mint
router.post("/repair-mint/:poolId", async (req, res) => {
  try {
    const pool = await Pool.findById(req.params.poolId);
    if (!pool) return res.status(404).json({ error: "Pool not found" });

    if (pool.chainBondId && pool.chainBondId > 0) {
      return res.json({ message: "Already minted", pool });
    }

    if (!["FULL", "MATURED"].includes(pool.state)) {
      return res.status(400).json({ error: "Pool not ready for mint" });
    }

    // ───── VALIDATE DATA FIRST ─────
    if (!pool.targetAmount || isNaN(pool.targetAmount)) {
      return res.status(400).json({ error: "Invalid targetAmount in DB" });
    }

    if (!pool.maturityDate) {
      return res.status(400).json({ error: "Missing maturityDate in DB" });
    }

    // ───── NOW SAFE CONVERSIONS ─────
    const bondId = BigInt(Date.now());

    const bondValue = BigInt(Number(pool.targetAmount));

    const maturityTime = BigInt(
      Math.floor(new Date(pool.maturityDate).getTime() / 1000)
    );

    const tx = await contract.mintBond(
      bondId,
      bondValue,
      maturityTime
    );

    await tx.wait();

    pool.chainBondId = Number(bondId);
    await pool.save();

    res.json({ success: true, bondId: Number(bondId), pool });

  } catch (err) {
    console.error("REPAIR MINT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

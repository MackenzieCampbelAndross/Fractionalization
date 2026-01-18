import express from "express";
import Pool from "../models/Pool.js";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MetaVaultBondABI = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../MetaVaultBond_abi.json"), "utf-8")
);


const router = express.Router();

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const wallet = new ethers.Wallet(process.env.BACKEND_PRIVATE_KEY, provider);

const contract = new ethers.Contract(
  "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  MetaVaultBondABI,
  wallet
);

router.post("/:poolId/deposit", async (req, res) => {
  try {
    const pool = await Pool.findById(req.params.poolId);

    if (!pool.chainBondId) {
      return res.status(400).json({ error: "Bond not minted yet" });
    }

    // Demo: deposit 0.1 ETH as yield
    const amount = ethers.parseEther("0.1");

    const tx = await contract.depositYield(pool.chainBondId, {
      value: amount
    });

    await tx.wait();

    res.json({ success: true, message: "Yield deposited on-chain" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

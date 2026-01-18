import express from "express";
import Pool from "../models/Pool.js";

const router = express.Router();

// Optional legacy endpoint – no longer required in new flow
router.post("/seal/:poolId", async (req, res) => {
  try {
    const pool = await Pool.findById(req.params.poolId);

    if (!pool) {
      return res.status(404).json({ error: "Pool not found" });
    }

    // In the new system, sealing is simply moving to OPEN state after tokenization
    if (!pool.bondId) {
      return res.status(400).json({ error: "Pool not tokenized yet" });
    }

    pool.state = "OPEN";
    await pool.save();

    res.json({ success: true, pool });
  } catch (err) {
    console.error("SEAL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

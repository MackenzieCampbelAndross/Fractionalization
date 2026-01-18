import Pool from "../models/Pool.js";
import { claimPayout } from "../services/chain.service.js";

export const claimYield = async (req, res) => {
  try {
    const { poolId } = req.params;
    const { investorId } = req.body;

    if (!investorId) {
      return res.status(400).json({ error: "investorId required" });
    }

    const pool = await Pool.findById(poolId);

    if (!pool) {
      return res.status(404).json({ error: "Pool not found" });
    }

    // Must be matured on DB side
    if (pool.state !== "MATURED") {
      return res.status(400).json({ error: "Pool not matured yet" });
    }

    // Must be tokenized
    if (!pool.bondId) {
      return res.status(400).json({ error: "Pool not tokenized on-chain" });
    }

    const payout = pool.payouts?.find(
      (p) => p.contributor === investorId
    );

    if (!payout) {
      return res.status(404).json({ error: "No payout found for investor" });
    }

    if (payout.claimed) {
      return res.status(400).json({ error: "Already claimed" });
    }

    // ───────────── ON-CHAIN CLAIM ─────────────
    console.log(`Claiming on-chain payout for bondId=${pool.bondId}`);

    await claimPayout(pool.bondId);

    console.log("On-chain claim successful");

    // ───────────── UPDATE DB AFTER SUCCESS ─────────────
    payout.claimed = true;

    // If all investors claimed, close the pool
    if (pool.payouts.every((p) => p.claimed)) {
      pool.state = "CLOSED";
    }

    await pool.save();

    res.json({
      success: true,
      message: "Yield claimed successfully on-chain",
      claim: payout,
    });

  } catch (err) {
    console.error("CLAIM ERROR:", err);

    res.status(500).json({
      error: "Claim failed",
      details: err.message,
    });
  }
};

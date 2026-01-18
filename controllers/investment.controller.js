import Pool from "../models/Pool.js";

export const contributeToPool = async (req, res) => {
  try {
    const { poolId, investorAddress, amount } = req.body;

    if (!poolId || !investorAddress || !amount) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const pool = await Pool.findById(poolId);
    if (!pool) return res.status(404).json({ error: "Pool not found" });

    if (pool.state !== "OPEN") {
      return res.status(400).json({ error: "Pool not open for investment" });
    }

    const amt = Number(amount);

    if (amt <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // Prevent over-investment
    if (pool.currentAmount + amt > pool.targetAmount) {
      return res.status(400).json({ error: "Investment exceeds target amount" });
    }

    console.log(
      `Processing OFF-CHAIN contribution: investor=${investorAddress}, amount=${amt}`
    );

    // ───────────── DATABASE UPDATE ONLY ─────────────

    pool.currentAmount += amt;

    if (!Array.isArray(pool.ownershipSnapshot)) {
      pool.ownershipSnapshot = [];
    }

    const existing = pool.ownershipSnapshot.find(
      (o) => o.contributorPublicId === investorAddress
    );

    if (existing) {
      existing.amount += amt;
      existing.percentage = existing.amount / pool.targetAmount;
    } else {
      pool.ownershipSnapshot.push({
        contributorPublicId: investorAddress,
        amount: amt,
        percentage: amt / pool.targetAmount,
      });
    }

    // If target reached, mark pool FULL
    if (pool.currentAmount >= pool.targetAmount) {
      pool.state = "FULL";
    }

    await pool.save();

    console.log("Contribution recorded successfully");

    res.json({
      success: true,
      pool,
    });

  } catch (err) {
    console.error("CONTRIBUTE ERROR:", err);

    res.status(500).json({
      error: "Contribution failed",
      details: err.message,
    });
  }
};

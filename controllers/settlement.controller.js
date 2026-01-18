import Pool from "../models/Pool.js";
import { verifyBondMaturity } from "../services/chain.service.js";

// ==============================
// Verify maturity directly from chain
// ==============================
export async function verifyMaturity(poolId) {
  const pool = await Pool.findById(poolId);
  if (!pool) throw new Error("Pool not found");

  if (!pool.bondId) {
    throw new Error("Bond not yet minted on-chain");
  }

  const matured = await verifyBondMaturity(pool.bondId);

  if (!matured) {
    throw new Error("Bond not yet matured on-chain");
  }

  return true;
}

// ==============================
// Close settlement only if chain + DB allow
// ==============================
export async function closeSettlement(req, res) {
  try {
    const { poolId } = req.params;

    const pool = await Pool.findById(poolId);
    if (!pool) return res.status(404).json({ error: "Pool not found" });

    // Consistent field name
    if (pool.state !== "MATURED") {
      return res.status(400).json({ error: "Pool not matured yet" });
    }

    // Verify with real blockchain
    await verifyMaturity(poolId);

    pool.state = "CLOSED";
    await pool.save();

    res.json({
      success: true,
      pool
    });

  } catch (err) {
    console.error("SETTLEMENT ERROR:", err.message);

    res.status(400).json({
      error: err.message
    });
  }
}

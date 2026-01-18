import Pool from "../models/Pool.js";
import Claim from "../models/Claim.js";

// Phase 2: finalize pool settlement & close lifecycle
export async function settlePool(poolId) {
  const pool = await Pool.findById(poolId);

  if (!pool) throw new Error("Pool not found");
  if (pool.state !== "MATURED") throw new Error("Pool not matured");

  // mark lifecycle complete
  pool.state = "CLOSED";
  await pool.save();

  return pool;
}

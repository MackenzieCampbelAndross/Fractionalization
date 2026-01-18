import Pool from "../models/Pool.js";
import Ownership from "../models/ownership.models.js";
import { bondContract } from "./bond.service.js";

const UNIT = 1_000_000;

export async function sealPool(poolId) {
  const pool = await Pool.findById(poolId);
  if (!pool) throw new Error("Pool not found");
  if (pool.status === "SEALED") return pool;

  if (pool.currentAmount < pool.targetAmount)
    throw new Error("Pool not fully funded");

  // 1. Seal pool
  pool.status = "SEALED";
  pool.sealedAt = new Date();
  await pool.save();

  // 🧬 Generate real on-chain bondId
const bondId = Date.now(); // simple unique uint256 for dev

// 🔗 Mint bond on-chain
const tx = await bondContract.mintBond(bondId);
await tx.wait();

// 💾 Persist numeric bondId in DB
pool.bondId = bondId;
await pool.save();


  // 3. Distribute fractional units
  const ownerships = await Ownership.find({ poolId });

  for (const o of ownerships) {
    const units = Math.floor((o.amount / pool.targetAmount) * UNIT);
    await bondContract.distribute(poolId.toString(), o.wallet, units);
  }

  return pool;
}

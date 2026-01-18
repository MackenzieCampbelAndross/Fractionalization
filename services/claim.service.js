import Pool from "../models/Pool.js";
import Ownership from "../models/ownership.models.js";


export async function claimYield(poolId, investorId, totalPayout) {
  const pool = await Pool.findById(poolId);
  if (pool.status !== "MATURED") throw new Error("Bond not matured");

  const ownership = await Ownership.findOne({ poolId, investorId });
  if (!ownership) throw new Error("No ownership");

  const entitled = Math.floor(totalPayout * ownership.shareBps / 10000);
  const remaining = entitled - ownership.claimedAmount;

  if (remaining <= 0) throw new Error("Nothing left to claim");

  ownership.claimedAmount += remaining;
  await ownership.save();

  return remaining;
}

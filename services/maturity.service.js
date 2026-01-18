import Pool from "../models/Pool.js";
import {
  verifyBondMaturity,
  depositYield
} from "../services/chain.service.js";

export async function processMaturedPools() {
  try {
    const now = new Date();

    const pools = await Pool.find({
      state: "FULL",
      maturityDate: { $lte: now }
    });

    for (const pool of pools) {
      console.log(`Processing maturity for pool: ${pool._id}`);

      // Must be tokenized first
      if (!pool.bondId) {
        console.log(`Skipping pool ${pool._id} – not tokenized on-chain`);
        continue;
      }

      // Verify on-chain maturity status
      const isMaturedOnChain = await verifyBondMaturity(pool.bondId);

      if (!isMaturedOnChain) {
        console.log(`Bond ${pool.bondId} not matured on-chain yet`);
        continue;
      }

      // Defensive ownership checks
      if (
        !Array.isArray(pool.ownershipSnapshot) ||
        pool.ownershipSnapshot.length === 0
      ) {
        console.log(`Skipping pool ${pool._id} – no ownership data`);
        continue;
      }

      // Mark pool as matured
      pool.state = "MATURED";

      // ───────────── ON-CHAIN YIELD DEPOSIT ─────────────

      // Deposit yield only once
      if (!pool.yieldDeposited) {
        const totalInterest = pool.ownershipSnapshot.reduce((sum, owner) => {
          const principal = Number(owner.amount);
          const interest =
            (principal * Number(pool.expectedReturnRate)) / 100;
          return sum + interest;
        }, 0);

        if (totalInterest > 0) {
          console.log(
            `Depositing yield on-chain for bond ${pool.bondId}: ${totalInterest}`
          );

          // Send interest as ETH to contract
          await depositYield(pool.bondId, totalInterest);

          pool.yieldDeposited = true;

          console.log("Yield deposited on-chain successfully");
        }
      }

      // ───────────── PAYOUT GENERATION ─────────────

      if (!Array.isArray(pool.payouts) || pool.payouts.length === 0) {
        pool.payouts = [];

        for (const owner of pool.ownershipSnapshot) {
          const principal = Number(owner.amount);
          const interest =
            (principal * Number(pool.expectedReturnRate)) / 100;
          const total = principal + interest;

          pool.payouts.push({
            contributor: owner.contributorPublicId,
            principal,
            interest,
            total,
            claimed: false
          });
        }
      }

      await pool.save();

      console.log(`Pool successfully matured: ${pool._id}`);
    }
  } catch (err) {
    console.error("MATURITY WORKER ERROR:", err.message);
  }
}

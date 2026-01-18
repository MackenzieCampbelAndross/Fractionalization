import Investor from "../models/Investor.js";
import Pool from "../models/Pool.js";
import Claim from "../models/Claim.js";

// ───────────────────────── LOGIN / REGISTER ─────────────────────────
export const loginInvestor = async (req, res) => {
  try {
    const { authId, email } = req.body;

    let investor = await Investor.findOne({ authId });

    if (!investor) {
      const publicId =
        Math.random().toString(36).substring(2, 6).toUpperCase() +
        Math.floor(1000 + Math.random() * 9000);

      investor = await Investor.create({
        authId,
        email,
        publicId
      });
    }

    res.json(investor);
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Login failed" });
  }
};

// ───────────────────────── GET CURRENT INVESTOR ─────────────────────────
export const getMe = async (req, res) => {
  try {
    const investor = await Investor.findById(req.params.id);
    if (!investor) return res.status(404).json({ error: "Investor not found" });
    res.json(investor);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch investor" });
  }
};

// ───────────────────────── SAVE PROFILE ─────────────────────────
export const saveProfile = async (req, res) => {
  try {
    const investor = await Investor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!investor) return res.status(404).json({ error: "Investor not found" });

    res.json(investor);
  } catch (err) {
    res.status(500).json({ error: "Failed to save profile" });
  }
};

// ───────────────────────── PORTFOLIO (PHASE 2 CORE) ─────────────────────────
export const getPortfolio = async (req, res) => {
  try {
    const investorId = req.params.id;

    const pools = await Pool.find({
      "ownershipSnapshot.contributorPublicId": investorId
    }).lean();

    const claims = await Claim.find({ investorId }).lean();

    let totalInvested = 0;
    let totalEarned = 0;

    const active = [];
    const completed = [];

    for (const pool of pools) {
      const entry = pool.ownershipSnapshot.find(
        o => o.contributorPublicId === investorId
      );

      if (!entry) continue;

      const invested = entry.amount;
      totalInvested += invested;

      if (pool.state === "CLOSED") {
        const claim = claims.find(c => String(c.poolId) === String(pool._id));

        if (claim) totalEarned += claim.payout || 0;

        completed.push({
          name: pool.bondName,
          invested,
          proof: claim?.txHash
            ? {
                contract: process.env.CONTRACT_ADDRESS,
                tx: claim.txHash
              }
            : null
        });
      } else {
        active.push({ name: pool.bondName, invested });
      }
    }

    res.json({ totalInvested, totalEarned, active, completed, claims });
  } catch (err) {
    console.error("PORTFOLIO ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

import Pool from "../models/Pool.js";

export const storeKycController = async (req, res) => {
  try {
    const { cid, localHash } = req.body;

    if (!cid || !localHash) {
      return res.status(400).json({ error: "CID and localHash required" });
    }

    const pool = await Pool.create({
      cid,
      localHash,
      state: "DRAFT"
    });

    console.log("KYC stored off-chain for pool:", pool._id);

    res.json({
      poolId: pool._id
    });

  } catch (err) {
    console.error("STORE KYC ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

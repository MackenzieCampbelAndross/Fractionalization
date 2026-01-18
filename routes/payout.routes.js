import express from "express";
import Claim from "../models/Claim.js";

const router = express.Router();

router.post("/execute", async (req, res) => {
  const { claimId } = req.body;

  const claim = await Claim.findById(claimId);
  if (!claim || claim.paid)
    return res.status(400).json({ error: "Invalid claim" });

  claim.paid = true;
  await claim.save();

  res.json({
    success: true,
    creditedAmount: Math.round(claim.share * 100000)
  });
});

export default router;

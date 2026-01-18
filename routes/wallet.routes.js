import express from "express";
import DummyWallet from "../models/DummyWallet.js";

const router = express.Router();

router.get("/:investorId", async (req, res) => {
  try {
    const wallet = await DummyWallet.findOne({
      ownerId: req.params.investorId
    });

    if (!wallet) {
      return res.json({
        balance: 0,
        transactions: []
      });
    }

    res.json(wallet);

  } catch (err) {
    res.status(500).json({ error: "Failed to load wallet" });
  }
});

export default router;

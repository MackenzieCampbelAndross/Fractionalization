import express from "express";
import { loginInvestor, saveProfile, getMe } from "../controllers/investor.controller.js";
import { getPortfolio } from "../controllers/investor.controller.js";

const router = express.Router();

router.post("/login", loginInvestor);
router.get("/me/:id", getMe);
router.post("/profile/:id", saveProfile);
router.get("/portfolio/:id", getPortfolio);
router.get("/history/:investorId", async (req, res) => {
  const history = await Settlement.find({ investorId: req.params.investorId });
  res.json(history);
});

export default router;

import Settlement from "../models/Settlement.js";

router.get("/state/:investorId", async (req, res) => {
  const investorId = req.params.investorId;

  const settlements = await Settlement.find({ investorId });

  res.json({ settlements });
});

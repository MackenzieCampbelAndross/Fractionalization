import express from "express";
import Activity from "../models/Activity.js";
console.log("Activity routes loaded");

const router = express.Router();

router.get("/:investorId", async (req, res) => {
  const activities = await Activity.find({ investorId: req.params.investorId })
    .sort({ timestamp: -1 })
    .limit(10);

  res.json(activities);
});

export default router;

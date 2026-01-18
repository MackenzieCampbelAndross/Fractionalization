import express from "express";
import Pool from "../models/Pool.js";

const router = express.Router();


// 🔓 Public Marketplace (Individual App)
router.get("/public", async (req, res) => {
  try {
    const pools = await Pool.find({ 
      state: { $in: ["OPEN", "FULL", "MATURED"] } 
    });
    res.json(pools);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🔒 Single Pool (Contribution Page)
router.get("/:id", async (req, res) => {
  try {
    const pool = await Pool.findById(req.params.id);
    if (!pool) return res.status(404).json({ error: "Pool not found" });
    res.json(pool);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


export default router;
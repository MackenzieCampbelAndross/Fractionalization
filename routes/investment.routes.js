import express from "express";
import { contributeToPool } from "../controllers/investment.controller.js";

const router = express.Router();

// POST /api/investment/contribute
router.post("/contribute", contributeToPool);

export default router;

import express from "express";
import { tokenizeBond } from "../controllers/bond.controller.js";

const router = express.Router();

router.post("/tokenize", tokenizeBond);

export default router;

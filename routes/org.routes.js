import express from "express";
import fs from "fs";

const router = express.Router();
const DB_PATH = "./data/orgStore.json";

// Helpers
function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync("./data", { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(DB_PATH));
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// GET org profile
router.get("/profile/:orgId", (req, res) => {
  const db = loadDB();
  const org = db[req.params.orgId] || {};
  res.json(org);
});

// SAVE org profile
router.post("/profile", (req, res) => {
  const db = loadDB();
  db[req.body.orgId] = req.body;
  saveDB(db);
  res.json({ success: true });
});

export default router;

import Pool from "../models/Pool.js";

setInterval(async () => {
  const now = new Date();

  const pools = await Pool.find({
    state: "FULL",
    maturityDate: { $lte: now }
  });

  for (const pool of pools) {
    pool.state = "MATURED";
    await pool.save();
    console.log("🟢 Pool matured:", pool.bondName);
  }
}, 5000); // every 5 seconds

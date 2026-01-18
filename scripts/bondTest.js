import "dotenv/config";
import { bondContract } from "../services/bond.service.js";

async function test() {
  console.log("Loaded key:", process.env.PRIVATE_KEY.slice(0, 6));
  const matured = await bondContract.isMatured(1);
  console.log("Bond maturity check:", matured);
}

test();

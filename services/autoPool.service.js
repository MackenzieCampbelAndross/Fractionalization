import Pool from "../models/Pool.js";

export async function createPoolFromBond(bond) {
  const existing = await Pool.findOne({ bondId: bond._id });
  if (existing) return existing;

  const maturityDate = new Date(Date.now() + 60 * 1000); // 1 min dev maturity

  const pool = await Pool.create({
    bondId: bond._id,
    targetAmount: Number(bond.faceValue),
    minContribution: Number(bond.minContribution),
    maturityDate
  });

  return pool;
}

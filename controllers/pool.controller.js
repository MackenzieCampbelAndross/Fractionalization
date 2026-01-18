export const getPublicPools = async (req, res) => {
  const pools = await Pool.find({
    state: { $in: ["OPEN", "FULL", "MATURED"] }
  }).populate("bondId");

  res.json(pools);
};

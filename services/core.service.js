const util = require("./util.service")

function calculateMCapChangeByInterval(
    data,
    currentMarketCap,
    intervalDays
) {
    if (!data || data.length === 0) return 0;

    const sortedData = [...data].sort((a, b) => a[0] - b[0]);
    const now = Date.now();
    const targetTimestamp = now - intervalDays * 24 * 60 * 60 * 1000;

    const targetData = sortedData.reduce((closest, current) => {
        if (
            current[0] <= targetTimestamp &&
            (!closest || current[0] > closest[0])
        ) {
            return current;
        }
        return closest;
    }, null);

    if (!targetData) return 0;

    const mcapStart = targetData[1];
    return (currentMarketCap - mcapStart) / 1e6;
}

function calculatePricePctChangeByInterval(data, currentPrice, intervalDays) {
    if (!data || data.length === 0) return 0;
  
    const sortedData = [...data].sort((a, b) => a[0] - b[0]);
    const now = Date.now();
    const targetTimestamp = now - intervalDays * 24 * 60 * 60 * 1000;
  
    const targetData = sortedData.reduce((closest, current) => {
      if (
        current[0] <= targetTimestamp &&
        (!closest || current[0] > closest[0])
      ) {
        return current;
      }
      return closest;
    }, null);
  
    if (!targetData) return 0;
  
    const priceStart = targetData[1];
    return ((currentPrice - priceStart) / priceStart) * 100;
  }
  

function calculateRanks(resultData, intervalKey) {
    const sortedCoins = [...resultData]
        .filter((coin) => coin[intervalKey] > 0)
        .sort((a, b) => b[intervalKey] - a[intervalKey]);

    sortedCoins.forEach((coin, index) => {
        coin[`rank_${intervalKey}`] = index + 1;
    });

    resultData.forEach((coin) => {
        if (!coin[`rank_${intervalKey}`]) {
            coin[`rank_${intervalKey}`] = "N/A";
        }
    });
}

function calculateRankChanges(resultData, intervals, currentRankKey) {
    intervals.forEach((intervalKey) => {
        resultData.forEach((coin) => {
            const currentRank = coin[currentRankKey];
            const intervalRank = coin[`rank_${intervalKey}`];

            if (currentRank !== "N/A" && intervalRank !== "N/A") {
                coin[`rank_chg_${intervalKey}`] = util.formatWithPlusSign(intervalRank - currentRank);
            } else {
                coin[`rank_chg_${intervalKey}`] = "N/A";
            }
        });
    });
}

function extractMCapAtInterval(data, intervalDays) {
    if (!data || data.length === 0) return 0;

    const sortedData = [...data].sort((a, b) => a[0] - b[0]);
    const now = Date.now();
    const targetTimestamp = now - intervalDays * 24 * 60 * 60 * 1000;

    const targetData = sortedData.reduce((closest, current) => {
        if (
            current[0] <= targetTimestamp &&
            (!closest || current[0] > closest[0])
        ) {
            return current;
        }
        return closest;
    }, null);

    return targetData ? targetData[1] : 0;
}

module.exports = {
    calculatePricePctChangeByInterval,

    calculateMCapChangeByInterval,
    extractMCapAtInterval,

    calculateRanks,
    calculateRankChanges,
};

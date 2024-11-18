const fs = require("fs");
const chalk = require("chalk");
const util = require("../services/util.service");

const config = JSON.parse(fs.readFileSync("config.json", "utf-8"));
const skipTickers = config.skip || [];

function calculateMarketCapIncreaseByInterval(
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

function calculateRankChanges(resultData, currentRankKey) {
  [
    "mcap_1D",
    "mcap_7D",
    "mcap_14D",
    "mcap_30D",
    "mcap_60D",
    "mcap_90D",
  ].forEach((intervalKey) => {
    resultData.forEach((coin) => {
      const currentRank = coin[currentRankKey];
      const intervalRank = coin[`rank_${intervalKey}`];

      if (currentRank !== "N/A" && intervalRank !== "N/A") {
        coin[`rank_chg_${intervalKey}`] = intervalRank - currentRank;
      } else {
        coin[`rank_chg_${intervalKey}`] = "N/A";
      }
    });
  });
}

function extractMarketCapAtInterval(data, intervalDays) {
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
  register(program) {
    program
      .command("mcap")
      .description(
        "Processes data from coinsDataWithMarket.json and calculates market cap changes and rank changes"
      )
      .action(() => {
        const coinsData = JSON.parse(
          fs.readFileSync("coinsDataWithMarket.json", "utf-8")
        );

        const resultData = [];
        coinsData.forEach((coin) => {
          const { market_data } = coin;
          if (market_data) {
            const { market_caps } = market_data;

            const mcap_1D = extractMarketCapAtInterval(market_caps, 1);
            const mcap_7D = extractMarketCapAtInterval(market_caps, 7);
            const mcap_14D = extractMarketCapAtInterval(market_caps, 14);
            const mcap_30D = extractMarketCapAtInterval(market_caps, 30);
            const mcap_60D = extractMarketCapAtInterval(market_caps, 60);
            const mcap_90D = extractMarketCapAtInterval(market_caps, 90);

            const currentMarketCap = coin.market_cap;
            const currentRank = coin.market_cap_rank;

            const mcapIncrease1D = calculateMarketCapIncreaseByInterval(
              market_caps,
              currentMarketCap,
              1
            );
            const mcapIncrease7D = calculateMarketCapIncreaseByInterval(
              market_caps,
              currentMarketCap,
              7
            );
            const mcapIncrease14D = calculateMarketCapIncreaseByInterval(
              market_caps,
              currentMarketCap,
              14
            );
            const mcapIncrease30D = calculateMarketCapIncreaseByInterval(
              market_caps,
              currentMarketCap,
              30
            );
            const mcapIncrease60D = calculateMarketCapIncreaseByInterval(
              market_caps,
              currentMarketCap,
              60
            );
            const mcapIncrease90D = calculateMarketCapIncreaseByInterval(
              market_caps,
              currentMarketCap,
              90
            );

            resultData.push({
              rank: coin.market_cap_rank,
              ticker: coin.symbol.toUpperCase(),

              market_cap: util.formatWithCommas(
                (coin.market_cap / 1e6).toFixed(2)
              ),
              mcap_1D,
              mcap_7D,
              mcap_14D,
              mcap_30D,
              mcap_60D,
              mcap_90D,
              mcap_chng_1D: mcapIncrease1D.toFixed(2),
              mcap_chng_7D: mcapIncrease7D.toFixed(2),
              mcap_chng_14D: mcapIncrease14D.toFixed(2),
              mcap_chng_30D: mcapIncrease30D.toFixed(2),
              mcap_chng_60D: mcapIncrease60D.toFixed(2),
              mcap_chng_90D: mcapIncrease90D.toFixed(2),
            });
          }
        });

        calculateRanks(resultData, "mcap_1D");
        calculateRanks(resultData, "mcap_7D");
        calculateRanks(resultData, "mcap_14D");
        calculateRanks(resultData, "mcap_30D");
        calculateRanks(resultData, "mcap_60D");
        calculateRanks(resultData, "mcap_90D");

        calculateRankChanges(resultData, "rank");

        const columnWidths = {
          rank: Math.max(
            "Rank".length,
            ...resultData.map((row) => row.rank.toString().length + 1)
          ),
          ticker: Math.max(
            "Ticker".length,
            ...resultData.map((row) => row.ticker.length + 1)
          ),

          market_cap: Math.max(
            "MCap".length,
            ...resultData.map((row) => row.market_cap.length + 1)
          ),
          mcap_chng_1D: Math.max(
            "MCap 1D".length,
            ...resultData.map((row) => row.mcap_chng_1D.length + 1)
          ),
          rank_chg_mcap_1D: Math.max("Rank 1D".length),
          mcap_chng_7D: Math.max(
            "MCap 7D".length,
            ...resultData.map((row) => row.mcap_chng_7D.length + 1)
          ),
          rank_chg_mcap_7D: Math.max("Rank 7D".length),
          mcap_chng_14D: Math.max(
            "MCap 14D".length,
            ...resultData.map((row) => row.mcap_chng_14D.length + 1)
          ),
          rank_chg_mcap_14D: Math.max("Rank 14D".length),
          mcap_chng_30D: Math.max(
            "MCap 30D".length,
            ...resultData.map((row) => row.mcap_chng_30D.length + 1)
          ),
          rank_chg_mcap_30D: Math.max("Rank 30D".length),
          mcap_chng_60D: Math.max(
            "MCap 60D".length,
            ...resultData.map((row) => row.mcap_chng_60D.length + 1)
          ),
          rank_chg_mcap_60D: Math.max("Rank 60D".length),
          mcap_chng_90D: Math.max(
            "MCap 90D".length,
            ...resultData.map((row) => row.mcap_chng_90D.length + 1)
          ),
          rank_chg_mcap_90D: Math.max("Rank 90D".length),
        };

        console.log(
          `${chalk.white(util.pad("Rank", columnWidths.rank))} | ` +
            `${chalk.yellow(util.pad("Ticker", columnWidths.ticker))} | ` +
            `${chalk.magenta(
              util.padStart("MCap", columnWidths.market_cap)
            )} | ` +
            `${chalk.magenta(
              util.padStart("MCap 1D", columnWidths.mcap_chng_1D)
            )} | ` +
            `${chalk.magenta(
              util.padStart("Rank 1D", columnWidths.mcap_rank_1D)
            )} | ` +
            `${chalk.magenta(
              util.padStart("MCap 7D", columnWidths.mcap_chng_7D)
            )} | ` +
            `${chalk.magenta(
              util.padStart("Rank 7D", columnWidths.mcap_rank_7D)
            )} | ` +
            `${chalk.magenta(
              util.padStart("MCap 14D", columnWidths.mcap_chng_14D)
            )} | ` +
            `${chalk.magenta(
              util.padStart("Rank 14D", columnWidths.mcap_rank_14D)
            )} | ` +
            `${chalk.magenta(
              util.padStart("MCap 30D", columnWidths.mcap_chng_30D)
            )} | ` +
            `${chalk.magenta(
              util.padStart("Rank 30D", columnWidths.mcap_rank_30D)
            )} | ` +
            `${chalk.magenta(
              util.padStart("MCap 60D", columnWidths.mcap_chng_60D)
            )} | ` +
            `${chalk.magenta(
              util.padStart("Rank 60D", columnWidths.mcap_rank_60D)
            )} | ` +
            `${chalk.magenta(
              util.padStart("MCap 90D", columnWidths.mcap_chng_90D)
            )} | ` +
            `${chalk.magenta(
              util.padStart("Rank 90D", columnWidths.mcap_rank_90D)
            )} | `
        );

        resultData.forEach((row) => {
          if (skipTickers.includes(row.ticker.toUpperCase())) {
            return;
          }

          console.log(
            `${chalk.white(util.pad(row.rank, columnWidths.rank))} | ` +
              `${chalk.yellow(util.pad(row.ticker, columnWidths.ticker))} | ` +
              `${chalk.cyan(
                util.padStart(row.market_cap, columnWidths.market_cap)
              )} | ` +
              `${util.colorizeAndPadStart(
                row.mcap_chng_1D,
                columnWidths.mcap_chng_1D
              )} | ` +
              `${util.colorizeAndPadStart(
                row.rank_chg_mcap_1D,
                columnWidths.rank_chg_mcap_1D,
                true
              )} | ` +
              `${util.colorizeAndPadStart(
                row.mcap_chng_7D,
                columnWidths.mcap_chng_7D
              )} | ` +
              `${util.colorizeAndPadStart(
                row.rank_chg_mcap_7D,
                columnWidths.rank_chg_mcap_7D,
                true
              )} | ` +
              `${util.colorizeAndPadStart(
                row.mcap_chng_14D,
                columnWidths.mcap_chng_14D
              )} | ` +
              `${util.colorizeAndPadStart(
                row.rank_chg_mcap_14D,
                columnWidths.rank_chg_mcap_14D,
                true
              )} | ` +
              `${util.colorizeAndPadStart(
                row.mcap_chng_30D,
                columnWidths.mcap_chng_30D
              )} | ` +
              `${util.colorizeAndPadStart(
                row.rank_chg_mcap_30D,
                columnWidths.rank_chg_mcap_30D,
                true
              )} | ` +
              `${util.colorizeAndPadStart(
                row.mcap_chng_60D,
                columnWidths.mcap_chng_60D
              )} | ` +
              `${util.colorizeAndPadStart(
                row.rank_chg_mcap_60D,
                columnWidths.rank_chg_mcap_60D,
                true
              )} | ` +
              `${util.colorizeAndPadStart(
                row.mcap_chng_90D,
                columnWidths.mcap_chng_90D
              )} | ` +
              `${util.colorizeAndPadStart(
                row.rank_chg_mcap_90D,
                columnWidths.rank_chg_mcap_90D,
                true
              )} | `
          );
        });
      });
  },
};

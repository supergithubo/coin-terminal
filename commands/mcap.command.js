const fs = require("fs");
const chalk = require("chalk");
const util = require("../services/util.service");
const core = require("../services/core.service");

const config = JSON.parse(fs.readFileSync("config.json", "utf-8"));
const skipTickers = config.skip || [];

module.exports = {
  register(program) {
    program
      .command("mcap")
      .description(
        "Processes data from pulled data and calculates market cap changes and rank changes"
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

            const mcap_1D = core.extractMCapAtInterval(market_caps, 1);
            const mcap_7D = core.extractMCapAtInterval(market_caps, 7);
            const mcap_14D = core.extractMCapAtInterval(market_caps, 14);
            const mcap_30D = core.extractMCapAtInterval(market_caps, 30);
            const mcap_60D = core.extractMCapAtInterval(market_caps, 60);
            const mcap_90D = core.extractMCapAtInterval(market_caps, 90);

            const mCapChange1D = core.calculateMCapChangeByInterval(
              market_caps,
              coin.market_cap,
              1
            );
            const mCapChange7D = core.calculateMCapChangeByInterval(
              market_caps,
              coin.market_cap,
              7
            );
            const mCapChange14D = core.calculateMCapChangeByInterval(
              market_caps,
              coin.market_cap,
              14
            );
            const mCapChange30D = core.calculateMCapChangeByInterval(
              market_caps,
              coin.market_cap,
              30
            );
            const mCapChange60D = core.calculateMCapChangeByInterval(
              market_caps,
              coin.market_cap,
              60
            );
            const mCapChange90D = core.calculateMCapChangeByInterval(
              market_caps,
              coin.market_cap,
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
              mcap_chg_1D: util.formatWithPlusSign(mCapChange1D),
              mcap_chg_7D: util.formatWithPlusSign(mCapChange7D),
              mcap_chg_14D: util.formatWithPlusSign(mCapChange14D),
              mcap_chg_30D: util.formatWithPlusSign(mCapChange30D),
              mcap_chg_60D: util.formatWithPlusSign(mCapChange60D),
              mcap_chg_90D: util.formatWithPlusSign(mCapChange90D),
            });
          }
        });

        core.calculateRanks(resultData, "mcap_1D");
        core.calculateRanks(resultData, "mcap_7D");
        core.calculateRanks(resultData, "mcap_14D");
        core.calculateRanks(resultData, "mcap_30D");
        core.calculateRanks(resultData, "mcap_60D");
        core.calculateRanks(resultData, "mcap_90D");

        core.calculateRankChanges(resultData, [
          "mcap_1D",
          "mcap_7D",
          "mcap_14D",
          "mcap_30D",
          "mcap_60D",
          "mcap_90D",
        ], "rank");

        const columnWidths = {
          rank: Math.max(
            "rank".length,
            ...resultData.map((row) => row.rank.toString().length)
          ),
          ticker: Math.max(
            "ticker".length,
            ...resultData.map((row) => row.ticker.length)
          ),

          market_cap: Math.max(
            "mcap".length,
            ...resultData.map((row) => row.market_cap.length)
          ),
          mcap_chg_1D: Math.max(
            "mcap_1d".length,
            ...resultData.map((row) => row.mcap_chg_1D.length + 1)
          ),
          rank_chg_mcap_1D: Math.max("Rank 1D".length),
          mcap_chg_7D: Math.max(
            "mcap_7d".length,
            ...resultData.map((row) => row.mcap_chg_7D.length + 1)
          ),
          rank_chg_mcap_7D: Math.max("Rank 7D".length),
          mcap_chg_14D: Math.max(
            "mcap_14d".length,
            ...resultData.map((row) => row.mcap_chg_14D.length + 1)
          ),
          rank_chg_mcap_14D: Math.max("Rank 14D".length),
          mcap_chg_30D: Math.max(
            "mcap_30d".length,
            ...resultData.map((row) => row.mcap_chg_30D.length + 1)
          ),
          rank_chg_mcap_30D: Math.max("Rank 30D".length),
          mcap_chg_60D: Math.max(
            "mcap_60d".length,
            ...resultData.map((row) => row.mcap_chg_60D.length + 1)
          ),
          rank_chg_mcap_60D: Math.max("Rank 60D".length),
          mcap_chg_90D: Math.max(
            "mcap_90d".length,
            ...resultData.map((row) => row.mcap_chg_90D.length + 1)
          ),
          rank_chg_mcap_90D: Math.max("Rank 90D".length),
        };

        console.log(
          `${chalk.white(util.pad("rank", columnWidths.rank))} | ` +
            `${chalk.yellow(util.pad("ticker", columnWidths.ticker))} | ` +
            `${chalk.magenta(
              util.padStart("mcap", columnWidths.market_cap)
            )} | ` +
            `${chalk.magenta(
              util.padStart("mcap_1d", columnWidths.mcap_chg_1D)
            )} | ` +
            `${chalk.magenta(
              util.padStart("rank_1d", columnWidths.mcap_rank_1D)
            )} | ` +
            `${chalk.magenta(
              util.padStart("mcap_7d", columnWidths.mcap_chg_7D)
            )} | ` +
            `${chalk.magenta(
              util.padStart("rank_7d", columnWidths.mcap_rank_7D)
            )} | ` +
            `${chalk.magenta(
              util.padStart("mcap_14d", columnWidths.mcap_chg_14D)
            )} | ` +
            `${chalk.magenta(
              util.padStart("rank_14d", columnWidths.mcap_rank_14D)
            )} | ` +
            `${chalk.magenta(
              util.padStart("mcap_30d", columnWidths.mcap_chg_30D)
            )} | ` +
            `${chalk.magenta(
              util.padStart("rank_30d", columnWidths.mcap_rank_30D)
            )} | ` +
            `${chalk.magenta(
              util.padStart("mcap_60d", columnWidths.mcap_chg_60D)
            )} | ` +
            `${chalk.magenta(
              util.padStart("rank_60d", columnWidths.mcap_rank_60D)
            )} | ` +
            `${chalk.magenta(
              util.padStart("mcap_90d", columnWidths.mcap_chg_90D)
            )} | ` +
            `${chalk.magenta(
              util.padStart("rank_90d", columnWidths.mcap_rank_90D)
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
                row.mcap_chg_1D,
                columnWidths.mcap_chg_1D
              )} | ` +
              `${util.colorizeAndPadStart(
                row.rank_chg_mcap_1D,
                columnWidths.rank_chg_mcap_1D,
                true
              )} | ` +
              `${util.colorizeAndPadStart(
                row.mcap_chg_7D,
                columnWidths.mcap_chg_7D
              )} | ` +
              `${util.colorizeAndPadStart(
                row.rank_chg_mcap_7D,
                columnWidths.rank_chg_mcap_7D,
                true
              )} | ` +
              `${util.colorizeAndPadStart(
                row.mcap_chg_14D,
                columnWidths.mcap_chg_14D
              )} | ` +
              `${util.colorizeAndPadStart(
                row.rank_chg_mcap_14D,
                columnWidths.rank_chg_mcap_14D,
                true
              )} | ` +
              `${util.colorizeAndPadStart(
                row.mcap_chg_30D,
                columnWidths.mcap_chg_30D
              )} | ` +
              `${util.colorizeAndPadStart(
                row.rank_chg_mcap_30D,
                columnWidths.rank_chg_mcap_30D,
                true
              )} | ` +
              `${util.colorizeAndPadStart(
                row.mcap_chg_60D,
                columnWidths.mcap_chg_60D
              )} | ` +
              `${util.colorizeAndPadStart(
                row.rank_chg_mcap_60D,
                columnWidths.rank_chg_mcap_60D,
                true
              )} | ` +
              `${util.colorizeAndPadStart(
                row.mcap_chg_90D,
                columnWidths.mcap_chg_90D
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

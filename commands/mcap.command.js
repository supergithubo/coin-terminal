const fs = require("fs");
const chalk = require("chalk");
const util = require("../services/util.service");
const core = require("../services/core.service");

const config = JSON.parse(fs.readFileSync("config.json", "utf-8"));
const skipTickers = config.skip || [];
const validSortColumns = [
  "mcap",
  "mcap_1d",
  "mcap_7d",
  "mcap_14d",
  "mcap_30d",
  "mcap_60d",
  "mcap_90d",
  "rank_1d",
  "rank_7d",
  "rank_14d",
  "rank_30d",
  "rank_60d",
  "rank_90d",
];

module.exports = {
  register(program) {
    program
      .command("mcap")
      .description(
        "Processes data from pulled data and calculates market cap changes and rank changes"
      )
      .option(
        "--sort <column>",
        "Sort by specified column (e.g., price, price_1d, price_7d, price_30d, price_60d, price_90d)"
      )
      .option(
        "--order <asc|desc>",
        "Specify sorting order: 'asc' for ascending, 'desc' for descending (default: 'desc')",
        "desc"
      )
      .action((options) => {
        const coinsData = JSON.parse(fs.readFileSync("data.json", "utf-8"));

        let resultData = [];
        coinsData.forEach((coin) => {
          const { market_data } = coin;
          if (market_data) {
            const { market_caps } = market_data;

            const mcap_1d = core.extractMCapAtInterval(market_caps, 1);
            const mcap_7d = core.extractMCapAtInterval(market_caps, 7);
            const mcap_14d = core.extractMCapAtInterval(market_caps, 14);
            const mcap_30d = core.extractMCapAtInterval(market_caps, 30);
            const mcap_60d = core.extractMCapAtInterval(market_caps, 60);
            const mcap_90d = core.extractMCapAtInterval(market_caps, 90);

            const mCapChange1d = core.calculateMCapChangeByInterval(
              market_caps,
              coin.market_cap,
              1
            );
            const mCapChange7d = core.calculateMCapChangeByInterval(
              market_caps,
              coin.market_cap,
              7
            );
            const mCapChange14d = core.calculateMCapChangeByInterval(
              market_caps,
              coin.market_cap,
              14
            );
            const mCapChange30d = core.calculateMCapChangeByInterval(
              market_caps,
              coin.market_cap,
              30
            );
            const mCapChange60d = core.calculateMCapChangeByInterval(
              market_caps,
              coin.market_cap,
              60
            );
            const mCapChange90d = core.calculateMCapChangeByInterval(
              market_caps,
              coin.market_cap,
              90
            );

            resultData.push({
              rank: coin.market_cap_rank,
              ticker: coin.symbol.toUpperCase(),
              price: util.formatWithCommas(coin.current_price.toFixed(2)),
              market_cap: util.formatWithCommas(
                (coin.market_cap / 1e6).toFixed(2)
              ),
              float: (coin.market_cap / coin.fully_diluted_valuation).toFixed(2),
              
              mcap_1d,
              mcap_7d,
              mcap_14d,
              mcap_30d,
              mcap_60d,
              mcap_90d,
              mcap_chg_1d: util.formatWithPlusSign(mCapChange1d),
              mcap_chg_7d: util.formatWithPlusSign(mCapChange7d),
              mcap_chg_14d: util.formatWithPlusSign(mCapChange14d),
              mcap_chg_30d: util.formatWithPlusSign(mCapChange30d),
              mcap_chg_60d: util.formatWithPlusSign(mCapChange60d),
              mcap_chg_90d: util.formatWithPlusSign(mCapChange90d),
            });
          }
        });

        core.calculateRanks(resultData, "mcap_1d");
        core.calculateRanks(resultData, "mcap_7d");
        core.calculateRanks(resultData, "mcap_14d");
        core.calculateRanks(resultData, "mcap_30d");
        core.calculateRanks(resultData, "mcap_60d");
        core.calculateRanks(resultData, "mcap_90d");

        core.calculateRankChanges(
          resultData,
          [
            "mcap_1d",
            "mcap_7d",
            "mcap_14d",
            "mcap_30d",
            "mcap_60d",
            "mcap_90d",
          ],
          "rank"
        );

        resultData = resultData.map((row) => ({
          rank: row.rank,
          ticker: row.ticker,
          price: row.price,
          mcap: row.market_cap,
          float: row.float,

          mcap_1d: row.mcap_chg_1d,
          mcap_7d: row.mcap_chg_7d,
          mcap_14d: row.mcap_chg_14d,
          mcap_30d: row.mcap_chg_30d,
          mcap_60d: row.mcap_chg_60d,
          mcap_90d: row.mcap_chg_90d,
          rank_1d: row.rank_chg_mcap_1d,
          rank_7d: row.rank_chg_mcap_7d,
          rank_14d: row.rank_chg_mcap_14d,
          rank_30d: row.rank_chg_mcap_30d,
          rank_60d: row.rank_chg_mcap_60d,
          rank_90d: row.rank_chg_mcap_90d,
        }));

        if (options.sort && !validSortColumns.includes(options.sort)) {
          console.log(
            chalk.red(
              `Invalid sort column: ${
                options.sort
              }. Valid columns are: ${validSortColumns.join(", ")}`
            )
          );
          return;
        }

        if (options.sort) {
          const sortColumn = options.sort.toLowerCase();
          const isAscending = options.order === "asc";
          util.sort(resultData, sortColumn, isAscending);
        }

        const columnWidths = {
          rank: Math.max(
            "rank".length,
            ...resultData.map((row) => row.rank.toString().length)
          ),
          ticker: Math.max(
            "ticker".length,
            ...resultData.map((row) => row.ticker.length)
          ),
          price: Math.max(
            "price".length,
            ...resultData.map((row) => row.price.length)
          ),
          mcap: Math.max(
            "mcap".length,
            ...resultData.map((row) => row.mcap.length)
          ),
          float: Math.max(
            "float".length,
            ...resultData.map((row) => row.float.length)
          ),

          mcap_1d: Math.max(
            "mcap_1d".length,
            ...resultData.map((row) => row.mcap_1d.length + 1)
          ),
          rank_1d: Math.max("Rank 1d".length),
          mcap_7d: Math.max(
            "mcap_7d".length,
            ...resultData.map((row) => row.mcap_7d.length + 1)
          ),
          rank_7d: Math.max("Rank 7d".length),
          mcap_14d: Math.max(
            "mcap_14d".length,
            ...resultData.map((row) => row.mcap_14d.length + 1)
          ),
          rank_14d: Math.max("Rank 14d".length),
          mcap_30d: Math.max(
            "mcap_30d".length,
            ...resultData.map((row) => row.mcap_30d.length + 1)
          ),
          rank_30d: Math.max("Rank 30d".length),
          mcap_60d: Math.max(
            "mcap_60d".length,
            ...resultData.map((row) => row.mcap_60d.length + 1)
          ),
          rank_60d: Math.max("Rank 60d".length),
          mcap_90d: Math.max(
            "mcap_90d".length,
            ...resultData.map((row) => row.mcap_90d.length + 1)
          ),
          rank_90d: Math.max("Rank 90d".length),
        };

        console.log(
          `${chalk.white(util.pad("rank", columnWidths.rank))} | ` +
            `${chalk.yellow(util.pad("ticker", columnWidths.ticker))} | ` +
            `${chalk.cyan(util.padStart("price", columnWidths.price))} | ` +
            `${chalk.cyan(util.padStart("mcap", columnWidths.mcap))} | ` +
            `${chalk.cyan(util.padStart("float", columnWidths.float))} | ` +

            `${chalk.white(
              util.padStart("mcap_1d", columnWidths.mcap_1d)
            )} | ` +
            `${chalk.white(
              util.padStart("rank_1d", columnWidths.rank_1d)
            )} | ` +
            `${chalk.white(
              util.padStart("mcap_7d", columnWidths.mcap_7d)
            )} | ` +
            `${chalk.white(
              util.padStart("rank_7d", columnWidths.rank_7d)
            )} | ` +
            `${chalk.white(
              util.padStart("mcap_14d", columnWidths.mcap_14d)
            )} | ` +
            `${chalk.white(
              util.padStart("rank_14d", columnWidths.rank_14d)
            )} | ` +
            `${chalk.white(
              util.padStart("mcap_30d", columnWidths.mcap_30d)
            )} | ` +
            `${chalk.white(
              util.padStart("rank_30d", columnWidths.rank_30d)
            )} | ` +
            `${chalk.white(
              util.padStart("mcap_60d", columnWidths.mcap_60d)
            )} | ` +
            `${chalk.white(
              util.padStart("rank_60d", columnWidths.rank_60d)
            )} | ` +
            `${chalk.white(
              util.padStart("mcap_90d", columnWidths.mcap_90d)
            )} | ` +
            `${chalk.white(
              util.padStart("rank_90d", columnWidths.rank_90d)
            )} | `
        );

        resultData.forEach((row) => {
          if (skipTickers.includes(row.ticker.toUpperCase())) {
            return;
          }

          console.log(
            `${chalk.white(util.pad(row.rank, columnWidths.rank))} | ` +
              `${chalk.yellow(util.pad(row.ticker, columnWidths.ticker))} | ` +
              `${chalk.cyan(util.padStart(row.price, columnWidths.price))} | ` +
              `${chalk.cyan(util.padStart(row.mcap, columnWidths.mcap))} | ` +
              `${chalk.cyan(util.padStart(row.float, columnWidths.float))} | ` +

              `${util.colorizeAndPadStart(
                row.mcap_1d,
                columnWidths.mcap_1d
              )} | ` +
              `${util.colorizeAndPadStart(
                row.rank_1d,
                columnWidths.rank_1d,
                true
              )} | ` +
              `${util.colorizeAndPadStart(
                row.mcap_7d,
                columnWidths.mcap_7d
              )} | ` +
              `${util.colorizeAndPadStart(
                row.rank_7d,
                columnWidths.rank_7d,
                true
              )} | ` +
              `${util.colorizeAndPadStart(
                row.mcap_14d,
                columnWidths.mcap_14d
              )} | ` +
              `${util.colorizeAndPadStart(
                row.rank_14d,
                columnWidths.rank_14d,
                true
              )} | ` +
              `${util.colorizeAndPadStart(
                row.mcap_30d,
                columnWidths.mcap_30d
              )} | ` +
              `${util.colorizeAndPadStart(
                row.rank_30d,
                columnWidths.rank_30d,
                true
              )} | ` +
              `${util.colorizeAndPadStart(
                row.mcap_60d,
                columnWidths.mcap_60d
              )} | ` +
              `${util.colorizeAndPadStart(
                row.rank_60d,
                columnWidths.rank_60d,
                true
              )} | ` +
              `${util.colorizeAndPadStart(
                row.mcap_90d,
                columnWidths.mcap_90d
              )} | ` +
              `${util.colorizeAndPadStart(
                row.rank_90d,
                columnWidths.rank_90d,
                true
              )} | `
          );
        });
      });
  },
};

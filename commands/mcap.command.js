// commands/mcap.command.js

const fs = require("fs");
const chalk = require("chalk");
const util = require("../services/util.service");
const core = require("../services/core.service");

const config = JSON.parse(fs.readFileSync("config.json", "utf-8"));
const skipTickers = config.skip || [];
const validSortColumns = [
  "mcap_1d",
  "mcap_7d",
  "mcap_14d",
  "mcap_30d",
  "mcap_60d",
  "mcap_90d",
  "ws_1d",
  "ws_7d",
  "ws_14d",
  "ws_30d",
  "ws_60d",
  "ws_90d",
];

module.exports = {
  register(program) {
    program
      .command("mcap")
      .description(
        "Processes data from pulled data and calculates market cap changes and weighted share (ws) flow"
      )
      .option(
        "--sort <column>",
        "Sort by specified column (e.g., mcap_1d, mcap_7d, mcap_30d, mcap_60d, mcap_90d, ws_1d, ws_7d, ws_30d, ws_60d, ws_90d)"
      )
      .option(
        "--order <asc|desc>",
        "Specify sorting order: 'asc' for ascending, 'desc' for descending",
        "desc"
      )
      .option(
        "--above <interval>",
        "Filter the results to only show positive mcap change for a specified interval (mcap_1d, mcap_7d, mcap_30d, mcap_60d, mcap_90d)"
      )
      .option(
        "--below <interval>",
        "Filter the results to only show negative mcap change for a specified interval (mcap_1d, mcap_7d, mcap_30d, mcap_60d, mcap_90d)"
      )
      .option(
        "--category <category>",
        "Filter the results by category (e.g., 'Smart Contract Platform')"
      )
      .action((options) => {
        let coinsData = JSON.parse(fs.readFileSync("data.json", "utf-8"));
        let categoriesData = JSON.parse(
          fs.readFileSync("categories.json", "utf-8")
        );

        let resultData = [];
        coinsData = coinsData.map((coin) => {
          const category = categoriesData.find((cat) => cat.id === coin.id);
          return { ...coin, categories: category ? category.categories : [] };
        });

        let totalMcap = 0;

        let totalMcapChanged_1d = 0;
        let totalMcapChanged_7d = 0;
        let totalMcapChanged_14d = 0;
        let totalMcapChanged_30d = 0;
        let totalMcapChanged_60d = 0;
        let totalMcapChanged_90d = 0;

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

            totalMcap += coin.market_cap;

            totalMcapChanged_1d += mCapChange1d;
            totalMcapChanged_7d += mCapChange7d;
            totalMcapChanged_14d += mCapChange14d;
            totalMcapChanged_30d += mCapChange30d;
            totalMcapChanged_60d += mCapChange60d;
            totalMcapChanged_90d += mCapChange90d;

            resultData.push({
              rank: coin.market_cap_rank,
              categories: coin.categories,
              ticker: coin.symbol.toUpperCase(),
              price: util.formatWithCommas(coin.current_price.toFixed(2)),
              market_cap: util.formatWithCommas(
                (coin.market_cap / 1e6).toFixed(2)
              ),
              float: (coin.market_cap / coin.fully_diluted_valuation).toFixed(
                2
              ),

              mcap_1d,
              mcap_7d,
              mcap_14d,
              mcap_30d,
              mcap_60d,
              mcap_90d,
              mCapChange1d,
              mCapChange7d,
              mCapChange14d,
              mCapChange30d,
              mCapChange60d,
              mCapChange90d,
              mcap_chg_1d: util.formatWithPlusSign(mCapChange1d),
              mcap_chg_7d: util.formatWithPlusSign(mCapChange7d),
              mcap_chg_14d: util.formatWithPlusSign(mCapChange14d),
              mcap_chg_30d: util.formatWithPlusSign(mCapChange30d),
              mcap_chg_60d: util.formatWithPlusSign(mCapChange60d),
              mcap_chg_90d: util.formatWithPlusSign(mCapChange90d),
            });
          }
        });

        resultData = resultData.map((row) => {
          return {
            rank: row.rank,
            ticker: row.ticker,
            categories: row.categories,
            price: row.price,
            mcap: row.market_cap,
            float: row.float,

            mcap_1d: row.mcap_chg_1d,
            mcap_7d: row.mcap_chg_7d,
            mcap_14d: row.mcap_chg_14d,
            mcap_30d: row.mcap_chg_30d,
            mcap_60d: row.mcap_chg_60d,
            mcap_90d: row.mcap_chg_90d,

            ws_1d: (
              (row.mCapChange1d / totalMcapChanged_1d -
                parseFloat(row.market_cap) / totalMcap) *
              1000
            ).toFixed(2),
            ws_7d: (
              (row.mCapChange7d / totalMcapChanged_7d -
                parseFloat(row.market_cap) / totalMcap) *
              1000
            ).toFixed(2),
            ws_14d: (
              (row.mCapChange14d / totalMcapChanged_14d -
                parseFloat(row.market_cap) / totalMcap) *
              1000
            ).toFixed(2),
            ws_30d: (
              (row.mCapChange30d / totalMcapChanged_30d -
                parseFloat(row.market_cap) / totalMcap) *
              1000
            ).toFixed(2),
            ws_60d: (
              (row.mCapChange60d / totalMcapChanged_60d -
                parseFloat(row.market_cap) / totalMcap) *
              1000
            ).toFixed(2),
            ws_90d: (
              (row.mCapChange90d / totalMcapChanged_90d -
                parseFloat(row.market_cap) / totalMcap) *
              1000
            ).toFixed(2),
          };
        });

        if (options.above) {
          const filterInterval = options.above.toLowerCase();

          resultData = resultData.filter((row) => {
            if (filterInterval === "mcap_1d" && row.mcap_1d > 0) return true;
            if (filterInterval === "mcap_7d" && row.mcap_7d > 0) return true;
            if (filterInterval === "mcap_14d" && row.mcap_14d > 0) return true;
            if (filterInterval === "mcap_30d" && row.mcap_30d > 0) return true;
            if (filterInterval === "mcap_60d" && row.mcap_60d > 0) return true;
            if (filterInterval === "mcap_90d" && row.mcap_90d > 0) return true;
            return false;
          });
        }

        if (options.below) {
          const filterInterval = options.below.toLowerCase();

          resultData = resultData.filter((row) => {
            if (filterInterval === "mcap_1d" && row.mcap_1d < 0) return true;
            if (filterInterval === "mcap_7d" && row.mcap_7d < 0) return true;
            if (filterInterval === "mcap_14d" && row.mcap_14d < 0) return true;
            if (filterInterval === "mcap_30d" && row.mcap_30d < 0) return true;
            if (filterInterval === "mcap_60d" && row.mcap_60d < 0) return true;
            if (filterInterval === "mcap_90d" && row.mcap_90d < 0) return true;
            return false;
          });
        }

        if (options.category) {
          const categoryFilter = options.category.toLowerCase();

          resultData = resultData.filter((row) => {
            return row.categories.some((category) =>
              category.toLowerCase().includes(categoryFilter)
            );
          });
        }

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
          mcap_7d: Math.max(
            "mcap_7d".length,
            ...resultData.map((row) => row.mcap_7d.length + 1)
          ),
          mcap_14d: Math.max(
            "mcap_14d".length,
            ...resultData.map((row) => row.mcap_14d.length + 1)
          ),
          mcap_30d: Math.max(
            "mcap_30d".length,
            ...resultData.map((row) => row.mcap_30d.length + 1)
          ),
          mcap_60d: Math.max(
            "mcap_60d".length,
            ...resultData.map((row) => row.mcap_60d.length + 1)
          ),
          mcap_90d: Math.max(
            "mcap_90d".length,
            ...resultData.map((row) => row.mcap_90d.length + 1)
          ),
          ws_1d: Math.max(
            "ws_1d".length,
            ...resultData.map((row) => row.ws_1d.length + 2)
          ),
          ws_7d: Math.max(
            "ws_7d".length,
            ...resultData.map((row) => row.ws_7d.length + 2)
          ),
          ws_14d: Math.max(
            "ws_14d".length,
            ...resultData.map((row) => row.ws_14d.length + 2)
          ),
          ws_30d: Math.max(
            "ws_30d".length,
            ...resultData.map((row) => row.ws_30d.length + 2)
          ),
          ws_60d: Math.max(
            "ws_60d".length,
            ...resultData.map((row) => row.ws_60d.length + 2)
          ),
          ws_90d: Math.max(
            "ws_90d".length,
            ...resultData.map((row) => row.ws_90d.length + 2)
          ),
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
              util.padStart("mcap_7d", columnWidths.mcap_7d)
            )} | ` +
            `${chalk.white(
              util.padStart("mcap_14d", columnWidths.mcap_14d)
            )} | ` +
            `${chalk.white(
              util.padStart("mcap_30d", columnWidths.mcap_30d)
            )} | ` +
            `${chalk.white(
              util.padStart("mcap_60d", columnWidths.mcap_60d)
            )} | ` +
            `${chalk.white(
              util.padStart("mcap_90d", columnWidths.mcap_90d)
            )} | ` +
            `${chalk.white(util.padStart("ws_1d", columnWidths.ws_1d))} | ` +
            `${chalk.white(
              util.padStart("ws_7d", columnWidths.ws_7d - 1)
            )} | ` +
            `${chalk.white(
              util.padStart("ws_14d", columnWidths.ws_14d - 1)
            )} | ` +
            `${chalk.white(
              util.padStart("ws_30d", columnWidths.ws_30d - 1)
            )} | ` +
            `${chalk.white(
              util.padStart("ws_60d", columnWidths.ws_60d - 1)
            )} | ` +
            `${chalk.white(
              util.padStart("ws_90d", columnWidths.ws_90d - 1)
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
                row.mcap_7d,
                columnWidths.mcap_7d
              )} | ` +
              `${util.colorizeAndPadStart(
                row.mcap_14d,
                columnWidths.mcap_14d
              )} | ` +
              `${util.colorizeAndPadStart(
                row.mcap_30d,
                columnWidths.mcap_30d
              )} | ` +
              `${util.colorizeAndPadStart(
                row.mcap_60d,
                columnWidths.mcap_60d
              )} | ` +
              `${util.colorizeAndPadStart(
                row.mcap_90d,
                columnWidths.mcap_90d
              )} | ` +
              `${util.colorizeAndPadStart2(
                row.ws_1d + "%",
                columnWidths.ws_1d
              )} |` +
              `${util.colorizeAndPadStart2(
                row.ws_7d + "%",
                columnWidths.ws_7d
              )} |` +
              `${util.colorizeAndPadStart2(
                row.ws_14d + "%",
                columnWidths.ws_14d
              )} |` +
              `${util.colorizeAndPadStart2(
                row.ws_30d + "%",
                columnWidths.ws_30d
              )} |` +
              `${util.colorizeAndPadStart2(
                row.ws_60d + "%",
                columnWidths.ws_60d
              )} |` +
              `${util.colorizeAndPadStart2(
                row.ws_90d + "%",
                columnWidths.ws_90d
              )} |`
          );
        });
      });
  },
};

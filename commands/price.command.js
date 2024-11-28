// commands/price.command.js

const fs = require("fs");
const chalk = require("chalk");
const util = require("../services/util.service");
const core = require("../services/core.service");

const config = JSON.parse(fs.readFileSync("config.json", "utf-8"));
const skipTickers = config.skip || [];
const validSortColumns = [
  "price_1d",
  "price_7d",
  "price_14d",
  "price_30d",
  "price_60d",
  "price_90d",
];

module.exports = {
  register(program) {
    program
      .command("price")
      .description(
        "Processes data from pulled data and calculates price changes"
      )
      .option(
        "--sort <column>",
        "Sort by specified column (e.g., price_1d, price_7d, price_30d, price_60d, price_90d)"
      )
      .option(
        "--order <asc|desc>",
        "Specify sorting order: 'asc' for ascending, 'desc' for descending",
        "desc"
      )
      .option(
        "--above <interval>",
        "Filter the results to only show positive price change for a specified interval (price_1d, price_7d, price_30d, price_60d, price_90d)"
      )
      .option(
        "--below <interval>",
        "Filter the results to only show negative price change for a specified interval (price_1d, price_7d, price_30d, price_60d, price_90d)"
      )
      .action((options) => {
        const coinsData = JSON.parse(fs.readFileSync("data.json", "utf-8"));

        let resultData = [];
        coinsData.forEach((coin) => {
          if (skipTickers.includes(coin.symbol.toUpperCase())) {
            return;
          }

          const { market_data } = coin;
          if (market_data) {
            const { prices } = market_data;

            const price1d = core.calculatePricePctChangeByInterval(
              prices,
              coin.current_price,
              1
            );
            const price7d = core.calculatePricePctChangeByInterval(
              prices,
              coin.current_price,
              7
            );
            const price14d = core.calculatePricePctChangeByInterval(
              prices,
              coin.current_price,
              14
            );
            const price30d = core.calculatePricePctChangeByInterval(
              prices,
              coin.current_price,
              30
            );
            const price60d = core.calculatePricePctChangeByInterval(
              prices,
              coin.current_price,
              60
            );
            const price90d = core.calculatePricePctChangeByInterval(
              prices,
              coin.current_price,
              90
            );

            resultData.push({
              rank: coin.market_cap_rank,
              ticker: coin.symbol.toUpperCase(),
              price: util.formatWithCommas(coin.current_price.toFixed(2)),
              mcap: util.formatWithCommas((coin.market_cap / 1e6).toFixed(2)),
              float: (coin.market_cap / coin.fully_diluted_valuation).toFixed(
                2
              ),

              price_1d: util.formatWithPlusSign(price1d),
              price_7d: util.formatWithPlusSign(price7d),
              price_14d: util.formatWithPlusSign(price14d),
              price_30d: util.formatWithPlusSign(price30d),
              price_60d: util.formatWithPlusSign(price60d),
              price_90d: util.formatWithPlusSign(price90d),
            });
          }
        });

        if (options.above) {
          const filterInterval = options.above.toLowerCase();

          resultData = resultData.filter((row) => {
            if (filterInterval === "price_1d" && row.price_1d > 0) return true;
            if (filterInterval === "price_7d" && row.price_7d > 0) return true;
            if (filterInterval === "price_14d" && row.price_14d > 0) return true;
            if (filterInterval === "price_30d" && row.price_30d > 0) return true;
            if (filterInterval === "price_60d" && row.price_60d > 0) return true;
            if (filterInterval === "price_90d" && row.price_90d > 0) return true;
            return false;
          });
        }

        if (options.below) {
          const filterInterval = options.below.toLowerCase();

          resultData = resultData.filter((row) => {
            if (filterInterval === "price_1d" && row.price_1d < 0) return true;
            if (filterInterval === "price_7d" && row.price_7d < 0) return true;
            if (filterInterval === "price_14d" && row.price_14d < 0) return true;
            if (filterInterval === "price_30d" && row.price_30d < 0) return true;
            if (filterInterval === "price_60d" && row.price_60d < 0) return true;
            if (filterInterval === "price_90d" && row.price_90d < 0) return true;
            return false;
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

          price_1d: Math.max(
            "price_1d".length,
            ...resultData.map((row) => row.price_1d.length + 2)
          ),
          price_7d: Math.max(
            "price_7d".length,
            ...resultData.map((row) => row.price_7d.length + 2)
          ),
          price_14d: Math.max(
            "price_14d".length,
            ...resultData.map((row) => row.price_14d.length + 2)
          ),
          price_30d: Math.max(
            "price_30d".length,
            ...resultData.map((row) => row.price_30d.length + 2)
          ),
          price_60d: Math.max(
            "price_60d".length,
            ...resultData.map((row) => row.price_60d.length + 2)
          ),
          price_90d: Math.max(
            "price_90d".length,
            ...resultData.map((row) => row.price_90d.length + 2)
          ),
        };

        console.log(
          `${chalk.white(util.pad("rank", columnWidths.rank))} | ` +
            `${chalk.yellow(util.pad("ticker", columnWidths.ticker))} | ` +
            `${chalk.cyan(util.padStart("price", columnWidths.price))} | ` +
            `${chalk.cyan(util.padStart("mcap", columnWidths.mcap))} | ` +
            `${chalk.cyan(util.padStart("float", columnWidths.float))} | ` +
            `${chalk.white(
              util.padStart("price_1d", columnWidths.price_1d)
            )} | ` +
            `${chalk.white(
              util.padStart("price_7d", columnWidths.price_7d)
            )} | ` +
            `${chalk.white(
              util.padStart("price_14d", columnWidths.price_14d)
            )} | ` +
            `${chalk.white(
              util.padStart("price_30d", columnWidths.price_30d)
            )} | ` +
            `${chalk.white(
              util.padStart("price_60d", columnWidths.price_60d)
            )} | ` +
            `${chalk.white(util.padStart("price_90d", columnWidths.price_90d))}`
        );

        resultData.forEach((row) => {
          console.log(
            `${chalk.white(util.pad(row.rank, columnWidths.rank))} | ` +
              `${chalk.yellow(util.pad(row.ticker, columnWidths.ticker))} | ` +
              `${chalk.cyan(util.padStart(row.price, columnWidths.price))} | ` +
              `${chalk.cyan(util.padStart(row.mcap, columnWidths.mcap))} | ` +
              `${chalk.cyan(util.padStart(row.float, columnWidths.float))} | ` +
              `${util.colorizeAndPadStart(
                row.price_1d + "%",
                columnWidths.price_1d
              )} | ` +
              `${util.colorizeAndPadStart(
                row.price_7d + "%",
                columnWidths.price_7d
              )} | ` +
              `${util.colorizeAndPadStart(
                row.price_14d + "%",
                columnWidths.price_14d
              )} | ` +
              `${util.colorizeAndPadStart(
                row.price_30d + "%",
                columnWidths.price_30d
              )} | ` +
              `${util.colorizeAndPadStart(
                row.price_60d + "%",
                columnWidths.price_60d
              )} | ` +
              `${util.colorizeAndPadStart(
                row.price_90d + "%",
                columnWidths.price_90d
              )} |`
          );
        });
      });
  },
};

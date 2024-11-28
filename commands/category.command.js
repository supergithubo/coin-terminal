// commands/category.command.js

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
];

module.exports = {
  register(program) {
    program
      .command("category")
      .description(
        "Processes category group from pulled data and calculates market cap changes"
      )
      .option(
        "--sort <column>",
        "Sort by specified column (e.g., mcap_1d, mcap_7d, mcap_30d, mcap_60d, mcap_90d)"
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
      .action((options) => {
        let coinsData = JSON.parse(fs.readFileSync("data.json", "utf-8"));
        let categoriesData = JSON.parse(fs.readFileSync("categories.json", "utf-8"));

        coinsData = coinsData.filter((coin)=>!skipTickers.includes(coin.symbol.toUpperCase()));

        let resultData = [];

        const mergedData = coinsData.map(coin => {
          const category = categoriesData.find(cat => cat.id === coin.id);
          return { ...coin, categories: category ? category.categories : [] };
        });

        mergedData.reduce((acc, coin) => {
          coin.categories.forEach(category => {
            if (!acc[category]) {
              acc[category] = [];
            }
            acc[category].push(coin);
          });
          return acc;
        }, {});

        const groupedByCategory = mergedData.reduce((acc, coin) => {
          coin.categories.forEach(category => {
            if (!acc[category]) {
              acc[category] = [];
            }
            acc[category].push(coin);
          });
          return acc;
        }, {});

        Object.keys(groupedByCategory).forEach((category) => {
          const coinsInCategory = groupedByCategory[category];

          const aggregatedData = coinsInCategory.reduce(
            (acc, coin) => {
              const { market_data, current_price, market_cap } = coin;
              if (market_data) {
                const { market_caps, prices } = market_data;

                acc.mcap += market_cap;
              
                acc.mcap_1d += core.extractMCapAtInterval(market_caps, 1);
                acc.mcap_7d += core.extractMCapAtInterval(market_caps, 7);
                acc.mcap_14d += core.extractMCapAtInterval(market_caps, 14);
                acc.mcap_30d += core.extractMCapAtInterval(market_caps, 30);
                acc.mcap_60d += core.extractMCapAtInterval(market_caps, 60);
                acc.mcap_90d += core.extractMCapAtInterval(market_caps, 90);

                acc.mcap_chg_1d += core.calculateMCapChangeByInterval(market_caps, market_cap, 1);
                acc.mcap_chg_7d += core.calculateMCapChangeByInterval(market_caps, market_cap, 7);
                acc.mcap_chg_14d += core.calculateMCapChangeByInterval(market_caps, market_cap, 14);
                acc.mcap_chg_30d += core.calculateMCapChangeByInterval(market_caps, market_cap, 30);
                acc.mcap_chg_60d += core.calculateMCapChangeByInterval(market_caps, market_cap, 60);
                acc.mcap_chg_90d += core.calculateMCapChangeByInterval(market_caps, market_cap, 90);
              }
              return acc;
            },
            {
              mcap: 0,
              
              mcap_1d: 0,
              mcap_7d: 0,
              mcap_14d: 0,
              mcap_30d: 0,
              mcap_60d: 0,
              mcap_90d: 0,

              mcap_chg_1d: 0,
              mcap_chg_7d: 0,
              mcap_chg_14d: 0,
              mcap_chg_30d: 0,
              mcap_chg_60d: 0,
              mcap_chg_90d: 0
            }
          );

          resultData.push({
            ticker: category,
            ...aggregatedData,
          });
        });

        resultData = resultData.map((row) => ({
          ticker: row.ticker,
          
          mcap: util.formatWithCommas(
            (row.mcap / 1e6).toFixed(2)
          ),
          mcap_1d: util.formatWithPlusSign(row.mcap_chg_1d),
          mcap_7d: util.formatWithPlusSign(row.mcap_chg_7d),
          mcap_14d: util.formatWithPlusSign(row.mcap_chg_14d),
          mcap_30d: util.formatWithPlusSign(row.mcap_chg_30d),
          mcap_60d: util.formatWithPlusSign(row.mcap_chg_60d),
          mcap_90d: util.formatWithPlusSign(row.mcap_chg_90d),
        }));

        util.sort(resultData, "mcap", false);

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
          ticker: Math.max(
            "ticker".length,
            ...resultData.map((row) => row.ticker.length)
          ),
          mcap: Math.max(
            "mcap".length,
            ...resultData.map((row) => row.mcap.length)
          ),

          mcap_1d: Math.max(
            "mcap_1d".length,
            ...resultData.map((row) => row.mcap_1d.length + 2)
          ),
          mcap_7d: Math.max(
            "mcap_7d".length,
            ...resultData.map((row) => row.mcap_7d.length + 2)
          ),
          mcap_14d: Math.max(
            "mcap_14d".length,
            ...resultData.map((row) => row.mcap_14d.length + 2)
          ),
          mcap_30d: Math.max(
            "mcap_30d".length,
            ...resultData.map((row) => row.mcap_30d.length + 2)
          ),
          mcap_60d: Math.max(
            "mcap_60d".length,
            ...resultData.map((row) => row.mcap_60d.length + 2)
          ),
          mcap_90d: Math.max(
            "mcap_90d".length,
            ...resultData.map((row) => row.mcap_90d.length + 2)
          )
        };

        console.log(
            `${chalk.yellow(util.pad("ticker", columnWidths.ticker))} | ` +
            `${chalk.cyan(util.padStart("mcap", columnWidths.mcap))} | ` +
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
            )} | `
        );

        resultData.forEach((row) => {
          console.log(
              `${chalk.yellow(util.pad(row.ticker, columnWidths.ticker))} | ` +
              `${chalk.cyan(util.padStart(row.mcap, columnWidths.mcap))} | ` +
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
              )} | `
          );
        });
      });
  },
};

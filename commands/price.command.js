const fs = require("fs");
const chalk = require("chalk");
const util = require("../services/util.service");
const core = require("../services/core.service");

const config = JSON.parse(fs.readFileSync("config.json", "utf-8"));
const skipTickers = config.skip || [];

module.exports = {
  register(program) {
    program
      .command("price")
      .description(
        "Processes data from pulled data and calculates price changes"
      )
      .action(() => {
        const coinsData = JSON.parse(
          fs.readFileSync("data.json", "utf-8")
        );

        const resultData = [];
        coinsData.forEach((coin) => {
          if (skipTickers.includes(coin.symbol.toUpperCase())) {
            return;
          }

          const { market_data } = coin;
          if (market_data) {
            const { prices } = market_data;

            const price1D = core.calculatePricePctChangeByInterval(
              prices,
              coin.current_price,
              1
            );
            const price7D = core.calculatePricePctChangeByInterval(
              prices,
              coin.current_price,
              7
            );
            const price14D = core.calculatePricePctChangeByInterval(
              prices,
              coin.current_price,
              14
            );
            const price30D = core.calculatePricePctChangeByInterval(
              prices,
              coin.current_price,
              30
            );
            const price60D = core.calculatePricePctChangeByInterval(
              prices,
              coin.current_price,
              60
            );
            const price90D = core.calculatePricePctChangeByInterval(
              prices,
              coin.current_price,
              90
            );

            resultData.push({
              rank: coin.market_cap_rank,
              ticker: coin.symbol.toUpperCase(),

              price: util.formatWithCommas(coin.current_price.toFixed(2)),
              price_1D: util.formatWithPlusSign(price1D),
              price_7D: util.formatWithPlusSign(price7D),
              price_14D: util.formatWithPlusSign(price14D),
              price_30D: util.formatWithPlusSign(price30D),
              price_60D: util.formatWithPlusSign(price60D),
              price_90D: util.formatWithPlusSign(price90D),
            });
          }
        });

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
          price_1D: Math.max(
            "price_1d".length,
            ...resultData.map((row) => row.price_1D.length + 2)
          ),
          price_7D: Math.max(
            "price_7d".length,
            ...resultData.map((row) => row.price_7D.length + 2)
          ),
          price_14D: Math.max(
            "price_14d".length,
            ...resultData.map((row) => row.price_14D.length + 2)
          ),
          price_30D: Math.max(
            "price_30d".length,
            ...resultData.map((row) => row.price_30D.length + 2)
          ),
          price_60D: Math.max(
            "price_60d".length,
            ...resultData.map((row) => row.price_60D.length + 2)
          ),
          price_90D: Math.max(
            "price_90d".length,
            ...resultData.map((row) => row.price_90D.length + 2)
          ),
        };

        console.log(
          `${chalk.white(util.pad("rank", columnWidths.rank))} | ` +
            `${chalk.yellow(util.pad("ticker", columnWidths.ticker))} | ` +
            `${chalk.cyan(util.padStart("price", columnWidths.price))} | ` +
            `${chalk.white(
              util.padStart("price_1d", columnWidths.price_1D)
            )} | ` +
            `${chalk.white(
              util.padStart("price_7d", columnWidths.price_7D)
            )} | ` +
            `${chalk.white(
              util.padStart("price_14d", columnWidths.price_14D)
            )} | ` +
            `${chalk.white(
              util.padStart("price_30d", columnWidths.price_30D)
            )} | ` +
            `${chalk.white(
              util.padStart("price_60d", columnWidths.price_60D)
            )} | ` +
            `${chalk.white(util.padStart("price_90d", columnWidths.price_90D))}`
        );

        resultData.forEach((row) => {
          console.log(
            `${chalk.white(util.pad(row.rank, columnWidths.rank))} | ` +
              `${chalk.yellow(util.pad(row.ticker, columnWidths.ticker))} | ` +
              `${chalk.cyan(util.padStart(row.price, columnWidths.price))} | ` +
              `${util.colorizeAndPadStart(
                row.price_1D + '%',
                columnWidths.price_1D
              )} | ` +
              `${util.colorizeAndPadStart(
                row.price_7D + '%',
                columnWidths.price_7D
              )} | ` +
              `${util.colorizeAndPadStart(
                row.price_14D + '%',
                columnWidths.price_14D
              )} | ` +
              `${util.colorizeAndPadStart(
                row.price_30D + '%',
                columnWidths.price_30D
              )} | ` +
              `${util.colorizeAndPadStart(
                row.price_60D + '%',
                columnWidths.price_60D
              )} | ` +
              `${util.colorizeAndPadStart(
                row.price_90D + '%',
                columnWidths.price_90D
              )} |`
          );
        });
      });
  },
};

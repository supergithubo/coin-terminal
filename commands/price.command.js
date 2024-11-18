const fs = require("fs");
const chalk = require("chalk");
const util = require("../services/util.service");

const config = JSON.parse(fs.readFileSync("config.json", "utf-8"));
const skipTickers = config.skip || [];

function calculatePercentageChangeByInterval(data, currentValue, intervalDays) {
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

  const valueStart = targetData[1];
  return ((currentValue - valueStart) / valueStart) * 100;
}

module.exports = {
  register(program) {
    program
      .command("price")
      .description(
        "Processes data from coinsDataWithMarket.json and calculates price changes"
      )
      .action(() => {
        const coinsData = JSON.parse(
          fs.readFileSync("coinsDataWithMarket.json", "utf-8")
        );

        const resultData = [];
        coinsData.forEach((coin) => {
          if (skipTickers.includes(coin.symbol.toUpperCase())) {
            return;
          }

          const { market_data } = coin;
          if (market_data) {
            const { prices } = market_data;

            const currentPrice = coin.current_price;

            const price1D = calculatePercentageChangeByInterval(
              prices,
              currentPrice,
              1
            );
            const price7D = calculatePercentageChangeByInterval(
              prices,
              currentPrice,
              7
            );
            const price14D = calculatePercentageChangeByInterval(
              prices,
              currentPrice,
              14
            );
            const price30D = calculatePercentageChangeByInterval(
              prices,
              currentPrice,
              30
            );
            const price60D = calculatePercentageChangeByInterval(
              prices,
              currentPrice,
              60
            );
            const price90D = calculatePercentageChangeByInterval(
              prices,
              currentPrice,
              90
            );

            resultData.push({
              rank: coin.market_cap_rank,
              ticker: coin.symbol.toUpperCase(),

              price: util.formatWithCommas(currentPrice.toFixed(2)),
              price_1D: price1D.toFixed(2),
              price_7D: price7D.toFixed(2),
              price_14D: price14D.toFixed(2),
              price_30D: price30D.toFixed(2),
              price_60D: price60D.toFixed(2),
              price_90D: price90D.toFixed(2),
            });
          }
        });

        const columnWidths = {
          rank: Math.max(
            "Rank".length,
            ...resultData.map((row) => row.rank.toString().length + 1)
          ),
          ticker: Math.max(
            "Ticker".length,
            ...resultData.map((row) => row.ticker.length + 1)
          ),

          price: Math.max(
            "Price".length,
            ...resultData.map((row) => row.price.length + 1)
          ),
          price_1D: Math.max(
            "Price 1D".length,
            ...resultData.map((row) => row.price_1D.length + 1)
          ),
          price_7D: Math.max(
            "Price 7D".length,
            ...resultData.map((row) => row.price_7D.length + 1)
          ),
          price_14D: Math.max(
            "Price 14D".length,
            ...resultData.map((row) => row.price_14D.length + 1)
          ),
          price_30D: Math.max(
            "Price 30D".length,
            ...resultData.map((row) => row.price_30D.length + 1)
          ),
          price_60D: Math.max(
            "Price 60D".length,
            ...resultData.map((row) => row.price_60D.length + 1)
          ),
          price_90D: Math.max(
            "Price 90D".length,
            ...resultData.map((row) => row.price_90D.length + 1)
          ),
        };

        console.log(
          `${chalk.white(util.pad("Rank", columnWidths.rank))} | ` +
            `${chalk.yellow(util.pad("Ticker", columnWidths.ticker))} | ` +
            `${chalk.cyan(util.padStart("Price", columnWidths.price))} | ` +
            `${chalk.white(
              util.padStart("Price 1D", columnWidths.price_1D)
            )} | ` +
            `${chalk.white(
              util.padStart("Price 7D", columnWidths.price_7D)
            )} | ` +
            `${chalk.white(
              util.padStart("Price 14D", columnWidths.price_14D)
            )} | ` +
            `${chalk.white(
              util.padStart("Price 30D", columnWidths.price_30D)
            )} | ` +
            `${chalk.white(
              util.padStart("Price 60D", columnWidths.price_60D)
            )} | ` +
            `${chalk.white(util.padStart("Price 90D", columnWidths.price_90D))}`
        );

        resultData.forEach((row) => {
          console.log(
            `${chalk.white(util.pad(row.rank, columnWidths.rank))} | ` +
              `${chalk.yellow(util.pad(row.ticker, columnWidths.ticker))} | ` +
              `${chalk.cyan(util.padStart(row.price, columnWidths.price))} | ` +
              `${util.colorizeAndPadStart(
                row.price_1D,
                columnWidths.price_1D
              )} | ` +
              `${util.colorizeAndPadStart(
                row.price_7D,
                columnWidths.price_7D
              )} | ` +
              `${util.colorizeAndPadStart(
                row.price_14D,
                columnWidths.price_14D
              )} | ` +
              `${util.colorizeAndPadStart(
                row.price_30D,
                columnWidths.price_30D
              )} | ` +
              `${util.colorizeAndPadStart(
                row.price_60D,
                columnWidths.price_60D
              )} | ` +
              `${util.colorizeAndPadStart(
                row.price_90D,
                columnWidths.price_90D
              )}`
          );
        });
      });
  },
};

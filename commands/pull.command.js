const fs = require("fs");
const coingecko = require("../services/coingecko.service");
const util = require("../services/util.service");

const config = JSON.parse(fs.readFileSync("config.json", "utf-8"));

module.exports = {
  register(program) {
    program
      .command("pull")
      .description("Fetches the top coins data")
      .option("--data", "Include coins data")
      .action(async (options) => {
        const coins = await coingecko.getCoins();

        let requestCount = 0;
        let batchCount = 0;
        const maxRequests = config.reqPerMin;

        for (const coin of coins) {
          if (requestCount >= maxRequests) {
            console.log("Rate limit reached. Pausing for 60 seconds...");
            await util.sleep(60000);
            requestCount = 0;
            batchCount++;
          }

          const { id, name, symbol, current_price, market_cap, image } = coin;
          console.log(
            `[${
              maxRequests * batchCount + requestCount + 1
            }] ${name} (${symbol}): $${current_price} $${market_cap}`
          );

          const marketData = await coingecko.getMarketData(id);
          if (marketData) {
            coin.market_data = marketData;
          }

          if (options.data) {
            const coinsData = await coingecko.getCoinData(id);
            if (coinsData) {
              coin.coin_data = coinsData;
            }
          }

          requestCount++;
          await util.sleep(250);
        }

        fs.writeFileSync("data.json", JSON.stringify(coins, null, 2), "utf-8");
        console.log(
          'Top coins data with data has been fetched and saved to "data.json".'
        );
      });
  },
};

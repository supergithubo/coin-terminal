const fs = require("fs");
const coingecko = require("../services/coingecko.service");
const util = require("../services/util.service");

module.exports = {
  register(program) {
    program
      .command("pull")
      .description("Fetches the top 250 coins data")
      .action(async () => {
        const coins = await coingecko.getTop250Coins();

        let requestCount = 0;
        let batchCount = 0;
        const maxRequests = 25;

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

          requestCount++;
          await util.sleep(500);
        }

        fs.writeFileSync(
          "data.json",
          JSON.stringify(coins, null, 2),
          "utf-8"
        );
        console.log(
          'Top 250 coins data with market data has been fetched and saved to "data.json".'
        );
      });
  },
};

const axios = require('axios');
const { Command } = require('commander');
const fs = require('fs');
const chalk = require('chalk');

// Load the API key from config.json
const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
const apiKey = config.apiKey;  // API key to be used in headers

// Initialize the commander program
const program = new Command();

// Define the headers using the API key from config
const headers = {
  'accept': 'application/json',
  'x-cg-demo-api-key': apiKey
};

// Function to get top 250 coins
async function getTop250Coins() {
    const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=250&page=';
    let coins = [];

    for (let page = 1; page <= 1; page++) {
        try {
            const response = await axios.get(url + page, { headers: headers });
            coins = [...coins, ...response.data];
        } catch (error) {
            console.error('Error fetching coins:', error.message);
        }
        await sleep(1000); // Pause for 1 second to avoid rate limit
    }

    return coins;
}

// Function to get market data for a specific coin
async function getMarketData(coinId) {
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=90&interval=daily`;

    try {
        const response = await axios.get(url, { headers: headers });
        return response.data;  // Market data like prices, market_caps, and total_volumes
    } catch (error) {
        console.error(`Error fetching market data for ${coinId}:`, error.message);
        return null;
    }
}

// Function to calculate percentage change over a given period (in days)
function calculatePercentageChange(data, days) {
    if (data.length < days) return 0;

    const priceStart = data[data.length - days][1];  // Price at start (e.g., 1 day ago)
    const priceEnd = data[data.length - 1][1];  // Latest price

    return ((priceEnd - priceStart) / priceStart) * 100;
}

// Function to calculate percentage change for market cap over a given period (in days)
function calculateMarketCapChange(data, days) {
    if (data.length < days) return 0;

    const mcapStart = data[data.length - days][1];  // Market cap at start (e.g., 1 day ago)
    const mcapEnd = data[data.length - 1][1];  // Latest market cap

    return ((mcapEnd - mcapStart) / mcapStart) * 100;
}


// Sleep function to pause execution
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Pull command to fetch data
program.command('pull')
  .description('Fetches the top 250 coins data')
  .action(async () => {
    const coins = await getTop250Coins();
    
    // Fetch market data for each coin and append it
    let requestCount = 0;
    let batchCount = 0;
    const maxRequests = 25;

    for (const coin of coins) {
        if (requestCount >= maxRequests) {
            console.log('Rate limit reached. Pausing for 60 seconds...');
            await sleep(60000); // Sleep for 60 seconds if limit is reached
            requestCount = 0; // Reset request count after pause
            batchCount++;
        }

        const { id, name, symbol, current_price, market_cap, image } = coin;
        console.log(`[${(maxRequests * batchCount) + requestCount + 1}] ${name} (${symbol}): $${current_price} $${market_cap}`);

        // Get market data for the coin
        const marketData = await getMarketData(id);
        if (marketData) {
            coin.market_data = marketData;
        }

        requestCount++;
        await sleep(500); // Sleep for 500ms to avoid exceeding the rate limit
    }

    // Save the appended data to a file
    fs.writeFileSync('coinsDataWithMarket.json', JSON.stringify(coins, null, 2), 'utf-8');
    console.log('Top 250 coins data with market data has been fetched and saved to "coinsDataWithMarket.json".');
});

// Pull command to process data from coinsDataWithMarket.json
program.command('index')
  .description('Processes data from coinsDataWithMarket.json and calculates price/market cap changes')
  .action(() => {
    // Read the coins data from the file
    const coinsData = JSON.parse(fs.readFileSync('coinsDataWithMarket.json', 'utf-8'));

    const resultData = [];

    // Process each coin
    coinsData.forEach((coin) => {
        const { market_data } = coin;
        if (market_data) {
            const { prices, market_caps } = market_data;

            // Calculate price and market cap changes for different periods
            const price1D = calculatePercentageChange(prices, 1);
            const price7D = calculatePercentageChange(prices, 7);
            const price30D = calculatePercentageChange(prices, 30);
            const price60D = calculatePercentageChange(prices, 60);

            const mcap1D = calculateMarketCapChange(market_caps, 1);
            const mcap7D = calculateMarketCapChange(market_caps, 7);
            const mcap30D = calculateMarketCapChange(market_caps, 30);
            const mcap60D = calculateMarketCapChange(market_caps, 60);

            // Prepare the result in the desired format
            resultData.push({
                rank: coin.market_cap_rank,
                ticker: coin.symbol.toUpperCase(),
                price: coin.current_price,
                price_1D: price1D.toFixed(2),
                price_7D: price7D.toFixed(2),
                price_30D: price30D.toFixed(2),
                price_60D: price60D.toFixed(2),
                mcap_1D: mcap1D.toFixed(2),
                mcap_7D: mcap7D.toFixed(2),
                mcap_30D: mcap30D.toFixed(2),
                mcap_60D: mcap60D.toFixed(2)
            });
        }
    });

    // Output the results
    console.log('Processed Data:');
    console.table(resultData.reduce((acc, {rank, ...x}) => { acc[rank] = x; return acc}, {}));
});

// Parse and execute the CLI commands
program.parse(process.argv);


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

    try {
        const response = await axios.get(url + 1, { headers: headers });
        coins = [...coins, ...response.data];
    } catch (error) {
        console.error('Error fetching coins:', error.message);
    }
    await sleep(1000); // Pause for 1 second to avoid rate limit
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

// Function to apply color based on the percentage change
function getColor(value) {
    if (value > 0) {
        return chalk.green(value.toFixed(2));  // Green for positive change
    } else if (value < 0) {
        return chalk.red(value.toFixed(2));  // Red for negative change
    } else {
        return chalk.white(value.toFixed(2));  // White for no change
    }
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
            console.log(chalk.yellow('Rate limit reached. Pausing for 60 seconds...'));
            await sleep(60000); // Sleep for 60 seconds if limit is reached
            requestCount = 0; // Reset request count after pause
            batchCount++;
        }

        const { id, name, symbol, current_price, market_cap, image } = coin;
        console.log(chalk.green(`[${(maxRequests * batchCount) + requestCount + 1}]`) + ` ${chalk.blue(name)} (${chalk.yellow(symbol)}): $${chalk.cyan(current_price)} $${chalk.magenta(market_cap)}`);

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
    console.log(chalk.green('Top 250 coins data with market data has been fetched and saved to "coinsDataWithMarket.json".'));
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

            // Prepare the result in the desired format with color
            resultData.push({
                rank: coin.market_cap_rank,
                ticker: coin.symbol.toUpperCase(),
                price: coin.current_price,
                price_1D: price1D,
                price_7D: price7D,
                price_30D: price30D,
                price_60D: price60D,
                mcap_1D: mcap1D,
                mcap_7D: mcap7D,
                mcap_30D: mcap30D,
                mcap_60D: mcap60D
            });
        }
    });

    // Dynamically calculate max column widths
    const columnWidths = {
        rank: Math.max('Rank'.length, ...resultData.map(row => row.rank.toString().length)),
        ticker: Math.max('Ticker'.length, ...resultData.map(row => row.ticker.length)),
        price: Math.max('Price'.length, ...resultData.map(row => row.price.toString().length)),
        price_1D: Math.max('Price 1D'.length, ...resultData.map(row => row.price_1D.toString().length)),
        price_7D: Math.max('Price 7D'.length, ...resultData.map(row => row.price_7D.toString().length)),
        price_30D: Math.max('Price 30D'.length, ...resultData.map(row => row.price_30D.toString().length)),
        price_60D: Math.max('Price 60D'.length, ...resultData.map(row => row.price_60D.toString().length)),
        mcap_1D: Math.max('MCap 1D'.length, ...resultData.map(row => row.mcap_1D.toString().length)),
        mcap_7D: Math.max('MCap 7D'.length, ...resultData.map(row => row.mcap_7D.toString().length)),
        mcap_30D: Math.max('MCap 30D'.length, ...resultData.map(row => row.mcap_30D.toString().length)),
        mcap_60D: Math.max('MCap 60D'.length, ...resultData.map(row => row.mcap_60D.toString().length)),
    };

    // Helper function to pad values to fixed width
    function pad(value, width) {
        return value.toString().padEnd(width);
    }

    // Output the results manually, line by line with proper formatting
    console.log(
        `${chalk.green(pad('Rank', columnWidths.rank))}` +
        `${chalk.blue(pad('Ticker', columnWidths.ticker))}` +
        `${chalk.cyan(pad('Price', columnWidths.price))}` +
        `${chalk.white(pad('Price 1D', columnWidths.price_1D))}` +
        `${chalk.white(pad('Price 7D', columnWidths.price_7D))}` +
        `${chalk.white(pad('Price 30D', columnWidths.price_30D))}` +
        `${chalk.white(pad('Price 60D', columnWidths.price_60D))}` +
        `${chalk.magenta(pad('MCap 1D', columnWidths.mcap_1D))}` +
        `${chalk.magenta(pad('MCap 7D', columnWidths.mcap_7D))}` +
        `${chalk.magenta(pad('MCap 30D', columnWidths.mcap_30D))}` +
        `${chalk.magenta(pad('MCap 60D', columnWidths.mcap_60D))}`
    );

    resultData.forEach((row) => {
        console.log(
            `${chalk.green(pad(row.rank, columnWidths.rank))}` +
            `${chalk.green(pad(row.ticker, columnWidths.ticker))}` +
            `${chalk.cyan(pad(row.price, columnWidths.price))}` +
            `${getColor(row.price_1D).padEnd(columnWidths.price_1D)}` +
            `${getColor(row.price_7D).padEnd(columnWidths.price_7D)}` +
            `${getColor(row.price_30D).padEnd(columnWidths.price_30D)}` +
            `${getColor(row.price_60D).padEnd(columnWidths.price_60D)}` +
            `${getColor(row.mcap_1D).padEnd(columnWidths.mcap_1D)}` +
            `${getColor(row.mcap_7D).padEnd(columnWidths.mcap_7D)}` +
            `${getColor(row.mcap_30D).padEnd(columnWidths.mcap_30D)}` +
            `${getColor(row.mcap_60D).padEnd(columnWidths.mcap_60D)}`
        );
    });
});

// Parse and execute the CLI commands
program.parse(process.argv);

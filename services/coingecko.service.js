const axios = require("axios");
const fs = require("fs");

const config = JSON.parse(fs.readFileSync("config.json", "utf-8"));
const apiKey = config.apiKey;

const headers = {
  accept: "application/json",
  "x-cg-demo-api-key": apiKey,
};

async function getTop250Coins() {
  const url =
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=250&page=";
  let coins = [];

  try {
    const response = await axios.get(url + 1, { headers: headers });
    coins = [...coins, ...response.data];
  } catch (error) {
    console.error("Error fetching coins:", error.message);
  }
  return coins;
}

async function getCoinData(coinId) {
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}`;

  try {
    const response = await axios.get(url, { headers: headers });
    return response.data;
  } catch (error) {
    console.error(`Error fetching coin data for ${coinId}:`, error.message);
    return null;
  }
}

async function getMarketData(coinId) {
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=100&interval=daily`;

  try {
    const response = await axios.get(url, { headers: headers });
    return response.data;
  } catch (error) {
    console.error(`Error fetching market data for ${coinId}:`, error.message);
    return null;
  }
}

module.exports = {
  getTop250Coins,
  getCoinData,
  getMarketData,
};

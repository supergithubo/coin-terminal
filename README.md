# coin-termnial

## Installation

### Windows

1. Install Git [here](https://git-scm.com/downloads/win)
2. Clone the project in command line:

```
 git clone https://github.com/supergithubo/coin-terminal.git
```

3. Install Node Version Manager (NVM) [here](https://github.com/coreybutler/nvm-windows/releases/tag/1.1.12)
4. Install Node `v18.20.4` in command line:

```
 nvm install v18.20.4
```

5. In the project directory, install dependencies:

```
 npm install
```

### Linux

1. Install Git

```
sudo apt install git-all
```

2. Install Node Version Manager (NVM)

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

3. Install Node `v18.20.4` in command line:

```
 nvm install v18.20.4
```

4. In the project directory, install dependencies:

```
 npm install
```

## Running

### Setup

1. Edit `config.sample.json`

- `apiKey` - signup for Coingecko API [here](https://www.coingecko.com/en/developers/dashboard)
- `reqPerMin` | `default: 25` - increase base on your Coingecko subscription (max: 30 when using demo api key)
- `skip` - coins/tokens to skip for displaying (ex: "USDT", "USDC", "WBTC")

2. Save it as `config.json`

### Commands

Use `node cli.js --help` for the commands

## `pull`

`node cli.js pull`

Use this command to initially pull all top 250 coins on Coingecko (current limit)

- Pulling data will take couple of minutes depending on your Coingecko api
- Pulling will pause every minute after 25 requests `default reqPerMin` (set `reqPerMin` for higher value if you are using premium api key `ex: 500`)

### options:

- `--data` Include coins data

## `price`

`node cli.js price`

Processes data from pulled data and calculates price changes

### options

- `--sort <column>` Sort by specified column (e.g., `price_1d`, `price_7d`, `price_30d`, `price_60d`, `price_90d`)
- `--order <asc|desc>` Specify sorting order: `asc` for ascending, `desc` for descending (default: `desc`)
- `--above <interval>` Filter the results to only show positive price change for a specified interval (`price_1d`, `price_7d`, `price_30d`, `price_60d`, `price_90d`)
- `--below <interval>` Filter the results to only show negative price change for a specified interval (`price_1d`, `price_7d`, `price_30d`, `price_60d`, `price_90d`)
- `--category <category>`  Filter the results by category (e.g., 'Smart Contract Platform')
- `-h, --help` display help for command

## `mcap`

`node cli.js mcap`

Processes data from pulled data and calculates market cap changes and rank changes

### options:

- `--sort <column>` Sort by specified column (e.g., `mcap_1d`, `mcap_7d`, `mcap_30d`, `mcap_60d`, `mcap_90d`, `rank_1d`, `rank_7d`, `rank_30d`, `rank_60d`, `rank_90d`)
- `--order <asc|desc>` Specify sorting order: `asc` for ascending, `desc` for descending (default: `desc`)
- `--above <interval>` Filter the results to only show positive mcap change for a specified interval (`mcap_1d`, `mcap_7d`, `mcap_30d`, `mcap_60d`, `mcap_90d`)
- `--below <interval>` Filter the results to only show negative mcap change for a specified interval (`mcap_1d`, `mcap_7d`, `mcap_30d`, `mcap_60d`, `mcap_90d`)
- `--category <category>`  Filter the results by category (e.g., 'Smart Contract Platform')
- `-h, --help` display help for command
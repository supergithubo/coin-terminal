const chalk = require("chalk");
const ansiRegex = require("ansi-regex");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripAnsi(value) {
  return value.replace(ansiRegex(), "");
}

function pad(value, width) {
  return value.toString().padEnd(width);
}

function padStart(value, width) {
  return value.toString().padStart(width);
}

function formatWithCommas(value) {
  if (isNaN(value)) return value;
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatWithPlusSign(value) {
  if (value > 0) {
      return `+${value.toFixed(2)}`;
  }
  return value.toFixed(2);
}

function colorizeAndPadStart(value, padding, noformat) {
  const numValue = parseFloat(value);
  const isPercentage = value.toString().endsWith('%'); 
  if (isNaN(numValue) && !isPercentage) {
    return chalk.white(padStart("N/A", padding));
  }

  let formattedValue = formatWithCommas(numValue);
  if (noformat) {
    formattedValue = numValue;
  }

  if (isPercentage) {
    formattedValue = `${formattedValue}%`;
  }

  if (value.toString().startsWith("+")) {
    return chalk.green(padStart("+" + formattedValue, padding)); 
  } else if (numValue > 0) {
    return chalk.green(padStart(formattedValue, padding));
  } else if (numValue < 0) {
    return chalk.red(padStart(formattedValue, padding));
  } else {
    return chalk.white(padStart(formattedValue, padding));
  }
}

module.exports = {
  sleep,
  stripAnsi,
  pad,
  padStart,
  formatWithCommas,
  formatWithPlusSign,
  colorizeAndPadStart,
};

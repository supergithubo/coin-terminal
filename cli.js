// cli.js

const { Command } = require("commander");
const pull = require("./commands/pull.command");
const price = require("./commands/price.command");
const mcap = require("./commands/mcap.command");
const category = require("./commands/category.command");

const program = new Command();

pull.register(program);
price.register(program);
mcap.register(program);
category.register(program);

program.parse(process.argv);

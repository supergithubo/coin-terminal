const fs = require("fs");

const coinsData = JSON.parse(fs.readFileSync("data.json", "utf-8"));
const config = JSON.parse(fs.readFileSync("config.json", "utf-8"));

const { remove, modify } = config.categoryFix;

let resultData = coinsData.map((coin) => {
  const filteredCategories = coin.coin_data.categories.filter((category) => {
    return !remove.some((rule) => {
      const { target, scope, except } = rule;

      if (except.includes(coin.id)) return false;

      if (scope === "exact" && category === target) return true;
      if (scope === "any" && new RegExp(target).test(category)) return true;

      return false;
    });
  });

  const modification = modify.find((rule) => rule.id === coin.id);
  if (modification) {
    if (modification.add) {
      modification.add.forEach((category) => {
        if (!filteredCategories.includes(category)) {
          filteredCategories.push(category);
        }
      });
    }

    if (modification.remove) {
      modification.remove.forEach((category) => {
        const index = filteredCategories.indexOf(category);
        if (index > -1) {
          filteredCategories.splice(index, 1);
        }
      });
    }
  }

  return {
    id: coin.id,
    categories: filteredCategories,
  };
});

fs.writeFileSync(
  "categories.json",
  JSON.stringify(resultData, null, 2),
  "utf-8"
);

console.log("Done");

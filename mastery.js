export const masteryUpgrades = [
    { id: "click_mastery", name: "Мастерство кликов", description: "Клики дают +1% от общего производства за уровень", cost: 1, maxLevel: 10, level: 0, effect: (level) => { game.clickPower += game.totalEssence * 0.01 * level; } },
    { id: "generator_mastery", name: "Мастерство генераторов", description: "Увеличивает производство всех генераторов на 10% за уровень", cost: 2, maxLevel: 5, level: 0, effect: (level) => { game.generators.forEach((g) => g.multiplier *= 1 + 0.1 * level); } },
    { id: "prestige_mastery", name: "Мастерство престижа", description: "Увеличивает получаемые души на 25% за уровень", cost: 3, maxLevel: 3, level: 0, effect: (level) => {} },
  ];
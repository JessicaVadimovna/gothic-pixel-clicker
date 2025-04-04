export const prestigeUpgradeTemplates = {
    soul_power: { effect: (level) => { game.clickPower = 1 + level * game.souls; calculateMultipliers(); } },
    soul_factory: { effect: (level) => { game.soulMultiplier = 1 + level * 0.1 * game.souls; calculateMultipliers(); } },
    soul_harvest: { effect: (level) => {} },
    soul_efficiency: { effect: (level) => { game.soulEfficiency = 1 + level * 0.2; } },
    eternal_flame: { effect: (level) => { game.eternalFlameBonus = level * 0.05; calculateMultipliers(); } },
    dark_resonance: { effect: (level) => { game.darkResonanceBonus = level * 0.1; calculateMultipliers(); } },
    spirit_amplifier: { effect: (level) => { game.generators.slice(0, 3).forEach((g) => g.multiplier *= 1 + level * 0.2); calculateMultipliers(); } },
    abyssal_boost: { effect: (level) => { game.generators.slice(-2).forEach((g) => g.multiplier *= 1 + level * 0.3); calculateMultipliers(); } },
  };
  
  export const prestigeUpgrades = [
    { id: "soul_power", name: "Сила душ", description: "Увеличивает силу щелчка на 1 за душу", cost: 1, purchased: false, maxLevel: 5, level: 0, effect: prestigeUpgradeTemplates.soul_power.effect },
    { id: "soul_factory", name: "Фабрика душ", description: "Увеличивает производство генераторов на 10% за душу", cost: 3, purchased: false, maxLevel: 3, level: 0, effect: prestigeUpgradeTemplates.soul_factory.effect },
    { id: "soul_harvest", name: "Сбор душ", description: "Увеличивает количество получаемых душ на 50%", cost: 5, purchased: false, maxLevel: 3, level: 0, effect: prestigeUpgradeTemplates.soul_harvest.effect },
    { id: "soul_efficiency", name: "Эффективность душ", description: "Увеличивает получаемые души на 20% за уровень", cost: 10, purchased: false, maxLevel: 4, level: 0, effect: prestigeUpgradeTemplates.soul_efficiency.effect },
    { id: "eternal_flame", name: "Вечное пламя", description: "Увеличивает производство генераторов на 5% за уровень", cost: 15, purchased: false, maxLevel: 5, level: 0, effect: prestigeUpgradeTemplates.eternal_flame.effect },
    { id: "dark_resonance", name: "Тёмный резонанс", description: "Увеличивает силу кликов на 10% за уровень", cost: 20, purchased: false, maxLevel: 3, level: 0, effect: prestigeUpgradeTemplates.dark_resonance.effect },
    { id: "spirit_amplifier", name: "Усилитель духов", description: "Увеличивает производство первых трёх генераторов на 20% за уровень", cost: 25, purchased: false, maxLevel: 4, level: 0, effect: prestigeUpgradeTemplates.spirit_amplifier.effect },
    { id: "abyssal_boost", name: "Бездонный импульс", description: "Увеличивает производство порталов и кузниц на 30% за уровень", cost: 30, purchased: false, maxLevel: 3, level: 0, effect: prestigeUpgradeTemplates.abyssal_boost.effect },
  ];
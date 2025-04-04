import { generators } from './generators.js';
import { upgrades } from './upgrades.js';
import { prestigeUpgradeTemplates, prestigeUpgrades } from './prestige.js';
import { masteryUpgrades } from './mastery.js';

// Начальное состояние игры
const initialGameState = {
  essence: 0,
  totalEssence: 0,
  clickPower: 1,
  autoClickPower: 0,
  clickMultiplier: 1,
  totalClicks: 0,
  souls: 0,
  totalPrestiges: 0,
  soulMultiplier: 1,
  soulEfficiency: 1,
  eternalFlameBonus: 0,
  darkResonanceBonus: 0,
  masteryLevel: 0,
  masteryPoints: 0,
  lastSave: Date.now(),
  lastTick: Date.now(),
  generators: JSON.parse(JSON.stringify(generators)),
  upgrades: JSON.parse(JSON.stringify(upgrades)),
  prestigeUpgrades: JSON.parse(JSON.stringify(prestigeUpgrades)),
  masteryUpgrades: JSON.parse(JSON.stringify(masteryUpgrades)),
};

let game = JSON.parse(JSON.stringify(initialGameState));

// Достижения
const achievements = [
  { id: "first_prestige", name: "Первое перерождение", description: "Совершите первый престиж", condition: () => game.totalPrestiges >= 1, reward: () => { game.souls += 5; }, unlocked: false },
  { id: "click_master", name: "Мастер кликов", description: "Сделайте 10000 кликов", condition: () => game.totalClicks >= 10000, reward: () => { game.clickPower *= 2; }, unlocked: false },
];
  
  // DOM элементы
  const elements = {
    essenceCount: document.getElementById("essence-count"),
    essencePerSecond: document.getElementById("essence-per-second"),
    totalClicks: document.getElementById("total-clicks"),
    totalEssence: document.getElementById("total-essence"),
    totalPrestiges: document.getElementById("total-prestiges"),
    soulsCount: document.getElementById("souls-count"),
    currentEssence: document.getElementById("current-essence"),
    soulsGain: document.getElementById("souls-gain"),
    clicker: document.getElementById("clicker"),
    generatorsContainer: document.getElementById("generators-container"),
    upgradesContainer: document.getElementById("upgrades-container"),
    prestigeButton: document.getElementById("prestige-button"),
    prestigeUpgradesContainer: document.getElementById("prestige-upgrades-container"),
    prestigeSoulsContainer: document.getElementById("prestige-souls-container"),
    masteryContainer: document.getElementById("mastery-container"),
    logContainer: document.getElementById("log-container"),
    notificationArea: document.getElementById("notification-area"),
    eventIndicator: document.getElementById("event-indicator"),
    tabs: document.querySelectorAll(".tab"),
    tabContents: document.querySelectorAll(".tab-content"),
    saveCode: document.getElementById("save-code"),
    saveButton: document.getElementById("save-button"),
    loadButton: document.getElementById("load-button"),
    resetButton: document.getElementById("reset-button"),
    masteryLevelDisplay: document.getElementById("mastery-level"),
    masteryPointsDisplay: document.getElementById("mastery-points"),
  };
  
  // Вспомогательные функции
  function formatNumber(num) {
    if (num < 1000) return num.toFixed(1).replace(/\.0$/, "");
    const suffixes = ["", "K", "M", "B", "T", "Qa", "Qi"];
    const exponent = Math.floor(Math.log10(Math.abs(num)) / 3);
    const suffix = suffixes[exponent] || `e${exponent * 3}`;
    const scaled = num / Math.pow(10, exponent * 3);
    return scaled.toFixed(2).replace(/\.00$/, "") + suffix;
  }
  
  function calculateGeneratorCost(generator) {
    return Math.ceil(generator.baseCost * Math.pow(1.15, generator.count));
  }
  
  function calculateSoulsGain() {
    if (game.essence < 1000) return 0;
    let souls = Math.floor(Math.sqrt(game.essence / 1000));
    const soulHarvest = game.prestigeUpgrades.find((u) => u.id === "soul_harvest");
    const prestigeMastery = game.masteryUpgrades.find((u) => u.id === "prestige_mastery");
    souls *= game.soulEfficiency;
    if (soulHarvest && soulHarvest.level > 0) {
      souls = Math.floor(souls * (1 + soulHarvest.level * 0.5));
    }
    if (prestigeMastery && prestigeMastery.level > 0) {
      souls = Math.floor(souls * (1 + prestigeMastery.level * 0.25));
    }
    return souls;
  }
  
  function calculateEssencePerSecond() {
    let eps = 0;
    game.generators.forEach((g) => {
      eps += g.baseProduction * g.count * g.multiplier * (1 + game.eternalFlameBonus);
    });
    eps *= game.soulMultiplier;
    return Math.max(eps, 0);
  }
  
  function calculateMultipliers() {
    game.clickPower = 1;
    game.clickMultiplier = 1;
    game.soulMultiplier = 1;
    game.eternalFlameBonus = 0;
    game.darkResonanceBonus = 0;
  
    game.upgrades.forEach((u) => {
      if (u.purchased && u.effect) u.effect();
    });
    game.prestigeUpgrades.forEach((u) => {
      if (u.level > 0) u.effect(u.level);
    });
    game.masteryUpgrades.forEach((u) => {
      if (u.level > 0) u.effect(u.level);
    });
  
    game.clickMultiplier = 1 + game.darkResonanceBonus;
    game.autoClickPower = calculateEssencePerSecond();
  }
  
  // Обновление интерфейса
  function updateUI() {
    game.essence = Math.max(game.essence, 0);
    game.totalEssence = Math.max(game.totalEssence, 0);
    elements.essenceCount.textContent = formatNumber(game.essence);
    elements.essencePerSecond.textContent = formatNumber(calculateEssencePerSecond());
    elements.totalClicks.textContent = formatNumber(game.totalClicks);
    elements.totalEssence.textContent = formatNumber(game.totalEssence);
    elements.totalPrestiges.textContent = game.totalPrestiges;
    elements.soulsCount.textContent = game.souls;
    elements.currentEssence.textContent = formatNumber(game.essence);
    const soulsGain = calculateSoulsGain();
    elements.soulsGain.textContent = soulsGain;
    elements.prestigeButton.disabled = soulsGain <= 0;
    if (game.totalPrestiges > 0 || game.souls > 0) {
      elements.prestigeSoulsContainer.style.display = "block";
    }
    elements.masteryLevelDisplay.textContent = game.masteryLevel;
    elements.masteryPointsDisplay.textContent = game.masteryPoints;
    renderGenerators();
    renderUpgrades();
    renderPrestigeUpgrades();
    renderMasteryUpgrades();
    checkUnlocks();
  }
  
  function renderGenerators() {
    if (!elements.generatorsContainer) return;
    game.generators.forEach((g) => {
      const genElement = elements.generatorsContainer.querySelector(`.generator[data-id="${g.id}"]`);
      if (!genElement) return;
  
      genElement.style.display = g.unlocked ? "flex" : "none";
      const cost = calculateGeneratorCost(g);
      const canAfford = game.essence >= cost;
      const production = g.baseProduction * g.multiplier * game.soulMultiplier * (1 + game.eternalFlameBonus);
  
      genElement.classList.toggle("locked", !canAfford);
      genElement.classList.toggle("new", g.justUnlocked);
  
      genElement.querySelector(".generator-count").textContent = g.count;
      genElement.querySelector(".generator-production").textContent = formatNumber(production);
      genElement.querySelectorAll(".generator-cost").forEach(span => {
        if (span.parentElement.dataset.amount === "1") span.textContent = formatNumber(cost);
      });
  
      g.justUnlocked = false;
    });
  }
  
  function renderUpgrades() {
    elements.upgradesContainer.innerHTML = "";
    const availableUpgrades = game.upgrades.filter(u => u.unlocked && !u.purchased);
    if (availableUpgrades.length === 0) {
      elements.upgradesContainer.innerHTML = "<p>Доступных улучшений нет</p>";
      return;
    }
    availableUpgrades.forEach((u) => {
      const canAfford = game.essence >= u.cost;
      const upElement = document.createElement("div");
      upElement.className = `upgrade ${canAfford ? "" : "locked"} ${u.justUnlocked ? "new" : ""}`;
      upElement.innerHTML = `
        <div class="upgrade-icon ${u.id}-icon"></div>
        <div class="upgrade-info" title="${u.description}">
          <div><strong>${u.name}</strong> ${u.justUnlocked ? '<span class="new-tag">new</span>' : ''}</div>
          <div>${u.description}</div>
        </div>
        <button class="buy-upgrade" data-id="${u.id}">Купить (${formatNumber(u.cost)})</button>
      `;
      elements.upgradesContainer.appendChild(upElement);
      upElement.querySelector(".buy-upgrade").addEventListener("click", () => buyUpgrade(u.id));
      u.justUnlocked = false;
    });
  }
  
  function renderPrestigeUpgrades() {
    elements.prestigeUpgradesContainer.innerHTML = "<h3>Улучшения за души</h3>";
    game.prestigeUpgrades.forEach((u) => {
      const maxLevel = u.level >= u.maxLevel;
      const canAfford = game.souls >= u.cost && !maxLevel;
      const upElement = document.createElement("div");
      upElement.className = `prestige-option ${canAfford ? "" : "locked"}`;
      upElement.innerHTML = `
        <div class="upgrade-info" title="${u.description}">
          <div><strong>${u.name}</strong> (Уровень ${u.level}/${u.maxLevel})</div>
          <div>${u.description}</div>
        </div>
        <button class="buy-prestige-upgrade" data-id="${u.id}" ${maxLevel ? "disabled" : ""}>
          ${maxLevel ? "Максимум" : `Купить (${u.cost} душ)`}
        </button>
      `;
      elements.prestigeUpgradesContainer.appendChild(upElement);
      if (!maxLevel) {
        upElement.querySelector(".buy-prestige-upgrade").addEventListener("click", () => buyPrestigeUpgrade(u.id));
      }
    });
  }
  
  function renderMasteryUpgrades() {
    if (game.masteryLevel < 1) return;
    elements.masteryContainer.innerHTML = "<h3>Мастерство</h3><button id='mini-game'>Играть в мини-игру</button>";
    game.masteryUpgrades.forEach((u) => {
      const maxLevel = u.level >= u.maxLevel;
      const canAfford = game.masteryPoints >= u.cost && !maxLevel;
      const upElement = document.createElement("div");
      upElement.className = `mastery-option ${canAfford ? "" : "locked"}`;
      upElement.innerHTML = `
        <div class="upgrade-info">
          <div><strong>${u.name}</strong> (Уровень ${u.level}/${u.maxLevel})</div>
          <div>${u.description}</div>
        </div>
        <button class="buy-mastery-upgrade" data-id="${u.id}" ${maxLevel ? "disabled" : ""}>
          ${maxLevel ? "Максимум" : `Купить (${u.cost} очков мастерства)`}
        </button>
      `;
      elements.masteryContainer.appendChild(upElement);
      if (!maxLevel) {
        upElement.querySelector(".buy-mastery-upgrade").addEventListener("click", () => buyMasteryUpgrade(u.id));
      }
    });
    document.getElementById("mini-game").addEventListener("click", () => {
      if (confirm("Соберите 100 эссенции за 10 секунд кликами! Начать?")) {
        let miniGameEssence = 0;
        const startTime = Date.now();
        const miniGameInterval = setInterval(() => {
          if (Date.now() - startTime >= 10000) {
            clearInterval(miniGameInterval);
            if (miniGameEssence >= 100) {
              game.essence += 1000;
              showNotification("Победа! +1000 эссенции");
            } else {
              showNotification("Поражение!");
            }
            updateUI();
          }
        }, 100);
        elements.clicker.onclick = () => {
          miniGameEssence += game.clickPower;
        };
        setTimeout(() => elements.clicker.onclick = clickEssence, 10000);
      }
    });
  }
  
  function checkUnlocks() {
    if (!game.generators[1].unlocked && game.generators[0].count >= 5) {
      game.generators[1].unlocked = true;
      game.generators[1].justUnlocked = true;
      showNotification(`Разблокирован генератор: ${game.generators[1].name}!`);
    }
    if (!game.generators[2].unlocked && game.generators[1].count >= 5) {
      game.generators[2].unlocked = true;
      game.generators[2].justUnlocked = true;
      showNotification(`Разблокирован генератор: ${game.generators[2].name}!`);
    }
    if (!game.generators[3].unlocked && game.generators[2].count >= 5) {
      game.generators[3].unlocked = true;
      game.generators[3].justUnlocked = true;
      showNotification(`Разблокирован генератор: ${game.generators[3].name}!`);
    }
    if (!game.generators[4].unlocked && game.generators[3].count >= 5) {
      game.generators[4].unlocked = true;
      game.generators[4].justUnlocked = true;
      showNotification(`Разблокирован генератор: ${game.generators[4].name}!`);
    }
    if (!game.generators[5].unlocked && game.generators[4].count >= 5) {
      game.generators[5].unlocked = true;
      game.generators[5].justUnlocked = true;
      showNotification(`Разблокирован генератор: ${game.generators[5].name}!`);
    }
    if (!game.generators[6].unlocked && game.generators[5].count >= 5) {
      game.generators[6].unlocked = true;
      game.generators[6].justUnlocked = true;
      showNotification(`Разблокирован генератор: ${game.generators[6].name}!`);
    }
    if (!game.generators[7].unlocked && game.generators[6].count >= 5) {
      game.generators[7].unlocked = true;
      game.generators[7].justUnlocked = true;
      showNotification(`Разблокирован генератор: ${game.generators[7].name}!`);
    }
    game.upgrades.forEach((u) => {
      if (u && !u.unlocked && u.requirement && u.requirement()) {
        u.unlocked = true;
        u.justUnlocked = true;
        addLogMessage(`Разблокировано улучшение: ${u.name}!`);
        showNotification(`Разблокировано улучшение: ${u.name}!`);
      }
    });
  }
  
  // Игровые действия
  function clickEssence() {
    const clickValue = game.clickPower * game.clickMultiplier;
    game.essence += clickValue;
    game.totalEssence += clickValue;
    game.totalClicks++;
    updateUI();
  }
  
  function buyGenerator(id, amount = 1) {
    const g = game.generators.find((g) => g.id === id);
    if (!g) return;
    if (amount === "max") {
      let count = 0;
      let totalCost = 0;
      let tempEssence = game.essence;
      while (tempEssence >= calculateGeneratorCost(g)) {
        const cost = calculateGeneratorCost(g);
        tempEssence -= cost;
        totalCost += cost;
        g.count++;
        count++;
      }
      if (count > 0) {
        game.essence -= totalCost;
        addLogMessage(`Куплено ${count} ${g.name}`);
      }
    } else {
      const cost = calculateGeneratorCost(g);
      if (game.essence >= cost) {
        game.essence -= cost;
        g.count += amount;
        addLogMessage(`Куплен: ${g.name}`);
      }
    }
    game.autoClickPower = calculateEssencePerSecond();
    updateUI();
  }
  
  function buyUpgrade(id) {
    const u = game.upgrades.find((u) => u.id === id);
    if (!u || u.purchased) return;
    if (game.essence >= u.cost) {
      game.essence -= u.cost;
      u.purchased = true;
      u.effect();
      game.autoClickPower = calculateEssencePerSecond();
      addLogMessage(`Куплено улучшение: ${u.name}`);
      showNotification(`Куплено улучшение: ${u.name}`);
      updateUI();
    }
  }
  
  function buyPrestigeUpgrade(id) {
    const u = game.prestigeUpgrades.find((u) => u.id === id);
    if (!u || u.level >= u.maxLevel) return;
    if (game.souls >= u.cost) {
      game.souls -= u.cost;
      u.level++;
      u.effect(u.level);
      game.autoClickPower = calculateEssencePerSecond();
      addLogMessage(`Куплено: ${u.name} (Уровень ${u.level})`);
      showNotification(`${u.name} повышен до уровня ${u.level}`);
      updateUI();
    }
  }
  
  function buyMasteryUpgrade(id) {
    const u = game.masteryUpgrades.find((u) => u.id === id);
    if (!u || u.level >= u.maxLevel) return;
    if (game.masteryPoints >= u.cost) {
      game.masteryPoints -= u.cost;
      u.level++;
      u.effect(u.level);
      game.autoClickPower = calculateEssencePerSecond();
      addLogMessage(`Куплено мастерство: ${u.name} (Уровень ${u.level})`);
      showNotification(`${u.name} повышен до уровня ${u.level}`);
      updateUI();
    }
  }
  
  function prestige() {
    const soulsGain = calculateSoulsGain();
    if (soulsGain <= 0) return;
    game.souls += soulsGain;
    game.totalPrestiges++;
    game.essence = 0;
    game.totalClicks = 0;
    game.clickPower = 1;
    game.autoClickPower = 0;
    game.totalEssence = 0;
    game.clickMultiplier = 1;
    game.generators.forEach((g) => {
      g.count = 0;
      g.multiplier = 1;
      if (g.id !== "candle") g.unlocked = false;
    });
    game.upgrades.forEach((u) => {
      u.purchased = false;
    });
    if (game.totalPrestiges % 5 === 0) {
      game.masteryLevel++;
      game.masteryPoints += 2;
      addLogMessage(`Достигнут новый уровень мастерства: ${game.masteryLevel}! +2 очка мастерства`);
      showNotification(`Новый уровень мастерства: ${game.masteryLevel}! +2 очка`);
    }
    calculateMultipliers();
    game.autoClickPower = calculateEssencePerSecond();
    addLogMessage(`Перерождение! Получено ${soulsGain} душ`);
    showNotification(`Перерождение успешно! +${soulsGain} душ`);
    updateUI();
  }
  
  function resetGame() {
    if (confirm("Вы уверены, что хотите полностью сбросить прогресс?")) {
      localStorage.clear();
      game = JSON.parse(JSON.stringify(initialGameState));
      game.lastSave = Date.now();
      game.lastTick = Date.now();
      addLogMessage("Прогресс полностью сброшен");
      showNotification("Игра сброшена до начального состояния");
      updateUI();
    }
  }
  
  // Логи и уведомления
  function addLogMessage(message) {
    const logEntry = document.createElement("div");
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    elements.logContainer.insertBefore(logEntry, elements.logContainer.firstChild);
    while (elements.logContainer.children.length > 50) {
      elements.logContainer.removeChild(elements.logContainer.lastChild);
    }
  }
  
  function showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    elements.notificationArea.appendChild(notification);
    setTimeout(() => {
      notification.classList.add("fadeOut");
      setTimeout(() => notification.remove(), 500);
    }, 3000);
  }
  
  // Сохранение и загрузка
  function generateSaveCode() {
    const gameState = JSON.stringify(game);
    const encoded = btoa(unescape(encodeURIComponent(gameState)));
    return encoded;
  }
  
  function loadFromCode(code) {
    try {
      const decoded = decodeURIComponent(escape(atob(code)));
      const loadedGame = JSON.parse(decoded);
      Object.assign(game, loadedGame);
      game.prestigeUpgrades.forEach((u) => {
        if (prestigeUpgradeTemplates[u.id]) {
          u.effect = prestigeUpgradeTemplates[u.id].effect;
        }
      });
      calculateMultipliers();
      const now = Date.now();
      const timeOffline = Math.max((now - game.lastSave) / 1000, 0);
      game.autoClickPower = calculateEssencePerSecond();
      const offlineGain = game.autoClickPower * timeOffline;
      game.essence += offlineGain;
      game.totalEssence += offlineGain;
      game.lastTick = now;
      game.lastSave = now;
      addLogMessage(`Игра загружена из кода. Получено ${formatNumber(offlineGain)} эссенции`);
      showNotification(`Игра загружена! +${formatNumber(offlineGain)} эссенции`);
      updateUI();
    } catch (error) {
      console.error("Ошибка в loadFromCode:", error);
      showNotification("Ошибка загрузки: " + error.message);
    }
  }
  
  function saveGame() {
    try {
      game.lastSave = Date.now();
      game.lastTick = Date.now();
      localStorage.setItem("gothicClickerSave", JSON.stringify(game));
      addLogMessage("Игра сохранена");
    } catch (error) {
      console.error("Ошибка в saveGame:", error);
      showNotification("Ошибка сохранения: " + error.message);
    }
  }
  
  function loadGame() {
    try {
      const saved = localStorage.getItem("gothicClickerSave");
      if (saved) {
        const loadedGame = JSON.parse(saved);
        Object.assign(game, loadedGame);
        game.prestigeUpgrades.forEach((u) => {
          if (prestigeUpgradeTemplates[u.id]) {
            u.effect = prestigeUpgradeTemplates[u.id].effect;
          }
        });
        calculateMultipliers();
        const now = Date.now();
        const timeOffline = Math.max((now - game.lastSave) / 1000, 0);
        game.autoClickPower = calculateEssencePerSecond();
        const offlineGain = game.autoClickPower * timeOffline;
        game.essence += offlineGain;
        game.totalEssence += offlineGain;
        game.lastTick = now;
        game.lastSave = now;
        addLogMessage(`Игра загружена. Получено ${formatNumber(offlineGain)} эссенции`);
        showNotification(`Добро пожаловать обратно! +${formatNumber(offlineGain)} эссенции`);
        updateUI();
      }
    } catch (error) {
      console.error("Ошибка в loadGame:", error);
      showNotification("Ошибка загрузки игры: " + error.message);
    }
  }
  
  // Игровой цикл
  function gameLoop(timestamp) {
    if (!game.lastTick || game.lastTick > timestamp) game.lastTick = timestamp;
    const deltaTime = Math.max((timestamp - game.lastTick) / 1000, 0);
    game.autoClickPower = calculateEssencePerSecond();
    const gain = game.autoClickPower * deltaTime;
    game.essence += gain;
    game.totalEssence += gain;
    game.lastTick = timestamp;
    game.essence = Math.max(game.essence, 0);
    game.totalEssence = Math.max(game.totalEssence, 0);
    updateUI();
    checkAchievements();
    requestAnimationFrame(gameLoop);
  }
  
  // Автосохранение
  let lastSaveTime = Date.now();
  setInterval(() => {
    const now = Date.now();
    if (now - lastSaveTime >= 10000) {
      saveGame();
      lastSaveTime = now;
    }
  }, 1000);
  
  // Случайные события
  let activeEvents = [];
  function updateEventIndicator() {
    elements.eventIndicator.innerHTML = activeEvents.map(e => `${e.name}: ${e.description} (Осталось: ${Math.ceil(e.timeLeft / 1000)} сек)`).join("<br>");
  }
  
  setInterval(() => {
    if (Math.random() < 0.15) {
      const events = [
        { name: "Прилив душ", description: "Производство удвоено", duration: 20000, effect: () => { game.soulMultiplier *= 2; }, undo: () => { game.soulMultiplier /= 2; } },
        { name: "Проклятье теней", description: "Сила кликов снижена на 50%", duration: 60000, effect: () => { game.clickPower *= 0.5; }, undo: () => { game.clickPower /= 0.5; } },
        { name: "Дар некроманта", description: "+10% эссенции", duration: 0, effect: () => { const bonus = game.essence * 0.1; game.essence += bonus; game.totalEssence += bonus; } },
      ];
      const event = events[Math.floor(Math.random() * events.length)];
      event.timeLeft = event.duration;
      if (event.duration > 0) {
        activeEvents.push(event);
        event.effect();
        setTimeout(() => {
          event.undo();
          activeEvents = activeEvents.filter(e => e !== event);
          updateUI();
        }, event.duration);
      } else {
        event.effect();
      }
      showNotification(`${event.name}! ${event.description}`);
      updateEventIndicator();
    }
    activeEvents.forEach(e => e.timeLeft -= 60000);
    updateEventIndicator();
  }, 60000);
  
  // Проверка достижений
  function checkAchievements() {
    achievements.forEach((a) => {
      if (!a.unlocked && a.condition()) {
        a.unlocked = true;
        a.reward();
        showNotification(`Достижение разблокировано: ${a.name}!`);
        addLogMessage(`Достижение: ${a.name}`);
      }
    });
  }
  
  // Инициализация и обработчики событий
  document.addEventListener("DOMContentLoaded", () => {
    loadGame();
    updateUI();
    requestAnimationFrame(gameLoop);
  
    elements.clicker.addEventListener("click", clickEssence);
    elements.prestigeButton.addEventListener("click", prestige);
    elements.tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        elements.tabs.forEach((t) => t.classList.remove("active"));
        elements.tabContents.forEach((tc) => tc.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById(`${tab.dataset.tab}-tab`).classList.add("active");
      });
    });
    elements.saveButton.addEventListener("click", () => {
      const code = generateSaveCode();
      elements.saveCode.value = code;
      navigator.clipboard.writeText(code).then(() => {
        showNotification("Код сохранения скопирован в буфер обмена!");
      });
    });
    elements.loadButton.addEventListener("click", () => {
      loadFromCode(elements.saveCode.value);
    });
    elements.resetButton.addEventListener("click", resetGame);
  
    // Привязка обработчиков к кнопкам "Купить"
    document.querySelectorAll(".buy-generator").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const amount = btn.dataset.amount === "max" ? "max" : parseInt(btn.dataset.amount);
        console.log("Клик по кнопке:", id, amount); // Для отладки
        buyGenerator(id, amount);
      });
    });
  });
  
  window.addEventListener("beforeunload", saveGame);
import { BotMode, PlayMode } from './modes.js';

export function createUi() {
  const ui = {
    status: document.getElementById('status'),
    connectionBadge: document.getElementById('connectionBadge'),
    playModeSelect: document.getElementById('playModeSelect'),
    timeModeSelect: document.getElementById('timeModeSelect'),
    botModeSelect: document.getElementById('botModeSelect'),
    chaosModeSelect: document.getElementById('chaosModeSelect'),
    difficultyRange: document.getElementById('difficultyRange'),
    difficultyValue: document.getElementById('difficultyValue'),
    randomChanceRange: document.getElementById('randomChanceRange'),
    randomChanceValue: document.getElementById('randomChanceValue'),
    randomChanceContainer: document.getElementById('randomChanceContainer'),
    difficultyContainer: document.getElementById('difficultyContainer'),
    findMatchBtn: document.getElementById('findMatchBtn'),
    leaveMatchBtn: document.getElementById('leaveMatchBtn'),
    restartBtn: document.getElementById('restartBtn')
  };

  ui.setStatus = (message) => {
    ui.status.textContent = message;
  };

  ui.setConnection = (message, isConnected = false) => {
    ui.connectionBadge.textContent = message;
    ui.connectionBadge.classList.toggle('connected', isConnected);
  };

  ui.updateControlVisibility = () => {
    const isBotMode = ui.playModeSelect.value === PlayMode.BOT;
    const botMode = ui.botModeSelect.value;

    document.querySelectorAll('.bot-only').forEach((element) => {
      element.classList.toggle('hidden', !isBotMode);
    });

    document.querySelectorAll('.online-only').forEach((element) => {
      element.classList.toggle('hidden', isBotMode);
    });

    ui.randomChanceContainer.classList.toggle('hidden', !isBotMode || botMode !== BotMode.MIXED);
    ui.difficultyContainer.classList.toggle('hidden', !isBotMode || botMode === BotMode.RANDOM);
  };

  ui.difficultyRange.addEventListener('input', () => {
    ui.difficultyValue.textContent = ui.difficultyRange.value;
  });

  ui.randomChanceRange.addEventListener('input', () => {
    ui.randomChanceValue.textContent = ui.randomChanceRange.value;
  });

  ui.botModeSelect.addEventListener('change', ui.updateControlVisibility);
  ui.playModeSelect.addEventListener('change', ui.updateControlVisibility);
  ui.updateControlVisibility();

  return ui;
}

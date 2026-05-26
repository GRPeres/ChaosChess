import { BotPlayer } from './bot-player.js';
import { ChessGame } from './chess-game.js';
import { OnlineClient } from './online-client.js';
import { PlayMode } from './modes.js';
import { createUi } from './ui.js';

const ui = createUi();
let botPlayer;
let onlineClient;

const chessGame = new ChessGame({
  ui,
  onBotTurn: () => botPlayer.makeMove(),
  onOnlineMove: (move) => onlineClient.sendMove(move)
});

botPlayer = new BotPlayer({ ui, chessGame });
onlineClient = new OnlineClient({ ui, chessGame });

chessGame.mount();
botPlayer.load().catch(() => {
  ui.setStatus('Nao foi possivel carregar Stockfish. O modo aleatorio ainda funciona.');
});

ui.playModeSelect.addEventListener('change', () => {
  const playMode = ui.playModeSelect.value;
  chessGame.reset();

  if (playMode === PlayMode.ONLINE) {
    ui.setConnection('Offline');
    ui.setStatus('Clique em Encontrar Partida para jogar online.');
    onlineClient.connect();
  } else {
    onlineClient.leaveMatch();
    ui.setConnection('Local');
    chessGame.onlineColor = null;
    chessGame.updateStatus();
  }
});

ui.findMatchBtn.addEventListener('click', () => {
  onlineClient.findMatch();
});

ui.leaveMatchBtn.addEventListener('click', () => {
  onlineClient.leaveMatch();
});

ui.restartBtn.addEventListener('click', () => {
  if (ui.playModeSelect.value === PlayMode.ONLINE) {
    ui.setStatus('Partidas online reiniciam quando voce encontra uma nova partida.');
    return;
  }

  chessGame.reset();
});

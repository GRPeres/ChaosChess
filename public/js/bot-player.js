import { BotMode } from './modes.js';

const STOCKFISH_URL = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';

export class BotPlayer {
  constructor({ ui, chessGame }) {
    this.ui = ui;
    this.chessGame = chessGame;
    this.stockfish = null;
    this.engineReady = false;
  }

  async load() {
    this.ui.setStatus('Carregando Stockfish...');

    const response = await fetch(STOCKFISH_URL);
    const code = await response.text();
    const workerUrl = URL.createObjectURL(new Blob([code], { type: 'application/javascript' }));

    this.stockfish = new Worker(workerUrl);
    this.stockfish.onmessage = (event) => this.handleEngineMessage(event.data);
    this.engineReady = true;
    this.chessGame.updateStatus();
  }

  handleEngineMessage(line) {
    if (!line.startsWith('bestmove')) return;

    const bestMove = line.split(' ')[1];
    if (!bestMove || bestMove === '(none)') return;

    const move = this.chessGame.game.move({
      from: bestMove.substring(0, 2),
      to: bestMove.substring(2, 4),
      promotion: bestMove.length === 5 ? bestMove.charAt(4) : undefined
    });

    this.chessGame.board.position(this.chessGame.game.fen());
    this.chessGame.handlePostMove(move);
  }

  makeMove() {
    if (this.chessGame.game.game_over() || !this.engineReady) return;

    const selectedMode = this.ui.botModeSelect.value;
    let actualMode = selectedMode;

    if (selectedMode === BotMode.MIXED) {
      const randomChance = Number.parseInt(this.ui.randomChanceRange.value, 10);
      actualMode = Math.random() * 100 < randomChance ? BotMode.RANDOM : BotMode.STOCKFISH;
    }

    if (actualMode === BotMode.RANDOM) {
      this.ui.setStatus('Bot aleatorio...');
      window.setTimeout(() => this.makeRandomMove(), 350);
      return;
    }

    const depth = Number.parseInt(this.ui.difficultyRange.value, 10);
    this.ui.setStatus(`Bot pensando... Depth ${depth}`);

    window.setTimeout(() => {
      this.stockfish.postMessage(`position fen ${this.chessGame.game.fen()}`);
      this.stockfish.postMessage(`go depth ${depth}`);
    }, 350);
  }

  makeRandomMove() {
    const moves = this.chessGame.game.moves({ verbose: true });
    if (moves.length === 0) return;

    const move = moves[Math.floor(Math.random() * moves.length)];
    const playedMove = this.chessGame.game.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion || 'q'
    });

    this.chessGame.board.position(this.chessGame.game.fen());
    this.chessGame.handlePostMove(playedMove);
  }
}

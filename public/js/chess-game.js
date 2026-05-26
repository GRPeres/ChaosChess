import { ChaosMode, PlayMode } from './modes.js';

export class ChessGame {
  constructor({ ui, onBotTurn, onOnlineMove }) {
    this.ui = ui;
    this.onBotTurn = onBotTurn;
    this.onOnlineMove = onOnlineMove;
    this.game = new Chess();
    this.board = null;
    this.playerColor = 'w';
    this.onlineColor = null;
    this.isOnlineTurnLocked = false;
  }

  mount() {
    this.board = Chessboard('board', {
      draggable: true,
      position: 'start',
      orientation: 'white',
      onDragStart: (source, piece) => this.onDragStart(source, piece),
      onDrop: (source, target) => this.onDrop(source, target),
      onSnapEnd: () => this.board.position(this.game.fen()),
      pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
    });

    this.updateStatus();
  }

  setOnlineColor(color) {
    this.onlineColor = color;
    this.playerColor = color;
    this.board.orientation(color === 'w' ? 'white' : 'black');
    this.updateStatus();
  }

  reset({ preserveOnlineColor = false } = {}) {
    this.game.reset();
    this.playerColor = preserveOnlineColor && this.onlineColor ? this.onlineColor : 'w';
    this.isOnlineTurnLocked = false;
    this.board.orientation(this.playerColor === 'w' ? 'white' : 'black');
    this.board.start();
    this.updateStatus();
  }

  applyRemoteMove(move) {
    const playedMove = this.game.move(move);
    if (!playedMove) return false;

    this.board.position(this.game.fen());
    this.handlePostMove(playedMove, { remote: true });
    return true;
  }

  onDragStart(source, piece) {
    if (this.game.game_over()) return false;

    const isWhitePiece = piece.startsWith('w');
    const isOnline = this.ui.playModeSelect.value === PlayMode.ONLINE;
    const activeColor = isOnline ? this.onlineColor : this.playerColor;

    if (!activeColor || this.game.turn() !== activeColor) return false;
    if (activeColor === 'w' && !isWhitePiece) return false;
    if (activeColor === 'b' && isWhitePiece) return false;
    if (isOnline && this.isOnlineTurnLocked) return false;

    return true;
  }

  onDrop(source, target) {
    const moveRequest = { from: source, to: target, promotion: 'q' };
    const move = this.game.move(moveRequest);

    if (move === null) return 'snapback';

    this.board.position(this.game.fen());
    this.handlePostMove(move);

    if (this.ui.playModeSelect.value === PlayMode.ONLINE) {
      this.onOnlineMove?.({
        from: move.from,
        to: move.to,
        promotion: move.promotion || 'q'
      });
      this.isOnlineTurnLocked = this.game.turn() !== this.onlineColor;
      this.updateStatus();
      return undefined;
    }

    if (!this.game.game_over() && this.game.turn() !== this.playerColor) {
      this.onBotTurn?.();
    }

    return undefined;
  }

  handlePostMove(move, { remote = false } = {}) {
    if (this.ui.chaosModeSelect.value === ChaosMode.SWAP_ON_CAPTURE && move.captured) {
      this.playerColor = this.playerColor === 'w' ? 'b' : 'w';
      this.board.orientation(this.playerColor === 'w' ? 'white' : 'black');

      if (this.ui.playModeSelect.value === PlayMode.ONLINE) {
        this.onlineColor = this.playerColor;
      }

      this.ui.setStatus(`Captura! Voce agora controla ${this.playerColor === 'w' ? 'Brancas' : 'Pretas'}`);

      window.setTimeout(() => {
        this.updateStatus();
        if (this.ui.playModeSelect.value === PlayMode.BOT && !this.game.game_over() && this.game.turn() !== this.playerColor) {
          this.onBotTurn?.();
        }
      }, 250);
      return;
    }

    if (remote) {
      this.isOnlineTurnLocked = false;
    }

    this.updateStatus();
  }

  updateStatus() {
    const moveColor = this.game.turn() === 'w' ? 'Brancas' : 'Pretas';

    if (this.game.in_checkmate()) {
      this.ui.setStatus(`Xeque-mate! ${moveColor} perderam.`);
      return;
    }

    if (this.game.in_draw()) {
      this.ui.setStatus('Empate!');
      return;
    }

    if (this.ui.playModeSelect.value === PlayMode.ONLINE) {
      if (!this.onlineColor) {
        this.ui.setStatus('Entre em uma partida online para comecar.');
      } else if (this.game.turn() === this.onlineColor) {
        this.ui.setStatus(`Sua vez (${this.onlineColor === 'w' ? 'Brancas' : 'Pretas'})${this.game.in_check() ? ' (Xeque)' : ''}`);
      } else {
        this.ui.setStatus(`Vez do oponente${this.game.in_check() ? ' (Xeque)' : ''}`);
      }
      return;
    }

    if (this.game.turn() === this.playerColor) {
      this.ui.setStatus(`Sua vez (${this.playerColor === 'w' ? 'Brancas' : 'Pretas'})${this.game.in_check() ? ' (Xeque)' : ''}`);
    } else {
      this.ui.setStatus(`Bot pensando...${this.game.in_check() ? ' (Xeque)' : ''}`);
    }
  }
}

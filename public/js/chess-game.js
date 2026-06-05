import { ChaosMode, PlayMode, TimeMode } from './modes.js';

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
    const playedMove = this.playMove(move, { ignoreTurn: this.isRealTimeMode() });
    if (!playedMove) return false;

    this.board.position(this.game.fen());
    this.handlePostMove(playedMove, { remote: true });
    return true;
  }

  onDragStart(source, piece) {
    if (this.game.game_over()) return false;

    const isWhitePiece = piece.startsWith('w');
    const isOnline = this.ui.playModeSelect.value === PlayMode.ONLINE;
    const isRealTime = this.isRealTimeMode();
    const activeColor = isOnline ? this.onlineColor : this.playerColor;

    if (!activeColor) return false;
    if (!isRealTime && this.game.turn() !== activeColor) return false;
    if (activeColor === 'w' && !isWhitePiece) return false;
    if (activeColor === 'b' && isWhitePiece) return false;
    if (isOnline && !isRealTime && this.isOnlineTurnLocked) return false;

    return true;
  }

  onDrop(source, target) {
    const moveRequest = { from: source, to: target, promotion: 'q' };
    const move = this.playMove(moveRequest, { ignoreTurn: this.isRealTimeMode() });

    if (move === null) return 'snapback';

    this.board.position(this.game.fen());
    this.handlePostMove(move);

    if (this.ui.playModeSelect.value === PlayMode.ONLINE) {
      this.onOnlineMove?.({
        from: move.from,
        to: move.to,
        promotion: move.promotion || 'q'
      });
      this.isOnlineTurnLocked = !this.isRealTimeMode() && this.game.turn() !== this.onlineColor;
      this.updateStatus();
      return undefined;
    }

    if (!this.game.game_over() && (this.isRealTimeMode() || this.game.turn() !== this.playerColor)) {
      this.onBotTurn?.();
    }

    return undefined;
  }

  playMove(moveRequest, { ignoreTurn = false } = {}) {
    if (!ignoreTurn) {
      return this.game.move(moveRequest);
    }

    const piece = this.game.get(moveRequest.from);
    if (!piece) return null;

    const realtimeGame = new Chess(this.withActiveTurn(this.game.fen(), piece.color));
    const move = realtimeGame.move(moveRequest);
    if (!move) return null;

    this.game.load(realtimeGame.fen());
    return move;
  }

  withActiveTurn(fen, activeTurn) {
    const parts = fen.split(' ');
    parts[1] = activeTurn;
    return parts.join(' ');
  }

  isRealTimeMode() {
    return this.ui.timeModeSelect.value === TimeMode.REAL_TIME;
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
        if (this.ui.playModeSelect.value === PlayMode.BOT && !this.game.game_over() && (this.isRealTimeMode() || this.game.turn() !== this.playerColor)) {
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
      } else if (this.isRealTimeMode()) {
        this.ui.setStatus(`Tempo real: jogue com ${this.onlineColor === 'w' ? 'Brancas' : 'Pretas'} quando quiser${this.game.in_check() ? ' (Xeque)' : ''}`);
      } else if (this.game.turn() === this.onlineColor) {
        this.ui.setStatus(`Sua vez (${this.onlineColor === 'w' ? 'Brancas' : 'Pretas'})${this.game.in_check() ? ' (Xeque)' : ''}`);
      } else {
        this.ui.setStatus(`Vez do oponente${this.game.in_check() ? ' (Xeque)' : ''}`);
      }
      return;
    }

    if (this.isRealTimeMode()) {
      this.ui.setStatus(`Tempo real: voce controla ${this.playerColor === 'w' ? 'Brancas' : 'Pretas'}${this.game.in_check() ? ' (Xeque)' : ''}`);
      return;
    }

    if (this.game.turn() === this.playerColor) {
      this.ui.setStatus(`Sua vez (${this.playerColor === 'w' ? 'Brancas' : 'Pretas'})${this.game.in_check() ? ' (Xeque)' : ''}`);
    } else {
      this.ui.setStatus(`Bot pensando...${this.game.in_check() ? ' (Xeque)' : ''}`);
    }
  }
}

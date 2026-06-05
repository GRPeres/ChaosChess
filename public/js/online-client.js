export class OnlineClient {
  constructor({ ui, chessGame }) {
    this.ui = ui;
    this.chessGame = chessGame;
    this.socket = null;
    this.roomId = null;
    this.pendingFindMatch = false;
  }

  connect() {
    if (!window.WebSocket) {
      this.ui.setConnection('Offline');
      this.ui.setStatus('Este navegador nao suporta WebSocket. Use Chrome, Edge, Firefox ou Safari para jogar online.');
      return;
    }

    if (this.socket && this.socket.readyState <= WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.socket = new WebSocket(`${protocol}//${window.location.host}`);

    this.socket.addEventListener('open', () => {
      this.ui.setConnection('Online', true);
      if (this.pendingFindMatch) {
        this.send({ type: 'findMatch', timeMode: this.ui.timeModeSelect.value });
        this.pendingFindMatch = false;
        this.ui.setStatus('Procurando oponente...');
      } else {
        this.ui.setStatus('Conectado. Clique em Encontrar Partida.');
      }
    });

    this.socket.addEventListener('close', () => {
      this.roomId = null;
      this.pendingFindMatch = false;
      this.ui.setConnection('Offline');
      this.ui.setStatus('Conexao online encerrada.');
    });

    this.socket.addEventListener('message', (event) => {
      this.handleMessage(JSON.parse(event.data));
    });
  }

  findMatch() {
    this.connect();
    if (!window.WebSocket) return;

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.pendingFindMatch = true;
    } else {
      this.send({ type: 'findMatch', timeMode: this.ui.timeModeSelect.value });
    }
    this.ui.setStatus('Procurando oponente...');
  }

  leaveMatch() {
    this.pendingFindMatch = false;
    this.send({ type: 'leaveMatch' });
    this.roomId = null;
    this.chessGame.onlineColor = null;
    this.chessGame.reset();
    this.ui.setStatus('Voce saiu da partida.');
  }

  sendMove(move) {
    this.send({ type: 'move', roomId: this.roomId, move });
  }

  send(message) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify(message));
  }

  handleMessage(message) {
    if (message.type === 'waiting') {
      this.ui.setStatus('Aguardando outro jogador...');
      return;
    }

    if (message.type === 'matchFound') {
      this.roomId = message.roomId;
      if (message.timeMode) {
        this.ui.timeModeSelect.value = message.timeMode;
      }
      this.chessGame.reset({ preserveOnlineColor: true });
      this.chessGame.setOnlineColor(message.color);
      this.ui.setStatus(`Partida encontrada. Voce joga de ${message.color === 'w' ? 'Brancas' : 'Pretas'}.`);
      return;
    }

    if (message.type === 'opponentMove') {
      this.chessGame.applyRemoteMove(message.move);
      return;
    }

    if (message.type === 'opponentLeft') {
      this.roomId = null;
      this.chessGame.onlineColor = null;
      this.ui.setStatus('Oponente saiu da partida.');
      return;
    }

    if (message.type === 'error') {
      this.ui.setStatus(message.message);
    }
  }
}

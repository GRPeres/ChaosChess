import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

const port = Number.parseInt(process.env.PORT || '8080', 10);
const rootDir = resolve(fileURLToPath(new URL('../public/', import.meta.url)));
const clients = new Map();
const rooms = new Map();
let waitingClientId = null;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const requestedPath = url.pathname === '/' ? '/index.html' : url.pathname;
    const filePath = resolve(join(rootDir, requestedPath));

    if (!filePath.startsWith(rootDir)) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    const body = await readFile(filePath);
    response.writeHead(200, {
      'content-type': mimeTypes[extname(filePath)] || 'application/octet-stream'
    });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});

const wss = new WebSocketServer({ server });

wss.on('connection', (socket) => {
  const id = randomUUID();
  clients.set(id, { id, socket, roomId: null });

  socket.on('message', (rawMessage) => {
    try {
      handleMessage(id, JSON.parse(rawMessage.toString()));
    } catch {
      send(id, { type: 'error', message: 'Mensagem invalida.' });
    }
  });

  socket.on('close', () => {
    leaveMatch(id);
    clients.delete(id);
    if (waitingClientId === id) waitingClientId = null;
  });
});

function handleMessage(id, message) {
  if (message.type === 'findMatch') {
    findMatch(id);
    return;
  }

  if (message.type === 'leaveMatch') {
    leaveMatch(id);
    return;
  }

  if (message.type === 'move') {
    relayMove(id, message);
  }
}

function findMatch(id) {
  const client = clients.get(id);
  if (!client) return;

  leaveMatch(id, { silent: true });

  if (!waitingClientId || waitingClientId === id || !clients.has(waitingClientId)) {
    waitingClientId = id;
    send(id, { type: 'waiting' });
    return;
  }

  const opponentId = waitingClientId;
  waitingClientId = null;
  const roomId = randomUUID();

  rooms.set(roomId, {
    id: roomId,
    whiteId: opponentId,
    blackId: id
  });

  clients.get(opponentId).roomId = roomId;
  client.roomId = roomId;

  send(opponentId, { type: 'matchFound', roomId, color: 'w' });
  send(id, { type: 'matchFound', roomId, color: 'b' });
}

function relayMove(id, message) {
  const client = clients.get(id);
  const room = client?.roomId ? rooms.get(client.roomId) : null;

  if (!room || message.roomId !== room.id) {
    send(id, { type: 'error', message: 'Partida nao encontrada.' });
    return;
  }

  const opponentId = room.whiteId === id ? room.blackId : room.whiteId;
  send(opponentId, { type: 'opponentMove', move: message.move });
}

function leaveMatch(id, options = {}) {
  const client = clients.get(id);
  if (!client?.roomId) return;

  const room = rooms.get(client.roomId);
  if (!room) return;

  const opponentId = room.whiteId === id ? room.blackId : room.whiteId;
  const opponent = clients.get(opponentId);

  if (opponent) {
    opponent.roomId = null;
    if (!options.silent) send(opponentId, { type: 'opponentLeft' });
  }

  rooms.delete(room.id);
  client.roomId = null;
}

function send(id, message) {
  const client = clients.get(id);
  if (!client || client.socket.readyState !== client.socket.OPEN) return;
  client.socket.send(JSON.stringify(message));
}

server.listen(port, () => {
  console.log(`Xadrez Caotico running on http://localhost:${port}`);
});

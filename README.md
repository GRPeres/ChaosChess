# Xadrez Caotico

Xadrez Caotico is a lightweight browser chess app with local bot play, online matchmaking, and optional chaos rules. The frontend is written with plain HTML, CSS, and JavaScript modules, while the backend is a small Node.js server that serves the app and connects online players through WebSockets.

## Features

- Play chess locally against a bot
- Choose bot strategy: random, Stockfish, or mixed
- Adjust Stockfish depth and mixed-mode randomness
- Play online through a simple matchmaking queue
- Use the special chaos mode where captures swap the side controlled by the player
- Host with Node.js or Docker
- Minimal framework usage and a modular project structure

## How To Play

Open the app in a browser and choose a game mode from the control panel.

### Against Bot

1. Select `Contra Bot`.
2. Choose the bot strategy.
3. Adjust difficulty or randomness if available.
4. Move pieces on the board by dragging them.
5. Use `Reiniciar Jogo` to start over.

### Online

1. Select `Online`.
2. Click `Encontrar Partida`.
3. Leave the browser tab open while waiting for another player.
4. When a match is found, one player receives white and the other receives black.
5. Moves are sent live through the server.

Online mode requires a browser with WebSocket support and a reachable server. If the app is behind a reverse proxy, the proxy must allow WebSocket upgrades.

## Run Locally

Requirements:

- Node.js 20 or newer
- npm

Install dependencies and start the server:

```bash
npm install
npm start
```

Then open:

```text
http://localhost:8080
```

The default port is `8080`. To use another port:

```bash
PORT=3000 npm start
```

On Windows PowerShell:

```powershell
$env:PORT=3000
npm start
```

## Host With Docker

Build and run the container:

```bash
docker compose up -d --build
```

Open the app at:

```text
http://SERVER_IP:8080
```

To stop the app:

```bash
docker compose down
```

## Host On TrueNAS / FreeNAS

This project can run anywhere Docker containers are supported.

1. Clone the repository onto the server.
2. Open a shell in the project folder.
3. Run:

```bash
docker compose up -d --build
```

4. Visit:

```text
http://SERVER_IP:8080
```

If exposing the app through Nginx, Caddy, Traefik, Cloudflare Tunnel, or another reverse proxy, forward both normal HTTP requests and WebSocket upgrade requests to the container.

## Reverse Proxy Notes

The frontend and WebSocket server use the same host and port. A reverse proxy should send traffic for the site and WebSocket connection to the Node server.

For Nginx, the important headers are:

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_set_header Host $host;
```

## Project Structure

```text
public/
  index.html          Static app shell
  styles.css          App styles
  js/
    app.js            App bootstrap and event wiring
    bot-player.js     Bot and Stockfish logic
    chess-game.js     Board state, moves, status, and chaos rules
    modes.js          Shared mode constants
    online-client.js  Browser WebSocket client
    ui.js             DOM references and UI visibility
server/
  index.js            Static file server and online matchmaking
Dockerfile
docker-compose.yml
package.json
```

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `8080` | HTTP and WebSocket server port |

## Notes

- Stockfish is loaded in the browser from a CDN.
- The chessboard pieces and chess libraries are also loaded from public CDNs.
- Online games are currently in-memory only. Restarting the server clears active rooms and matchmaking state.
- The matchmaking server is intentionally simple: it pairs the next two waiting players.

## License

No license has been selected yet. Add one before publishing if others should be allowed to use, modify, or redistribute the project.

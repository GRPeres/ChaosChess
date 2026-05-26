# Xadrez Caotico

A lightweight chess app built from the original preview HTML. It keeps the frontend mostly framework-free, splits game concerns into modules, and includes a small WebSocket server for online matchmaking.

## Run Locally

```powershell
npm install
npm start
```

Open `http://localhost:8080`.

## Run On TrueNAS / FreeNAS With Docker

Build and run:

```powershell
docker compose up -d --build
```

Then open `http://YOUR_SERVER_IP:8080`.

If you use a reverse proxy, forward HTTP and WebSocket traffic to the same container port.

## Current Features

- Local bot mode with random, Stockfish, and mixed strategies
- Online matchmaking queue
- Browser-to-browser online play over WebSockets
- Modular frontend files for chess rules, bot play, online mode, and UI state
- Chaos rule: players swap sides after a capture

## Project Structure

```text
public/
  index.html
  styles.css
  js/
    app.js
    bot-player.js
    chess-game.js
    modes.js
    online-client.js
    ui.js
server/
  index.js
```

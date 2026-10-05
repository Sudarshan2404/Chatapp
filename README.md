# Simpl-Chat

Simpl-Chat is a lightweight room based chat application. The frontend is built with React, TypeScript, and Vite. An Express server handles health checks and WebSocket connections for room creation, joining, and live message delivery.

## Features

- Create a room and share its room code.
- Join a room with a username and room code.
- Exchange messages in real time over WebSockets.
- See system notices when participants join or leave.
- Check backend availability at `/ping`.
- Run a WebSocket stress test in ramp or room creation mode.

Messages are relayed to connected participants and are not stored. A room exists only in the running backend process. The backend currently includes the room code `121215` for local development.

## Requirements

- Node.js 18 or newer
- npm

## Run locally

Clone the repository, then install dependencies in both app folders:

```bash
cd Backdend
npm install

cd ../Frontend
npm install
```

Create `Backdend/.env`:

```dotenv
PORT=8080
```

Create `Frontend/.env`:

```dotenv
VITE_WEB=ws://localhost:8080
```

Start the backend and frontend in separate terminals:

```bash
cd Backdend
npm run dev
```

```bash
cd Frontend
npm run dev
```

Open the Vite URL printed in the frontend terminal (normally `http://localhost:5173`). The frontend checks the backend's `/ping` endpoint before showing the app.

## Available scripts

### Backend (`Backdend`)

| Command | Description |
| --- | --- |
| `npm run dev` | Compile the TypeScript backend and start it. |
| `npm test` | Run Jest. |

The server listens on `PORT`, defaulting to `8080`, and binds to `0.0.0.0`.

### Frontend (`Frontend`)

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Type-check and create a production build in `dist`. |
| `npm run preview` | Serve the production build locally. |
| `npm run lint` | Run ESLint. |

## WebSocket message protocol

Connect to the backend's WebSocket endpoint, then send JSON messages:

| Purpose | Request |
| --- | --- |
| Create a room | `{"type":"createroom"}` |
| Join a room | `{"type":"join","payload":{"roomId":"123456","username":"Alex"}}` |
| Send a chat message | `{"type":"chat","payload":{"message":"Hello!"}}` |

Room creation responds with a numeric room code. A successful join sends a `joinsystem` event to the joining client and a `system` notice to other participants. Chat messages are sent to the other connected clients in that room as `server` events. A client must join a valid room before sending chat messages.

The HTTP health endpoint is `GET /ping` and returns JSON like:

```json
{"success":true,"message":"Server is running"}
```

## Stress testing

With the backend running, open another terminal and run the stress test from the backend folder:

```bash
cd Backdend
node test/stress.test.js
```

The default ramp test increases the number of connected users and reports delivery, latency, and server responsiveness. For example:

```bash
node test/stress.test.js --steps 100,500,1000 --perRoom 10 --msgRate 1 --hold 20
```

To test room creation instead of connected users:

```bash
node test/stress.test.js --mode rooms --roomTargets 1000,10000
```

Use `node test/stress.test.js --help` to print the test's options. Results are written to `stress-results.json` by default.

## Project layout

```text
Backdend/
  src/app.ts             Express and WebSocket server
  test/stress.test.js    WebSocket load and room creation test
Frontend/
  src/                   React application and chat UI
```

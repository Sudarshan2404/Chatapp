import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });
let usernumber = 0;
let alsocket: WebSocket[] = [];

wss.on("connection", (socket) => {
  usernumber += 1;
  let user = `User ${usernumber}`;
  alsocket.push(socket);
  console.log(`user ${usernumber} connected`);

  socket.on("message", (e) => {
    alsocket.forEach((s) => {
      if (socket == s) {
        return;
      }
      s.send(`${e.toString()}: Recieved from ${user}`);
    });
  });
});

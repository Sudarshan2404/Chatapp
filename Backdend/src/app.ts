import { WebSocketServer, WebSocket } from "ws";

// @ts-ignore

const wss = new WebSocketServer({ port: 8080 });
let usernumber = 0;
// @ts-ignore
let allsocket = new Map();
let rooms: string[] = [];
let roomcode;
wss.on("connection", (socket) => {
  usernumber += 1;
  console.log(`user ${usernumber} connected`);

  socket.on("message", (message) => {
    // @ts-ignore
    const parsedMessage = JSON.parse(message);
    if (parsedMessage.type === "createroom") {
      do {
        roomcode = Math.floor(100000 + Math.random() * 999999);
      } while (roomcode.toString() in rooms);
      rooms.push(roomcode.toString());
      socket.send(roomcode);
    }
    if (parsedMessage.type === "join") {
      const roomId = parsedMessage.payload.roomId.toString();
      if (rooms.includes(roomId)) {
        allsocket.set(socket, {
          roomId: parsedMessage.payload.roomId,
          Username: parsedMessage.payload.username,
        });
        console.log(
          `${parsedMessage.payload.username} joined the ${parsedMessage.payload.roomId} room`
        );
        socket.send("ok");
        return;
      } else {
        socket.send("false");
      }
    }

    if (parsedMessage.type === "chat") {
      const currentUser = allsocket.get(socket);
      const cUsername = currentUser.Username;
      const currentUserRoom = currentUser.roomId;

      allsocket.forEach((user, currentUserSocket) => {
        if (user.roomId == currentUserRoom && currentUserSocket != socket) {
          return currentUserSocket.send(
            `${parsedMessage.payload.message}: form ${cUsername}`
          );
        }
        console.log("Went wrong");
        return;
      });
    }
  });

  socket.on("close", () => {
    const currentUser = allsocket.get(socket);
    const cUsername = currentUser.Username;
    allsocket.delete(socket);
    console.log(`${cUsername} Disconnected`);
  });
});

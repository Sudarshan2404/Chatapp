import { WebSocketServer, WebSocket } from "ws";
import express from "express";
import http from "http";
import dotenv from "dotenv";

// @ts-ignore
const PORT = Number(process.env.PORT) || 8080;
const app = express();
const server = http.createServer(app);
// @ts-ignore

app.get("/", (req, res) => {
  res.send("Wensocket server started successfully");
});

const wss = new WebSocketServer({ server });
let usernumber = 0;
// @ts-ignore
let allsocket = new Map();
let rooms: string[] = ["121215"];
let roomcode;
wss.on("connection", (socket) => {
  try {
    usernumber += 1;
    // console.log(`user ${usernumber} connected`);

    socket.on("message", (message) => {
      let parsedMessage;
      try {
        parsedMessage = JSON.parse(message.toString());
      } catch (err) {
        socket.send("Invalid JSON format");
        return;
      }
      if (parsedMessage.type === "createroom") {
        do {
          roomcode = Math.floor(100000 + Math.random() * 999999);
        } while (rooms.includes(roomcode.toString()));
        rooms.push(roomcode.toString());
        socket.send(roomcode);
      }
      if (parsedMessage.type === "join") {
        try {
          const roomId = parsedMessage.payload.roomId.toString();
          if (rooms.includes(roomId)) {
            allsocket.set(socket, {
              roomId: parsedMessage.payload.roomId,
              Username: parsedMessage.payload.username,
            });
            const currentUser = allsocket.get(socket);
            if (!currentUser) {
              // console.error("User didnt join any room");
              socket.send("You must join a room first");
              return;
            }
            const cUsername = currentUser.Username;
            const currentUserRoom = currentUser.roomId;

            allsocket.forEach((user, currentUserSocket) => {
              if (
                user.roomId == currentUserRoom &&
                currentUserSocket != socket
              ) {
                return currentUserSocket.send(
                  JSON.stringify({
                    sender: "system",
                    payload: { message: `${cUsername} joined this chat` },
                  }),
                );
              }
            });

            socket.send(
              JSON.stringify({
                sender: "joinsystem",
                payload: {
                  status: "True",
                  message: "Joined room successfully",
                },
              }),
            );
            return;
          } else {
            socket.send("false");
          }
        } catch (error) {
          console.error("An Error occured while joining room", error);
          socket.send("An internal server Error Occured");
        }
      }

      if (parsedMessage.type === "chat") {
        try {
          const currentUser = allsocket.get(socket);
          if (!currentUser) {
            console.error("User didnt join any room");
            socket.send("You must join a room first");
            return;
          }
          const cUsername = currentUser.Username;
          const currentUserRoom = currentUser.roomId;

          allsocket.forEach((user, currentUserSocket) => {
            if (user.roomId == currentUserRoom && currentUserSocket != socket) {
              return currentUserSocket.send(
                JSON.stringify({
                  sender: "server",
                  payload: {
                    message: parsedMessage.payload.message,
                    username: cUsername,
                  },
                }),
              );
            }
            // console.log("Went wrong");
            return;
          });
        } catch (error) {
          console.log("an Error occuerd while chatting", error);
          socket.send("An internal Error occured");
        }
      }
    });

    socket.on("close", () => {
      const currentUser = allsocket.get(socket);
      if (!currentUser) return;
      const cUsername = currentUser.Username;
      const currentUserRoom = currentUser.roomId;
      allsocket.forEach((user, currentUserSocket) => {
        if (user.roomId == currentUserRoom && currentUserSocket != socket) {
          return currentUserSocket.send(
            JSON.stringify({
              sender: "system",
              payload: {
                message: `${cUsername} left this chat`,
              },
            }),
          );
        }
      });
      allsocket.delete(socket);
      // console.log(`${cUsername} Disconnected`);
    });
  } catch (error) {
    console.error("Shit went bad brother", error);
    socket.send("Check syntax and try again brother");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

import { useEffect, useRef, useState } from "react";
import { useSocket } from "../Socket.tsx";

const Chat = () => {
  type Msg = {
    message: string;
    username: string;
    sender: "me" | "server" | "system";
  };

  const socketRef = useSocket();
  const [joined, setJoined] = useState<boolean>(false);
  console.log(joined);

  const inputref = useRef<HTMLInputElement | null>(null);
  const [myMsg, setMyMsg] = useState<Msg[]>([]);
  const username = localStorage.getItem("username");
  const roomId = localStorage.getItem("roomId");
  console.log(myMsg);
  const SendMsg = () => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    const message = inputref.current?.value.trim();
    if (!message) return;

    socket.send(
      JSON.stringify({
        type: "chat",
        payload: { message },
      })
    );

    setMyMsg((prev) => [...prev, { sender: "me", message, username: "me" }]);
    inputref.current!.value = "";
  };

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    if (!roomId || !username) {
      alert("Invalid session. Please join again.");
      return;
    }

    const handleOpen = () => {
      socket.send(
        JSON.stringify({
          type: "join",
          payload: { roomId, username },
        })
      );
    };

    const handleMessage = (event: MessageEvent) => {
      const res = JSON.parse(event.data);

      if (res.data?.sender === "joinsystem") {
        if (res.data.payload?.status === "true") {
          setJoined(true);
          return;
        }
      }

      setMyMsg((prev) => [
        ...prev,
        {
          message: res.payload.message,
          username: res.payload.username,
          sender: res.sender,
        },
      ]);
    };

    socket.addEventListener("open", handleOpen);
    socket.addEventListener("message", handleMessage);

    return () => {
      socket.removeEventListener("open", handleOpen);
      socket.removeEventListener("message", handleMessage);
    };
  }, [socketRef, roomId, username]);

  return (
    <div className="flex justify-center items-centerw-screen h-screen bg-amber-200">
      <div className="flex flex-col w-[50%] h-[98%] justify-end bg-amber-100 m-2 rounded-2xl gap-2 overflow-auto">
        {myMsg.map((msg, i) =>
          msg.sender === "me" ? (
            <div key={i} className=" flex w-[80%] ml-auto mr-auto justify-end">
              <h1 className="px-2 py-1 bg-white w-fit h-auto rounded-xl ml-1 mb-2">
                {msg.message}
              </h1>
            </div>
          ) : msg.sender === "server" ? (
            <div key={i} className=" flex w-[80%] ml-auto mr-auto">
              <div className="min-w-20 flex flex-col gap-2 px-2 py-1 bg-white w-fit h-auto rounded-xl ml-1 mb-2">
                <h1 className="text-purple-500 text-[12px] justify-self-start px-1">
                  {msg?.username}
                </h1>
                <h1 className="text-[14px] px-1">{msg.message}</h1>
              </div>
            </div>
          ) : (
            <div
              key={i}
              className=" flex w-[80%] ml-auto mr-auto justify-center"
            >
              <h1 className="px-2 py-1 text-gray-400 w-fit h-auto rounded-xl ml-1 mb-2">
                {msg.message}
              </h1>
            </div>
          )
        )}
        <div className="flex w-[80%] items-center justify-center mb-4 gap-2 ml-auto mr-auto">
          <input
            className="bg-[#ffffff] w-[80%] h-10 rounded-3xl px-4 py-2"
            type="text"
            ref={inputref}
            placeholder="Message....."
          />
          <button
            onClick={SendMsg}
            className="w-[20%] h-10 bg-blue-300 rounded-2xl cursor-pointer"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;

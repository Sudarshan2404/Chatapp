import { useEffect, useRef, useState } from "react";
import { useSocket } from "../Socket.tsx";

const Chat = () => {
  type Msg = {
    message: string;
    sender: "me" | "server";
  };

  const s = useSocket();
  const socket = s.current;

  const inputref = useRef<HTMLInputElement | null>(null);
  const [myMsg, setMyMsg] = useState<Msg[]>([]);

  const SendMsg = () => {
    if (!inputref || !inputref.current || !socket) return;
    const message = inputref.current.value;
    socket.send(message);
    if (inputref.current.value.length != 0) {
      setMyMsg((prev) => [...prev, { sender: "me", message: message }]);
      inputref.current.value = "";
    }
  };

  useEffect(() => {
    if (!socket) return;
    socket.onmessage = (event) => {
      setMyMsg((prev) => [...prev, { message: event.data, sender: "server" }]);
    };
  }, [socket]);

  return (
    <div className="flex flex-col w-[50%] h-[98%] justify-end bg-amber-100 m-2 rounded-2xl gap-2 overflow-auto">
      {myMsg.map((msg, i) =>
        msg.sender === "me" ? (
          <div key={i} className=" flex w-[80%] ml-auto mr-auto justify-end">
            <h1 className="px-2 py-1 bg-white w-fit h-auto rounded-xl ml-1 mb-2">
              {msg.message}
            </h1>
          </div>
        ) : (
          <div key={i} className=" flex w-[80%] ml-auto mr-auto">
            <h1 className="px-2 py-1 bg-white w-fit h-auto rounded-xl ml-1 mb-2">
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
  );
};

export default Chat;

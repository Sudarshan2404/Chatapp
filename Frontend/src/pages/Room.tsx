import { useEffect, useRef, useState } from "react";
import { useSocket } from "../Socket";
import { useNavigate } from "react-router-dom";

const Room = () => {
  const socketRef = useSocket();
  const navigate = useNavigate();
  const roomref = useRef<HTMLInputElement>(null);
  const usernameref = useRef<HTMLInputElement>(null);

  const [roomCode, setRoomcode] = useState<number | null>(null);

  const genroom = () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN)
      return;
    if (roomCode) {
      alert("User Cannot genreate multiple rooms");
      return;
    }
    socketRef.current?.send(
      JSON.stringify({
        type: "createroom",
      })
    );
    console.log("Everything fine");
  };

  const joinRoom = () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN)
      return;
    // socketRef.current?.send(
    //   JSON.stringify({
    //     type: "join",
    //     payload: {
    //       roomId: roomref.current?.value,
    //       username: usernameref.current?.value,
    //     },
    //   })
    // );
    if (!roomref || !usernameref) {
      alert("Something went wrong");
      return;
    }
    localStorage.setItem("roomId", roomref.current?.value || "");
    localStorage.setItem("username", usernameref.current?.value || "");
    console.log("Everything fine");
    roomref.current!.value = "";
    usernameref.current!.value = "";
    navigate("/chat");
  };

  useEffect(() => {
    if (!socketRef.current) return;
    socketRef.current.onmessage = (e) => {
      if (e.data === "ok") {
        navigate("/chat");
        return;
      }
      if (e.data === "false") {
        alert(e.data);
        return;
      }
      setRoomcode(e.data);
    };
  }, [socketRef]);

  const [join, setJoin] = useState<boolean>(true);
  return (
    <div className="flex justify-center items-centerw-screen h-screen bg-amber-200">
      <div className="flex flex-col w-[50%] h-[98%] items-center bg-amber-100 m-2 rounded-2xl gap-2 overflow-auto drop-shadow-2xl">
        <h1 className="text-amber-300 text-8xl g-font mt-20 text-center">
          Simpl-Chat
        </h1>
        <div className="w-full flex flex-col mt-15 justify-center">
          <div className="w-[90%] flex justify-between px-25 pb-4 ml-auto mr-auto text-3xl g-font font-semibold border-b-2 border-amber-300">
            {join ? (
              <>
                <button
                  onClick={() => {
                    setJoin(true);
                  }}
                  className="bg-amber-300 py-2 px-4 cursor-pointer text-white rounded-xl"
                >
                  Join Room
                </button>
                <button
                  onClick={() => {
                    setJoin(false);
                  }}
                  className="cursor-pointer  py-2 px-4 text-amber-300"
                >
                  Create Room
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setJoin(true);
                  }}
                  className="cursor-pointer  py-2 px-4 text-amber-300"
                >
                  Join Room
                </button>
                <button
                  onClick={() => {
                    setJoin(false);
                  }}
                  className="bg-amber-300 py-2 px-4 cursor-pointer text-white rounded-xl"
                >
                  Create Room
                </button>
              </>
            )}
          </div>
          {join ? (
            <div className=" w-full flex flex-col justify-center items-center mt-10 gap-2">
              <input
                name="room"
                ref={roomref}
                placeholder="Enter Room Code.... "
                className="w-[60%] bg-[#ffffff] text-xl g-font py-3 px-4 rounded-xl border-2 border-amber-300"
              />
              <input
                name="room"
                ref={usernameref}
                placeholder="Enter Your Username.... "
                className="w-[60%] bg-[#ffffff] text-xl g-font py-3 px-4 rounded-xl border-2 border-amber-300"
              />
              <button
                onClick={joinRoom}
                className="z-99 bg-amber-300 text-white g-font text-3xl py-3 px-4 mt-5 cursor-pointer rounded-xl"
              >
                Join
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col justify-center items-center mt-10 gap-2">
              <div className="w-[60%] h-15 bg-[#ffffff] text-xl g-font py-3 px-4 rounded-xl border-2 border-amber-300">
                {roomCode ? (
                  <h1>{roomCode}</h1>
                ) : (
                  <h1>Your Room Code will appear here!!</h1>
                )}
              </div>

              <button
                onClick={genroom}
                className="z-99 bg-amber-300 text-white g-font text-3xl py-3 px-4 mt-5 cursor-pointer rounded-xl"
              >
                Genreate Room Code
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Room;

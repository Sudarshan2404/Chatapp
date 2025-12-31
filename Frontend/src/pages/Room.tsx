import React, { useState } from "react";
import { useSocket } from "../Socket";

const Room = () => {
  const [join, setJoin] = useState<boolean>(true);
  return (
    <div className="flex flex-col w-[50%] h-[98%] items-center bg-amber-100 m-2 rounded-2xl gap-2 overflow-auto">
      <h1 className="text-amber-300 text-8xl g-font mt-20 text-center">
        Simpl-Chat
      </h1>
      <div className="w-full flex flex-col mt-15 justify-center">
        <div className="w-[90%] flex justify-between px-25 pb-4 ml-auto mr-auto text-3xl g-font font-semibold text-[#ffffff] border-b-2 border-amber-300">
          {join ? (
            <>
              <button
                onClick={() => {
                  setJoin(!join);
                }}
                className="bg-amber-300 py-2 px-4 cursor-pointer"
              >
                Join Room
              </button>
              <button
                onClick={() => {
                  setJoin(!join);
                }}
                className="cursor-pointer"
              >
                Create Room
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setJoin(!join);
                }}
                className="cursor-pointer"
              >
                Join Room
              </button>
              <button
                onClick={() => {
                  setJoin(!join);
                }}
                className="bg-amber-300 py-2 px-4 cursor-pointer"
              >
                Create Room
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Room;

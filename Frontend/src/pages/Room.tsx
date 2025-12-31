import React, { useState } from "react";
import { useSocket } from "../Socket";
import { motion } from "motion/react";

const Room = () => {
  const [join, setJoin] = useState<boolean>(true);
  return (
    <div className="flex flex-col w-[50%] h-[98%] items-center bg-amber-100 m-2 rounded-2xl gap-2 overflow-auto">
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
        <div className="w-full flex flex-col justify-center items-center mt-10 gap-2">
          <input
            name="room"
            placeholder="Enter Room Code.... "
            className="w-[60%] bg-[#ffffff] text-xl g-font py-3 px-4 rounded-xl border-2 border-amber-300"
          />
          <input
            name="room"
            placeholder="Enter Your Username.... "
            className="w-[60%] bg-[#ffffff] text-xl g-font py-3 px-4 rounded-xl border-2 border-amber-300"
          />
          <button className="bg-amber-300 text-white g-font text-3xl py-3 px-4 mt-5 cursor-pointer rounded-xl">
            Join
          </button>
        </div>
      </div>
    </div>
  );
};

export default Room;

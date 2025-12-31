import { useEffect, useRef } from "react";

export const useSocket = () => {
  const socketRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    const ws: WebSocket = new WebSocket("ws://localhost:8080");
    socketRef.current = ws;

    return () => {
      ws.close();
    };
  }, []);
  return socketRef;
};

import { useEffect, useRef } from "react";

export const useSocket = () => {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (socketRef.current) return; // ✅ prevents double connect (StrictMode)

    const ws = new WebSocket("ws://localhost:8080");
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      socketRef.current = null;
    };

    ws.onerror = (err) => {
      console.error("WebSocket error", err);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  return socketRef;
};

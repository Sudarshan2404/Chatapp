import { useEffect, useRef } from "react";
import { Navigate, useNavigate } from "react-router";

export const useSocket = () => {
  const socketRef = useRef<WebSocket | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (socketRef.current) return; // ✅ prevents double connect (StrictMode)

    const ws = new WebSocket("ws://192.168.1.33:8080");
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      socketRef.current = null;
    };

    ws.onerror = (err) => {
      navigate("/err500");
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

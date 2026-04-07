import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

type Status = "checking" | "healthy" | "failed";

const getPingUrl = () => {
  const backendUrl = import.meta.env.VITE_WEB;

  if (!backendUrl) {
    throw new Error("❌ VITE_WEB is not defined");
  }

  try {
    const url = new URL(backendUrl);

    // Convert WS → HTTP for health check
    if (url.protocol === "wss:") url.protocol = "https:";
    if (url.protocol === "ws:") url.protocol = "http:";

    url.pathname = "/ping";
    url.search = "";
    url.hash = "";

    return url.toString();
  } catch (err) {
    console.error("Invalid VITE_WEB URL:", err);
    throw err;
  }
};

const CheckBackend = () => {
  const [status, setStatus] = useState<Status>("checking");
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return; // prevent double execution (React strict mode)
    hasRun.current = true;

    const checkBackend = async (retries = 3) => {
      const controller = new AbortController();
      const url = getPingUrl();

      console.log("🔍 Pinging:", url);

      try {
        // ⏱ timeout (8s for Render cold start)
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(url, {
          method: "GET",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log("✅ Status:", response.status);

        if (!response.ok) throw new Error("Ping failed");

        const data = await response.json();
        console.log("✅ Backend:", data);

        setStatus("healthy");
      } catch (err) {
        // ✅ Ignore abort errors (React cleanup / timeout)
        if (err.name === "AbortError") {
          console.warn("⚠️ Request aborted (timeout or cleanup)");
          return;
        }

        console.error("❌ Ping error:", err);

        if (retries > 0) {
          console.log(`🔁 Retrying... (${retries} left)`);
          setTimeout(() => checkBackend(retries - 1), 2000);
          return;
        }

        setStatus("failed");
      }
    };

    checkBackend();

    return () => {
      // nothing needed here now (controller is per request)
    };
  }, []);

  // 🟡 Loading UI
  if (status === "checking") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-amber-200 text-amber-700">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-amber-700"></div>
        <p className="text-lg font-medium">Waking up the server...</p>
        <p className="text-sm opacity-70">
          First request may take a few seconds (Render cold start)
        </p>
      </div>
    );
  }

  // 🔴 Failure
  if (status === "failed") {
    return <Navigate to="/err500" replace />;
  }

  // 🟢 Success
  return <Outlet />;
};

export default CheckBackend;

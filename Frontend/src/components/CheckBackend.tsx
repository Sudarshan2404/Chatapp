import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";

const getPingUrl = () => {
  const backendUrl = import.meta.env.VITE_WEB;

  if (!backendUrl) {
    return "/ping";
  }

  try {
    const url = new URL(backendUrl);
    url.protocol = url.protocol === "wss:" ? "https:" : "http:";
    url.pathname = "/ping";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "/ping";
  }
};

const CheckBackend = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [isHealthy, setIsHealthy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const checkBackend = async () => {
      try {
        const response = await fetch(getPingUrl(), {
          method: "GET",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Backend ping failed");
        }

        setIsHealthy(true);
      } catch {
        setIsHealthy(false);
      } finally {
        setIsChecking(false);
      }
    };

    void checkBackend();

    return () => {
      controller.abort();
    };
  }, []);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-200 text-xl text-amber-700">
        Checking server...
      </div>
    );
  }

  if (!isHealthy) {
    return <Navigate to="/err500" replace />;
  }

  return <Outlet />;
};

export default CheckBackend;

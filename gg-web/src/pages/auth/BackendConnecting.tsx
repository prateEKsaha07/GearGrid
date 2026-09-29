import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type State = "connecting" | "online" | "failed";

const MAX_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 3000;
const REDIRECT_DELAY_MS = 1000;

export default function BackendConnecting() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>("connecting");
  const [attempts, setAttempts] = useState(0);
  const attemptRef = useRef(0);
  const cancelledRef = useRef(false);

  const startPolling = () => {
    cancelledRef.current = false;
    attemptRef.current = 0;
    setAttempts(0);
    setState("connecting");
  };

  useEffect(() => {
    if (state !== "connecting") return;

    cancelledRef.current = false;

    const poll = async () => {
      if (cancelledRef.current) return;

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/health`);
        if (!res.ok) throw new Error("not ok");

        if (cancelledRef.current) return;
        setState("online");
        setTimeout(() => {
          if (!cancelledRef.current) navigate("/login");
        }, REDIRECT_DELAY_MS);
      } catch {
        if (cancelledRef.current) return;
        attemptRef.current += 1;
        setAttempts(attemptRef.current);

        if (attemptRef.current >= MAX_ATTEMPTS) {
          setState("failed");
        }
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelledRef.current = true;
      clearInterval(interval);
    };
  }, [state, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
        {state === "connecting" && (
          <>
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary" />
            <p className="text-lg font-medium">Connecting to server...</p>
            <p className="text-xs text-muted-foreground">
              Attempt {attempts} of {MAX_ATTEMPTS}
            </p>
          </>
        )}

        {state === "online" && (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-green-500"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <p className="text-lg font-medium">Backend Online</p>
            <p className="text-xs text-muted-foreground">Redirecting...</p>
          </>
        )}

        {state === "failed" && (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-red-500"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </div>
            <p className="text-lg font-medium">
              Server unavailable — please try again later
            </p>
            <button
              type="button"
              onClick={startPolling}
              className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Retry
            </button>
          </>
        )}
      </div>
    </div>
  );
}
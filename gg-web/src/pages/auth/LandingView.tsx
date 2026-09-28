import { useState } from "react";
import { useNavigate } from "react-router-dom";

type BackendState = "idle" | "connecting" | "online";

export default function LandingView() {
  const [backendState, setBackendState] = useState<BackendState>("idle");
  const navigate = useNavigate();

  const wakeBackend = async () => {
    if (backendState === "connecting" || backendState === "online") return;
    setBackendState("connecting");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/health`);
      if (!res.ok) throw new Error("Backend not healthy");
      setBackendState("online");
    } catch {
      setBackendState("idle");
    }
  };

  const indicatorClass =
    backendState === "idle"
      ? "bg-neutral-400"
      : backendState === "connecting"
      ? "bg-amber-500 animate-pulse"
      : "bg-green-500";

  const buttonLabel =
    backendState === "idle"
      ? "Connect Server"
      : backendState === "connecting"
      ? "Connecting..."
      : "Backend Online";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-12 px-6 py-20">
        <div className="text-center">
          <h1 className="text-4xl font-semibold tracking-tight">GearGrid</h1>
          <p className="mt-3 text-muted-foreground">
            Rent farm equipment from nearby owners. Or list yours.
          </p>
        </div>

        <button
          onClick={wakeBackend}
          disabled={backendState === "connecting"}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm transition hover:bg-muted disabled:cursor-not-allowed"
        >
          <span className={`h-2.5 w-2.5 rounded-full ${indicatorClass}`} />
          {buttonLabel}
        </button>

        <div className="w-full space-y-8">
          <section>
            <h2 className="text-lg font-medium">Problem</h2>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>Small farmers can't afford to own every piece of equipment.</li>
              <li>Idle machinery on nearby farms goes unused each season.</li>
              <li>Informal rentals rely on phone calls and guesswork.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium">Solution</h2>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>A local marketplace for renting farm equipment by the day.</li>
              <li>Verified listings, transparent pricing, mutual agreements.</li>
              <li>Both sides build a reliability score over time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium">How it Works</h2>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>Browse or post a request in your pincode.</li>
              <li>Agree on price and dates through bids.</li>
              <li>Confirm pickup and return with signed agreements.</li>
            </ul>
          </section>
        </div>

        <button
          onClick={() => navigate("/login")}
          disabled={backendState !== "online"}
          className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import landingImage from "../../assets/landing.jpg";

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

  const wakeButtonLabel =
    backendState === "idle"
      ? "Wake Backend"
      : backendState === "connecting"
      ? "Connecting..."
      : "Backend ready";

  const wakeCardTitle =
    backendState === "idle"
      ? "Backend asleep"
      : backendState === "connecting"
      ? "Connecting..."
      : "Backend Online";

  const wakeCardBody =
    backendState === "idle"
      ? "Wake the service before getting started. No account data is sent yet."
      : backendState === "connecting"
      ? "Waking the secure service. This usually takes under 30 seconds."
      : "You can log in or create an account.";

  const statusPill =
    backendState === "idle"
      ? { label: "Idle", cls: "bg-muted text-muted-foreground" }
      : backendState === "connecting"
      ? { label: "Please wait", cls: "bg-amber-500/15 text-amber-700" }
      : { label: "Ready", cls: "bg-green-500/15 text-green-700" };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M12 6v12" />
                <path d="M6 12h12" />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight">GearGrid</span>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground">
              How it works
            </a>
            <a href="#trust" className="text-sm text-muted-foreground hover:text-foreground">
              Trust &amp; safety
            </a>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <span className="rounded-full border border-border px-2 py-0.5">EN</span>
              <span className="rounded-full px-2 py-0.5">हिं</span>
            </span>
            <button
              type="button"
              onClick={() => navigate("/login")}
              disabled={backendState !== "online"}
              className="text-sm font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              Log in
            </button>
          </nav>
        </header>

        <section className="mb-20 grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Peer-to-peer farm equipment · India
            </span>

            <h1 className="mt-5 text-5xl font-semibold leading-tight tracking-tight lg:text-6xl">
              Grow More,
              <br />
              Own Less.
            </h1>

            <p className="mt-5 max-w-lg text-base text-muted-foreground">
              Rent trusted farm equipment nearby—or earn from tools sitting idle.
              Calendar bookings, condition records and safer handoffs for small and
              marginal farmers.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={wakeBackend}
                disabled={backendState === "connecting" || backendState === "online"}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex h-4 w-4 items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M12 2v10" />
                    <path d="M18.4 6.6a9 9 0 1 1-12.8 0" />
                  </svg>
                </span>
                {wakeButtonLabel}
              </button>

              <a
                href="#how-it-works"
                className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-muted"
              >
                See how it works
              </a>
            </div>

            <p className="mt-5 text-xs text-muted-foreground">
              Cash or UPI directly between parties. GearGrid never collects your money.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-border">
            <img
              src={landingImage}
              alt="Farmer with a tractor in a field"
              className="aspect-[4/3] w-full object-cover"
            />
            <div className="absolute bottom-4 left-4 rounded-xl border border-border bg-background/95 px-4 py-3 shadow-sm backdrop-blur">
              <p className="text-[10px] font-medium uppercase tracking-wider text-primary">
                Available nearby
              </p>
              <p className="mt-1 text-sm font-semibold">Mahindra 575 DI</p>
              <p className="mt-0.5 text-xs text-muted-foreground">₹1,500/day · 6 km</p>
            </div>
          </div>
        </section>

        <section className="mb-20 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-7">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              The farm reality
            </p>
            <h2 className="mt-3 text-xl font-semibold">
              Equipment is costly. Useful machines sit idle.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              A new tractor can be out of reach for a two-acre farm, while a
              neighbour's machine may remain unused between jobs.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-7">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              The shared solution
            </p>
            <h2 className="mt-3 text-xl font-semibold">
              Match local demand with local equipment.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              One account lets you own and rent. Clear dates, plain-language
              agreements and handoff checks make every booking easier to trust.
            </p>
          </div>
        </section>

        <section id="how-it-works" className="mb-20">
          <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            From local search to a documented return—without an in-app checkout.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                n: "01",
                title: "List or request",
                body: "Owners list idle equipment; renters post what the farm task needs.",
              },
              {
                n: "02",
                title: "Bid",
                body: "Compare dates, direct price and separate owner/renter reliability scores.",
              },
              {
                n: "03",
                title: "Book",
                body: "Accepting locks calendar slots and creates a transparent booking record.",
              },
              {
                n: "04",
                title: "Pickup & agreement",
                body: "Condition photos, digital signatures, direct payment confirmation and OTP.",
              },
              {
                n: "05",
                title: "Return",
                body: "Compare photos, settle deposit directly, confirm OTP and receive an invoice.",
              },
            ].map((step) => (
              <div key={step.n} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {step.n}
                </div>
                <h3 className="mt-4 text-sm font-semibold">{step.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="trust" className="mb-20">
          <h2 className="text-2xl font-semibold tracking-tight">
            Trust built into every handoff
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Practical records for real-world rentals.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Digital agreements",
                body: "Auto-filled equipment, dates, price, deposit and notes with both e-sign statuses.",
              },
              {
                title: "Pickup & return OTP",
                body: "Time-limited codes confirm the equipment changed hands in person.",
              },
              {
                title: "Condition photos",
                body: "Mandatory pickup and return records make changes easy to see.",
              },
              {
                title: "Two reliability scores",
                body: "Owner and renter behaviour are measured separately across each stage.",
              },
            ].map((card) => (
              <div key={card.title} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <h3 className="mt-4 text-sm font-semibold">{card.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold tracking-tight">
            Get started when the backend is ready
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Wake the secure service first. Get Started remains disabled until online.
          </p>

          <div className="mt-8 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${indicatorClass}`} />
                <div>
                  <p className="text-sm font-semibold">{wakeCardTitle}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{wakeCardBody}</p>
                </div>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusPill.cls}`}>
                {statusPill.label}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={wakeBackend}
                disabled={backendState === "connecting" || backendState === "online"}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {backendState === "online" ? "Backend ready" : wakeButtonLabel}
              </button>
              <button
                type="button"
                onClick={() => navigate("/login")}
                disabled={backendState !== "online"}
                className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                Get Started
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-primary px-8 py-10 text-primary-foreground">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Ready to put the right tool to work?
              </h2>
              <p className="mt-2 text-sm opacity-90">
                Wake the backend, then create one account to rent and list.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/login")}
              disabled={backendState !== "online"}
              className="rounded-lg bg-primary-foreground px-6 py-3 text-sm font-medium text-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Get Started
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
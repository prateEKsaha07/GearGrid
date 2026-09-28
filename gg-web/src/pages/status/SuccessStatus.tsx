import { useLocation, useNavigate } from "react-router-dom";

type StatusState = {
  message?: string;
  redirectTo?: string;
};

export default function SuccessStatus() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state ?? {}) as StatusState;

  const message = state.message ?? "Operation completed successfully.";
  const redirectTo = state.redirectTo ?? "/dashboard";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-6 py-24 text-center">
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

        <p className="text-lg font-medium">{message}</p>

        <button
          onClick={() => navigate(redirectTo)}
          className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
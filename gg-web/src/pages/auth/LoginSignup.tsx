import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

type Mode = "login" | "signup";

export default function LoginSignup() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        navigate("/error", { state: { message: error.message, redirectTo: "/login" } });
        return;
      }

      const user = data.user;
      if (!user) {
        navigate("/error", {
          state: { message: "Signup succeeded but no user returned.", redirectTo: "/login" },
        });
        return;
      }

      const { error: profileError } = await supabase.from("users").insert({
        id: user.id,
        name,
        email,
        language_pref: "hi",
        id_verified: false,
      });

      if (profileError) {
        navigate("/error", {
          state: { message: profileError.message, redirectTo: "/login" },
        });
        return;
      }

      navigate("/dashboard");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      navigate("/error", { state: { message: error.message, redirectTo: "/login" } });
      return;
    }

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight">GearGrid</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login" ? "Welcome back." : "Create your account."}
          </p>
        </div>

        <div className="flex rounded-lg border border-border p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-md px-3 py-2 text-sm transition ${
              mode === "login"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-md px-3 py-2 text-sm transition ${
              mode === "signup"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Signup
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              I agree to the{" "}
              <Link to="/terms" className="text-primary underline">
                Terms &amp; Conditions
              </Link>
            </span>
          </label>

          <button
            type="submit"
            disabled={!agreed}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {mode === "login" ? "Login" : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
}
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/wishr/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to Wishr" },
      { name: "description", content: "Sign in or create a Wishr account to make and grant wishes." },
      { property: "og:title", content: "Sign in to Wishr" },
      { property: "og:description", content: "Sign in or create an account to make and grant wishes." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) void navigate({ to: "/dashboard" });
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName.trim() || email.split("@")[0] },
          },
        });
        if (signUpError) throw signUpError;
        setMessage("Check your inbox to confirm your email, then sign in.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-md pt-10">
        <h1 className="font-display text-3xl">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-mute">
          {mode === "signin"
            ? "Sign in to make a wish or track the ones you've supported."
            : "It takes a minute. Your name is only shown if you want it to be."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4 card-frame p-5 border-2 border-ink">
          {mode === "signup" ? (
            <Field label="Display name">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ada O."
                className={inputClass}
              />
            </Field>
          ) : null}
          <Field label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className={inputClass}
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className={inputClass}
            />
          </Field>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-success">{message}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full press rounded-lg bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setMessage(null);
            }}
            className="w-full text-sm font-semibold text-primary"
          >
            {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-mute">
          By continuing you agree to keep Wishr honest.{" "}
          <Link to="/how-it-works" className="font-semibold text-ink">
            How it works
          </Link>
        </p>
      </section>
    </AppShell>
  );
}

const inputClass =
  "w-full rounded-xl bg-canvas px-4 py-3 text-sm text-ink border-2 border-ink outline-none focus:ring-2 focus:ring-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-mute">{label}</span>
      {children}
    </label>
  );
}

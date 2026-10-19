"use client";
import { useState } from "react";
import { request } from "@/lib/client-api";
import { useApp } from "@/context/AppContext";
import Input from "@/components/ui/Input";
import Button, { ButtonLink } from "@/components/ui/Button";
export default function Page() {
  const { refresh } = useApp();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <div className="container page-section">
      <section className="card panel max-w-lg mx-auto">
        <p className="eyebrow">Account access</p>
        <h1>Set your new password</h1>
        <p className="text-sm text-muted mb-6">
          Open the reset link from your email in the same browser where you
          requested it.
        </p>
        {saved ? (
          <p className="alert alert-success" role="status">
            Your password has been changed.
          </p>
        ) : (
          <form
            noValidate
            onSubmit={async (event) => {
              event.preventDefault();
              if (password.length < 8) {
                setError("Use at least 8 characters.");
                return;
              }
              if (password !== confirm) {
                setError("The passwords do not match.");
                return;
              }
              setBusy(true);
              setError("");
              try {
                await request("/api/auth/update-password", {
                  method: "POST",
                  body: JSON.stringify({ password }),
                });
                setPassword("");
                setConfirm("");
                setSaved(true);
                await refresh().catch(() => undefined);
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "The reset link may have expired. Request a new link.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="space-y-4">
              <Input
                label="New password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Input
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            {error && (
              <p className="alert alert-error mt-4" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full mt-5" disabled={busy}>
              {busy ? "Saving…" : "Change password"}
            </Button>
          </form>
        )}
        <ButtonLink
          href={saved ? "/login" : "/forgot-password"}
          className="mt-5"
          variant="secondary"
        >
          {saved ? "Sign in" : "Request a new reset link"}
        </ButtonLink>
      </section>
    </div>
  );
}

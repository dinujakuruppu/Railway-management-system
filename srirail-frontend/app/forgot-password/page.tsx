"use client";
import { useState } from "react";
import { isEmail } from "@/lib/validation";
import { request } from "@/lib/client-api";
import Input from "@/components/ui/Input";
import Button, { ButtonLink } from "@/components/ui/Button";
export default function Page() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <div className="container page-section">
      <section className="card panel max-w-lg mx-auto">
        <p className="eyebrow">Account access</p>
        <h1>Forgot your password?</h1>
        <p className="text-sm text-muted mb-6">
          Enter your account email to request a password reset link.
        </p>
        {sent ? (
          <div className="alert alert-success" role="status">
            If this email belongs to an account, a reset link will arrive
            shortly. Check your inbox and spam folder.
          </div>
        ) : (
          <form
            noValidate
            onSubmit={async (e) => {
              e.preventDefault();
              if (!isEmail(email)) {
                setError("Enter a valid email address.");
                return;
              }
              setBusy(true);
              setError("");
              try {
                await request("/api/auth/forgot-password", {
                  method: "POST",
                  body: JSON.stringify({ email: email.trim() }),
                });
                setSent(true);
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Unable to request a reset link.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              value={email}
              error={error}
              required
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
            />
            <Button className="w-full mt-5" type="submit" disabled={busy}>
              {busy ? "Sending request…" : "Send reset link"}
            </Button>
          </form>
        )}
        <ButtonLink className="mt-5" href="/login" variant="ghost">
          ← Back to sign in
        </ButtonLink>
      </section>
    </div>
  );
}

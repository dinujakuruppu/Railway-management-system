"use client";
import { useState } from "react";
import { isEmail } from "@/lib/validation";
import Input from "@/components/ui/Input";
import Button, { ButtonLink } from "@/components/ui/Button";
export default function Page() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div className="container page-section">
      <section className="card panel max-w-lg mx-auto">
        <p className="eyebrow">Account access</p>
        <h1>Forgot your password?</h1>
        <p className="text-sm text-muted mb-6">
          This screen previews a password reset request. No email service or
          account database is connected.
        </p>
        {sent ? (
          <div className="alert alert-success" role="status">
            Your demo reset request passed validation. No email was sent. Return
            to sign in with any sample password of at least 8 characters.
          </div>
        ) : (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (!isEmail(email)) {
                setError("Enter a valid email address.");
                return;
              }
              setSent(true);
            }}
          >
            <Input
              label="Email address"
              type="email"
              value={email}
              error={error}
              required
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
            />
            <Button className="w-full mt-5" type="submit">
              Preview reset request
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

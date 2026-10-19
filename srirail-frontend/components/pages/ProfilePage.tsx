"use client";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import type { User } from "@/types";
import { request } from "@/lib/client-api";
import { isIdentity, isMobile, type Errors } from "@/lib/validation";
import PageHeading from "@/components/ui/PageHeading";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
function ProfileEditor({ user }: { user: User }) {
  const { updateProfile } = useApp();
  const [values, setValues] = useState(user);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const issues: Errors = {};
    if (values.fullName.trim().length < 3)
      issues.fullName = "Enter your full name.";
    if (!isIdentity(values.identity))
      issues.identity = "Enter a valid sample NIC or passport.";
    if (!isMobile(values.mobile))
      issues.mobile = "Enter a Sri Lankan mobile number.";
    setErrors(issues);
    if (Object.keys(issues).length) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await updateProfile(values);
      setEditing(false);
      setMessage("Your profile has been saved.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save your profile.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="Passenger account"
        title="My profile"
        description="Manage your contact details. Use fictional passenger information for this project."
      />
      {message && (
        <p className="alert alert-success mb-5" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="alert alert-error mb-5" role="alert">
          {error}
        </p>
      )}
      <form className="card panel max-w-3xl" noValidate onSubmit={save}>
        <div className="flex justify-between items-center gap-4 mb-6">
          <h2 className="font-bold text-lg m-0">Personal information</h2>
          {!editing && (
            <Button
              variant="secondary"
              onClick={() => {
                setEditing(true);
                setMessage("");
              }}
            >
              Edit profile
            </Button>
          )}
        </div>
        <fieldset
          disabled={!editing || busy}
          className="grid sm:grid-cols-2 gap-5 border-0 p-0 m-0 min-w-0"
        >
          <Input
            label="Full name"
            value={values.fullName}
            error={errors.fullName}
            onChange={(e) => setValues({ ...values, fullName: e.target.value })}
            required
          />
          <Input
            label="NIC / Passport"
            value={values.identity}
            error={errors.identity}
            onChange={(e) => setValues({ ...values, identity: e.target.value })}
            required
          />
          <Input
            label="Verified account email"
            type="email"
            value={user.email}
            readOnly
          />
          <Input
            label="Mobile"
            type="tel"
            value={values.mobile}
            error={errors.mobile}
            onChange={(e) => setValues({ ...values, mobile: e.target.value })}
            required
          />
        </fieldset>
        {editing && (
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setValues(user);
                setEditing(false);
                setErrors({});
              }}
            >
              Discard changes
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save profile"}
            </Button>
          </div>
        )}
        <p className="text-xs text-muted mt-5 mb-0">
          Email changes are not available here. Profile edits do not change
          previously issued demonstration tickets.
        </p>
      </form>
      <section className="card panel max-w-3xl mt-6">
        <h2 className="font-bold text-lg mb-2">Password</h2>
        <p className="text-sm text-muted mb-5">
          Request a secure link at your account email to change your password.
        </p>
        <Button
          variant="secondary"
          disabled={resetting}
          onClick={async () => {
            setResetting(true);
            setError("");
            setMessage("");
            try {
              await request("/api/auth/forgot-password", {
                method: "POST",
                body: JSON.stringify({ email: user.email }),
              });
              setMessage(
                "If this account can receive email, a password reset link will arrive shortly. Check your inbox and spam folder.",
              );
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : "Unable to request a reset email.",
              );
            } finally {
              setResetting(false);
            }
          }}
        >
          {resetting ? "Sending…" : "Send password reset link"}
        </Button>
      </section>
    </>
  );
}
export default function ProfilePage() {
  const { ready, user } = useApp();
  return ready && user ? (
    <ProfileEditor key={user.id} user={user} />
  ) : (
    <LoadingSpinner />
  );
}

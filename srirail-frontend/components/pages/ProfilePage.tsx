"use client";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { demoUser } from "@/data/bookings";
import type { User } from "@/types";
import { isEmail, isIdentity, isMobile, type Errors } from "@/lib/validation";
import PageHeading from "@/components/ui/PageHeading";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
function ProfileEditor() {
  const { user, updateProfile } = useApp();
  const [values, setValues] = useState<User>(user ?? demoUser);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState("");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [passwordError, setPasswordError] = useState("");
  function save(e: React.FormEvent) {
    e.preventDefault();
    const issues: Errors = {};
    if (values.fullName.trim().length < 3)
      issues.fullName = "Enter your full name.";
    if (!isIdentity(values.identity))
      issues.identity = "Enter a valid sample NIC or passport.";
    if (!isEmail(values.email)) issues.email = "Enter a valid email address.";
    if (!isMobile(values.mobile))
      issues.mobile = "Enter a Sri Lankan mobile number.";
    setErrors(issues);
    if (Object.keys(issues).length) return;
    updateProfile(values);
    setEditing(false);
    setMessage("Your demo profile has been updated.");
  }
  return (
    <>
      <PageHeading
        eyebrow="Passenger account"
        title="My profile"
        description="Manage your sample contact details and account preferences."
      />
      {message && (
        <p className="alert alert-success mb-5" role="status">
          {message}
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
          disabled={!editing}
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
            label="Email"
            type="email"
            value={values.email}
            error={errors.email}
            onChange={(e) => setValues({ ...values, email: e.target.value })}
            required
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
              onClick={() => {
                setValues(user ?? demoUser);
                setEditing(false);
                setErrors({});
              }}
            >
              Discard changes
            </Button>
            <Button type="submit">Save profile</Button>
          </div>
        )}
        <p className="text-xs text-muted mt-5 mb-0">
          Use fictional details. Profile edits do not change already issued
          tickets.
        </p>
      </form>
      <section className="card panel max-w-3xl mt-6">
        <h2 className="font-bold text-lg mb-2">Password</h2>
        <p className="text-sm text-muted mb-5">
          Preview the change-password form. Passwords are not stored or verified
          in this frontend demo.
        </p>
        <Button
          variant="secondary"
          onClick={() => {
            setPasswordOpen(true);
            setPasswordError("");
          }}
        >
          Change password
        </Button>
      </section>
      <Modal
        open={passwordOpen}
        title="Change password · Demo"
        onClose={() => {
          setPasswordOpen(false);
          setPasswords({ current: "", next: "", confirm: "" });
        }}
      >
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!passwords.current) {
              setPasswordError("Enter a sample current password.");
              return;
            }
            if (passwords.next.length < 8) {
              setPasswordError(
                "Use at least 8 characters for the new password.",
              );
              return;
            }
            if (passwords.next !== passwords.confirm) {
              setPasswordError("The new passwords do not match.");
              return;
            }
            setMessage(
              "Password form validation passed. No password was changed or stored in this demo.",
            );
            setPasswordOpen(false);
            setPasswords({ current: "", next: "", confirm: "" });
          }}
        >
          <div className="space-y-4">
            <Input
              label="Current password"
              type="password"
              value={passwords.current}
              onChange={(e) =>
                setPasswords({ ...passwords, current: e.target.value })
              }
            />
            <Input
              label="New password"
              type="password"
              value={passwords.next}
              onChange={(e) =>
                setPasswords({ ...passwords, next: e.target.value })
              }
            />
            <Input
              label="Confirm new password"
              type="password"
              value={passwords.confirm}
              onChange={(e) =>
                setPasswords({ ...passwords, confirm: e.target.value })
              }
            />
          </div>
          {passwordError && (
            <p className="field-error mt-4" role="alert">
              {passwordError}
            </p>
          )}
          <Button className="w-full mt-6" type="submit">
            Validate password change
          </Button>
        </form>
      </Modal>
    </>
  );
}
export default function ProfilePage() {
  const { ready } = useApp();
  return ready ? <ProfileEditor /> : <LoadingSpinner />;
}

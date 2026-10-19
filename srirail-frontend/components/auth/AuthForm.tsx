"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { demoUser } from "@/data/bookings";
import { isEmail, isIdentity, isMobile, type Errors } from "@/lib/validation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
export default function AuthForm({ register = false }: { register?: boolean }) {
  const { login } = useApp();
  const router = useRouter();
  const [values, setValues] = useState({
    fullName: "",
    identity: "",
    email: "",
    mobile: "",
    password: "",
    confirm: "",
  });
  const [remember, setRemember] = useState(false);
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    try {
      const email = localStorage.getItem("srirail-remembered-email");
      if (email) {
        setValues((v) => ({ ...v, email }));
        setRemember(true);
      }
    } catch {
      /* Remembering an email is optional. */
    }
  }, []);
  function change(key: keyof typeof values, value: string) {
    setValues({ ...values, [key]: value });
    setErrors({ ...errors, [key]: "" });
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const issues: Errors = {};
    if (!isEmail(values.email)) issues.email = "Enter a valid email address.";
    if (values.password.length < 8)
      issues.password = "Use at least 8 characters for this demo password.";
    if (register) {
      if (values.fullName.trim().length < 3)
        issues.fullName = "Enter your full name.";
      if (!isIdentity(values.identity))
        issues.identity = "Enter a valid sample NIC or passport number.";
      if (!isMobile(values.mobile))
        issues.mobile = "Use a Sri Lankan mobile number, e.g. 0771234567.";
      if (values.password !== values.confirm)
        issues.confirm = "The passwords do not match.";
      if (!terms) issues.terms = "Accept the demo terms to continue.";
    }
    setErrors(issues);
    if (Object.keys(issues).length) return;
    setBusy(true);
    try {
      if (remember)
        localStorage.setItem("srirail-remembered-email", values.email.trim());
      else localStorage.removeItem("srirail-remembered-email");
    } catch {
      /* Sign-in works without local storage. */
    }
    login(
      register
        ? {
            id: crypto.randomUUID(),
            fullName: values.fullName.trim(),
            identity: values.identity.trim().toUpperCase(),
            email: values.email.trim(),
            mobile: values.mobile.trim(),
          }
        : { ...demoUser, email: values.email.trim() },
    );
    router.push("/dashboard");
  }
  return (
    <div className="card auth-grid">
      <aside className="auth-aside">
        <div>
          <Icon name="train" size={38} />
          <h2>
            A little less planning.
            <br />
            <span className="text-gold">A lot more journey.</span>
          </h2>
          <p className="text-slate-300 text-sm mt-5">
            Your tickets, travel plans and favourite destinations. All in one
            place.
          </p>
        </div>
        <div className="border-t border-white/20 pt-7 mt-12">
          <p className="text-sm mb-2">From coast to hill country.</p>
          <p className="text-xs text-slate-300 m-0">SriRail Smart Ticketing</p>
        </div>
      </aside>
      <div className="auth-main">
        <p className="eyebrow">Your SriRail account</p>
        <h1>{register ? "Let’s get you started" : "Welcome back"}</h1>
        <p className="text-muted text-sm mb-5">
          {register
            ? "Create a sample profile to try the passenger experience."
            : "Sign in to explore your demo travel dashboard."}
        </p>
        <p className="alert mb-6">
          Frontend demo: use sample details. Any valid email and password of 8+
          characters are accepted. Passwords are not saved or verified.
        </p>
        <form noValidate onSubmit={submit}>
          <div className="space-y-4">
            {register && (
              <>
                <Input
                  label="Full name"
                  required
                  value={values.fullName}
                  error={errors.fullName}
                  onChange={(e) => change("fullName", e.target.value)}
                />
                <Input
                  label="NIC / Passport"
                  required
                  placeholder="200012345678"
                  value={values.identity}
                  error={errors.identity}
                  onChange={(e) => change("identity", e.target.value)}
                />
              </>
            )}
            <Input
              label="Email address"
              type="email"
              required
              autoComplete="email"
              value={values.email}
              error={errors.email}
              onChange={(e) => change("email", e.target.value)}
            />
            {register && (
              <Input
                label="Mobile number"
                type="tel"
                required
                value={values.mobile}
                error={errors.mobile}
                onChange={(e) => change("mobile", e.target.value)}
              />
            )}
            <Input
              label="Password"
              type="password"
              required
              autoComplete={register ? "new-password" : "current-password"}
              value={values.password}
              error={errors.password}
              onChange={(e) => change("password", e.target.value)}
            />
            {register && (
              <Input
                label="Confirm password"
                type="password"
                required
                autoComplete="new-password"
                value={values.confirm}
                error={errors.confirm}
                onChange={(e) => change("confirm", e.target.value)}
              />
            )}
          </div>
          {register ? (
            <div className="my-5">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                />
                <span>
                  I agree to the{" "}
                  <Link className="link" href="/terms">
                    demo terms & privacy notice
                  </Link>
                  .
                </span>
              </label>
              {errors.terms && <p className="field-error">{errors.terms}</p>}
            </div>
          ) : (
            <div className="flex flex-wrap justify-between gap-3 my-5">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>
                  Remember me <span className="text-muted">(email only)</span>
                </span>
              </label>
              <Link href="/forgot-password" className="link text-sm">
                Forgot password?
              </Link>
            </div>
          )}
          <Button type="submit" disabled={busy} className="w-full">
            {busy
              ? "Opening dashboard…"
              : register
                ? "Create demo account"
                : "Sign in"}
          </Button>
        </form>
        <div className="relative text-center text-xs text-muted my-5">
          or explore without filling the form
        </div>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            login(demoUser);
            router.push("/dashboard");
          }}
        >
          Open demo account
        </Button>
        <p className="text-sm text-center mt-6 mb-0">
          {register ? "Already have an account?" : "New to SriRail?"}{" "}
          <Link className="link" href={register ? "/login" : "/register"}>
            {register ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </div>
    </div>
  );
}

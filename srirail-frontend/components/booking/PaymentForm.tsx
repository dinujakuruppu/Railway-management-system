"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import type { PaymentMethod } from "@/types";
import { totals } from "@/lib/booking";
import { money } from "@/lib/format";
import {
  isMobile,
  validCardNumber,
  validExpiry,
  type Errors,
} from "@/lib/validation";
import Input from "@/components/ui/Input";
import Button, { ButtonLink } from "@/components/ui/Button";
import Icon, { type IconName } from "@/components/ui/Icon";
const methods: { id: PaymentMethod; label: string; icon: IconName }[] = [
  { id: "card", label: "Visa / MasterCard", icon: "card" },
  { id: "lankaqr", label: "LankaQR", icon: "grid" },
  { id: "mobile", label: "Mobile payment", icon: "phone" },
];
export default function PaymentForm() {
  const { draft, pay } = useApp();
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [values, setValues] = useState({
    name: "",
    number: "",
    expiry: "",
    cvv: "",
    mobile: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const total = totals(draft).total;
  function update(key: keyof typeof values, value: string) {
    setValues({ ...values, [key]: value });
    setErrors({ ...errors, [key]: "" });
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const issues: Errors = {};
    if (method === "card") {
      if (values.name.trim().length < 3)
        issues.name = "Enter a sample cardholder name.";
      if (!validCardNumber(values.number))
        issues.number = "Use the demo number 4242 4242 4242 4242.";
      if (!validExpiry(values.expiry))
        issues.expiry = "Enter a future expiry date in MM/YY format.";
      if (!/^\d{3,4}$/.test(values.cvv)) issues.cvv = "Enter 3 or 4 digits.";
    }
    if (method === "mobile" && !isMobile(values.mobile))
      issues.mobile = "Enter a Sri Lankan mobile number.";
    if (!agreed)
      issues.agreed = "Confirm that you understand this is a demo payment.";
    setErrors(issues);
    if (Object.keys(issues).length) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      pay(method);
      setValues({ name: "", number: "", expiry: "", cvv: "", mobile: "" });
      router.replace("/booking/success");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The mock payment could not be completed. Please try again.",
      );
      setBusy(false);
      pending.current = false;
    }
  }
  return (
    <form noValidate onSubmit={submit}>
      <div className="card panel">
        <h2 className="text-lg font-bold mb-5">Payment method</h2>
        <div
          className="grid sm:grid-cols-3 gap-3 mb-6"
          role="group"
          aria-label="Payment method"
        >
          {methods.map((item) => (
            <label
              key={item.id}
              className={`flex flex-col items-center gap-2 border-2 rounded-lg p-4 cursor-pointer text-sm font-semibold ${method === item.id ? "border-maroon bg-rose-50 text-maroon" : "border-slate-200"}`}
            >
              <input
                type="radio"
                name="payment-method"
                value={item.id}
                checked={method === item.id}
                disabled={busy}
                onChange={() => {
                  setMethod(item.id);
                  setErrors({});
                  setError("");
                }}
              />
              <Icon name={item.icon} />
              {item.label}
            </label>
          ))}
        </div>
        <div className="alert mb-6">
          <strong>Demo payment only.</strong> Do not enter real card details.
          Use 4242 4242 4242 4242, a future expiry (12/30), and CVV 123.
        </div>
        <fieldset disabled={busy} className="border-0 p-0 m-0 min-w-0">
          {method === "card" ? (
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <Input
                  label="Cardholder name"
                  autoComplete="off"
                  value={values.name}
                  error={errors.name}
                  required
                  onChange={(e) => update("name", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Card number"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="4242 4242 4242 4242"
                  value={values.number}
                  error={errors.number}
                  maxLength={19}
                  required
                  onChange={(e) =>
                    update(
                      "number",
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 16)
                        .replace(/(.{4})/g, "$1 ")
                        .trim(),
                    )
                  }
                />
              </div>
              <Input
                label="Expiry date"
                placeholder="MM/YY"
                value={values.expiry}
                error={errors.expiry}
                maxLength={5}
                required
                onChange={(e) => update("expiry", e.target.value)}
              />
              <Input
                label="CVV"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={values.cvv}
                error={errors.cvv}
                maxLength={4}
                required
                onChange={(e) => update("cvv", e.target.value)}
              />
            </div>
          ) : method === "lankaqr" ? (
            <div className="text-center rounded-lg bg-slate-50 p-6">
              <div className="qr-placeholder mx-auto mb-4">
                <Icon name="grid" />
                <span>
                  DEMO QR
                  <br />
                  NOT SCANNABLE
                </span>
              </div>
              <p className="font-semibold mb-1">LankaQR preview</p>
              <p className="text-muted text-sm m-0">
                No banking app is connected. Continue below to simulate this
                payment.
              </p>
            </div>
          ) : (
            <div>
              <Input
                label="Mobile payment number"
                type="tel"
                placeholder="0771234567"
                value={values.mobile}
                error={errors.mobile}
                required
                onChange={(e) => update("mobile", e.target.value)}
              />
              <p className="text-muted text-sm mt-3">
                A mock mobile transaction will be recorded. No SMS is sent and
                no wallet is charged.
              </p>
            </div>
          )}
          <label className="checkbox-row mt-6">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>
              I understand this is a simulated payment and the ticket is not
              valid for travel.
            </span>
          </label>
          {errors.agreed && <p className="field-error">{errors.agreed}</p>}
        </fieldset>
        <div className="text-xs text-muted flex items-center gap-2 mt-5">
          <Icon name="shield" size={16} />
          Payment details stay on this screen and are not saved.
        </div>
      </div>
      {error && (
        <div role="alert" className="alert alert-error mt-5">
          {error}{" "}
          <ButtonLink
            href="/booking/seats"
            variant="secondary"
            className="mt-3"
          >
            Review class & seats
          </ButtonLink>
          <ButtonLink href="/trains" variant="secondary" className="mt-3 ml-2">
            Start a new search
          </ButtonLink>
        </div>
      )}
      <div className="flex flex-wrap gap-3 justify-between mt-6">
        {!busy && (
          <ButtonLink variant="secondary" href="/booking/summary">
            Back
          </ButtonLink>
        )}
        <Button type="submit" disabled={busy} className="ml-auto">
          {busy ? (
            <>
              <span className="spinner" />
              Processing demo payment…
            </>
          ) : (
            <>
              Pay {money(total)} · Demo
              <Icon name="arrow" size={17} />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import type { PaymentMethod } from "@/types";
import { totals } from "@/lib/booking";
import { money } from "@/lib/format";
import Button, { ButtonLink } from "@/components/ui/Button";
import Icon, { type IconName } from "@/components/ui/Icon";
const methods: { id: PaymentMethod; label: string; icon: IconName }[] = [
  { id: "card", label: "Card simulation", icon: "card" },
  { id: "lankaqr", label: "LankaQR simulation", icon: "grid" },
  { id: "mobile", label: "Mobile simulation", icon: "phone" },
];
export default function PaymentForm() {
  const { draft, pay, connected } = useApp();
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    if (!agreed) {
      setError("Confirm that you understand this is a simulated payment.");
      return;
    }
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await pay(method);
      router.replace("/booking/success");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The simulated payment could not be completed.",
      );
    } finally {
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
          aria-label="Simulated payment method"
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
                  setError("");
                }}
              />
              <Icon name={item.icon} />
              {item.label}
            </label>
          ))}
        </div>
        <p className="alert mb-6">
          <strong>Demo payment only.</strong> No bank, wallet or payment gateway
          is connected. No card number, CVV or banking details are collected.
          The server records a simulated payment and a demonstration booking.
        </p>
        <label className="checkbox-row mt-6">
          <input
            type="checkbox"
            checked={agreed}
            disabled={busy}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span>
            I understand no money is charged and this ticket is not valid for
            travel.
          </span>
        </label>
        <p className="text-xs text-muted mt-5">
          Seat availability and fares are checked again when you confirm.
          Selecting a seat does not hold it.
        </p>
      </div>
      {error && (
        <div role="alert" className="alert alert-error mt-5">
          {error}
          <div className="flex gap-3 mt-3">
            <ButtonLink href="/booking/seats" variant="secondary">
              Review class & seats
            </ButtonLink>
            <ButtonLink href="/trains" variant="secondary">
              Start a new search
            </ButtonLink>
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-3 justify-between mt-6">
        {!busy && (
          <ButtonLink variant="secondary" href="/booking/summary">
            Back
          </ButtonLink>
        )}
        <Button type="submit" disabled={busy || !connected} className="ml-auto">
          {busy
            ? "Saving demo booking…"
            : `Simulate ${money(totals(draft).total)} payment`}
        </Button>
      </div>
    </form>
  );
}

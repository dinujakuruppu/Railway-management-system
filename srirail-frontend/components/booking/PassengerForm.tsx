"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import type { Passenger } from "@/types";
import { validatePassenger, type Errors } from "@/lib/validation";
import { searchQuery } from "@/lib/format";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button, { ButtonLink } from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
const blank = (index: number): Passenger => ({
  id: `passenger-${index + 1}`,
  fullName: "",
  identity: "",
  email: "",
  mobile: "",
  type: "Adult",
  gender: "Not specified",
});
export default function PassengerForm() {
  const { draft, user, updateDraft } = useApp();
  const router = useRouter();
  const count = draft.journey?.count ?? 1;
  const [passengers, setPassengers] = useState<Passenger[]>(() =>
    Array.from(
      { length: count },
      (_, i) =>
        draft.passengers[i] ??
        (i === 0 && user
          ? {
              ...blank(i),
              fullName: user.fullName,
              identity: user.identity,
              email: user.email,
              mobile: user.mobile,
            }
          : blank(i)),
    ),
  );
  const [errors, setErrors] = useState<Errors[]>([]);
  const [message, setMessage] = useState("");
  function update(index: number, patch: Partial<Passenger>) {
    setPassengers((values) =>
      values.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    );
  }
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const issues = passengers.map(validatePassenger);
        setErrors(issues);
        if (issues.some((e) => Object.keys(e).length)) {
          setMessage("Please check the highlighted passenger details.");
          return;
        }
        const identities = passengers.map((p) =>
          p.identity.trim().toUpperCase(),
        );
        if (new Set(identities).size !== identities.length) {
          setMessage(
            "Each passenger must have a different NIC or passport number.",
          );
          return;
        }
        updateDraft({
          passengers: passengers.map((p) => ({
            ...p,
            fullName: p.fullName.trim(),
            identity: p.identity.trim().toUpperCase(),
            email: p.email.trim(),
            mobile: p.mobile.trim(),
          })),
        });
        router.push("/booking/seats");
      }}
    >
      <div className="alert mb-5">
        Use fictional passenger information in this demo. Passenger details are
        saved securely with your booking when you confirm the simulated payment.
        Refreshing before confirmation clears this unfinished form.
      </div>
      <div className="space-y-5">
        {passengers.map((passenger, index) => (
          <section className="card panel" key={passenger.id}>
            <div className="flex justify-between items-center gap-3 mb-6">
              <h2 className="text-lg font-bold m-0">Passenger {index + 1}</h2>
              <span className="text-xs text-muted">
                {index === 0 ? "Primary contact" : "Additional passenger"}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <Input
                label="Full name"
                autoComplete="off"
                required
                value={passenger.fullName}
                error={errors[index]?.fullName}
                onChange={(e) => update(index, { fullName: e.target.value })}
              />
              <Input
                label="NIC / Passport"
                required
                value={passenger.identity}
                error={errors[index]?.identity}
                placeholder="200012345678"
                onChange={(e) => update(index, { identity: e.target.value })}
              />
              <Input
                label="Email address"
                type="email"
                required
                value={passenger.email}
                error={errors[index]?.email}
                placeholder="name@example.com"
                onChange={(e) => update(index, { email: e.target.value })}
              />
              <Input
                label="Mobile number"
                type="tel"
                required
                value={passenger.mobile}
                error={errors[index]?.mobile}
                placeholder="0771234567"
                onChange={(e) => update(index, { mobile: e.target.value })}
              />
              <Select
                label="Passenger type"
                value={passenger.type}
                onChange={(e) =>
                  update(index, { type: e.target.value as Passenger["type"] })
                }
              >
                <option>Adult</option>
                <option>Child</option>
                <option>Senior Citizen</option>
              </Select>
              <Select
                label="Gender (optional)"
                value={passenger.gender}
                onChange={(e) =>
                  update(index, {
                    gender: e.target.value as Passenger["gender"],
                  })
                }
              >
                <option>Not specified</option>
                <option>Female</option>
                <option>Male</option>
              </Select>
            </div>
          </section>
        ))}
      </div>
      {message && (
        <p className="alert alert-error mt-5" role="alert">
          {message}
        </p>
      )}
      <div className="flex flex-wrap gap-3 justify-between mt-6">
        <ButtonLink
          variant="secondary"
          href={`/trains?${draft.journey ? searchQuery(draft.journey) : ""}`}
        >
          Back to trains
        </ButtonLink>
        <Button type="submit">
          Continue to seats
          <Icon name="arrow" size={17} />
        </Button>
      </div>
    </form>
  );
}

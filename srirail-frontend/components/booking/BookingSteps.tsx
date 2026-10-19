"use client";
import { usePathname } from "next/navigation";
import Icon from "@/components/ui/Icon";
const steps = [
  { name: "Passengers", path: "passengers" },
  { name: "Class & seats", path: "seats" },
  { name: "Summary", path: "summary" },
  { name: "Payment", path: "payment" },
  { name: "Ticket", path: "success" },
];
export default function BookingSteps() {
  const path = usePathname();
  const current = steps.findIndex((step) => path.endsWith(step.path));
  return (
    <ol className="booking-steps" aria-label="Booking progress">
      {steps.map((step, index) => (
        <li
          key={step.path}
          className={`step ${index === current ? "current" : index < current ? "done" : ""}`}
          aria-current={index === current ? "step" : undefined}
        >
          <span className="step-number">
            {index < current ? <Icon name="check" size={15} /> : index + 1}
          </span>
          <span>{step.name}</span>
        </li>
      ))}
    </ol>
  );
}

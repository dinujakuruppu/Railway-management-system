import type { TrainClass } from "@/types";
import { money } from "@/lib/format";
import Badge from "@/components/ui/Badge";
export default function ClassCard({
  travelClass,
  selected,
  available,
  onSelect,
  disabled,
}: {
  travelClass: TrainClass;
  selected: boolean;
  available: number;
  onSelect: () => void;
  disabled: boolean;
}) {
  return (
    <label
      className={`class-card block cursor-pointer ${selected ? "selected" : ""} ${disabled ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-3">
        <input
          type="radio"
          name="travel-class"
          checked={selected}
          disabled={disabled}
          onChange={onSelect}
          className="mt-1 accent-maroon"
        />
        <div className="flex-1">
          <div className="flex flex-wrap justify-between gap-2">
            <h2 className="font-bold text-base mb-1">{travelClass.name}</h2>
            <strong className="text-sm">{money(travelClass.price)}</strong>
          </div>
          <p className="text-sm text-muted mt-1 mb-3">
            {travelClass.description}
          </p>
          <Badge
            tone={
              disabled ? "danger" : travelClass.reserved ? "success" : "neutral"
            }
          >
            {available} {travelClass.reserved ? "seats" : "places"} available
          </Badge>
          <span className="text-xs text-muted ml-3">Per passenger</span>
        </div>
      </div>
    </label>
  );
}

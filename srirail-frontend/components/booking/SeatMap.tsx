import { Fragment } from "react";
import type { Seat } from "@/types";
import Icon from "@/components/ui/Icon";
export default function SeatMap({
  seats,
  onSelect,
}: {
  seats: Seat[];
  onSelect: (seat: string) => void;
}) {
  return (
    <div>
      <div className="flex justify-center flex-wrap gap-5 text-xs mb-7">
        {["Available", "Selected", "Reserved"].map((status) => (
          <span className="flex items-center gap-2" key={status}>
            <span
              className={`w-4 h-4 rounded border ${status === "Selected" ? "bg-maroon border-maroon" : status === "Reserved" ? "bg-slate-200 border-slate-200" : "border-slate-400 bg-white"}`}
            />
            {status}
          </span>
        ))}
      </div>
      <div className="seat-coach">
        <div className="flex items-center justify-center gap-2 text-xs text-muted mb-6">
          <Icon name="arrow" size={15} className="-rotate-90" />
          Front of coach
        </div>
        <div className="seat-grid">
          {seats.map((seat, index) => (
            <Fragment key={seat.number}>
              <button
                type="button"
                className={`seat seat-${seat.status}`}
                disabled={seat.status === "reserved"}
                aria-label={`Seat ${seat.number}, ${seat.status}`}
                aria-pressed={seat.status === "selected"}
                onClick={() => onSelect(seat.number)}
                style={{ gridColumn: index % 4 === 2 ? 4 : undefined }}
              >
                {seat.number}
              </button>
            </Fragment>
          ))}
        </div>
        <p className="text-xs text-muted text-center mt-5 mb-0">
          Window · A / D &nbsp; | &nbsp; Aisle · B / C
        </p>
      </div>
    </div>
  );
}

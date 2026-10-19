import type { Train } from "@/types";
export default function JourneyTimes({ train }: { train: Train }) {
  return (
    <div className="journey-line">
      <div>
        <div className="time">{train.departureTime}</div>
        <div className="station text-sm mt-1">{train.departureStation}</div>
      </div>
      <div className="rail-line">
        <span>{train.duration}</span>
        <div className="line" />
        <span>Direct service</span>
      </div>
      <div className="text-right">
        <div className="time">{train.arrivalTime}</div>
        <div className="station text-sm mt-1">{train.arrivalStation}</div>
      </div>
    </div>
  );
}

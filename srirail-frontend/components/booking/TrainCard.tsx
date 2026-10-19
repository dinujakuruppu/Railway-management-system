"use client";
import { useRouter } from "next/navigation";
import type { JourneySearch, Train } from "@/types";
import { useApp } from "@/context/AppContext";
import { availablePlaces } from "@/lib/booking";
import { money, searchQuery } from "@/lib/format";
import Button, { ButtonLink } from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
import JourneyTimes from "./JourneyTimes";
export default function TrainCard({
  train,
  search,
}: {
  train: Train;
  search: JourneySearch;
}) {
  const { startJourney, bookings } = useApp();
  const router = useRouter();
  const count = availablePlaces(
    train,
    search.date,
    "second-reserved",
    bookings,
  );
  const available = train.classes.some(
    (c) => availablePlaces(train, search.date, c.id, bookings) >= search.count,
  );
  return (
    <article className="card train-card">
      <div className="train-card-top">
        <div className="train-title">
          <span className="icon-tile">
            <Icon name="train" size={25} />
          </span>
          <div>
            <h2 className="text-lg font-bold m-0">{train.name}</h2>
            <p className="text-xs text-muted m-0 mt-1">
              #{train.trainNumber} <span className="mx-2">·</span>
              {train.type}
            </p>
          </div>
        </div>
        <Badge tone={count >= search.count ? "success" : "warning"}>
          {count} second-class reserved seats
        </Badge>
      </div>
      <JourneyTimes train={train} />
      <div className="flex flex-wrap gap-2 mb-5">
        {train.classes.map((c) => (
          <span
            key={c.id}
            className="text-xs rounded border border-slate-200 px-2 py-1 text-muted"
          >
            {c.name} · {money(c.price)}
          </span>
        ))}
      </div>
      <div className="train-card-bottom">
        <div>
          <span className="text-xs text-muted">From / passenger</span>
          <p className="text-xl font-bold m-0">
            {money(Math.min(...train.classes.map((c) => c.price)))}
          </p>
        </div>
        <div className="flex gap-2 justify-end">
          <ButtonLink
            href={`/trains/${train.id}?${searchQuery(search)}`}
            variant="secondary"
          >
            View details
          </ButtonLink>
          <Button
            disabled={!available}
            onClick={() => {
              startJourney({ ...search, train });
              router.push("/booking/passengers");
            }}
          >
            {available ? "Select train" : "Sold out"}
            <Icon name="arrow" size={16} />
          </Button>
        </div>
      </div>
    </article>
  );
}

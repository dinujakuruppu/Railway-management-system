import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
export interface Filters {
  time: string;
  type: string;
  classId: string;
  sort: string;
}
export const defaultFilters: Filters = {
  time: "all",
  type: "all",
  classId: "all",
  sort: "departure",
};
export default function TrainFilters({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
}) {
  return (
    <aside className="card filter-panel">
      <div className="filter-heading flex items-center justify-between">
        <h2 className="font-bold m-0">Filter trains</h2>
        <Button
          variant="ghost"
          className="!p-1 !min-h-0 !text-xs"
          onClick={() => onChange(defaultFilters)}
        >
          Reset
        </Button>
      </div>
      <Select
        label="Departure time"
        value={filters.time}
        onChange={(e) => onChange({ ...filters, time: e.target.value })}
      >
        <option value="all">Any time</option>
        <option value="morning">Morning · before 12:00</option>
        <option value="afternoon">Afternoon · 12:00–17:59</option>
        <option value="evening">Evening · from 18:00</option>
      </Select>
      <Select
        label="Train type"
        value={filters.type}
        onChange={(e) => onChange({ ...filters, type: e.target.value })}
      >
        <option value="all">All trains</option>
        <option>Intercity</option>
        <option>Express</option>
        <option>Commuter</option>
      </Select>
      <Select
        label="Travel class"
        value={filters.classId}
        onChange={(e) => onChange({ ...filters, classId: e.target.value })}
      >
        <option value="all">All classes</option>
        <option value="first">First Class</option>
        <option value="second-reserved">Second Class Reserved</option>
        <option value="third-reserved">Third Class Reserved</option>
        <option value="second">Second Class</option>
        <option value="third">Third Class</option>
      </Select>
    </aside>
  );
}

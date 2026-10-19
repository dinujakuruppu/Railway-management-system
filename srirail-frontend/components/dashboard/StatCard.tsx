import Icon, { type IconName } from "@/components/ui/Icon";
export default function StatCard({
  label,
  value,
  icon,
  note,
}: {
  label: string;
  value: string | number;
  icon: IconName;
  note?: string;
}) {
  return (
    <div className="card stat-card">
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        {note && <span className="text-xs text-muted">{note}</span>}
      </div>
      <span className="icon-tile !w-10 !h-10">
        <Icon name={icon} size={19} />
      </span>
    </div>
  );
}

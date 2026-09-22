export const money = (value: number) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(value);
export function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function dateOffset(days: number) {
  const date = new Date(`${today()}T12:00:00+05:30`);
  date.setUTCDate(date.getUTCDate() + days);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function formatDate(value: string, short = false) {
  return new Date(`${value}T12:00:00+05:30`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: short ? "short" : "long",
    year: "numeric",
    timeZone: "Asia/Colombo",
  });
}
export function minutes(time: string) {
  const [hours, mins] = time.split(":").map(Number);
  return hours * 60 + mins;
}
export function duration(from: string, to: string) {
  const delta = (minutes(to) - minutes(from) + 1440) % 1440;
  return `${Math.floor(delta / 60)}h ${String(delta % 60).padStart(2, "0")}m`;
}
export function departureTimestamp(date: string, time: string) {
  return new Date(`${date}T${time}:00+05:30`).getTime();
}
export function departureHasPassed(date: string, time: string) {
  return departureTimestamp(date, time) <= Date.now();
}
export function daysAway(date: string) {
  return Math.ceil(
    (new Date(`${date}T00:00:00+05:30`).getTime() -
      new Date(`${today()}T00:00:00+05:30`).getTime()) /
      86400000,
  );
}
export function searchQuery(value: {
  from: string;
  to: string;
  date: string;
  count: number;
}) {
  return new URLSearchParams({
    from: value.from,
    to: value.to,
    date: value.date,
    count: String(value.count),
  }).toString();
}

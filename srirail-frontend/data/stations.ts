import type { Station } from "@/types";
export const stations: Station[] = [
  { id: "CMB", name: "Colombo Fort", province: "Western" },
  { id: "MDA", name: "Maradana", province: "Western" },
  { id: "KDY", name: "Kandy", province: "Central" },
  { id: "GAL", name: "Galle", province: "Southern" },
  { id: "MTR", name: "Matara", province: "Southern" },
  { id: "BAD", name: "Badulla", province: "Uva" },
  { id: "ELL", name: "Ella", province: "Uva" },
  { id: "NOA", name: "Nanu Oya", province: "Central" },
  { id: "JAF", name: "Jaffna", province: "Northern" },
  { id: "ANU", name: "Anuradhapura", province: "North Central" },
  { id: "KUR", name: "Kurunegala", province: "North Western" },
  { id: "TRI", name: "Trincomalee", province: "Eastern" },
  { id: "BAT", name: "Batticaloa", province: "Eastern" },
];
export const popularRoutes = [
  {
    from: "Colombo Fort",
    to: "Kandy",
    label: "The hill country line",
    description: "City streets to misty hills",
    time: "2h 35m",
    fare: 350,
  },
  {
    from: "Colombo Fort",
    to: "Galle",
    label: "The coastal line",
    description: "A journey along the Indian Ocean",
    time: "2h 20m",
    fare: 380,
  },
  {
    from: "Nanu Oya",
    to: "Ella",
    label: "Through tea country",
    description: "Tea estates, valleys and mountain views",
    time: "2h 40m",
    fare: 220,
  },
];

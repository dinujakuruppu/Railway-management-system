import { z } from "zod";
import { today, dateOffset } from "@/lib/format";

export const identifier = z.string().min(1).max(100).regex(/^[A-Za-z0-9_-]+$/, "Invalid identifier.");
export const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Use a valid HH:mm time.");
const name = z.string().trim().min(3, "Enter a full name of at least 3 characters.").max(120);
const email = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);
const identity = z.string().trim().regex(/^(?:\d{12}|\d{9}[vVxX]|[A-Za-z]{1,2}\d{6,9})$/, "Enter a valid NIC or passport number.");
const mobile = z.string().trim().max(30).refine(v => /^(?:0|\+94|94)7[0-9]{8}$/.test(v.replace(/[\s()-]/g, "")), "Enter a valid Sri Lankan mobile number.").transform(v => v.replace(/[\s()-]/g, ""));
export const profileSchema = z.object({fullName: name, identity, mobile}).strict();
export const loginSchema = z.object({email, password: z.string().min(1).max(128)}).strict();
export const passwordSchema = z.object({password: z.string().min(8, "Use a password of at least 8 characters.").max(128)}).strict();
export const registerSchema = profileSchema.extend({email, password: passwordSchema.shape.password}).strict();
export const emailSchema = z.object({email}).strict();
export const classId = z.enum(["first", "second-reserved", "third-reserved", "second", "third"]);
export const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid YYYY-MM-DD date.").refine(v => {
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === v;
}, "Invalid calendar date.");
export const travelDate = calendarDate.refine(v => v >= today() && v <= dateOffset(90), "Choose a date within the next 90 days.");
export const passengerSchema = profileSchema.extend({
  id: z.string().min(1).max(100), email,
  type: z.enum(["Adult", "Child", "Senior Citizen"]),
  gender: z.enum(["Not specified", "Female", "Male"]),
}).strict();
export const bookingSchema = z.object({
  trainId: identifier, from: z.string().min(1).max(100), to: z.string().min(1).max(100), date: travelDate,
  count: z.number().int().min(1).max(6), classId,
  passengers: z.array(passengerSchema).min(1).max(6),
  seats: z.array(z.string().regex(/^[1-9]\d?[ABCD]$/)).max(6),
  method: z.enum(["card", "lankaqr", "mobile"]),
  idempotencyKey: z.uuid(), quotedPrice: z.number().int().min(10).max(1000000),
  quotedDepartureTime: time, quotedArrivalTime: time,
}).strict().refine(v => v.passengers.length === v.count && new Set(v.seats).size === v.seats.length, "Passenger count or seat selection is invalid.");
export const trainSchema = z.object({
  id: identifier, trainNumber: z.string().regex(/^\d{3,6}$/), name, type: z.enum(["Intercity","Express","Commuter"]),
  departureStation: z.string().min(1).max(100), arrivalStation: z.string().min(1).max(100), departureTime: time, arrivalTime: time,
  duration: z.string().max(30), stops: z.array(z.object({station:z.string().min(1).max(100),time}).strict()).min(2).max(50),
  facilities: z.array(z.string().min(1).max(100)).max(20), active:z.boolean(),
  classes: z.array(z.object({id:classId,name:z.string().min(1).max(100),description:z.string().max(500),price:z.number().int().min(20).max(1000000),reserved:z.boolean(),capacity:z.number().int().min(1).max(1000)}).strict()).min(1).max(5),
}).strict().refine(v => new Set(v.classes.map(c=>c.id)).size === v.classes.length && new Set(v.stops.map(s=>s.station)).size === v.stops.length, "Duplicate train classes or stops.");
export const scheduleSchema = z.object({id:identifier,trainId:identifier,days:z.enum(["Daily","Weekdays","Weekends"]),active:z.boolean()}).strict();
export const noticeSchema = z.object({id:identifier,title:z.string().trim().min(3).max(200),date:calendarDate,category:z.enum(["Service update","Special service","Schedule change","Announcement"]),description:z.string().trim().min(3).max(5000),published:z.boolean()}).strict();

import type { JourneySearch, Passenger } from "@/types";
import { stations } from "@/data/stations";
import { dateOffset, today } from "@/lib/format";
export type Errors = Record<string, string>;
export const isEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
export const isMobile = (value: string) =>
  /^(?:0|\+94|94)7[0-9]{8}$/.test(value.replace(/[\s()-]/g, ""));
// NIC: 12 digits or the legacy 9 digits + V/X. Passport: 1–2 letters + 6–9 digits.
export const isIdentity = (value: string) =>
  /^(?:\d{12}|\d{9}[vVxX]|[A-Za-z]{1,2}\d{6,9})$/.test(value.trim());
export function validateSearch(value: JourneySearch): Errors {
  const errors: Errors = {};
  if (!stations.some((s) => s.name === value.from))
    errors.from = "Select a departure station.";
  if (!stations.some((s) => s.name === value.to))
    errors.to = "Select an arrival station.";
  if (value.from === value.to)
    errors.to = "Choose a different arrival station.";
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value.date) ||
    Number.isNaN(Date.parse(value.date)) ||
    new Date(value.date).toISOString().slice(0, 10) !== value.date ||
    value.date < today() ||
    value.date > dateOffset(90)
  )
    errors.date = "Choose a valid date within the next 90 days.";
  if (!Number.isInteger(value.count) || value.count < 1 || value.count > 6)
    errors.count = "Choose between 1 and 6 passengers.";
  return errors;
}
export function validatePassenger(value: Passenger): Errors {
  const errors: Errors = {};
  if (value.fullName.trim().length < 3)
    errors.fullName =
      "Enter the passenger’s full name (at least 3 characters).";
  if (!isIdentity(value.identity))
    errors.identity =
      "Enter a 12-digit NIC, a 9-digit NIC + V/X, or a passport number.";
  if (!isEmail(value.email)) errors.email = "Enter a valid email address.";
  if (!isMobile(value.mobile))
    errors.mobile = "Enter a Sri Lankan mobile number, e.g. 0771234567.";
  return errors;
}
export function validCardNumber(value: string) {
  const digits = value.replace(/\s/g, "");
  if (!/^\d{16}$/.test(digits)) return false;
  let sum = 0;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if ((digits.length - 1 - i) % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}
export function validExpiry(value: string) {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value);
  if (!match) return false;
  const end = new Date(2000 + Number(match[2]), Number(match[1]), 1);
  return end.getTime() > Date.now();
}

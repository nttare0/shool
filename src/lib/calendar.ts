import type { ScheduleEntry } from "./types";

export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function occursOn(entry: ScheduleEntry, date: string): boolean {
  if (date < entry.date || (entry.until && date > entry.until)) return false;
  if (entry.repeat === "once") return entry.date === date;
  // UTC date arithmetic avoids daylight-saving changes affecting weekly recurrence.
  const days = (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${entry.date}T00:00:00Z`)) / 86400000;
  return Number.isInteger(days) && days % 7 === 0;
}

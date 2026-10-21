export interface DayPlan {
  date: string;
  tourStart: string;
  duration: number;
  travelBefore: number;
  travelAfter: number;
  checkIn: number;
  returnBy: string;
}

export function clockMinutes(value: string): number | null {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

export function clockLabel(minutes: number): string {
  const day = Math.floor(minutes / 1440);
  const n = ((minutes % 1440) + 1440) % 1440;
  return `${Math.floor(n / 60) % 12 || 12}:${String(n % 60).padStart(2, "0")} ${n < 720 ? "AM" : "PM"}${day > 0 ? " (+1 day)" : day < 0 ? " (previous day)" : ""}`;
}

export function validPlan(value: unknown): value is DayPlan {
  if (!value || typeof value !== "object") return false;
  const p = value as DayPlan;
  const d = new Date(`${p.date}T12:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(p.date) && Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === p.date && clockMinutes(p.tourStart) !== null && clockMinutes(p.returnBy) !== null && [p.duration, p.travelBefore, p.travelAfter, p.checkIn].every(n => Number.isInteger(n) && n >= 0 && n <= 720) && p.duration > 0;
}

export function calculatePlan(plan: DayPlan) {
  if (!validPlan(plan)) return null;
  const start = clockMinutes(plan.tourStart)!;
  const deadline = clockMinutes(plan.returnBy)!;
  const leaveAt = start - plan.travelBefore - plan.checkIn;
  const returnAt = start + plan.duration + plan.travelAfter;
  return { leaveAt, checkInAt: start - plan.checkIn, returnAt, margin: deadline - returnAt, crossesDay: leaveAt < 0 || returnAt >= 1440 };
}

export function parseSharedPlan(params: URLSearchParams): DayPlan | null {
  const p = { date: params.get("date") || "", tourStart: params.get("start") || "", duration: Number(params.get("duration")), travelBefore: Number(params.get("out")), travelAfter: Number(params.get("back")), checkIn: Number(params.get("checkin")), returnBy: params.get("return") || "" };
  return validPlan(p) ? p : null;
}

export function sharePlanUrl(origin: string, plan: DayPlan): string {
  const url = new URL("/tools", origin);
  url.search = new URLSearchParams({ date: plan.date, start: plan.tourStart, duration: String(plan.duration), out: String(plan.travelBefore), back: String(plan.travelAfter), checkin: String(plan.checkIn), return: plan.returnBy }).toString();
  url.hash = "day-plan";
  return url.toString();
}

export const PORT_DATE_EVENT = "jfd:port-date-change";
const PORT_DATE_STORAGE_KEY = "jfd-port-date";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isPortDate(value: string | null | undefined): value is string {
  if (!value || !ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function readSharedPortDate(): string {
  if (typeof window === "undefined") return "";
  const queryDate = new URL(window.location.href).searchParams.get("date");
  if (isPortDate(queryDate)) return queryDate;
  const storedDate = window.sessionStorage.getItem(PORT_DATE_STORAGE_KEY);
  return isPortDate(storedDate) ? storedDate : "";
}

export function sharePortDate(date: string) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);

  if (isPortDate(date)) {
    window.sessionStorage.setItem(PORT_DATE_STORAGE_KEY, date);
    url.searchParams.set("date", date);
  } else {
    window.sessionStorage.removeItem(PORT_DATE_STORAGE_KEY);
    url.searchParams.delete("date");
  }

  window.history.replaceState({}, "", url.toString());
  window.dispatchEvent(new CustomEvent(PORT_DATE_EVENT, { detail: { date } }));
}

export function addPortDateListener(callback: (date: string) => void) {
  const listener = (event: Event) => {
    const nextDate = (event as CustomEvent<{ date?: string }>).detail?.date || "";
    callback(isPortDate(nextDate) ? nextDate : "");
  };
  window.addEventListener(PORT_DATE_EVENT, listener);
  return () => window.removeEventListener(PORT_DATE_EVENT, listener);
}

export function buildDatedOperatorUrl(href: string | null | undefined, date: string) {
  if (!href) return "";
  if (!isPortDate(date)) return href;

  try {
    const url = new URL(href);
    if (url.hostname !== "fareharbor.com") return href;
    const itemMatch = url.pathname.match(/^(.*\/items\/\d+)(?:\/calendar\/\d{4}\/\d{2})?\/?$/);
    if (!itemMatch) return href;
    const [year, month] = date.split("-");
    url.pathname = `${itemMatch[1]}/calendar/${year}/${month}/`;
    return url.toString();
  } catch {
    return href;
  }
}

export const localIsoDate = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
export const todayIso = () => localIsoDate(new Date());
export const MIN_PUBLISH_LEAD_MS = 60 * 60 * 1000;
export const isPublishStartAllowed = (date, time) => {
  if (!date || !time) return false;

  const dateMatch = String(date).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = String(time).match(/^(\d{1,2}):(\d{2})/);

  if (!dateMatch || !timeMatch) return false;

  const start = new Date(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]),
    Number(timeMatch[1]),
    Number(timeMatch[2]),
    0,
    0
  );

  return (
    Number.isFinite(start.getTime()) &&
    start.getTime() >= Date.now() + MIN_PUBLISH_LEAD_MS
  );
};
export const formatHorecaText = (value) => String(value || "")
  .replace(/(\d+)\s*pers\b/gi, "$1 persoane")
  .replace(/^Eveniment\s+(\d+\s+persoane)$/i, "Eveniment · $1");
export const addDaysIso = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return localIsoDate(d);
};
export const shiftStartDate = (shift) => {
  if (!shift) return null;
  if (shift.starts_at) return new Date(shift.starts_at);
  if (shift.shift_date && shift.start_time) {
    return new Date(`${shift.shift_date}T${String(shift.start_time).slice(0, 5)}:00`);
  }
  return null;
};
export const canCancelConfirmedShift = (shift) => {
  const start = shiftStartDate(shift);
  return !!start && start.getTime() - Date.now() > 48 * 60 * 60 * 1000;
};
export const shiftEndDate = (shift) => {
  if (!shift) return null;
  if (shift.ends_at) return new Date(shift.ends_at);
  if (shift.shift_date && shift.start_time && shift.end_time) {
    const start = new Date(`${shift.shift_date}T${String(shift.start_time).slice(0, 5)}:00`);
    const end = new Date(`${shift.shift_date}T${String(shift.end_time).slice(0, 5)}:00`);
    if (end <= start) end.setDate(end.getDate() + 1);
    return end;
  }
  return null;
};
export const hasShiftEnded = (shift) => {
  const end = shiftEndDate(shift);
  return !!end && end.getTime() <= Date.now();
};
export const availabilityEndDate = (row) => {
  if (!row?.available_date) return null;
  const startTime = String(row.start_time || "00:00").slice(0, 5);
  const endTime = String(row.end_time || row.start_time || "23:59").slice(0, 5);
  const start = new Date(`${row.available_date}T${startTime}:00`);
  const end = new Date(`${row.available_date}T${endTime}:00`);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return null;
  if (end <= start) end.setDate(end.getDate() + 1);
  return end;
};
export const hasAvailabilityEnded = (row) => {
  const end = availabilityEndDate(row);
  return !!end && end.getTime() <= Date.now();
};
export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
export const cleanPhone = (value) => value.replace(/[^\d+]/g, "");
export const sameDay = (a, b) => {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
};
export const messageDayLabel = (value) => {
  if (!value) return "";
  const d = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(d, today)) return "Astăzi";
  if (sameDay(d, yesterday)) return "Ieri";
  return d.toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: d.getFullYear() === today.getFullYear() ? undefined : "numeric" });
};
export const messageTime = (value) => value ? new Date(value).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" }) : "";
export const conversationTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  const today = new Date();
  if (sameDay(d, today)) return messageTime(value);
  return d.toLocaleDateString("ro-RO", { day: "numeric", month: "short" });
};

export function formatDateRo(value) {
  if (!value) return "";
  const d = new Date(`${value}T12:00:00`);
  return d.toLocaleDateString("ro-RO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function money(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? `${n.toFixed(0)} lei` : "";
}


export function shiftStatusLabel(status) {
  if (status === "open") return "Deschisă";
  if (status === "closed") return "Locuri ocupate";
  if (status === "cancelled") return "Anulată";
  if (status === "completed") return "Finalizată";
  return status || "—";
}

export function applicationStatusLabel(status) {
  if (status === "pending") return "În așteptare";
  if (status === "accepted") return "Confirmată";
  if (status === "rejected") return "Respinsă";
  if (status === "cancelled") return "Anulată";
  if (status === "completed") return "Finalizată";
  if (status === "no_show") return "Neprezentare";
  return status || "—";
}

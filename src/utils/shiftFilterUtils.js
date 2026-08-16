export const filterShifts = ({
  shifts,
  shiftQuery,
  shiftFilter,
  favorites,
  role,
  profile,
}) => {
  const q = shiftQuery.trim().toLowerCase();

  let list = shifts.filter((shift) => {
    if (!q) return true;

    return [
      shift.title,
      shift.location_name,
      shift.location_city,
      shift.role,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  });

  if (role === "waiter" && profile?.worker_roles?.length) {
    list = list.filter((shift) =>
      profile.worker_roles.some(
        (workerRole) =>
          String(workerRole || "").trim().toLocaleLowerCase("ro-RO") ===
          String(shift.role || "").trim().toLocaleLowerCase("ro-RO")
      )
    );
  }

  if (shiftFilter === "Active")
    list = list.filter((s) => ["open", "closed"].includes(s.status) && !hasShiftEnded(s));

  if (shiftFilter === "Ocupate")
    list = list.filter((s) => s.status === "closed");

  if (shiftFilter === "Finalizate")
    list = list.filter((s) => s.status === "completed");

  if (shiftFilter === "Anulate")
    list = list.filter((s) => s.status === "cancelled");

  if (shiftFilter === "Azi")
    list = list.filter((s) => s.shift_date === todayIso());

  if (shiftFilter === "Mâine")
    list = list.filter((s) => s.shift_date === addDaysIso(1));

  if (shiftFilter === "Weekend") {
    list = list.filter((s) => {
      const d = new Date(`${s.shift_date}T12:00:00`).getDay();
      return d === 0 || d === 6;
    });
  }

  if (shiftFilter === "Favorite")
    list = list.filter((s) => favorites.includes(s.id));

  return list;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const addDaysIso = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const hasShiftEnded = (shift) => {
  if (!shift?.shift_date) return false;
  const end = shift.end_time || shift.start_time || "23:59";
  return new Date(`${shift.shift_date}T${end}`) < new Date();
};

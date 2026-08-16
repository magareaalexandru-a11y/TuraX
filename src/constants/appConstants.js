export const C = {
  bg: "#020B16",
  panel: "#0B1524",
  panel2: "#111B2B",
  panel3: "#172338",
  border: "#2B394F",
  gold: "#F5B942",
  gold2: "#E6AE50",
  text: "#FFFFFF",
  muted: "#98A2B3",
  muted2: "#707B8E",
  danger: "#EF5350",
  success: "#56C271",
  warning: "#F5B942",
};

export const WORK_TYPES = [
  "Restaurant",
  "Bar / Pub",
  "Cafenea",
  "Hotel",
  "Evenimente",
];

export const SKILLS = [
  "Servire à la carte",
  "POS / Casă de marcat",
  "Servire băuturi",
  "Preparare băuturi / Bar",
  "Gestionare mese",
  "Evenimente",
  "Lucru în echipă",
];

export const SHIFT_ROLES = [
  "Ospătar",
  "Barman",
  "Bucătar",
  "Ajutor bucătar",
  "Runner",
  "Recepționer",
  "Altele",
];

export const WORKER_ROLES = SHIFT_ROLES.filter((x) => x !== "Altele");

export const TIME_SLOTS = Array.from({ length: 48 }, (_, index) => {
  const minutes = index * 30;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

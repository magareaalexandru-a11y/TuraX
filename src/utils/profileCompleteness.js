const hasText = (value) => String(value ?? "").trim().length > 0;
const hasItems = (value) => Array.isArray(value) && value.length > 0;

export function getMissingProfileFields(profile, role) {
  if (!profile) return ["Profil"];

  const missing = [];

  if (role === "waiter") {
    if (!hasText(profile.full_name)) missing.push("Nume complet");
    if (!hasText(profile.city)) missing.push("Oraș");

    if (
      profile.experience === null ||
      profile.experience === undefined ||
      Number.isNaN(Number(profile.experience)) ||
      Number(profile.experience) < 0
    ) {
      missing.push("Ani de experiență");
    }

    if (!hasItems(profile.worker_roles)) missing.push("Roluri");
    if (!hasItems(profile.work_types)) missing.push("Experiență");
    if (!hasItems(profile.horeca_skills)) missing.push("Competențe HoReCa");
  }

  if (role === "manager") {
    if (!hasText(profile.location_name)) missing.push("Nume locație");
    if (!hasText(profile.location_type)) missing.push("Tip locație");
    if (!hasText(profile.location_city)) missing.push("Oraș");
    if (!hasText(profile.location_address)) missing.push("Adresă / Zonă");
    if (!hasText(profile.contact_name)) missing.push("Persoană de contact");
    if (!hasText(profile.contact_phone)) missing.push("Telefon");
  }

  return missing;
}

export function isProfileComplete(profile, role) {
  return getMissingProfileFields(profile, role).length === 0;
}

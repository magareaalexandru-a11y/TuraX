import { cleanPhone } from "./appUtils";

const uniqueCaseInsensitive = (values = []) =>
  values
    .map((x) => String(x).trim())
    .filter(Boolean)
    .filter(
      (x, i, arr) =>
        arr.findIndex(
          (y) => y.toLocaleLowerCase("ro-RO") === x.toLocaleLowerCase("ro-RO")
        ) === i
    );

export function buildWaiterProfileSave(waiterForm, currentUserId) {
  const exp = Number(waiterForm.experience);

  if (waiterForm.fullName.trim().length < 2)
    return { error: "Completează numele complet." };

  if (waiterForm.city.trim().length < 2)
    return { error: "Completează orașul." };

  if (!Number.isFinite(exp) || exp < 0 || exp > 60)
    return { error: "Introdu corect anii de experiență." };

  const customRole = waiterForm.customRoleEnabled
    ? String(waiterForm.customWorkerRole || "").trim()
    : "";

  if (waiterForm.customRoleEnabled && customRole.length < 2)
    return { error: "Specifică rolul HoReCa." };

  if (customRole.length > 60)
    return { error: "Rolul poate avea maximum 60 de caractere." };

  const workerRoles = [
    ...(waiterForm.workerRoles || []),
    ...(customRole ? [customRole] : []),
  ];

  const uniqueRoles = uniqueCaseInsensitive(workerRoles);

  if (uniqueRoles.length === 0)
    return { error: "Selectează cel puțin un rol profesional." };

  if (waiterForm.workTypes.length === 0)
    return { error: "Selectează cel puțin un tip de experiență." };

  if (waiterForm.horecaSkills.length === 0)
    return { error: "Selectează cel puțin o competență HoReCa." };

  return {
    payload: {
      id: currentUserId,
      role: "waiter",
      full_name: waiterForm.fullName.trim(),
      city: waiterForm.city.trim(),
      experience: exp,
      description: waiterForm.description.trim() || null,
      worker_roles: uniqueRoles,
      work_types: waiterForm.workTypes,
      horeca_skills: waiterForm.horecaSkills,
      updated_at: new Date().toISOString(),
    },
  };
}

export function buildManagerProfileSave(managerForm, currentUserId) {
  if (managerForm.locationName.trim().length < 2)
    return { error: "Completează numele locației." };

  if (managerForm.locationType.trim().length < 2)
    return { error: "Completează tipul locației." };

  if (managerForm.locationCity.trim().length < 2)
    return { error: "Completează orașul." };

  if (managerForm.locationAddress.trim().length < 3)
    return { error: "Completează adresa sau zona." };

  if (managerForm.contactName.trim().length < 2)
    return { error: "Completează persoana de contact." };

  if (cleanPhone(managerForm.contactPhone).length < 7)
    return { error: "Introdu un număr de telefon valid." };

  return {
    payload: {
      id: currentUserId,
      role: "manager",
      location_name: managerForm.locationName.trim(),
      location_type: managerForm.locationType.trim(),
      location_city: managerForm.locationCity.trim(),
      location_address: managerForm.locationAddress.trim(),
      contact_name: managerForm.contactName.trim(),
      contact_phone: cleanPhone(managerForm.contactPhone),
      updated_at: new Date().toISOString(),
    },
  };
}

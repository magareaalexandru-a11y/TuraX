import { WORKER_ROLES } from "../constants/appConstants";

export function profileToForms(p) {
  if (!p) return null;

  const storedRoles = Array.isArray(p.worker_roles)
    ? p.worker_roles
    : [];

  const customRole =
    storedRoles.find((x) => !WORKER_ROLES.includes(x)) || "";

  return {
    waiterForm: {
      fullName: p.full_name || "",
      city: p.city || "",
      experience:
        p.experience !== null && p.experience !== undefined
          ? String(p.experience)
          : "",
      description: p.description || "",
      workerRoles: storedRoles.filter((x) => WORKER_ROLES.includes(x)),
      customRoleEnabled: Boolean(customRole),
      customWorkerRole: customRole,
      workTypes: Array.isArray(p.work_types) ? p.work_types : [],
      horecaSkills: Array.isArray(p.horeca_skills) ? p.horeca_skills : [],
    },

    managerForm: {
      locationName: p.location_name || "",
      locationType: p.location_type || "",
      locationCity: p.location_city || "",
      locationAddress: p.location_address || "",
      contactName: p.contact_name || "",
      contactPhone: p.contact_phone || "",
    },
  };
}

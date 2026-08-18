import { useMemo } from "react";
import { WORKER_ROLES } from "../constants/appConstants";

export function useProfileDerivedState({
  profile,
  role,
  waiterForm,
  managerForm,
}) {
    const profileComplete = useMemo(() => {
      if (!profile || !role) return false;
      if (role === "waiter") {
        return !!(
          profile.full_name &&
          profile.city &&
          profile.experience !== null &&
          profile.experience !== undefined &&
          Number(profile.experience) >= 0 &&
          Array.isArray(profile.worker_roles) &&
          profile.worker_roles.length > 0 &&
          Array.isArray(profile.work_types) &&
          profile.work_types.length > 0 &&
          Array.isArray(profile.horeca_skills) &&
          profile.horeca_skills.length > 0
        );
      }
      return !!(
        profile.location_name &&
        profile.location_city &&
        profile.contact_name &&
        profile.contact_phone
      );
    }, [profile, role]);

    const waiterFormDirty = useMemo(() => {
      if (!profile || role !== "waiter") return false;

      const storedRoles = Array.isArray(profile.worker_roles)
        ? profile.worker_roles
        : [];

      const customRole =
        storedRoles.find((x) => !WORKER_ROLES.includes(x)) || "";

      const current = {
        fullName: profile.full_name || "",
        city: profile.city || "",
      address: profile.location_address || "",
        experience:
          profile.experience !== null && profile.experience !== undefined
            ? String(profile.experience)
            : "",
        description: profile.description || "",
        workerRoles: storedRoles.filter((x) => WORKER_ROLES.includes(x)),
        customRoleEnabled: Boolean(customRole),
        customWorkerRole: customRole,
        workTypes: Array.isArray(profile.work_types) ? profile.work_types : [],
        horecaSkills: Array.isArray(profile.horeca_skills)
          ? profile.horeca_skills
          : [],
      };

      return JSON.stringify(waiterForm) !== JSON.stringify(current);
    }, [waiterForm, profile, role]);

    const managerFormDirty = useMemo(() => {
      if (!profile || role !== "manager") return false;
      const current = {
        locationName: profile.location_name || "",
        locationType: profile.location_type || "",
        locationCity: profile.location_city || "",
        locationAddress: profile.location_address || "",
        contactName: profile.contact_name || "",
        contactPhone: profile.contact_phone || "",
      };
      return JSON.stringify(managerForm) !== JSON.stringify(current);
    }, [managerForm, profile, role]);

  return {
    profileComplete,
    waiterFormDirty,
    managerFormDirty,
  };
}

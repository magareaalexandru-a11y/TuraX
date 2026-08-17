import AsyncStorage from "@react-native-async-storage/async-storage";

import { profileToForms } from "../utils/profileFormUtils";
import {
  buildWaiterProfileSave,
  buildManagerProfileSave,
} from "../utils/profileSaveUtils";

export function useProfileActions({
  supabase,
  currentUserId,
  session,
  waiterForm,
  managerForm,
  setWaiterForm,
  setManagerForm,
  setDbError,
  setProfile,
  setRole,
  setProfileBackTarget,
  setScreen,
  setFormError,
  showNotice,
}) {
  const applyProfileToForms = (p) => {
    const forms = profileToForms(p);
    if (!forms) return;

    setWaiterForm(forms.waiterForm);
    setManagerForm(forms.managerForm);
  };

  const loadProfile = async (userId, chooseScreen = false) => {
    if (!userId) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      setDbError(`Profilul nu poate fi încărcat: ${error.message}`);
      return null;
    }

    setDbError("");
    setProfile(data || null);

    const nextRole = data?.role || null;
    setRole(nextRole);
    applyProfileToForms(data);

    if (chooseScreen && nextRole) {
      const complete =
        nextRole === "waiter"
          ? !!(
              data?.full_name &&
              data?.city &&
              data?.experience !== null &&
              data?.experience !== undefined &&
              Number(data.experience) >= 0 &&
              Array.isArray(data?.worker_roles) &&
              data.worker_roles.length > 0 &&
              Array.isArray(data?.work_types) &&
              data.work_types.length > 0 &&
              Array.isArray(data?.horeca_skills) &&
              data.horeca_skills.length > 0
            )
          : !!(
              data?.location_name &&
              data?.location_city &&
              data?.contact_name &&
              data?.contact_phone
            );

      if (!complete) setProfileBackTarget("role");

      setScreen(
        complete
          ? "home"
          : nextRole === "waiter"
          ? "waiterProfile"
          : "managerProfile"
      );
    }

    return data;
  };

  const chooseRole = async (nextRole) => {
    if (!currentUserId) return;

    setDbError("");

    const payload = {
      id: currentUserId,
      role: nextRole,
      email: session?.user?.email || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();

    if (error) {
      setDbError(`Rolul nu a putut fi salvat: ${error.message}`);
      return;
    }

    setProfile(data);
    setRole(nextRole);
    applyProfileToForms(data);
    setProfileBackTarget("role");

    setScreen(nextRole === "waiter" ? "waiterProfile" : "managerProfile");
  };

  const saveWaiterProfile = async () => {
    setFormError("");

    const { error: validationError, payload } =
      buildWaiterProfileSave(waiterForm, currentUserId);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();

    if (error) {
      setFormError(error.message);
      return;
    }

    await AsyncStorage.setItem(
      "turax_waiter_profile",
      JSON.stringify(payload)
    );

    setProfile(data);
    setRole("waiter");
    applyProfileToForms(data);
    showNotice("Profilul a fost actualizat.");
    setScreen("home");
  };

  const saveManagerProfile = async () => {
    setFormError("");

    const { error: validationError, payload } =
      buildManagerProfileSave(managerForm, currentUserId);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();

    if (error) {
      setFormError(error.message);
      return;
    }

    await AsyncStorage.setItem(
      "turax_manager_profile",
      JSON.stringify(payload)
    );

    setProfile(data);
    setRole("manager");
    showNotice("Profilul a fost actualizat.");
    setScreen("home");
  };

  return {
    applyProfileToForms,
    loadProfile,
    chooseRole,
    saveWaiterProfile,
    saveManagerProfile,
  };
}

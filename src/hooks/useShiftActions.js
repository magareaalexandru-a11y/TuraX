import { Alert } from "react-native";

export function useShiftActions({
  supabase,
  currentUserId,
  favorites,
  setFavorites,
  setShiftBackTarget,
  setSelectedShift,
  setApplications,
  role,
  setScreen,
  setWaiterDirectoryLoading,
  setWaiterDirectoryError,
  setWaiterDirectory,
  setSelectedWorkerProfile,
  setWorkerProfileError,
  setWorkerProfileLoading,
  selectedShift,
  showNotice,
  profile,
  myApplications,
  applyBusy,
  setApplyBusy,
  shiftStartDate,
  refreshCoreData,
  applicationStatusLabel,
}) {
  const toggleFavorite = async (shiftId) => {
    const isFav = favorites.includes(shiftId);
    setFavorites((prev) => (isFav ? prev.filter((id) => id !== shiftId) : [...prev, shiftId]));
    const result = isFav
      ? await supabase.from("favorites").delete().eq("user_id", currentUserId).eq("shift_id", shiftId)
      : await supabase.from("favorites").insert({ user_id: currentUserId, shift_id: shiftId });
    if (result.error) {
      setFavorites((prev) => (isFav ? [...prev, shiftId] : prev.filter((id) => id !== shiftId)));
      Alert.alert("TuraX", result.error.message);
    }
  };

  const openShift = async (shift, backTarget = "shifts") => {
    setShiftBackTarget(backTarget);
    setSelectedShift(shift);
    setApplications([]);
    if (role === "manager" && shift?.id) {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("shift_id", shift.id)
        .order("created_at", { ascending: true });
      if (!error) setApplications(data || []);
    }
    setScreen("shiftDetail");
  };

  const openWaiterDirectory = async () => {
    setScreen("waiterDirectory");
    setWaiterDirectoryLoading(true);
    setWaiterDirectoryError("");
    try {
      const { data, error } = await supabase.rpc("list_waiter_directory");
      if (error) throw error;
      setWaiterDirectory(data || []);
    } catch (e) {
      setWaiterDirectoryError(e?.message || "Catalogul nu poate fi incarcat.");
    } finally {
      setWaiterDirectoryLoading(false);
    }
  };

  const openWorkerPublicProfile = async (worker) => {
    if (!worker?.waiter_id) return;

    setSelectedWorkerProfile(worker);
    setWorkerProfileError("");
    setWorkerProfileLoading(true);
    setScreen("workerProfile");

    try {
      const { data, error } = await supabase.rpc(
        "get_worker_public_profile",
        { p_waiter_id: worker.waiter_id }
      );

      if (error) throw error;

      if (data) {
        setSelectedWorkerProfile(data);
      }
    } catch (e) {
      setWorkerProfileError(
        e?.message || "Profilul profesionistului nu a putut fi încărcat."
      );
    } finally {
      setWorkerProfileLoading(false);
    }
  };

  const reloadSelectedShift = async () => {
    if (!selectedShift?.id) return;
    const { data: freshShift, error: shiftError } = await supabase
      .from("shifts")
      .select("*")
      .eq("id", selectedShift.id)
      .maybeSingle();
    if (shiftError) {
      showNotice(shiftError.message, "error");
      return;
    }
    if (freshShift) setSelectedShift(freshShift);

    if (role === "manager") {
      const { data: freshApplications, error: applicationsError } = await supabase
        .from("applications")
        .select("*")
        .eq("shift_id", selectedShift.id)
        .order("created_at", { ascending: true });
      if (applicationsError) {
        showNotice(applicationsError.message, "error");
        return;
      }
      setApplications(freshApplications || []);
    }
  };

  const applyToShift = async () => {
    if (!selectedShift?.id || !currentUserId || applyBusy) return;

    const allowedRoles = Array.isArray(profile?.worker_roles)
      ? profile.worker_roles
      : [];

    const roleMatches = allowedRoles.some(
      (workerRole) =>
        String(workerRole || "").trim().toLocaleLowerCase("ro-RO") ===
        String(selectedShift.role || "").trim().toLocaleLowerCase("ro-RO")
    );

    if (role === "waiter" && !roleMatches) {
      showNotice("Rolul acestei ture nu este inclus în profilul tău.", "error");
      return;
    }

    const existing = myApplications.find((a) => a.shift_id === selectedShift.id);
    if (existing) {
      showNotice(`Ai deja o candidatură pentru această tură: ${applicationStatusLabel(existing.status)}.`, "info");
      return;
    }

    const start = shiftStartDate(selectedShift);
    if (!start || start.getTime() <= Date.now()) {
      showNotice("Tura a început deja și nu mai primește candidaturi.", "error");
      return;
    }

    setApplyBusy(true);
    try {
      const { error } = await supabase.rpc("apply_to_shift", { p_shift_id: selectedShift.id });
      if (error) return showNotice(error.message, "error");
      await refreshCoreData(true);
      await reloadSelectedShift();
      showNotice("Candidatura a fost trimisă. Status: În așteptare.");
    } finally {
      setApplyBusy(false);
    }
  };

  return {
    toggleFavorite,
    openShift,
    openWaiterDirectory,
    openWorkerPublicProfile,
    reloadSelectedShift,
    applyToShift,
  };
}

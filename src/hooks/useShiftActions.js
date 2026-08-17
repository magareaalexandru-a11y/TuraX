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
  shiftForm,
  setShiftForm,
  setPublishError,
  setPublishBusy,
  isPublishStartAllowed,
  formatDateRo,
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

  const publishShift = async () => {
    if (publishBusy) return;
    setPublishError("");
    const needed = Number(shiftForm.workersNeeded);
    const rate = Number(shiftForm.hourlyRate);
    const effectiveRole =
      shiftForm.role === "Altele"
        ? String(shiftForm.customRole || "").trim()
        : String(shiftForm.role || "").trim();

    if (!effectiveRole) {
      return setPublishError("Alege rolul căutat.");
    }

    if (shiftForm.role === "Altele" && effectiveRole.length < 2) {
      return setPublishError("Specifică rolul necesar.");
    }

    if (effectiveRole.length > 60) {
      return setPublishError("Denumirea rolului poate avea maximum 60 de caractere.");
    }

    if (!shiftForm.locationName.trim()) return setPublishError("Completează numele locației.");
    if (!shiftForm.city.trim()) return setPublishError("Completează orașul.");
    if (!shiftForm.date) return setPublishError("Selectează data turei.");
    if (!shiftForm.start || !shiftForm.end) return setPublishError("Selectează intervalul orar.");
    if (!Number.isInteger(needed) || needed < 1) return setPublishError("Numărul de persoane necesare trebuie să fie cel puțin 1.");
    if (!Number.isFinite(rate) || rate <= 0) return setPublishError("Introdu un tarif orar valid.");

    if (!isPublishStartAllowed(shiftForm.date, shiftForm.start)) {
      return setPublishError("Tura trebuie să înceapă cu cel puțin 60 de minute de acum.");
    }

    setPublishBusy(true);
    try {
      const { error } = await supabase.rpc("publish_shift", {
        p_role: effectiveRole,
        p_location_name: shiftForm.locationName.trim(),
        p_city: shiftForm.city.trim(),
        p_address: shiftForm.address.trim() || null,
        p_shift_date: shiftForm.date,
        p_start_time: shiftForm.start,
        p_end_time: shiftForm.end,
        p_workers_needed: needed,
        p_hourly_rate: rate,
        p_description: shiftForm.description.trim() || null,
      });

      if (error) return setPublishError(error.message);

      setShiftForm({
        role: "Ospătar",
        customRole: "",
        locationName: profile?.location_name || "",
        city: profile?.location_city || "",
        address: profile?.location_address || "",
        date: "",
        start: "",
        end: "",
        workersNeeded: "1",
        hourlyRate: "",
        description: "",
      });
      await refreshCoreData(true);
      showNotice("Tura a fost publicată.");
      setScreen("home");
    } finally {
      setPublishBusy(false);
    }
  };

  return {
    toggleFavorite,
    openShift,
    openWaiterDirectory,
    openWorkerPublicProfile,
    reloadSelectedShift,
    applyToShift,
    publishShift,
  };
}

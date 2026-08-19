import { useCallback } from "react";
import { Alert } from "react-native";
import {
  canCancelConfirmedShift,
  formatDateRo,
  isPublishStartAllowed,
} from "../utils/appUtils";

export function useApplicationActions({
  supabase,
  askConfirm,
  currentUserId,
  profile,
  selectedDates,
  dayAvailability,
  setAvailabilityError,
  setSelectedDates,
  setDayAvailability,
  refreshCoreData,
  showNotice,
  setScreen,
  myApplications,
  selectedShift,
  reloadSelectedShift,
  setApplications,
}) {
  const updateApplication = async (applicationId, status) => {
    const { error } = await supabase.rpc("manager_set_application_status", {
      p_application_id: applicationId,
      p_status: status,
    });
    if (error) return Alert.alert("TuraX", error.message);
    setApplications((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status } : a)));
    await refreshCoreData(true);
    await reloadSelectedShift();
    showNotice(status === "accepted" ? "Candidatura a fost acceptată." : "Candidatura a fost respinsă.");
  };

  const publishAvailability = async () => {
    setAvailabilityError("");
    if (selectedDates.length === 0) return setAvailabilityError("Selectează cel puțin o dată.");

    for (const date of selectedDates) {
      const info = dayAvailability[date] || {};
      if (!info.start || !info.end || !info.rate) {
        return setAvailabilityError(`Completează ora de început, ora de final și tariful pentru ${formatDateRo(date)}.`);
      }
      if (!isPublishStartAllowed(date, info.start)) {
        return setAvailabilityError(`Pentru ${formatDateRo(date)}, ora de început trebuie să fie cu cel puțin 60 de minute în viitor.`);
      }
      if (Number(info.rate) <= 0) return setAvailabilityError("Tariful trebuie să fie mai mare decât 0.");
    }

    const rows = selectedDates.map((date) => {
      const info = dayAvailability[date];
      return {
        waiter_id: currentUserId,
        waiter_name: profile?.full_name || "Ospătar",
        city: profile?.city || null,
        available_date: date,
        start_time: info.start,
        end_time: info.end,
        desired_rate: Number(info.rate),
        waiter_avatar_url: profile?.avatar_url || null,
      };
    });

    const { error } = await supabase
      .from("availability")
      .upsert(rows, { onConflict: "waiter_id,available_date" });

    if (error) return setAvailabilityError(error.message);

    setSelectedDates([]);
    setDayAvailability({});
    await refreshCoreData(true);
    showNotice("Disponibilitatea a fost publicată.");
    setScreen("myActivity");
  };

  const withdrawAvailability = (row) => {
    askConfirm({
      title: "Retrage disponibilitatea?",
      message: `${formatDateRo(row.available_date)} · ${String(row.start_time || "").slice(0, 5)}–${String(row.end_time || "").slice(0, 5)}`,
      confirmLabel: "Retrage",
      danger: true,
      onConfirm: async () => {
        const { error } = await supabase
          .from("availability")
          .delete()
          .eq("id", row.id)
          .eq("waiter_id", currentUserId);
        if (error) return showNotice(error.message, "error");
        await refreshCoreData(true);
        showNotice("Disponibilitatea a fost retrasă.");
      },
    });
  };

  const cancelMyApplication = (application) => {
    const confirmed = application.status === "accepted";
    const allowed = !confirmed || canCancelConfirmedShift(application.shifts);
    if (confirmed && !allowed) {
      showNotice("Anularea este blocată cu 48 de ore sau mai puțin înainte de începerea turei.", "error");
      return;
    }

    askConfirm({
      title: confirmed ? "Anulezi tura confirmată?" : "Retragi candidatura?",
      message: confirmed
        ? "Locul va fi eliberat pentru alt ospătar. Regula de 48h este verificată și de server."
        : "Candidatura va apărea în istoric ca anulată.",
      confirmLabel: confirmed ? "Anulează tura" : "Retrage",
      danger: true,
      onConfirm: async () => {
        const { error } = await supabase.rpc("cancel_my_application", {
          p_application_id: application.id,
        });
        if (error) return showNotice(error.message, "error");
        await refreshCoreData(true);
        showNotice(confirmed ? "Tura a fost anulată și locul a fost eliberat." : "Candidatura a fost retrasă.");
      },
    });
  };

  const cancelShiftByManager = (shift) => {
    if (!shift?.id) return;
    askConfirm({
      title: "Anulezi tura?",
      message: "Candidații aflați în așteptare sau deja confirmați vor fi anunțați automat.",
      confirmLabel: "Anulează tura",
      danger: true,
      onConfirm: async () => {
        const { error } = await supabase.rpc("manager_cancel_shift", {
          p_shift_id: shift.id,
          p_reason: "Anulată de manager din aplicația TuraX",
        });
        if (error) return showNotice(error.message, "error");
        await refreshCoreData(true);
        await reloadSelectedShift();
        showNotice("Tura a fost anulată. Participanții au fost notificați.");
      },
    });
  };

  const markAttendance = (application, result) => {
    const noShow = result === "no_show";
    askConfirm({
      title: noShow ? "Marchezi neprezentarea?" : "Confirmi tura finalizată?",
      message: noShow
        ? "Această acțiune va rămâne în istoricul turei și ospătarul va putea primi un rating corespunzător."
        : "Confirmă că ospătarul s-a prezentat și tura s-a încheiat.",
      confirmLabel: noShow ? "Marchează no-show" : "Confirmă prezența",
      danger: noShow,
      onConfirm: async () => {
        const { error } = await supabase.rpc("manager_mark_attendance", {
          p_application_id: application.id,
          p_result: result,
        });
        if (error) return showNotice(error.message, "error");
        await refreshCoreData(true);
        await reloadSelectedShift();
        showNotice(noShow ? "Neprezentarea a fost înregistrată." : "Tura a fost marcată ca finalizată.");
      },
    });
  };

  const submitShiftRating = async ({ shiftId, revieweeId, rating }) => {
    const { error } = await supabase.rpc("submit_shift_review", {
      p_shift_id: shiftId,
      p_reviewee_id: revieweeId,
      p_rating: rating,
      p_comment: null,
    });
    if (error) return showNotice(error.message, "error");
    showNotice(`Rating salvat: ${rating}/5.`);
  };

  return {
    updateApplication,
    publishAvailability,
    withdrawAvailability,
    cancelMyApplication,
    cancelShiftByManager,
    markAttendance,
    submitShiftRating,
  };
}

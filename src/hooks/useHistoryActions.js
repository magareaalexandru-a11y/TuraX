import { supabase } from "../lib/supabase";
import { hasAvailabilityEnded, hasShiftEnded } from "../utils/appUtils";

export function useHistoryActions({
  currentUserId,
  askConfirm,
  refreshCoreData,
  showNotice,
}) {
  const hideHistoryItem = (itemType, itemId, label = "Acest element") => {
    if (!currentUserId || !itemId) return;

    askConfirm({
      title: "Ștergi din istoric?",
      message: `${label} va dispărea doar din istoricul tău. Datele asociate nu vor fi șterse.`,
      confirmLabel: "Șterge din istoric",
      danger: true,
      onConfirm: async () => {
        try {
          if (itemType === "shift") {
            const { data: shift, error } = await supabase
              .from("shifts")
              .select("*")
              .eq("id", itemId)
              .single();

            if (error) throw error;
            if (shift.manager_id !== currentUserId) {
              throw new Error("Nu poți modifica istoricul acestei ture.");
            }

            const { data: unresolved, error: appError } = await supabase
              .from("applications")
              .select("id")
              .eq("shift_id", itemId)
              .eq("status", "accepted")
              .limit(1);

            if (appError) throw appError;

            if ((unresolved || []).length > 0) {
              throw new Error(
                "Tura are încă o prezență nerezolvată. Marchează mai întâi tura ca finalizată sau neprezentare."
              );
            }
          }

          if (itemType === "availability") {
            const { data: row, error } = await supabase
              .from("availability")
              .select("*")
              .eq("id", itemId)
              .single();

            if (error) throw error;
            if (row.waiter_id !== currentUserId) {
              throw new Error("Nu poți modifica această disponibilitate.");
            }
            if (!hasAvailabilityEnded(row)) {
              throw new Error("Disponibilitatea este încă activă.");
            }
          }

          if (itemType === "application") {
            const { data: application, error } = await supabase
              .from("applications")
              .select("*")
              .eq("id", itemId)
              .single();

            if (error) throw error;
            if (application.waiter_id !== currentUserId) {
              throw new Error("Nu poți modifica această candidatură.");
            }

            if (["pending", "accepted"].includes(application.status)) {
              const { data: shift, error: shiftError } = await supabase
                .from("shifts")
                .select("*")
                .eq("id", application.shift_id)
                .single();

              if (shiftError) throw shiftError;

              if (!hasShiftEnded(shift)) {
                throw new Error("Această tură este încă activă.");
              }
            }
          }

          const { error: hideError } = await supabase
            .from("history_hidden_items")
            .upsert(
              {
                user_id: currentUserId,
                item_type: itemType,
                item_id: itemId,
              },
              { onConflict: "user_id,item_type,item_id" }
            );

          if (hideError) throw hideError;

          await refreshCoreData(true);
          showNotice("Elementul a fost șters din istoric.");
        } catch (error) {
          showNotice(error?.message || "Nu s-a putut șterge din istoric.", "error");
        }
      },
    });
  };

  return { hideHistoryItem };
}

import { supabase } from "../lib/supabase";
import { todayIso, shiftStartDate } from "../utils/appUtils";

export function useCoreDataActions({
  currentUserId,
  role,
  setDataLoading,
  setDbError,
  setShifts,
  setFavorites,
  setNotifications,
  setConversations,
  setAvailabilities,
  setAcceptedShifts,
  setMyAvailabilities,
  setMyApplications,
  setRefreshing,
}) {
    const refreshCoreData = async (silent = false) => {
      if (!currentUserId || !role) return;
      if (!silent) setDataLoading(true);
      setDbError("");
      try {
        const [shiftResult, favoriteResult, notificationResult, conversationResult] = await Promise.all([
          role === "waiter"
            ? supabase
                .from("shifts")
                .select("*")
                .eq("status", "open")
                .gte("shift_date", todayIso())
                .order("shift_date", { ascending: true })
            : supabase
                .from("shifts")
                .select("*")
                .eq("manager_id", currentUserId)
                .order("shift_date", { ascending: false }),
          supabase.from("favorites").select("shift_id").eq("user_id", currentUserId),
          supabase
            .from("notifications")
            .select("*")
            .eq("user_id", currentUserId)
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("conversations")
            .select("*")
            .or(`manager_id.eq.${currentUserId},waiter_id.eq.${currentUserId}`)
            .order("updated_at", { ascending: false }),
        ]);

        const commonError = [shiftResult, favoriteResult, notificationResult, conversationResult].find((r) => r.error)?.error;
        if (commonError) throw commonError;

        const incomingShifts = shiftResult.data || [];
        const visibleShifts = role === "waiter"
          ? incomingShifts.filter((s) => {
              const start = shiftStartDate(s);
              return s.status === "open" && !!start && start.getTime() > Date.now();
            })
          : incomingShifts;
        setShifts(visibleShifts);
        setFavorites((favoriteResult.data || []).map((x) => x.shift_id));
        setNotifications(notificationResult.data || []);

        const conversationRows = conversationResult.data || [];
        let enrichedConversations = conversationRows;
        if (conversationRows.length > 0) {
          const ids = conversationRows.map((c) => c.id);
          const { data: unreadRows, error: unreadError } = await supabase
            .from("messages")
            .select("conversation_id")
            .in("conversation_id", ids)
            .is("read_at", null)
            .neq("sender_id", currentUserId);
          if (unreadError) throw unreadError;
          const counts = (unreadRows || []).reduce((acc, row) => {
            acc[row.conversation_id] = (acc[row.conversation_id] || 0) + 1;
            return acc;
          }, {});
          enrichedConversations = conversationRows.map((c) => ({ ...c, unread_count: counts[c.id] || 0 }));
        }
        setConversations(enrichedConversations);

        if (role === "manager") {
          const { data, error } = await supabase
            .from("availability")
            .select("*")
            .gte("available_date", todayIso())
            .order("available_date", { ascending: true })
            .limit(100);
          if (error) throw error;
          setAvailabilities(data || []);
          setAcceptedShifts([]);
          setMyAvailabilities([]);
          setMyApplications([]);
        } else {
          const [availabilityResult, applicationsResult] = await Promise.all([
            supabase
              .from("availability")
              .select("*")
              .eq("waiter_id", currentUserId)
              .gte("available_date", todayIso())
              .order("available_date", { ascending: true }),
            supabase
              .from("applications")
              .select("*, shifts(*)")
              .eq("waiter_id", currentUserId)
              .order("created_at", { ascending: false }),
          ]);
          if (availabilityResult.error) throw availabilityResult.error;
          if (applicationsResult.error) throw applicationsResult.error;

          const apps = applicationsResult.data || [];
          setMyAvailabilities(availabilityResult.data || []);
          setMyApplications(apps);
          setAcceptedShifts(apps.filter((a) => ["accepted", "completed", "no_show"].includes(a.status)));
          setAvailabilities([]);
        }
      } catch (e) {
        setDbError(
          `Datele nu pot fi încărcate. Dacă tocmai ai aplicat upgrade-ul, rulează și migrarea Supabase. Detaliu: ${e?.message || e}`
        );
      } finally {
        setDataLoading(false);
        setRefreshing(false);
      }
    };

    const refresh = async () => {
      setRefreshing(true);
      await refreshCoreData(true);
    };

  return {
    refreshCoreData,
    refresh,
  };
}

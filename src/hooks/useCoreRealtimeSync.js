import { useEffect } from "react";

export function useCoreRealtimeSync({
  supabase,
  currentUserId,
  role,
  profileComplete,
  refreshCoreData,
}) {
  useEffect(() => {
    if (!currentUserId || !role || !profileComplete) return;

    let timer = null;
    const scheduleRefresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => refreshCoreData(true), 220);
    };

    let channel = supabase
      .channel(`turax-core:${currentUserId}:${role}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "shifts" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, scheduleRefresh)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${currentUserId}` },
        scheduleRefresh
      );

    if (role === "manager") {
      channel = channel.on("postgres_changes", { event: "*", schema: "public", table: "availability" }, scheduleRefresh);
    }

    channel.subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [currentUserId, role, profileComplete]);

}

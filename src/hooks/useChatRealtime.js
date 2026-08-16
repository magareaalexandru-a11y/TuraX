import { useEffect } from "react";

export function useChatRealtime({
  supabase,
  chatConversation,
  setChatMessages,
}) {
  useEffect(() => {
    if (!chatConversation?.id) return;
    const channel = supabase
      .channel(`messages:${chatConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${chatConversation.id}`,
        },
        (payload) => {
          setChatMessages((prev) =>
            prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatConversation?.id]);

}

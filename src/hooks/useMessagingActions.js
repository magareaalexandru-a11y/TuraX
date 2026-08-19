import { Alert } from "react-native";
import { supabase } from "../lib/supabase";

export function useMessagingActions({
  currentUserId,
  selectedShift,
  showNotice,
  setChatConversation,
  chatConversation,
  setChatMessages,
  chatText,
  setChatText,
  setConversations,
  setNotifications,
  setScreen,
  role,
  openShift,
}) {
    const openConversation = async ({ shift = null, waiter = null, initialText = "" } = {}) => {
      if (!currentUserId) return;

      const contextShift = shift || selectedShift || null;
      const otherUserId = role === "waiter" ? contextShift?.manager_id : waiter?.waiter_id;

      if (!otherUserId) {
        showNotice("Nu am putut identifica participantul conversației.", "error");
        return;
      }

      const { data, error } = await supabase
        .rpc("ensure_conversation", {
          p_other_user_id: otherUserId,
          p_shift_id: contextShift?.id || null,
        })
        .single();

      if (error) return showNotice(error.message, "error");

      setChatConversation(data);
      await loadChat(data.id);
      if (initialText) setChatText(String(initialText));
      setScreen("chat");
    };

    const loadChat = async (conversationId) => {
      const readResult = await supabase.rpc("mark_conversation_read", {
        p_conversation_id: conversationId,
      });
      if (readResult.error) console.log("TuraX read messages:", readResult.error.message);

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) return Alert.alert("TuraX", error.message);
      setChatMessages(data || []);
      setConversations((prev) => prev.map((c) => c.id === conversationId ? { ...c, unread_count: 0 } : c));
      setNotifications((prev) => prev.map((n) => {
        let payload = {};

    if (n.data && typeof n.data === "object") {
      payload = n.data;
    } else if (typeof n.data === "string") {
      try {
        payload = JSON.parse(n.data) || {};
      } catch (_) {
        payload = {};
      }
    }

    const conversationId =
      payload.conversation_id ||
      payload.conversationId ||
      n.conversation_id ||
      null;

    const isMessageNotification =
      n.type === "message_new" ||
      n.type === "new_message" ||
      /mesaj/i.test(String(n.title || ""));
        return n.type === "message_new" && payload.conversation_id === conversationId && !n.read_at
          ? { ...n, read_at: new Date().toISOString() }
          : n;
      }));
    };

    const sendMessage = async () => {
      const body = chatText.trim();
      if (!body || !chatConversation?.id) return;
      const tempId = `temp-${Date.now()}`;
      const optimistic = {
        id: tempId,
        conversation_id: chatConversation.id,
        sender_id: currentUserId,
        body,
        created_at: new Date().toISOString(),
        _sending: true,
      };
      setChatText("");
      setChatMessages((prev) => [...prev, optimistic]);

      const { data, error } = await supabase
        .from("messages")
        .insert({ conversation_id: chatConversation.id, sender_id: currentUserId, body })
        .select("*")
        .single();
      if (error) {
        setChatMessages((prev) => prev.filter((m) => m.id !== tempId));
        setChatText(body);
        return Alert.alert("TuraX", error.message);
      }

      setChatMessages((prev) => {
        const clean = prev.filter((m) => m.id !== tempId && m.id !== data.id);
        return [...clean, data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      });
      setConversations((prev) => prev.map((c) => c.id === chatConversation.id ? {
        ...c,
        last_message: body,
        last_message_at: data.created_at,
        last_sender_id: currentUserId,
      } : c));
    };

    const openConversationFromList = async (conversation) => {
      setChatConversation(conversation);
      await loadChat(conversation.id);
      setScreen("chat");
    };

    const markNotificationRead = async (n) => {
      if (!n?.id || n.read_at) return;
      const now = new Date().toISOString();
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: now } : x)));
      const { error } = await supabase
      .from("notifications")
      .update({ read_at: now })
      .eq("id", n.id);

    if (error) {
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read_at: null } : x))
      );
      console.log("TuraX mark notification read:", error.message);
    }
    };

    const deleteNotification = async (notification) => {
    if (!notification?.id || !currentUserId) return;

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notification.id)
      .eq("user_id", currentUserId);

    if (error) {
      showNotice(error.message, "error");
      return;
    }

    setNotifications((prev) =>
      prev.filter((item) => item.id !== notification.id)
    );
  };

  const clearNotifications = () => {
    if (!currentUserId) return;

    Alert.alert(
      "Golești notificările?",
      "Toate notificările tale vor fi șterse.",
      [
        { text: "Renunță", style: "cancel" },
        {
          text: "Golește",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("notifications")
              .delete()
              .eq("user_id", currentUserId);

            if (error) {
              Alert.alert("TuraX", error.message);
              return;
            }

            setNotifications([]);
            showNotice("Notificările au fost golite.", "success");
          },
        },
      ]
    );
  };

  const openNotification = async (n) => {
    if (!n) return;

    await markNotificationRead(n);

    let payload = {};
    if (n.data && typeof n.data === "object") {
      payload = n.data;
    } else if (typeof n.data === "string") {
      try {
        payload = JSON.parse(n.data) || {};
      } catch (_) {
        payload = {};
      }
    }

    const conversationId =
      payload.conversation_id ||
      payload.conversationId ||
      n.conversation_id ||
      null;

    const isMessageNotification =
      n.type === "message_new" ||
      n.type === "new_message" ||
      /mesaj/i.test(String(n.title || ""));

    if (isMessageNotification && conversationId) {
      const { data: conversation, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .maybeSingle();

      if (error) {
        Alert.alert("TuraX", error.message);
        return;
      }

      if (conversation) {
        await openConversationFromList(conversation);
        return;
      }

      Alert.alert("TuraX", "Conversația nu mai este disponibilă.");
      return;
    }

    if (payload.shift_id) {
      const { data: shift, error } = await supabase
        .from("shifts")
        .select("*")
        .eq("id", payload.shift_id)
        .maybeSingle();

      if (error) {
        Alert.alert("TuraX", error.message);
        return;
      }

      if (shift) {
        await openShift(shift);
        return;
      }
    }

    if (
      role === "waiter" &&
      ["application_status", "application_cancelled"].includes(n.type)
    ) {
      setScreen("myActivity");
      return;
    }

    showNotice("Notificarea a fost marcată ca citită.", "info");
  };

  return {
    openConversation,
    loadChat,
    sendMessage,
    openConversationFromList,
    markNotificationRead,
    openNotification,
    deleteNotification,
    clearNotifications,
  };
}

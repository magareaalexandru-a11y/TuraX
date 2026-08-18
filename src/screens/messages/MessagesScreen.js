import React, { useEffect, useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Ionicons } from "../../components/ui/TuraXIcon";
import { C } from "../../constants/appConstants";
import { Shell, ScreenScroll, Title } from "../../components/ui/BasicUI";
import { AvatarCircle, EmptyCard } from "../../components/ui/FeedbackUI";
import { sameDay, messageDayLabel, messageTime, conversationTime } from "../../utils/appUtils";

export function MessagesScreen({ role, conversations, onOpen }) {
  return (
    <Shell>
      <ScreenScroll bottom={110}>
        <Title subtitle="Conversațiile tale TuraX">Mesaje</Title>
        {conversations.length === 0 ? (
          <EmptyCard icon="chatbubble-ellipses-outline" title="Nu ai mesaje încă" text="Conversațiile cu ospătari sau locații vor apărea aici." />
        ) : (
          conversations.map((c) => {
            const counterpartRole = role === "waiter" ? "manager" : "waiter";
            const avatar = role === "waiter" ? c.manager_avatar_url : c.waiter_avatar_url;
            const name = role === "waiter" ? c.manager_name || "Locație HoReCa" : c.waiter_name || "Ospătar";
            return (
              <TouchableOpacity key={c.id} onPress={() => onOpen(c)} activeOpacity={0.82} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border }}>
                <AvatarCircle uri={avatar} role={counterpartRole} size={48} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text numberOfLines={1} style={{ color: C.text, fontSize: 16, fontWeight: "900", flex: 1 }}>{name}</Text>
                    <Text style={{ color: C.muted2, fontSize: 11, marginLeft: 8 }}>{conversationTime(c.last_message_at || c.updated_at)}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                    <Text numberOfLines={1} style={{ color: c.unread_count ? C.text : C.muted, fontSize: 13, flex: 1, fontWeight: c.unread_count ? "800" : "500" }}>{c.last_message || c.shift_context || "Începe conversația"}</Text>
                    {!!c.unread_count && (
                      <View style={{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: C.gold, alignItems: "center", justifyContent: "center", paddingHorizontal: 5, marginLeft: 8 }}>
                        <Text style={{ color: "#07111D", fontSize: 10, fontWeight: "900" }}>{c.unread_count > 9 ? "9+" : c.unread_count}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={21} color={C.gold} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            );
          })
        )}
      </ScreenScroll>
    </Shell>
  );
}

export function ChatScreen({ role, conversation, messages, currentUserId, text, setText, onBack, onSend }) {
  const scrollRef = React.useRef(null);
  const name = role === "waiter" ? conversation?.manager_name || "Locație HoReCa" : conversation?.waiter_name || "Ospătar";
  const avatar = role === "waiter" ? conversation?.manager_avatar_url : conversation?.waiter_avatar_url;
  const counterpartRole = role === "waiter" ? "manager" : "waiter";

  useEffect(() => {
    const id = setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 80);
    return () => clearTimeout(id);
  }, [messages.length]);

  return (
    <Shell>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: C.border }}>
          <TouchableOpacity onPress={onBack} style={{ padding: 8, marginRight: 4 }}><Ionicons name="arrow-back" size={24} color={C.gold} /></TouchableOpacity>
          <AvatarCircle uri={avatar} role={counterpartRole} size={40} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text numberOfLines={1} style={{ color: C.text, fontSize: 18, fontWeight: "900" }}>{name}</Text>
            {!!conversation?.shift_context && <Text numberOfLines={1} style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{conversation.shift_context}</Text>}
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd?.({ animated: false })}
        >
          {messages.map((m, index) => {
            const mine = m.sender_id === currentUserId;
            const prev = index > 0 ? messages[index - 1] : null;
            const showDay = !prev || !sameDay(prev.created_at, m.created_at);
            return (
              <React.Fragment key={m.id}>
                {showDay && (
                  <View style={{ alignItems: "center", marginVertical: 12 }}>
                    <Text style={{ color: C.muted2, fontSize: 11, backgroundColor: C.panel, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>{messageDayLabel(m.created_at)}</Text>
                  </View>
                )}
                <View style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "82%", backgroundColor: mine ? C.gold : C.panel2, borderRadius: 16, paddingHorizontal: 13, paddingVertical: 9, marginBottom: 9 }}>
                  <Text style={{ color: mine ? "#07111D" : C.text, lineHeight: 19 }}>{m.body}</Text>
                  <Text style={{ color: mine ? "rgba(7,17,29,0.65)" : C.muted2, fontSize: 10, marginTop: 4, textAlign: "right" }}>{m._sending ? "Se trimite…" : messageTime(m.created_at)}</Text>
                </View>
              </React.Fragment>
            );
          })}
        </ScrollView>

        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 10, paddingBottom: Platform.OS === "android" ? 10 : 12, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg }}>
          <TextInput value={text} onChangeText={setText} placeholder="Scrie un mesaj..." placeholderTextColor={C.muted2} returnKeyType="send" onSubmitEditing={onSend} style={{ flex: 1, minHeight: 48, borderRadius: 15, backgroundColor: C.panel, color: C.text, paddingHorizontal: 14, borderWidth: 1, borderColor: C.border }} />
          <TouchableOpacity onPress={onSend} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: C.gold, alignItems: "center", justifyContent: "center", marginLeft: 8 }}><Ionicons name="send" size={21} color="#07111D" /></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Shell>
  );
}

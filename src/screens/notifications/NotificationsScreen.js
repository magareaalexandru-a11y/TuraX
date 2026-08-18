import React from "react";
import {
  Text,
  TouchableOpacity,
  View,
  } from "react-native";
import { Ionicons } from "../../components/ui/TuraXIcon";

import { C } from "../../constants/appConstants";
import {
  Shell,
  ScreenScroll,
  BackButton,
  Title,
} from "../../components/ui/BasicUI";
import { EmptyCard } from "../../components/ui/FeedbackUI";

export default function NotificationsScreen({ notifications, onBack, onOpen }) {
  return (
    <Shell>
      <ScreenScroll bottom={40}>
        <BackButton onPress={onBack} />
        <Title>Notificări</Title>
        {notifications.length === 0 ? (
          <EmptyCard icon="notifications-outline" title="Nu ai notificări" />
        ) : (
          notifications.map((n) => (
            <TouchableOpacity key={n.id} onPress={() => onOpen(n)} activeOpacity={0.82} style={{ backgroundColor: C.panel2, borderRadius: 17, borderWidth: 1, borderColor: n.read_at ? C.border : C.gold, padding: 15, marginBottom: 11 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: C.panel3, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                  <Ionicons name="notifications-outline" size={20} color={C.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.text, fontWeight: "900" }}>{n.title || "TuraX"}</Text>
                  <Text style={{ color: C.muted, marginTop: 4, lineHeight: 19 }}>{n.body || ""}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {!n.read_at && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.gold, marginRight: 8 }} />}
                  <Ionicons name="chevron-forward" size={18} color={C.muted2} />
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScreenScroll>
    </Shell>
  );
}

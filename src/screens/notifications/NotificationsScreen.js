import React from "react";
import {
  PanResponder,
  Animated,
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

function SwipeNotificationRow({ children, onDelete }) {
  const translateX = React.useRef(new Animated.Value(0)).current;

  const resetPosition = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 12 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy),

      onPanResponderMove: (_, gesture) => {
        if (gesture.dx < 0) {
          translateX.setValue(Math.max(gesture.dx, -110));
        }
      },

      onPanResponderRelease: (_, gesture) => {
        Animated.spring(translateX, {
          toValue: gesture.dx < -55 ? -110 : 0,
          useNativeDriver: true,
        }).start();
      },

      onPanResponderTerminate: resetPosition,
    })
  ).current;

  return (
    <View style={{ position: "relative", overflow: "hidden", borderRadius: 17 }}>
      <View
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 105,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={onDelete}
          activeOpacity={0.82}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 13,
            backgroundColor: C.danger,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900" }}>
            Șterge
          </Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={{
          transform: [{ translateX }],
          backgroundColor: C.bg,
        }}
      >
        {children}
      </Animated.View>
    </View>
  );
}

export default function NotificationsScreen({ notifications, onBack, onOpen, onClear, onDelete }) {
  return (
    <Shell>
      <ScreenScroll bottom={40}>
        <BackButton onPress={onBack} />
        <Title>Notificări</Title>

        {notifications.length > 0 && onClear ? (
          <TouchableOpacity
            onPress={onClear}
            activeOpacity={0.82}
            style={{
              alignSelf: "flex-end",
              marginTop: -44,
              marginBottom: 20,
              paddingVertical: 10,
              paddingHorizontal: 4,
            }}
          >
            <Text style={{ color: C.gold, fontWeight: "900", fontSize: 15 }}>
              Golește
            </Text>
          </TouchableOpacity>
        ) : null}
        {notifications.length === 0 ? (
          <EmptyCard icon="notifications-outline" title="Nu ai notificări" />
        ) : (
          notifications.map((n) => (
            <SwipeNotificationRow
              key={n.id}
              onDelete={() => onDelete?.(n)}
            >
              <TouchableOpacity onPress={() => onOpen(n)} activeOpacity={0.82} style={{ backgroundColor: C.panel2, borderRadius: 17, borderWidth: 1, borderColor: n.read_at ? C.border : C.gold, padding: 15, marginBottom: 11 }}>
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
            </SwipeNotificationRow>
          ))
        )}
      </ScreenScroll>
    </Shell>
  );
}

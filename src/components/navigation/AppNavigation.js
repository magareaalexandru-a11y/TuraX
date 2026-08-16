import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../../constants/appConstants";

export function BottomNav({ screen, setScreen }) {
  const items = [
    ["home", "home-outline", "Acasă"],
    ["shifts", "search-outline", "Ture"],
    ["publish", "add-circle-outline", "Publică"],
    ["messages", "chatbubble-ellipses-outline", "Mesaje"],
    ["profile", "person-outline", "Profil"],
  ];
  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        minHeight: 76,
        paddingBottom: 6,
        backgroundColor: "#07101E",
        borderTopWidth: 1,
        borderTopColor: C.border,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
      }}
    >
      {items.map(([target, icon, label]) => {
        const active = screen === target;
        return (
          <TouchableOpacity
            key={target}
            onPress={() => setScreen(target)}
            style={{ alignItems: "center", minWidth: 58, paddingVertical: 8 }}
          >
            <Ionicons name={icon} size={23} color={active ? C.gold : C.muted2} />
            <Text
              style={{
                marginTop: 4,
                fontSize: 11,
                fontWeight: active ? "800" : "600",
                color: active ? C.gold : C.muted2,
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function ClocheLogo({ size = 205 }) {
  const inner = Math.round(size * 0.78);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: "rgba(245,185,66,0.12)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: inner,
          height: inner,
          borderRadius: inner / 2,
          borderWidth: 1,
          borderColor: "rgba(245,185,66,0.17)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View style={{ width: 17, height: 17, borderRadius: 9, backgroundColor: C.gold, marginBottom: 7 }} />
        <View
          style={{
            width: Math.round(inner * 0.62),
            height: Math.round(inner * 0.31),
            backgroundColor: C.gold,
            borderTopLeftRadius: 55,
            borderTopRightRadius: 55,
          }}
        />
        <View
          style={{
            width: Math.round(inner * 0.78),
            height: 8,
            borderRadius: 5,
            backgroundColor: C.gold,
            marginTop: -2,
          }}
        />
        <View
          style={{
            width: Math.round(inner * 0.32),
            height: Math.round(inner * 0.18),
            borderLeftWidth: 8,
            borderBottomWidth: 8,
            borderColor: C.gold,
            borderBottomLeftRadius: 17,
            marginTop: 9,
            transform: [{ rotate: "-45deg" }],
          }}
        />
      </View>
    </View>
  );
}

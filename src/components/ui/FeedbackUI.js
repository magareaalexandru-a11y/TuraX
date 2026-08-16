import React from "react";
import {
  View,
  Text,
  StatusBar,
  Platform,
  Modal,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../../constants/appConstants";

export function TuraXNotice({ notice }) {
  if (!notice) return null;
  const danger = notice.type === "error";
  const info = notice.type === "info";
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 18,
        right: 18,
        top: (Platform.OS === "android" ? StatusBar.currentHeight || 0 : 12) + 10,
        zIndex: 9999,
        elevation: 20,
        backgroundColor: C.panel3,
        borderWidth: 1,
        borderColor: danger ? C.danger : info ? C.border : C.gold,
        borderRadius: 16,
        paddingHorizontal: 15,
        paddingVertical: 13,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Ionicons
        name={danger ? "alert-circle-outline" : info ? "information-circle-outline" : "checkmark-circle-outline"}
        size={22}
        color={danger ? C.danger : C.gold}
        style={{ marginRight: 10 }}
      />
      <Text style={{ color: C.text, flex: 1, fontWeight: "800", lineHeight: 20 }}>{notice.text}</Text>
    </View>
  );
}

export function TuraXConfirm({ dialog, onCancel, onConfirm }) {
  if (!dialog) return null;
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onCancel}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.68)",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 22,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 430,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: dialog.danger ? C.danger : C.gold,
            backgroundColor: C.panel2,
            padding: 20,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: C.panel3,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Ionicons
                name={dialog.danger ? "warning-outline" : "help-circle-outline"}
                size={24}
                color={dialog.danger ? C.danger : C.gold}
              />
            </View>
            <Text style={{ color: C.text, fontSize: 20, fontWeight: "900", flex: 1 }}>
              {dialog.title || "Confirmare"}
            </Text>
          </View>

          {!!dialog.message && (
            <Text style={{ color: C.muted, lineHeight: 21, marginTop: 15 }}>{dialog.message}</Text>
          )}

          <View style={{ flexDirection: "row", marginTop: 20 }}>
            <TouchableOpacity
              onPress={onCancel}
              style={{
                flex: 1,
                minHeight: 50,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: C.border,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 6,
              }}
            >
              <Text style={{ color: C.text, fontWeight: "900" }}>{dialog.cancelLabel || "Renunță"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              style={{
                flex: 1,
                minHeight: 50,
                borderRadius: 14,
                backgroundColor: dialog.danger ? C.danger : C.gold,
                alignItems: "center",
                justifyContent: "center",
                marginLeft: 6,
              }}
            >
              <Text style={{ color: dialog.danger ? "#fff" : "#07111D", fontWeight: "900" }}>
                {dialog.confirmLabel || "Confirmă"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function RatingStars({ label, onRate, compact = false }) {
  return (
    <View style={{ marginTop: compact ? 10 : 14 }}>
      {!!label && <Text style={{ color: C.muted, fontSize: 13, marginBottom: 7 }}>{label}</Text>}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <TouchableOpacity
            key={rating}
            onPress={() => onRate(rating)}
            activeOpacity={0.72}
            style={{ paddingVertical: 4, paddingRight: 9 }}
          >
            <Ionicons name="star" size={compact ? 25 : 29} color={C.gold} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export function AvatarCircle({ uri, role, size = 52 }) {
  const manager = role === "manager";
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: C.gold,
        backgroundColor: C.panel3,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
      ) : (
        <Ionicons name={manager ? "business-outline" : "person-outline"} size={Math.round(size * 0.48)} color={C.gold} />
      )}
    </View>
  );
}

export function EmptyCard({ icon = "restaurant-outline", title, text }) {
  return (
    <View
      style={{
        backgroundColor: C.panel2,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: C.border,
      }}
    >
      <Ionicons name={icon} size={30} color={C.gold} />
      <Text style={{ color: C.text, fontSize: 18, fontWeight: "800", marginTop: 12 }}>
        {title}
      </Text>
      {!!text && (
        <Text style={{ color: C.muted, fontSize: 14, lineHeight: 20, marginTop: 6 }}>{text}</Text>
      )}
    </View>
  );
}

import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { Ionicons as Icons } from "@expo/vector-icons";

import { C } from "../../constants/appConstants";
import {
  formatDateRo,
  money,
  shiftStatusLabel,
} from "../../utils/appUtils";

export default function ShiftCard({ shift, favorite, onFavorite, onPress, showStatus = false }) {
  const statusColor = shift.status === "cancelled" ? C.danger : shift.status === "completed" ? C.success : C.gold;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{
        backgroundColor: C.panel2,
        borderRadius: 20,
        padding: 17,
        borderWidth: 1,
        borderColor: C.border,
        marginBottom: 13,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        {shift.manager_avatar_url ? (
          <Image
            source={{ uri: shift.manager_avatar_url }}
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              borderWidth: 1,
              borderColor: C.gold,
              marginRight: 12,
              backgroundColor: C.panel,
            }}
          />
        ) : (
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              borderWidth: 1,
              borderColor: C.gold,
              marginRight: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: C.panel,
            }}
          >
            <Ionicons name="business-outline" size={23} color={C.gold} />
          </View>
        )}

        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={{ color: C.text, fontSize: 18, fontWeight: "900" }}>
            {shift.location_name || "Locație HoReCa"}
          </Text>
          <Text style={{ color: C.gold, fontSize: 14, fontWeight: "800", marginTop: 3 }}>
            {shift.role || "Ospătar"}
          </Text>
          {showStatus && (
            <View style={{ alignSelf: "flex-start", marginTop: 8, borderRadius: 999, borderWidth: 1, borderColor: statusColor, paddingHorizontal: 10, paddingVertical: 5 }}>
              <Text style={{ color: statusColor, fontWeight: "900", fontSize: 11 }}>{shiftStatusLabel(shift.status)}</Text>
            </View>
          )}
        </View>
        {!!onFavorite && (
          <TouchableOpacity onPress={onFavorite} style={{ padding: 4 }}>
            <Ionicons name={favorite ? "heart" : "heart-outline"} size={23} color={favorite ? C.gold : C.muted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={{ marginTop: 12 }}>
        <Text style={{ color: C.muted, fontSize: 14 }}>
          <Ionicons name="location-outline" size={14} color={C.muted} /> {shift.city || "—"}
        </Text>
        <Text style={{ color: C.muted, fontSize: 14, marginTop: 6 }}>
          <Ionicons name="calendar-outline" size={14} color={C.muted} /> {formatDateRo(shift.shift_date)}
        </Text>
        <Text style={{ color: C.muted, fontSize: 14, marginTop: 6 }}>
          <Ionicons name="time-outline" size={14} color={C.muted} /> {String(shift.start_time || "").slice(0, 5)} – {String(shift.end_time || "").slice(0, 5)}
        </Text>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 15 }}>
        <Text style={{ color: C.success, fontWeight: "900", fontSize: 15 }}>{money(shift.hourly_rate)}/oră</Text>
        <Text style={{ color: C.gold, fontWeight: "900" }}>Vezi detalii ›</Text>
      </View>
    </TouchableOpacity>
  );
}

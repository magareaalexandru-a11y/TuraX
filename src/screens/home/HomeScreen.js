import React from "react";
import {
  ActivityIndicator,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { C } from "../../constants/appConstants";
import {
  Shell,
  ScreenScroll,
  Button,
  ErrorBox,
} from "../../components/ui/BasicUI";
import { EmptyCard } from "../../components/ui/FeedbackUI";
import ShiftCard from "../../components/shifts/ShiftCard";
import { hasShiftEnded } from "../../utils/appUtils";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen({
  role,
  profile,
  shifts,
  availabilities,
  acceptedShifts,
  myAvailabilities,
  myApplications,
  unreadCount,
  dbError,
  dataLoading,
  refreshing,
  onRefresh,
  onNotifications,
  onSeeShifts,
  onPublish,
  onOpenShift,
  onAvailableWaiters,
  onBrowseWaiters,
  onMyActivity,
  onConfirmedShifts,
}) {
  const manager = role === "manager";
  const firstName = manager ? profile?.location_name || "TuraX" : (profile?.full_name || "Salut").split(" ")[0];
  const activeManagerShifts = shifts.filter((s) => ["open", "closed"].includes(s.status) && !hasShiftEnded(s));
  const primaryCount = manager ? activeManagerShifts.length : shifts.length;
  const secondaryCount = manager ? new Set(availabilities.map((a) => a.waiter_id).filter(Boolean)).size : acceptedShifts.filter((a) => a.status === "accepted").length;

  return (
    <Shell>
      <ScreenScroll refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />} bottom={110}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ color: C.gold, fontSize: 34, fontWeight: "900" }}>TuraX</Text>
            <Text style={{ color: C.muted, marginTop: 2 }}>Ture HoReCa, când vrei tu.</Text>
          </View>
          <TouchableOpacity onPress={onNotifications} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: C.panel2, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="notifications-outline" size={23} color={C.gold} />
            {unreadCount > 0 && (
              <View style={{ position: "absolute", top: -3, right: -3, minWidth: 19, height: 19, borderRadius: 10, backgroundColor: C.danger, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }}>
                <Text style={{ color: "#fff", fontSize: 10, fontWeight: "900" }}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Text style={{ color: C.text, fontSize: 27, fontWeight: "900", marginTop: 30 }}>{manager ? `Bun venit, ${firstName}` : `Salut, ${firstName}! 👋`}</Text>
        <Text style={{ color: C.muted, marginTop: 6, lineHeight: 20 }}>{manager ? "Gestionează turele și găsește oameni disponibili." : "Găsește ture potrivite și gestionează programul tău."}</Text>
        <ErrorBox text={dbError} />

        <View style={{ flexDirection: "row", marginTop: 22 }}>
          <TouchableOpacity onPress={onSeeShifts} activeOpacity={0.82} style={{ flex: 1, backgroundColor: C.panel2, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, marginRight: 8 }}>
            <Text style={{ color: C.gold, fontSize: 25, fontWeight: "900" }}>{primaryCount}</Text>
            <Text style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{manager ? "Ture active" : "Ture disponibile"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={manager ? onAvailableWaiters : onConfirmedShifts} activeOpacity={0.82} style={{ flex: 1, backgroundColor: C.panel2, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, marginLeft: 8 }}>
            <Text style={{ color: C.gold, fontSize: 25, fontWeight: "900" }}>{secondaryCount}</Text>
            <Text style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{manager ? "Oameni disponibili" : "Ture confirmate"}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row", marginTop: 14 }}>
          <Button label={manager ? "Publică tură" : "Publică disponibilitate"} icon="add-circle-outline" onPress={onPublish} style={{ flex: 1, marginRight: 7 }} />
          <Button label={manager ? "Vezi oameni" : "Vezi ture"} icon="search-outline" onPress={manager ? onBrowseWaiters : onSeeShifts} secondary style={{ flex: 1, marginLeft: 7 }} />
        </View>

        {!manager && (
          <TouchableOpacity onPress={onMyActivity} activeOpacity={0.85} style={{ marginTop: 12, minHeight: 70, borderRadius: 17, borderWidth: 1, borderColor: C.border, backgroundColor: C.panel, flexDirection: "row", alignItems: "center", paddingHorizontal: 15 }}>
            <Ionicons name="calendar-outline" size={23} color={C.gold} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontSize: 16, fontWeight: "900" }}>Programul meu</Text>
              <Text style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>{myAvailabilities.length} disponibilități · {myApplications.length} candidaturi</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.gold} />
          </TouchableOpacity>
        )}

        <Text style={{ color: C.text, fontSize: 20, fontWeight: "900", marginTop: 28, marginBottom: 13 }}>{manager ? "Turele tale" : "Ture recomandate"}</Text>
        {dataLoading ? (
          <ActivityIndicator color={C.gold} />
        ) : shifts.length === 0 ? (
          <EmptyCard title={manager ? "Nu ai publicat nicio tură" : "Nu există ture publicate încă"} text={manager ? "Publică prima tură când ai nevoie de personal." : "Când apar ture noi, le vei vedea aici."} />
        ) : (
          shifts.slice(0, 3).map((s) => <ShiftCard key={s.id} shift={s} showStatus={manager} onPress={() => onOpenShift(s)} />)
        )}
      </ScreenScroll>
    </Shell>
  );
}

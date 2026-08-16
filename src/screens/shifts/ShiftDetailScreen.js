import React from "react";
import {
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { C } from "../../constants/appConstants";

import {
  Shell,
  ScreenScroll,
  BackButton,
  Button,
  EmptyCard,
} from "../../components/ui/BasicUI";

import {
  RatingStars,
} from "../../components/ui/FeedbackUI";

import {
  formatDateRo,
  money,
  shiftStatusLabel,
  shiftStartDate,
  hasShiftEnded,
} from "../../utils/appUtils";

function ShiftInfoRow({ icon, children }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 9 }}>
      <Ionicons name={icon} size={18} color={C.muted} style={{ width: 25 }} />
      <Text style={{ color: C.muted, flex: 1, lineHeight: 20 }}>{children}</Text>
    </View>
  );
}

export default function ShiftDetailScreen({
  role,
  shift,
  applications,
  favorite,
  currentApplication,
  onBack,
  onFavorite,
  onApply,
  applyBusy,
  onMessage,
  onApplicationStatus,
  onCancelShift,
  onAttendance,
  onRateApplicant,
  onMessageApplicant,
}) {
  if (!shift) return null;
  const manager = role === "manager";
  const needed = Math.max(1, Number(shift.workers_needed || 1));
  const filled = Math.max(0, Number(shift.filled_positions || 0));
  const remaining = Math.max(0, needed - filled);
  const applicationStatus = currentApplication?.status || null;
  const ended = hasShiftEnded(shift);
  const start = shiftStartDate(shift);
  const acceptingApplications = shift.status === "open" && remaining > 0 && !!start && start.getTime() > Date.now();
  const cancellableByManager = manager && ["open", "closed"].includes(shift.status) && !ended;
  const shiftStatusColor =
    shift.status === "completed"
      ? C.success
      : shift.status === "cancelled"
      ? C.danger
      : shift.status === "closed"
      ? C.warning
      : C.gold;
  const statusColor =
    applicationStatus === "accepted" || applicationStatus === "completed"
      ? C.success
      : applicationStatus === "rejected" || applicationStatus === "cancelled" || applicationStatus === "no_show"
      ? C.danger
      : C.gold;

  return (
    <Shell>
      <ScreenScroll bottom={40}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <BackButton onPress={onBack} />
          {!manager && (
            <TouchableOpacity onPress={onFavorite} style={{ width: 48, height: 48, borderRadius: 15, borderWidth: 1, borderColor: C.border, backgroundColor: C.panel, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={favorite ? "heart" : "heart-outline"} size={24} color={C.gold} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={{ color: C.text, fontSize: 30, fontWeight: "900" }}>{shift.location_name}</Text>
        <Text style={{ color: C.gold, fontSize: 18, fontWeight: "900", marginTop: 5 }}>{shift.role}</Text>
        <View style={{ alignSelf: "flex-start", marginTop: 10, borderRadius: 999, borderWidth: 1, borderColor: shiftStatusColor, paddingHorizontal: 11, paddingVertical: 6 }}>
          <Text style={{ color: shiftStatusColor, fontWeight: "900", fontSize: 12 }}>{shiftStatusLabel(shift.status)}</Text>
        </View>

        <View style={{ backgroundColor: C.panel2, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 17, marginTop: 20 }}>
          <ShiftInfoRow icon="location-outline">{shift.city}{shift.address ? `, ${shift.address}` : ""}</ShiftInfoRow>
          <ShiftInfoRow icon="calendar-outline">{formatDateRo(shift.shift_date)}</ShiftInfoRow>
          <ShiftInfoRow icon="time-outline">{String(shift.start_time || "").slice(0, 5)} – {String(shift.end_time || "").slice(0, 5)}</ShiftInfoRow>
          <ShiftInfoRow icon="people-outline">{remaining} din {needed} {needed === 1 ? "loc disponibil" : "locuri disponibile"}</ShiftInfoRow>
          <Text style={{ color: C.success, fontSize: 18, fontWeight: "900", marginTop: 14 }}>{money(shift.hourly_rate)}/oră</Text>
        </View>

        {!!shift.description && (
          <>
            <Text style={{ color: C.text, fontSize: 19, fontWeight: "900", marginTop: 24, marginBottom: 8 }}>Detalii</Text>
            <Text style={{ color: C.muted, lineHeight: 22 }}>{formatHorecaText(shift.description)}</Text>
          </>
        )}

        {!manager && (
          <>
            {currentApplication ? (
              <View style={{ marginTop: 28, borderRadius: 17, borderWidth: 1, borderColor: statusColor, backgroundColor: C.panel2, padding: 15, flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name={applicationStatus === "accepted" ? "checkmark-circle" : applicationStatus === "pending" ? "time-outline" : "information-circle-outline"}
                  size={24}
                  color={statusColor}
                  style={{ marginRight: 11 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.text, fontWeight: "900", fontSize: 16 }}>Candidatura ta</Text>
                  <Text style={{ color: statusColor, fontWeight: "800", marginTop: 3 }}>{applicationStatusLabel(applicationStatus)}</Text>
                </View>
              </View>
            ) : acceptingApplications ? (
              <Button label={applyBusy ? "Se trimite..." : "Aplică acum"} icon="checkmark-circle-outline" onPress={onApply} disabled={applyBusy} style={{ marginTop: 28 }} />
            ) : (
              <View style={{ marginTop: 28, borderRadius: 17, borderWidth: 1, borderColor: C.border, backgroundColor: C.panel2, padding: 15 }}>
                <Text style={{ color: C.muted, lineHeight: 20 }}>Această tură nu mai primește candidaturi.</Text>
              </View>
            )}
            <Button label="Trimite mesaj" secondary icon="chatbubble-outline" onPress={onMessage} style={{ marginTop: 12 }} />
          </>
        )}

        {manager && (
          <>
            <View style={{ marginTop: 24, borderRadius: 16, borderWidth: 1, borderColor: C.border, backgroundColor: C.panel, padding: 13 }}>
              <Text style={{ color: C.muted }}>Locuri ocupate</Text>
              <Text style={{ color: C.gold, fontSize: 20, fontWeight: "900", marginTop: 3 }}>{filled} / {needed}</Text>
              {ended && shift.status !== "cancelled" && (
                <Text style={{ color: C.muted, marginTop: 7, lineHeight: 19 }}>
                  Tura s-a încheiat. Marchează prezența fiecărui ospătar confirmat.
                </Text>
              )}
            </View>

            {cancellableByManager && (
              <Button label="Anulează tura" danger icon="close-circle-outline" onPress={() => onCancelShift(shift)} style={{ marginTop: 12 }} />
            )}

            <Text style={{ color: C.text, fontSize: 20, fontWeight: "900", marginTop: 24, marginBottom: 12 }}>
              Candidați ({applications.length})
            </Text>
            {applications.length === 0 ? (
              <EmptyCard icon="people-outline" title="Nicio candidatură încă" />
            ) : (
              applications.map((a) => (
                <View key={a.id} style={{ backgroundColor: C.panel2, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 15, marginBottom: 12 }}>
                  <Text style={{ color: C.text, fontSize: 16, fontWeight: "900" }}>{a.waiter_name || "Ospătar"}</Text>
                  <Text style={{ color: C.muted, marginTop: 4 }}>{a.waiter_city || "—"} · {a.waiter_experience || 0} ani experiență</Text>
                  <Text style={{ color: a.status === "accepted" || a.status === "completed" ? C.success : ["rejected", "cancelled", "no_show"].includes(a.status) ? C.danger : C.gold, fontWeight: "800", marginTop: 7 }}>
                    {applicationStatusLabel(a.status)}
                  </Text>

                  {a.status === "pending" && shift.status === "open" && (
                    <View style={{ flexDirection: "row", marginTop: 12 }}>
                      <TouchableOpacity onPress={() => onApplicationStatus(a.id, "accepted")} style={{ flex: 1, backgroundColor: C.success, borderRadius: 12, paddingVertical: 10, alignItems: "center", marginRight: 5 }}>
                        <Text style={{ color: "#07111D", fontWeight: "900" }}>Acceptă</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => onApplicationStatus(a.id, "rejected")} style={{ flex: 1, borderWidth: 1, borderColor: C.danger, borderRadius: 12, paddingVertical: 10, alignItems: "center", marginHorizontal: 5 }}>
                        <Text style={{ color: C.danger, fontWeight: "900" }}>Respinge</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => onMessageApplicant(a)} style={{ width: 45, borderWidth: 1, borderColor: C.border, borderRadius: 12, alignItems: "center", justifyContent: "center", marginLeft: 5 }}>
                        <Ionicons name="chatbubble-outline" size={20} color={C.gold} />
                      </TouchableOpacity>
                    </View>
                  )}

                  {a.status === "accepted" && ended && (
                    <View style={{ marginTop: 12 }}>
                      <Text style={{ color: C.muted, fontSize: 13, marginBottom: 8 }}>Prezență după tură</Text>
                      <View style={{ flexDirection: "row" }}>
                        <TouchableOpacity onPress={() => onAttendance(a, "completed")} style={{ flex: 1, backgroundColor: C.success, borderRadius: 12, minHeight: 44, alignItems: "center", justifyContent: "center", marginRight: 6 }}>
                          <Text style={{ color: "#07111D", fontWeight: "900" }}>S-a prezentat</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onAttendance(a, "no_show")} style={{ flex: 1, borderWidth: 1, borderColor: C.danger, borderRadius: 12, minHeight: 44, alignItems: "center", justifyContent: "center", marginLeft: 6 }}>
                          <Text style={{ color: C.danger, fontWeight: "900" }}>No-show</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {["completed", "no_show"].includes(a.status) && (
                    <RatingStars
                      label={a.status === "no_show" ? "Rating pentru profesionist după no-show" : "Evaluează profesionistul"}
                      compact
                      onRate={(rating) => onRateApplicant(a, rating)}
                    />
                  )}

                  {a.status !== "pending" && (
                    <TouchableOpacity onPress={() => onMessageApplicant(a)} style={{ marginTop: 12, minHeight: 42, borderWidth: 1, borderColor: C.border, borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row" }}>
                      <Ionicons name="chatbubble-outline" size={18} color={C.gold} style={{ marginRight: 7 }} />
                      <Text style={{ color: C.text, fontWeight: "800" }}>Mesaj</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </>
        )}
      </ScreenScroll>
    </Shell>
  );
}

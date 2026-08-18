import React from "react";
import {
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Ionicons } from "../../components/ui/TuraXIcon";
import { C } from "../../constants/appConstants";
import { Shell,
  ScreenScroll,
  Title,
  BackButton,
  } from "../../components/ui/BasicUI";
import { RatingStars,
  EmptyCard,
} from "../../components/ui/FeedbackUI";
import { formatDateRo,
  money,
  hasShiftEnded,
  canCancelConfirmedShift,
  applicationStatusLabel,
} from "../../utils/appUtils";

import ShiftCard from "../../components/shifts/ShiftCard";

export function MyWaiterActivityScreen({
  availabilities,
  applications,
  onBack,
  onWithdrawAvailability,
  onCancelApplication,
  onRateManager,
  onOpenShift,
}) {
  const active = applications.filter((a) => ["pending", "accepted"].includes(a.status));
  const history = applications.filter((a) => !["pending", "accepted"].includes(a.status));

  const renderApplication = (a) => {
    const shift = a.shifts || {};
    const confirmed = a.status === "accepted";
    const cancellationAllowed = !confirmed || canCancelConfirmedShift(shift);
    const canCancel = a.status === "pending" || confirmed;
    const statusColor =
      a.status === "accepted" || a.status === "completed"
        ? C.success
        : a.status === "rejected" || a.status === "cancelled" || a.status === "no_show"
        ? C.danger
        : C.gold;

    return (
      <View key={a.id} style={{ backgroundColor: C.panel2, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12 }}>
        <TouchableOpacity onPress={() => onOpenShift(a)} activeOpacity={0.8}>
          <Text style={{ color: C.text, fontSize: 17, fontWeight: "900" }}>{shift.location_name || "Tură HoReCa"}</Text>
          <Text style={{ color: C.muted, marginTop: 5 }}>
            {shift.role || "—"} · {formatDateRo(shift.shift_date)} · {String(shift.start_time || "").slice(0, 5)}–{String(shift.end_time || "").slice(0, 5)}
          </Text>
          <Text style={{ color: statusColor, marginTop: 8, fontWeight: "900" }}>{applicationStatusLabel(a.status)}</Text>
        </TouchableOpacity>

        {confirmed && !cancellationAllowed && (
          <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 10 }}>
            <Ionicons name="lock-closed-outline" size={18} color={C.warning} style={{ marginRight: 7, marginTop: 1 }} />
            <Text style={{ color: C.warning, lineHeight: 19, flex: 1 }}>
              Anularea este blocată: au rămas 48 de ore sau mai puțin până la începerea turei.
            </Text>
          </View>
        )}

        {canCancel && (
          <TouchableOpacity
            disabled={confirmed && !cancellationAllowed}
            onPress={() => onCancelApplication(a)}
            style={{
              alignSelf: "flex-start",
              marginTop: 12,
              borderWidth: 1,
              borderColor: confirmed && !cancellationAllowed ? C.border : C.danger,
              borderRadius: 12,
              paddingVertical: 9,
              paddingHorizontal: 13,
              opacity: confirmed && !cancellationAllowed ? 0.45 : 1,
            }}
          >
            <Text style={{ color: confirmed && !cancellationAllowed ? C.muted : C.danger, fontWeight: "900" }}>
              {confirmed ? "Anulează tura" : "Retrage candidatura"}
            </Text>
          </TouchableOpacity>
        )}

        {a.status === "completed" && shift.manager_id && (
          <RatingStars
            label="Evaluează locația după această tură"
            compact
            onRate={(rating) => onRateManager(a, rating)}
          />
        )}

        {a.status === "no_show" && (
          <Text style={{ color: C.danger, marginTop: 10, lineHeight: 19 }}>
            Managerul a înregistrat o neprezentare pentru această tură.
          </Text>
        )}
      </View>
    );
  };

  return (
    <Shell>
      <ScreenScroll bottom={45}>
        <BackButton onPress={onBack} />
        <Title subtitle="Disponibilități, angajamente active și istoricul tău.">Programul meu</Title>

        <View style={{ backgroundColor: C.panel2, borderRadius: 17, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 22 }}>
          <Text style={{ color: C.gold, fontWeight: "900" }}>Regula de anulare</Text>
          <Text style={{ color: C.muted, marginTop: 6, lineHeight: 20 }}>
            Disponibilitatea simplă poate fi retrasă. O tură confirmată poate fi anulată numai când au rămas mai mult de 48 de ore până la începere. Regula este verificată și în Supabase, nu doar de buton.
          </Text>
        </View>

        <Text style={{ color: C.text, fontSize: 20, fontWeight: "900", marginBottom: 12 }}>
          Disponibilitățile mele ({availabilities.length})
        </Text>
        {availabilities.length === 0 ? (
          <EmptyCard icon="calendar-outline" title="Nu ai disponibilități active" text="Publică una din butonul Publică." />
        ) : (
          availabilities.map((r) => (
            <View key={r.id} style={{ backgroundColor: C.panel2, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12 }}>
              <Text style={{ color: C.text, fontSize: 17, fontWeight: "900" }}>{formatDateRo(r.available_date)}</Text>
              <Text style={{ color: C.gold, marginTop: 7, fontWeight: "800" }}>
                {String(r.start_time || "").slice(0, 5)} – {String(r.end_time || "").slice(0, 5)} · {money(r.desired_rate)}/oră
              </Text>
              <Text style={{ color: C.success, marginTop: 6, fontWeight: "800" }}>Activă</Text>
              <TouchableOpacity onPress={() => onWithdrawAvailability(r)} style={{ alignSelf: "flex-start", marginTop: 12, borderWidth: 1, borderColor: C.danger, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 13 }}>
                <Text style={{ color: C.danger, fontWeight: "900" }}>Retrage disponibilitatea</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <Text style={{ color: C.text, fontSize: 20, fontWeight: "900", marginTop: 26, marginBottom: 12 }}>
          Angajamente active ({active.length})
        </Text>
        {active.length === 0 ? (
          <EmptyCard icon="briefcase-outline" title="Nicio candidatură activă" text="Candidaturile noi și turele confirmate apar aici." />
        ) : (
          active.map(renderApplication)
        )}

        <Text style={{ color: C.text, fontSize: 20, fontWeight: "900", marginTop: 26, marginBottom: 12 }}>
          Istoric ({history.length})
        </Text>
        {history.length === 0 ? (
          <EmptyCard icon="time-outline" title="Istoricul este gol" text="Turele finalizate, anulate, respinse sau no-show vor rămâne aici." />
        ) : (
          history.map(renderApplication)
        )}
      </ScreenScroll>
    </Shell>
  );
}


export function ConfirmedShiftsScreen({ applications, onBack, onOpenShift }) {
  const confirmed = applications.filter((a) => a.status === "accepted" && a.shifts && !hasShiftEnded(a.shifts));
  return (
    <Shell>
      <ScreenScroll bottom={45}>
        <BackButton onPress={onBack} />
        <Title subtitle="Doar turele tale confirmate și încă active.">Ture confirmate</Title>
        {confirmed.length === 0 ? (
          <EmptyCard icon="checkmark-circle-outline" title="Nu ai ture confirmate" text="Când o candidatură este acceptată, tura va apărea aici." />
        ) : (
          confirmed.map((a) => (
            <ShiftCard key={a.id} shift={a.shifts} onPress={() => onOpenShift(a)} />
          ))
        )}
      </ScreenScroll>
    </Shell>
  );
}

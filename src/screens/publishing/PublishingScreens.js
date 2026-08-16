import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";

import {
  C,
  SHIFT_ROLES,
  TIME_SLOTS,
} from "../../constants/appConstants";

import {
  todayIso,
  isPublishStartAllowed,
  formatDateRo,
} from "../../utils/appUtils";

import {
  Shell,
  ScreenScroll,
  Title,
  Field,
  Button,
  ErrorBox,
} from "../../components/ui/BasicUI";

export function PickerBox({ value, onChange, placeholder, items }) {
  const [visible, setVisible] = useState(false);

  const choose = (item) => {
    onChange(item);
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        activeOpacity={0.82}
        style={{
          flex: 1,
          minHeight: 56,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: C.border,
          backgroundColor: C.panel,
          paddingHorizontal: 14,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: value ? C.text : C.muted2,
            fontSize: 16,
            flex: 1,
          }}
        >
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={19} color={C.gold} />
      </TouchableOpacity>

      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.78)",
            justifyContent: "center",
            paddingHorizontal: 22,
          }}
        >
          <View
            style={{
              maxHeight: "72%",
              borderRadius: 22,
              backgroundColor: C.panel2,
              borderWidth: 1,
              borderColor: C.gold,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                paddingHorizontal: 18,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: C.border,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: C.text,
                  fontSize: 19,
                  fontWeight: "900",
                  flex: 1,
                }}
              >
                {placeholder}
              </Text>

              <TouchableOpacity
                onPress={() => setVisible(false)}
                style={{
                  width: 38,
                  height: 38,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={25} color={C.gold} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {items.map((item) => {
                const selected = item === value;

                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => choose(item)}
                    activeOpacity={0.82}
                    style={{
                      minHeight: 60,
                      paddingHorizontal: 18,
                      flexDirection: "row",
                      alignItems: "center",
                      borderBottomWidth: 1,
                      borderBottomColor: C.border,
                      backgroundColor: selected ? C.panel3 : C.panel2,
                    }}
                  >
                    <Text
                      style={{
                        color: selected ? C.gold : C.text,
                        fontSize: 17,
                        fontWeight: selected ? "900" : "600",
                        flex: 1,
                      }}
                    >
                      {item}
                    </Text>

                    {selected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={23}
                        color={C.gold}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

export function TimePickerBox({ value, onChange, placeholder, disabledTimes = [] }) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        activeOpacity={0.82}
        style={{ minHeight: 56, borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.panel, paddingHorizontal: 14, flexDirection: "row", alignItems: "center" }}
      >
        <Text style={{ color: value ? C.text : C.muted2, fontSize: 16, flex: 1 }}>{value || placeholder}</Text>
        <Ionicons name="chevron-down" size={19} color={C.gold} />
      </TouchableOpacity>

      <Modal transparent visible={visible} animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "center", paddingHorizontal: 22 }}>
          <View style={{ maxHeight: "72%", borderRadius: 22, backgroundColor: C.panel2, borderWidth: 1, borderColor: C.gold, overflow: "hidden" }}>
            <View style={{ paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: "row", alignItems: "center" }}>
              <Text style={{ color: C.text, fontSize: 19, fontWeight: "900", flex: 1 }}>{placeholder}</Text>
              <TouchableOpacity onPress={() => setVisible(false)} style={{ padding: 5 }}><Ionicons name="close" size={24} color={C.gold} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {(placeholder === "Început"
          ? TIME_SLOTS.filter((item) => item >= "07:00")
          : TIME_SLOTS
        ).map((item) => {
                const selected = item === value;
                const disabled = disabledTimes.includes(item);
                return (
                  <TouchableOpacity key={item} disabled={disabled} onPress={() => { onChange(item); setVisible(false); }} style={{ minHeight: 52, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: selected ? C.panel3 : C.panel2, opacity: disabled ? 0.32 : 1 }}>
                    <Text style={{ color: selected ? C.gold : C.text, fontSize: 17, fontWeight: selected ? "900" : "600", flex: 1 }}>{item}</Text>
                    {disabled ? <Text style={{ color: C.muted2, fontSize: 12 }}>prea devreme</Text> : selected ? <Ionicons name="checkmark-circle" size={21} color={C.gold} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

export function DarkCalendar({ selectedDates, onDayPress, single }) {
  const marked = Object.fromEntries(
    selectedDates.map((date) => [date, { selected: true, selectedColor: C.gold, selectedTextColor: "#07111D" }])
  );
  return (
    <View style={{ borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: C.border }}>
      <Calendar
        minDate={todayIso()}
        firstDay={1}
        onDayPress={onDayPress}
        markedDates={marked}
        theme={{
          calendarBackground: C.panel,
          dayTextColor: C.text,
          monthTextColor: C.text,
          textDisabledColor: "#405069",
          todayTextColor: C.gold,
          arrowColor: C.gold,
          selectedDayBackgroundColor: C.gold,
          selectedDayTextColor: "#07111D",
          textSectionTitleColor: C.muted,
        }}
      />
    </View>
  );
}

export function AvailabilityScreen({ selectedDates, setSelectedDates, dayAvailability, setDayAvailability, error, onPublish }) {
  return (
    <Shell>
      <ScreenScroll bottom={112}>
        <Title subtitle="Alege zilele, intervalul și tariful dorit.">Publică disponibilitatea</Title>

        <DarkCalendar
          selectedDates={selectedDates}
          onDayPress={(day) =>
            setSelectedDates((prev) =>
              prev.includes(day.dateString) ? prev.filter((x) => x !== day.dateString) : [...prev, day.dateString]
            )
          }
        />

        {selectedDates.length > 0 && (
          <View style={{ marginTop: 22 }}>
            <Text style={{ color: C.text, fontSize: 19, fontWeight: "900", marginBottom: 12 }}>Interval orar</Text>
            {[...selectedDates].sort().map((date) => {
              const info = dayAvailability[date] || {};
              return (
                <View key={date} style={{ backgroundColor: C.panel2, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 15, marginBottom: 13 }}>
                  <Text style={{ color: C.gold, fontSize: 16, fontWeight: "900", marginBottom: 12 }}>
                    {formatDateRo(date)}
                  </Text>

                  <Field
                    label="Tarif dorit (lei/oră)"
                    value={info.rate || ""}
                    onChangeText={(v) => setDayAvailability((p) => ({ ...p, [date]: { ...(p[date] || {}), rate: v } }))}
                    placeholder="Ex: 35"
                    keyboardType="numeric"
                  />

                  <View style={{ flexDirection: "row" }}>
                    <View style={{ flex: 1, marginRight: 6 }}>
                      <Text style={{ color: C.muted, fontSize: 12, marginBottom: 6 }}>De la</Text>
                      <TimePickerBox
                        value={info.start || ""}
                        onChange={(v) => setDayAvailability((p) => ({ ...p, [date]: { ...(p[date] || {}), start: v } }))}
                        placeholder="Început"
                        disabledTimes={TIME_SLOTS.filter((time) => !isPublishStartAllowed(date, time))}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 6 }}>
                      <Text style={{ color: C.muted, fontSize: 12, marginBottom: 6 }}>Până la</Text>
                      <TimePickerBox
                        value={info.end || ""}
                        onChange={(v) => setDayAvailability((p) => ({ ...p, [date]: { ...(p[date] || {}), end: v } }))}
                        placeholder="Final"
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <ErrorBox text={error} />
        <Button label="Publică disponibilitatea" icon="calendar-outline" onPress={onPublish} style={{ marginTop: 10 }} />
      </ScreenScroll>
    </Shell>
  );
}

export function PublishShiftScreen({ form, setForm, profile, error, busy, onPublish }) {
  useEffect(() => {
    setForm((p) => ({
      ...p,
      locationName: p.locationName || profile?.location_name || "",
      city: p.city || profile?.location_city || "",
      address: p.address || profile?.location_address || "",
    }));
  }, [profile?.id]);

  return (
    <Shell>
      <ScreenScroll bottom={112}>
        <Title subtitle="Completează datele turei. Ospătarii vor putea aplica direct din TuraX.">
          Publică o tură
        </Title>

        <Text style={{ color: C.gold, fontWeight: "900", marginBottom: 7 }}>Rol căutat</Text>
        <PickerBox
          value={form.role}
          onChange={(v) =>
            setForm((p) => ({
              ...p,
              role: v,
              customRole: v === "Altele" ? (p.customRole || "") : "",
            }))
          }
          placeholder="Alege rolul"
          items={SHIFT_ROLES}
        />

        {form.role === "Altele" && (
          <View style={{ marginTop: 12 }}>
            <Field
              label="Specifică rolul necesar *"
              icon="briefcase-outline"
              value={form.customRole || ""}
              onChangeText={(v) =>
                setForm((p) => ({ ...p, customRole: v }))
              }
              placeholder="Ex: Personal curățenie, Steward bucătărie / Spălător vase"
            />
            <Text
              style={{
                color: C.muted,
                fontSize: 12,
                lineHeight: 18,
                marginTop: -5,
                marginBottom: 4,
              }}
            >
              Folosește denumirea profesională a postului. Rolul introdus aici va apărea pe tura publicată.
            </Text>
          </View>
        )}

        <View style={{ height: 14 }} />
        <Field value={form.locationName} onChangeText={(v) => setForm((p) => ({ ...p, locationName: v }))} placeholder="Numele locației *" icon="business-outline" />
        <Field value={form.city} onChangeText={(v) => setForm((p) => ({ ...p, city: v }))} placeholder="Oraș *" icon="location-outline" />
        <Field value={form.address} onChangeText={(v) => setForm((p) => ({ ...p, address: v }))} placeholder="Adresă / Zonă" icon="map-outline" />

        <Text style={{ color: C.text, fontSize: 18, fontWeight: "900", marginTop: 8, marginBottom: 10 }}>Data</Text>
        <DarkCalendar
          selectedDates={form.date ? [form.date] : []}
          onDayPress={(day) => setForm((p) => ({ ...p, date: day.dateString }))}
          single
        />

        <Text style={{ color: C.text, fontSize: 18, fontWeight: "900", marginTop: 20, marginBottom: 10 }}>Interval orar</Text>
        <View style={{ flexDirection: "row", marginBottom: 14 }}>
          <View style={{ flex: 1, marginRight: 6 }}>
            <TimePickerBox value={form.start} onChange={(v) => setForm((p) => ({ ...p, start: v }))} placeholder="Început" disabledTimes={TIME_SLOTS.filter((time) => !isPublishStartAllowed(form.date, time))} />
          </View>
          <View style={{ flex: 1, marginLeft: 6 }}>
            <TimePickerBox value={form.end} onChange={(v) => setForm((p) => ({ ...p, end: v }))} placeholder="Final" />
          </View>
        </View>

        <Field value={form.workersNeeded} onChangeText={(v) => setForm((p) => ({ ...p, workersNeeded: v }))} placeholder="Număr persoane necesare *" keyboardType="numeric" icon="people-outline" />
        <Field value={form.hourlyRate} onChangeText={(v) => setForm((p) => ({ ...p, hourlyRate: v }))} placeholder="Tarif lei/oră *" keyboardType="numeric" icon="cash-outline" />
        <Field value={form.description} onChangeText={(v) => setForm((p) => ({ ...p, description: v }))} placeholder="Detalii suplimentare" multiline />

        <ErrorBox text={error} />
        <Button label={busy ? "Se publică..." : "Publică tura"} icon="paper-plane-outline" onPress={onPublish} disabled={busy} style={{ marginTop: 8 }} />
      </ScreenScroll>
    </Shell>
  );
}

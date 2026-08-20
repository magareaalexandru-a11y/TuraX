import React from "react";
import { View, Text } from "react-native";

import {
  C,
  WORKER_ROLES,
  WORK_TYPES,
  SKILLS,
} from "../../constants/appConstants";

import {
  Shell,
  ScreenScroll,
  BackButton,
  Title,
  ErrorBox,
  Field,
  Chip,
  Button,
} from "../../components/ui/BasicUI";
import { LocationPicker } from "../../components/location/LocationPicker";

export function WaiterProfileScreen({ form, setForm, error, onBack, onSave }) {
  const toggle = (key, item) =>
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(item)
        ? prev[key].filter((x) => x !== item)
        : [...prev[key], item],
    }));

  const toggleCustomRole = () =>
    setForm((prev) => ({
      ...prev,
      customRoleEnabled: !prev.customRoleEnabled,
      customWorkerRole: prev.customRoleEnabled ? "" : prev.customWorkerRole,
    }));

  return (
    <Shell>
      <ScreenScroll bottom={140}>
        <BackButton onPress={onBack} />

        <Title subtitle="Completează profilul profesional pentru a găsi ture potrivite rolurilor și experienței tale.">
          Profil profesionist HoReCa
        </Title>

        <ErrorBox text={error} />

        <Text style={{ color: C.gold, fontSize: 17, fontWeight: "900", marginBottom: 12 }}>
          Date personale
        </Text>

        <Field
          icon="person-outline"
          value={form.fullName}
          onChangeText={(v) => setForm((p) => ({ ...p, fullName: v }))}
          placeholder="Nume complet *"
        />

        <LocationPicker
          city={form.city}
          address={form.address}
          onChangeCity={(v) =>
            setForm((p) => ({ ...p, city: v }))
          }
          onChangeAddress={(v) =>
            setForm((p) => ({ ...p, address: v }))
          }
        />

        <Field
          icon="briefcase-outline"
          value={form.experience}
          onChangeText={(v) => setForm((p) => ({ ...p, experience: v }))}
          placeholder="Ani de experiență *"
          keyboardType="numeric"
        />

        <Text style={{ color: C.text, fontSize: 18, fontWeight: "900", marginTop: 13, marginBottom: 6 }}>
          În ce roluri poți lucra? *
        </Text>

        <Text style={{ color: C.muted, fontSize: 13, lineHeight: 19, marginBottom: 12 }}>
          Poți selecta mai multe roluri.
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 6 }}>
          {WORKER_ROLES.map((item) => (
            <Chip
              key={item}
              label={item}
              selected={form.workerRoles.includes(item)}
              onPress={() => toggle("workerRoles", item)}
            />
          ))}

          <Chip
            label="Alte roluri"
            selected={form.customRoleEnabled}
            onPress={toggleCustomRole}
          />
        </View>

        {form.customRoleEnabled && (
          <View style={{ marginBottom: 12 }}>
            <Field
              label="Specifică rolul *"
              icon="briefcase-outline"
              value={form.customWorkerRole}
              onChangeText={(v) =>
                setForm((p) => ({ ...p, customWorkerRole: v }))
              }
              placeholder="Ex: Personal curățenie, Steward / Spălător vase"
            />

            <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginTop: -5 }}>
              Rolul introdus aici va fi folosit pentru potrivirea cu turele publicate.
            </Text>
          </View>
        )}

        <Text style={{ color: C.text, fontSize: 18, fontWeight: "900", marginTop: 13, marginBottom: 12 }}>
          Experiență în *
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 15 }}>
          {WORK_TYPES.map((item) => (
            <Chip
              key={item}
              label={item}
              selected={form.workTypes.includes(item)}
              onPress={() => toggle("workTypes", item)}
            />
          ))}
        </View>

        <Text style={{ color: C.text, fontSize: 18, fontWeight: "900", marginBottom: 12 }}>
          Competențe HoReCa *
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 15 }}>
          {SKILLS.map((item) => (
            <Chip
              key={item}
              label={item}
              selected={form.horecaSkills.includes(item)}
              onPress={() => toggle("horecaSkills", item)}
            />
          ))}
        </View>

        <Text style={{ color: C.text, fontSize: 18, fontWeight: "900", marginBottom: 12 }}>
          Despre tine
        </Text>

        <Field
          value={form.description}
          onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
          placeholder="Descriere scurtă despre tine"
          multiline
        />

        <Button
          label="Salvează profilul"
          icon="checkmark-circle-outline"
          onPress={onSave}
          style={{ marginTop: 8 }}
        />
      </ScreenScroll>
    </Shell>
  );
}

export function ManagerProfileScreen({ form, setForm, error, onBack, onSave }) {
  return (
    <Shell>
      <ScreenScroll bottom={140}>
        <BackButton onPress={onBack} />
        <Title subtitle="Datele locației apar în turele publicate și ajută profesioniștii HoReCa să știe unde aplică.">Profil locație</Title>
        <ErrorBox text={error} />
        <Field label="Nume locație *" icon="business-outline" value={form.locationName} onChangeText={(v) => setForm((p) => ({ ...p, locationName: v }))} placeholder="Ex: Restaurant X" />
        <Field label="Tip locație *" icon="restaurant-outline" value={form.locationType} onChangeText={(v) => setForm((p) => ({ ...p, locationType: v }))} placeholder="Ex: Fine dining" />
        <Field label="Oraș *" icon="location-outline" value={form.locationCity} onChangeText={(v) => setForm((p) => ({ ...p, locationCity: v }))} placeholder="Oraș" />
        <Field label="Adresă / Zonă *" icon="map-outline" value={form.locationAddress} onChangeText={(v) => setForm((p) => ({ ...p, locationAddress: v }))} placeholder="Stradă, număr sau zonă" />
        <Field label="Persoană de contact *" icon="person-outline" value={form.contactName} onChangeText={(v) => setForm((p) => ({ ...p, contactName: v }))} placeholder="Nume contact" />
        <Field label="Telefon *" icon="call-outline" value={form.contactPhone} onChangeText={(v) => setForm((p) => ({ ...p, contactPhone: v }))} placeholder="07..." keyboardType="phone-pad" />
        <Button label="Salvează profilul" icon="checkmark-circle-outline" onPress={onSave} style={{ marginTop: 8 }} />
      </ScreenScroll>
    </Shell>
  );
}

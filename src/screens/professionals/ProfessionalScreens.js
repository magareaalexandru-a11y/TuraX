import React, { useState } from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { C } from "../../constants/appConstants";
import { formatDateRo } from "../../utils/appUtils";

import {
  Shell,
  ScreenScroll,
  BackButton,
  Title,
  Field,
  ErrorBox,
  Button,
} from "../../components/ui/BasicUI";

import {
  AvatarCircle,
  EmptyCard,
} from "../../components/ui/FeedbackUI";

export function WaiterDirectoryScreen({ rows, loading, error, onBack, onMessage, onOpenProfile }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = !q ? rows : rows.filter((r) =>
    [r.waiter_name, r.city, ...(r.work_types || []), ...(r.worker_roles || []), ...(r.horeca_skills || [])]
      .filter(Boolean).join(" ").toLowerCase().includes(q)
  );
  return (
    <Shell>
      <ScreenScroll bottom={45}>
        <BackButton onPress={onBack} />
        <Title subtitle="Catalogul profesioniștilor TuraX. Disponibilitatea publicată apare separat.">Vezi oameni</Title>
        <Field icon="search-outline" value={query} onChangeText={setQuery} placeholder="Caută după nume, oraș sau competență" />
        <ErrorBox text={error} />
        {loading ? (
          <ActivityIndicator color={C.gold} />
        ) : filtered.length === 0 ? (
          <EmptyCard icon="people-outline" title="Niciun profil găsit" text="Încearcă altă căutare." />
        ) : (
          filtered.map((r) => (
            <View key={r.waiter_id} style={{ backgroundColor: C.panel2, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 13 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <AvatarCircle uri={r.waiter_avatar_url} role="waiter" size={54} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: C.text, fontSize: 18, fontWeight: "900" }}>{r.waiter_name || "Ospătar"}</Text>
                  <Text style={{ color: C.muted, marginTop: 4 }}>{r.city || "Oraș nespecificat"} · {Number(r.experience || 0)} ani experiență</Text>
                  <Text style={{ color: C.gold, marginTop: 4, fontWeight: "800" }}>{r.rating ? `★ ${Number(r.rating).toFixed(1)} (${r.review_count || 0})` : "Fără rating încă"}</Text>
                </View>
              </View>
              {!!r.description && <Text style={{ color: C.muted, lineHeight: 20, marginTop: 12 }}>{r.description}</Text>}
              {(r.horeca_skills || []).length > 0 && <Text style={{ color: C.text, marginTop: 10, lineHeight: 20 }}>{r.horeca_skills.slice(0, 4).join(" · ")}</Text>}
              {r.next_available_date ? (
                <View style={{ marginTop: 12, borderRadius: 13, backgroundColor: C.panel3, padding: 11 }}>
                  <Text style={{ color: C.success, fontWeight: "900" }}>Disponibil {formatDateRo(r.next_available_date)} · {String(r.next_start_time || "").slice(0,5)}–{String(r.next_end_time || "").slice(0,5)}{r.desired_rate ? ` · ${money(r.desired_rate)}/oră` : ""}</Text>
                </View>
              ) : (
                <Text style={{ color: C.muted2, marginTop: 12 }}>Fără disponibilitate publicată momentan</Text>
              )}
              <View style={{ flexDirection: "row", marginTop: 12 }}>
                <Button
                  label="Vezi profilul"
                  icon="person-circle-outline"
                  secondary
                  onPress={() => onOpenProfile(r)}
                  style={{ flex: 1, marginRight: 7 }}
                />
                <Button
                  label="Mesaj"
                  icon="chatbubble-outline"
                  secondary
                  onPress={() => onMessage(r)}
                  style={{ flex: 1, marginLeft: 7 }}
                />
              </View>
            </View>
          ))
        )}
      </ScreenScroll>
    </Shell>
  );
}


export function WorkerPublicProfileScreen({
  worker,
  loading,
  error,
  onBack,
  onMessage,
}) {
  if (loading && !worker) {
    return (
      <Shell>
        <ScreenScroll bottom={45}>
          <BackButton onPress={onBack} />
          <ActivityIndicator color={C.gold} />
        </ScreenScroll>
      </Shell>
    );
  }

  if (!worker) {
    return (
      <Shell>
        <ScreenScroll bottom={45}>
          <BackButton onPress={onBack} />
          <ErrorBox text={error || "Profilul nu este disponibil."} />
        </ScreenScroll>
      </Shell>
    );
  }

  const roles = Array.isArray(worker.worker_roles)
    ? worker.worker_roles
    : [];

  const workTypes = Array.isArray(worker.work_types)
    ? worker.work_types
    : [];

  const skills = Array.isArray(worker.horeca_skills)
    ? worker.horeca_skills
    : [];

  const availability = Array.isArray(worker.availability)
    ? worker.availability
    : [];

  return (
    <Shell>
      <ScreenScroll bottom={50}>
        <BackButton onPress={onBack} />

        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <AvatarCircle
            uri={worker.avatar_url || worker.waiter_avatar_url}
            role="waiter"
            size={92}
          />

          <Text
            style={{
              color: C.text,
              fontSize: 28,
              fontWeight: "900",
              marginTop: 14,
              textAlign: "center",
            }}
          >
            {worker.full_name || worker.waiter_name || "Profesionist HoReCa"}
          </Text>

          <Text
            style={{
              color: C.gold,
              fontWeight: "800",
              marginTop: 5,
              fontSize: 16,
            }}
          >
            Profesionist HoReCa
          </Text>

          {roles.length > 0 && (
            <Text
              style={{
                color: C.muted,
                textAlign: "center",
                lineHeight: 21,
                marginTop: 8,
              }}
            >
              {roles.join(" · ")}
            </Text>
          )}
        </View>

        <View
          style={{
            backgroundColor: C.panel2,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: C.border,
            padding: 18,
            marginBottom: 14,
          }}
        >
          <Text style={{ color: C.gold, fontWeight: "900", fontSize: 17 }}>
            Experiență profesională
          </Text>

          <Text style={{ color: C.text, marginTop: 12, fontSize: 16 }}>
            {Number(worker.experience || 0)} ani experiență
          </Text>

          <Text style={{ color: C.muted, marginTop: 7 }}>
            {worker.city || "Oraș nespecificat"}
          </Text>

          {worker.rating ? (
            <Text style={{ color: C.gold, marginTop: 9, fontWeight: "800" }}>
              ★ {Number(worker.rating).toFixed(1)} · {worker.review_count || 0} recenzii
            </Text>
          ) : (
            <Text style={{ color: C.muted, marginTop: 9 }}>
              Fără rating încă
            </Text>
          )}
        </View>

        {workTypes.length > 0 && (
          <View
            style={{
              backgroundColor: C.panel2,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: C.border,
              padding: 18,
              marginBottom: 14,
            }}
          >
            <Text style={{ color: C.gold, fontWeight: "900", fontSize: 17 }}>
              Experiență în
            </Text>
            <Text style={{ color: C.text, lineHeight: 22, marginTop: 10 }}>
              {workTypes.join(" · ")}
            </Text>
          </View>
        )}

        {skills.length > 0 && (
          <View
            style={{
              backgroundColor: C.panel2,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: C.border,
              padding: 18,
              marginBottom: 14,
            }}
          >
            <Text style={{ color: C.gold, fontWeight: "900", fontSize: 17 }}>
              Competențe HoReCa
            </Text>
            <Text style={{ color: C.text, lineHeight: 22, marginTop: 10 }}>
              {skills.join(" · ")}
            </Text>
          </View>
        )}

        {!!worker.description && (
          <View
            style={{
              backgroundColor: C.panel2,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: C.border,
              padding: 18,
              marginBottom: 14,
            }}
          >
            <Text style={{ color: C.gold, fontWeight: "900", fontSize: 17 }}>
              Despre
            </Text>
            <Text style={{ color: C.muted, lineHeight: 21, marginTop: 10 }}>
              {worker.description}
            </Text>
          </View>
        )}

        <View
          style={{
            backgroundColor: C.panel2,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: C.border,
            padding: 18,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: C.gold, fontWeight: "900", fontSize: 17 }}>
            Disponibilitate
          </Text>

          {availability.length === 0 ? (
            <Text style={{ color: C.muted, marginTop: 10 }}>
              Nu are disponibilități publicate momentan.
            </Text>
          ) : (
            availability.map((a) => (
              <View
                key={a.id || `${a.available_date}-${a.start_time}`}
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: C.border,
                }}
              >
                <Text style={{ color: C.text, fontWeight: "800" }}>
                  {formatDateRo(a.available_date)}
                </Text>
                <Text style={{ color: C.muted, marginTop: 4 }}>
                  {String(a.start_time || "").slice(0, 5)}
                  {" – "}
                  {String(a.end_time || "").slice(0, 5)}
                  {a.desired_rate
                    ? ` · ${money(a.desired_rate)}/oră`
                    : ""}
                </Text>
              </View>
            ))
          )}
        </View>

        <ErrorBox text={error} />

        <Button
          label="Trimite mesaj"
          icon="chatbubble-outline"
          onPress={() => onMessage(worker)}
        />
      </ScreenScroll>
    </Shell>
  );
}

export function AvailableWaitersScreen({ rows, onBack, onMessage }) {
  return (
    <Shell>
      <ScreenScroll bottom={40}>
        <BackButton onPress={onBack} />
        <Title subtitle="Disponibilități publicate de profesioniști HoReCa.">Oameni disponibili</Title>
        {rows.length === 0 ? (
          <EmptyCard icon="people-outline" title="Nicio disponibilitate publicată" text="Revino mai târziu." />
        ) : (
          rows.map((r) => (
            <View key={r.id} style={{ backgroundColor: C.panel2, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <AvatarCircle uri={r.waiter_avatar_url} role="waiter" size={46} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: C.text, fontSize: 17, fontWeight: "900" }}>{r.waiter_name || "Ospătar"}</Text>
                  <Text style={{ color: C.muted, marginTop: 4 }}>{r.city || "Oraș nespecificat"} · {formatDateRo(r.available_date)}</Text>
                </View>
              </View>
              <Text style={{ color: C.gold, marginTop: 10, fontWeight: "800" }}>{String(r.start_time || "").slice(0, 5)} – {String(r.end_time || "").slice(0, 5)} · {money(r.desired_rate)}/oră</Text>
              <TouchableOpacity onPress={() => onMessage(r)} style={{ flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginTop: 12 }}>
                <Ionicons name="chatbubble-outline" size={18} color={C.gold} />
                <Text style={{ color: C.gold, fontWeight: "800", marginLeft: 7 }}>Trimite mesaj</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScreenScroll>
    </Shell>
  );
}

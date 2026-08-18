import React from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "../../components/ui/TuraXIcon";

import { C } from "../../constants/appConstants";

import {
  Shell,
  ScreenScroll,
  Button,
} from "../../components/ui/BasicUI";

import {
  AvatarCircle,
} from "../../components/ui/FeedbackUI";

export default function ProfileScreen({ role, profile, shifts, acceptedShifts, onEdit, onNotifications, onSignOut, onDeleteAccount, deleteAccountBusy, onChangePhoto, photoBusy, onOpenShifts }) {
  const manager = role === "manager";
  const name = manager ? profile?.location_name || "Locație" : profile?.full_name || "Ospătar";
  return (
    <Shell>
      <ScreenScroll bottom={110}>
        <View style={{ alignItems: "center", marginTop: 12 }}>
          <TouchableOpacity onPress={onChangePhoto} disabled={photoBusy} activeOpacity={0.82} style={{ position: "relative" }}>
            <AvatarCircle uri={profile?.avatar_url} role={role} size={108} />
            <View style={{ position: "absolute", right: -2, bottom: -2, width: 34, height: 34, borderRadius: 17, backgroundColor: C.gold, borderWidth: 3, borderColor: C.bg, alignItems: "center", justifyContent: "center" }}>
              {photoBusy ? <ActivityIndicator size="small" color="#07111D" /> : <Ionicons name="camera-outline" size={18} color="#07111D" />}
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={onChangePhoto} disabled={photoBusy} style={{ paddingVertical: 8 }}>
            <Text style={{ color: C.gold, fontSize: 12, fontWeight: "800" }}>{profile?.avatar_url ? "Schimbă fotografia" : manager ? "Adaugă logo / fotografie" : "Adaugă fotografie"}</Text>
          </TouchableOpacity>
          <Text style={{ color: C.text, fontSize: 27, fontWeight: "900", marginTop: 5 }}>{name}</Text>
          <Text style={{ color: C.gold, fontWeight: "800", marginTop: 5 }}>
              {manager ? "Restaurant / angajator" : "Profesionist HoReCa"}
            </Text>

            {!manager &&
              Array.isArray(profile?.worker_roles) &&
              profile.worker_roles.length > 0 && (
                <Text
                  style={{
                    color: C.muted,
                    fontSize: 14,
                    fontWeight: "700",
                    marginTop: 7,
                    textAlign: "center",
                    lineHeight: 20,
                  }}
                >
                  {profile.worker_roles.join(" · ")}
                </Text>
              )}
        </View>

        <View style={{ flexDirection: "row", marginTop: 24 }}>
          <TouchableOpacity onPress={onOpenShifts} activeOpacity={0.82} style={{ flex: 1, backgroundColor: C.panel2, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 15, marginRight: 7, alignItems: "center" }}>
            <Text style={{ color: C.gold, fontSize: 24, fontWeight: "900" }}>{manager ? shifts.length : acceptedShifts.length}</Text>
            <Text style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{manager ? "Ture publicate" : "Ture confirmate"}</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, backgroundColor: C.panel2, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 15, marginLeft: 7, alignItems: "center" }}>
            <Text style={{ color: C.gold, fontSize: 24, fontWeight: "900" }}>{profile?.rating ? Number(profile.rating).toFixed(1) : "—"}</Text>
            <Text style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>Rating</Text>
          </View>
        </View>

        <Button label="Editează profilul" secondary icon="create-outline" onPress={onEdit} style={{ marginTop: 20 }} />
        <Button label="Notificări" secondary icon="notifications-outline" onPress={onNotifications} style={{ marginTop: 12 }} />
        <Button label="Deconectare" danger icon="log-out-outline" onPress={onSignOut} style={{ marginTop: 24 }} />

      <Button
        label={deleteAccountBusy ? "Se șterge..." : "Șterge contul"}
        danger
        icon="trash-outline"
        onPress={onDeleteAccount}
        disabled={deleteAccountBusy}
        style={{
          marginTop: 12,
          opacity: deleteAccountBusy ? 0.6 : 1,
        }}
      />
      </ScreenScroll>
    </Shell>
  );
}

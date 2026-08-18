import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "../../components/ui/TuraXIcon";

import { C } from "../../constants/appConstants";
import {
  Shell,
  ScreenScroll,
  BackButton,
  ErrorBox,
} from "../../components/ui/BasicUI";
import { ClocheLogo } from "../../components/navigation/AppNavigation";

export function RoleScreen({ onBack, onChoose, error }) {
  return (
    <Shell>
      <ScreenScroll bottom={36}>
        <BackButton onPress={onBack} />

        <View style={{ alignItems: "center" }}>
          <ClocheLogo size={220} />
          <Text style={{ color: C.text, fontSize: 36, fontWeight: "900", textAlign: "center", marginTop: 10 }}>
            Bun venit! 👋
          </Text>
          <Text style={{ color: C.muted, fontSize: 18, textAlign: "center", marginTop: 9 }}>
            Alege <Text style={{ color: C.gold, fontWeight: "800" }}>tipul de cont</Text> potrivit pentru tine
          </Text>
        </View>

        <View style={{ marginTop: 28 }}>
          <ErrorBox text={error} />
          <TouchableOpacity
            onPress={() => onChoose("waiter")}
            style={{
              minHeight: 110,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: C.border,
              backgroundColor: C.panel2,
              padding: 18,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View style={{ width: 58, height: 58, borderRadius: 17, backgroundColor: C.panel3, alignItems: "center", justifyContent: "center", marginRight: 15 }}>
              <Ionicons name="person-outline" size={30} color={C.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontSize: 20, fontWeight: "900" }}>Lucrez în HoReCa</Text>
              <Text style={{ color: C.muted, marginTop: 5, lineHeight: 19 }}>
                Găsesc ture potrivite rolurilor mele
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={26} color={C.gold} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onChoose("manager")}
            style={{
              minHeight: 110,
              borderRadius: 22,
              backgroundColor: C.gold,
              padding: 18,
              flexDirection: "row",
              alignItems: "center",
              marginTop: 14,
            }}
          >
            <View style={{ width: 58, height: 58, borderRadius: 17, backgroundColor: C.bg, alignItems: "center", justifyContent: "center", marginRight: 15 }}>
              <Ionicons name="business-outline" size={29} color={C.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#07111D", fontSize: 19, fontWeight: "900" }}>
                Restaurant / Angajator
              </Text>
              <Text style={{ color: "#42382A", marginTop: 5, lineHeight: 19 }}>
                Public ture și găsesc oameni disponibili
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={26} color="#07111D" />
          </TouchableOpacity>
        </View>
      </ScreenScroll>
    </Shell>
  );
}

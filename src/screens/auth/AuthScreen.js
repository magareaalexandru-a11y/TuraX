import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "../../components/ui/TuraXIcon";

import { C } from "../../constants/appConstants";
import {
  Shell,
  ScreenScroll,
  Title,
  BackButton,
  Field,
  Button,
  Chip,
  ErrorBox,
} from "../../components/ui/BasicUI";
import {
  TuraXNotice,
  TuraXConfirm,
  RatingStars,
  AvatarCircle,
  EmptyCard,
} from "../../components/ui/FeedbackUI";
import {
  ClocheLogo,
} from "../../components/navigation/AppNavigation";

export default function AuthScreen({
  authMode,
  setAuthMode,
  email,
  setEmail,
  password,
  setPassword,
  name,
  setName,
  showPassword,
  setShowPassword,
  rememberMe,
  setRememberMe,
  message,
  busy,
  onLogin,
  onSignup,
  onResetPassword,
}) {
  const login = authMode === "login";
  return (
    <Shell>
      <ScreenScroll bottom={40}>
        <View style={{ alignItems: "center", marginTop: 6 }}>
          <Image
            source={require("../../../assets/turax-logo.png")}
            style={{ width: 288, height: 230 }}
            resizeMode="contain"
          />
        </View>

        <View style={{ marginTop: 30 }}>
          <Text style={{ color: C.text, fontSize: 28, fontWeight: "900", textAlign: "center" }}>
            {login ? "Autentificare" : "Creează cont"}
          </Text>

          {!login && (
            <Field label="Nume" icon="person-outline" value={name} onChangeText={setName} placeholder="Numele tău" />
          )}

          <View style={{ marginTop: 20 }}>
            <Field label="Email" icon="mail-outline" value={email} onChangeText={setEmail} placeholder="email@exemplu.ro" keyboardType="email-address" autoCapitalize="none" />
            <Field
              label="Parolă"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              placeholder="Parolă"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              right={
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={24} color={C.gold} />
                </TouchableOpacity>
              }
            />
          </View>

          {login && (
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
              <TouchableOpacity onPress={() => setRememberMe((v) => !v)} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 6 }}>
                <View style={{ width: 21, height: 21, borderRadius: 6, borderWidth: 1, borderColor: rememberMe ? C.gold : C.border, backgroundColor: rememberMe ? C.gold : C.panel, alignItems: "center", justifyContent: "center", marginRight: 8 }}>
                  {rememberMe && <Ionicons name="checkmark" size={15} color="#07111D" />}
                </View>
                <Text style={{ color: C.muted }}>Ține-mă minte</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onResetPassword}><Text style={{ color: C.gold }}>Ai uitat parola?</Text></TouchableOpacity>
            </View>
          )}

          <ErrorBox text={message} />
          <Button label={busy ? "Se procesează..." : login ? "Autentificare" : "Creează cont"} onPress={login ? onLogin : onSignup} disabled={busy} icon={login ? "log-in-outline" : "person-add-outline"} />

          <TouchableOpacity onPress={() => setAuthMode(login ? "signup" : "login")} style={{ paddingVertical: 20, alignItems: "center" }}>
            <Text style={{ color: C.muted }}>
              {login ? "Nu ai cont? " : "Ai deja cont? "}
              <Text style={{ color: C.gold, fontWeight: "800" }}>{login ? "Creează unul" : "Autentifică-te"}</Text>
            </Text>
          </TouchableOpacity>
          <Text style={{ color: C.muted2, fontSize: 12, textAlign: "center", marginTop: 8 }}>🔐 Nu stocăm parola în aplicație.</Text>
        </View>
      </ScreenScroll>
    </Shell>
  );
}

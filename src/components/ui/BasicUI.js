import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  Text,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Ionicons } from "./TuraXIcon";
import { C } from "../../constants/appConstants";

export function Shell({ children }) {
  const androidTop = Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, paddingTop: androidTop }}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} translucent={false} />
      {children}
    </SafeAreaView>
  );
}

export function ScreenScroll({ children, refreshControl, bottom = 120 }) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        refreshControl={refreshControl}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: bottom + (keyboardVisible ? 280 : 0),
        }}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function Title({ children, subtitle }) {
  return (
    <View style={{ marginBottom: 22 }}>
      <Text style={{ color: C.text, fontSize: 30, fontWeight: "900" }}>{children}</Text>
      {!!subtitle && (
        <Text style={{ color: C.muted, fontSize: 14, lineHeight: 20, marginTop: 5 }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

export function BackButton({ onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        width: 48,
        height: 48,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: C.panel,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
      }}
    >
      <Ionicons name="arrow-back" size={25} color={C.gold} />
    </TouchableOpacity>
  );
}

export function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  multiline,
  right,
  autoCapitalize = "sentences",
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      {!!label && (
        <Text style={{ color: C.gold, fontWeight: "700", fontSize: 13, marginBottom: 7 }}>
          {label}
        </Text>
      )}
      <View
        style={{
          minHeight: multiline ? 122 : 58,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: C.border,
          backgroundColor: C.panel,
          flexDirection: "row",
          alignItems: multiline ? "flex-start" : "center",
          paddingHorizontal: 15,
        }}
      >
        {!!icon && (
          <Ionicons
            name={icon}
            size={21}
            color={C.gold}
            style={{ marginRight: 11, marginTop: multiline ? 17 : 0 }}
          />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.muted2}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          autoCapitalize={autoCapitalize}
          style={{
            flex: 1,
            color: C.text,
            fontSize: 16,
            minHeight: multiline ? 116 : 56,
            paddingTop: multiline ? 15 : 0,
          }}
        />
        {right}
      </View>
    </View>
  );
}

export function Button({ label, onPress, icon, secondary, danger, disabled, style }) {
  const bg = danger ? "transparent" : secondary ? C.panel : C.gold;
  const fg = danger ? C.danger : secondary ? C.text : "#07111D";
  const border = danger ? C.danger : secondary ? C.border : C.gold;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.86}
      style={[
        {
          minHeight: 58,
          borderRadius: 17,
          borderWidth: 1,
          borderColor: border,
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          paddingHorizontal: 12,
          minWidth: 0,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {!!icon && <Ionicons name={icon} size={21} color={fg} style={{ marginRight: 8, flexShrink: 0 }} />}
      <Text
        numberOfLines={2}
        style={{ color: fg, fontSize: 16, fontWeight: "900", flexShrink: 1, textAlign: "center" }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function Chip({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: selected ? C.gold : C.border,
        backgroundColor: selected ? C.gold : C.panel,
        marginRight: 8,
        marginBottom: 9,
      }}
    >
      <Text style={{ color: selected ? "#07111D" : C.text, fontWeight: "700", fontSize: 14 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function ErrorBox({ text }) {
  if (!text) return null;
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: "#6D3434",
        backgroundColor: "#241416",
        borderRadius: 14,
        padding: 12,
        marginBottom: 14,
      }}
    >
      <Text style={{ color: "#FFB8B8", lineHeight: 19 }}>{text}</Text>
    </View>
  );
}

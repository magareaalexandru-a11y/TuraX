// TURAX_START_FROM_0700
// TURAX_HOTFIX_PUBLIC_PROFILE_3_1_3_1
// TURAX_UPGRADE_3_1_3
// TURAX_HOTFIX_CUSTOM_ROLE_3_1_2_2
// TURAX_UPGRADE_3_1_2
// Upgrade 3.1.2: UX publicare, navigare si catalog profesionisti

import {
  decode } from "base64-arraybuffer";
import { Picker } from "@react-native-picker/picker";
import "react-native-url-polyfill/auto";
import { Calendar } from "react-native-calendars";
import React,
  { useEffect,
  useMemo,
  useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  } from "react-native";

import { C,
  WORK_TYPES,
  SKILLS,
  SHIFT_ROLES,
  WORKER_ROLES,
  TIME_SLOTS } from "./src/constants/appConstants";

import {
  localIsoDate,
  todayIso,
  MIN_PUBLISH_LEAD_MS,
  isPublishStartAllowed,
  formatHorecaText,
  addDaysIso,
  shiftStartDate,
  canCancelConfirmedShift,
  shiftEndDate,
  hasShiftEnded,
  isEmail,
  cleanPhone,
  sameDay,
  messageDayLabel,
  messageTime,
  conversationTime,
  formatDateRo,
  money,
  shiftStatusLabel,
  applicationStatusLabel,
} from "./src/utils/appUtils";

import {
  Shell,
  ScreenScroll,
  Title,
  BackButton,
  Field,
  Button,
  Chip,
  ErrorBox,
} from "./src/components/ui/BasicUI";

import {
  TuraXNotice,
  TuraXConfirm,
  RatingStars,
  AvatarCircle,
  EmptyCard,
} from "./src/components/ui/FeedbackUI";

import {
  BottomNav,
  ClocheLogo,
} from "./src/components/navigation/AppNavigation";

import { RoleScreen } from "./src/screens/onboarding/RoleScreen";






import ShiftCard from "./src/components/shifts/ShiftCard";



import AuthScreen from "./src/screens/auth/AuthScreen";












import { useAuthActions } from "./src/hooks/useAuthActions";
import { useCoreRealtimeSync } from "./src/hooks/useCoreRealtimeSync";
import { useAppBootstrap } from "./src/hooks/useAppBootstrap";
import { useCoreDataActions } from "./src/hooks/useCoreDataActions";
import { useChatRealtime } from "./src/hooks/useChatRealtime";
import { useMessagingActions } from "./src/hooks/useMessagingActions";
import { profileToForms } from "./src/utils/profileFormUtils";
import { buildWaiterProfileSave, buildManagerProfileSave } from "./src/utils/profileSaveUtils";
import { filterShifts } from "./src/utils/shiftFilterUtils";
import { useShiftActions } from "./src/hooks/useShiftActions";
import { useApplicationActions } from "./src/hooks/useApplicationActions";
import { useProfileActions } from "./src/hooks/useProfileActions";
import { useProfileFlowActions } from "./src/hooks/useProfileFlowActions";

import AppRouter from "./src/navigation/AppRouter";
import { useAppState } from "./src/hooks/useAppState";
import { supabase } from "./src/lib/supabase";


export default function App() {
  const {
    booting, setBooting, session, setSession, profile, setProfile, role, setRole, screen,
    setScreen, profileBackTarget, setProfileBackTarget, dbError, setDbError, authMode, setAuthMode,
    authEmail, setAuthEmail, authPassword, setAuthPassword, authName, setAuthName,
    showAuthPassword, setShowAuthPassword, rememberMe, setRememberMe, authBusy, setAuthBusy,
    authMessage, setAuthMessage, waiterForm, setWaiterForm, managerForm, setManagerForm, formError,
    setFormError, shifts, setShifts, availabilities, setAvailabilities, favorites, setFavorites,
    notifications, setNotifications, conversations, setConversations, acceptedShifts,
    setAcceptedShifts, myAvailabilities, setMyAvailabilities, myApplications, setMyApplications,
    dataLoading, setDataLoading, refreshing, setRefreshing, shiftQuery, setShiftQuery, shiftFilter,
    setShiftFilter, selectedShift, setSelectedShift, applications, setApplications, selectedDates,
    setSelectedDates, dayAvailability, setDayAvailability, availabilityError, setAvailabilityError,
    shiftForm, setShiftForm, publishError, setPublishError, chatConversation, setChatConversation,
    chatMessages, setChatMessages, chatText, setChatText, notice, setNotice, confirmDialog,
    setConfirmDialog, photoBusy, setPhotoBusy, deleteAccountBusy, setDeleteAccountBusy,
    publishBusy, setPublishBusy, applyBusy, setApplyBusy, waiterDirectory, setWaiterDirectory,
    waiterDirectoryLoading, setWaiterDirectoryLoading, waiterDirectoryError,
    setWaiterDirectoryError, selectedWorkerProfile, setSelectedWorkerProfile, workerProfileLoading,
    setWorkerProfileLoading, workerProfileError, setWorkerProfileError, shiftBackTarget,
    setShiftBackTarget,
  } = useAppState();
  const showNotice = (message, type = "success") => {
    const id = Date.now();
    setNotice({ id, text: message, type });
    setTimeout(() => {
      setNotice((current) => (current?.id === id ? null : current));
    }, 3200);
  };

  const askConfirm = ({ title, message, confirmLabel = "Confirmă", cancelLabel = "Renunță", danger = false, onConfirm }) => {
    setConfirmDialog({ title, message, confirmLabel, cancelLabel, danger, onConfirm });
  };

  const executeConfirm = async () => {
    const action = confirmDialog?.onConfirm;
    setConfirmDialog(null);
    if (action) await action();
  };

  const currentUserId = session?.user?.id || null;
  const isManager = role === "manager";

  const profileComplete = useMemo(() => {
    if (!profile || !role) return false;
    if (role === "waiter") {
      return !!(
        profile.full_name &&
        profile.city &&
        profile.experience !== null &&
        profile.experience !== undefined &&
        Number(profile.experience) >= 0 &&
        Array.isArray(profile.worker_roles) &&
        profile.worker_roles.length > 0 &&
        Array.isArray(profile.work_types) &&
        profile.work_types.length > 0 &&
        Array.isArray(profile.horeca_skills) &&
        profile.horeca_skills.length > 0
      );
    }
    return !!(
      profile.location_name &&
      profile.location_city &&
      profile.contact_name &&
      profile.contact_phone
    );
  }, [profile, role]);

  const waiterFormDirty = useMemo(() => {
    if (!profile || role !== "waiter") return false;

    const storedRoles = Array.isArray(profile.worker_roles)
      ? profile.worker_roles
      : [];

    const customRole =
      storedRoles.find((x) => !WORKER_ROLES.includes(x)) || "";

    const current = {
      fullName: profile.full_name || "",
      city: profile.city || "",
      experience:
        profile.experience !== null && profile.experience !== undefined
          ? String(profile.experience)
          : "",
      description: profile.description || "",
      workerRoles: storedRoles.filter((x) => WORKER_ROLES.includes(x)),
      customRoleEnabled: Boolean(customRole),
      customWorkerRole: customRole,
      workTypes: Array.isArray(profile.work_types) ? profile.work_types : [],
      horecaSkills: Array.isArray(profile.horeca_skills)
        ? profile.horeca_skills
        : [],
    };

    return JSON.stringify(waiterForm) !== JSON.stringify(current);
  }, [waiterForm, profile, role]);

  const managerFormDirty = useMemo(() => {
    if (!profile || role !== "manager") return false;
    const current = {
      locationName: profile.location_name || "",
      locationType: profile.location_type || "",
      locationCity: profile.location_city || "",
      locationAddress: profile.location_address || "",
      contactName: profile.contact_name || "",
      contactPhone: profile.contact_phone || "",
    };
    return JSON.stringify(managerForm) !== JSON.stringify(current);
  }, [managerForm, profile, role]);



  const {
    applyProfileToForms,
    loadProfile,
    chooseRole,
    saveWaiterProfile,
    saveManagerProfile,
  } = useProfileActions({
    supabase,
    currentUserId,
    session,
    waiterForm,
    managerForm,
    setWaiterForm,
    setManagerForm,
    setDbError,
    setProfile,
    setRole,
    setProfileBackTarget,
    setScreen,
    setFormError,
    showNotice,
  });

  useAppBootstrap({
    loadProfile,
    setAuthEmail,
    setRememberMe,
    setSession,
    setRole,
    setProfile,
    setScreen,
    setBooting,
    setDbError,
  });

  useEffect(() => {
    if (!currentUserId || !role || !profileComplete) return;
    refreshCoreData();
  }, [currentUserId, role, profileComplete]);

  useCoreRealtimeSync({
    supabase,
    currentUserId,
    role,
    profileComplete,
    refreshCoreData: (...args) => refreshCoreData(...args),
  });

  useEffect(() => {
    setShiftFilter("Toate");
  }, [role]);

  useChatRealtime({
    supabase,
    chatConversation,
    setChatMessages,
  });

  const {
    handleLogin,
    handleSignup,
    resetPassword,
    handleSignOut,
  } = useAuthActions({
    supabase,
    AsyncStorage,
    isEmail,
    authEmail,
    authPassword,
    authName,
    rememberMe,
    setAuthBusy,
    setAuthMessage,
    setAuthMode,
    setSession,
    setProfile,
    setRole,
    setScreen,
    setAuthPassword,
  });

  const handleDeleteAccount = () => {
    if (deleteAccountBusy) return;

    Alert.alert(
      "Șterge contul?",
      "Contul și datele asociate vor fi șterse definitiv.",
      [
        {
          text: "Renunță",
          style: "cancel",
        },
        {
          text: "Continuă",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Ștergere definitivă",
              "Această acțiune nu poate fi anulată. Ești sigur că vrei să ștergi definitiv contul?",
              [
                {
                  text: "Renunță",
                  style: "cancel",
                },
                {
                  text: "Șterge definitiv",
                  style: "destructive",
                  onPress: async () => {
                    if (deleteAccountBusy) return;

                    setDeleteAccountBusy(true);

                    try {
                      const { data, error } = await supabase.functions.invoke(
                        "delete-account",
                        {
                          body: { confirm: true },
                        }
                      );

                      if (error) {
                        let message =
                          error.message ||
                          "Contul nu a putut fi șters.";

                        try {
                          const payload =
                            typeof error?.context?.json === "function"
                              ? await error.context.json()
                              : null;

                          if (payload?.error) {
                            message = payload.error;
                          }
                        } catch (_) {}

                        throw new Error(message);
                      }

                      if (!data?.success) {
                        throw new Error(
                          data?.error ||
                            "Contul nu a putut fi șters."
                        );
                      }

                      await supabase.auth.signOut({ scope: "local" });

                      setSession(null);
                      setProfile(null);
                      setRole(null);
                      setScreen("home");
                      setAuthPassword("");

                      Alert.alert(
                        "Cont șters",
                        "Contul tău a fost șters definitiv."
                      );
                    } catch (error) {
                      Alert.alert(
                        "Ștergerea nu a reușit",
                        error?.message ||
                          "A apărut o eroare la ștergerea contului."
                      );
                    } finally {
                      setDeleteAccountBusy(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };




  const {
    refreshCoreData,
    refresh,
  } = useCoreDataActions({
    currentUserId,
    role,
    setDataLoading,
    setDbError,
    setShifts,
    setFavorites,
    setNotifications,
    setConversations,
    setAvailabilities,
    setAcceptedShifts,
    setMyAvailabilities,
    setMyApplications,
    setRefreshing,
  });

  const {
    toggleFavorite,
    openShift,
    openWaiterDirectory,
    openWorkerPublicProfile,
    reloadSelectedShift,
    applyToShift,
    publishShift,
  } = useShiftActions({
    supabase,
    currentUserId,
    favorites,
    setFavorites,
    setShiftBackTarget,
    setSelectedShift,
    setApplications,
    role,
    setScreen,
    setWaiterDirectoryLoading,
    setWaiterDirectoryError,
    setWaiterDirectory,
    setSelectedWorkerProfile,
    setWorkerProfileError,
    setWorkerProfileLoading,
    selectedShift,
    showNotice,
    profile,
    myApplications,
    applyBusy,
    setApplyBusy,
    shiftStartDate,
    refreshCoreData,
    applicationStatusLabel,
    shiftForm,
    setShiftForm,
    setPublishError,
    setPublishBusy,
    isPublishStartAllowed,
    formatDateRo,
  });

  const {
    updateApplication,
    publishAvailability,
    withdrawAvailability,
    cancelMyApplication,
    cancelShiftByManager,
    markAttendance,
    submitShiftRating,
  } = useApplicationActions({
    supabase,
    askConfirm,
    currentUserId,
    profile,
    selectedDates,
    dayAvailability,
    setAvailabilityError,
    setSelectedDates,
    setDayAvailability,
    refreshCoreData,
    showNotice,
    setScreen,
    myApplications,
    selectedShift,
    reloadSelectedShift,
  });

  const {
    openConversation,
    loadChat,
    sendMessage,
    openConversationFromList,
    markNotificationRead,
    openNotification,
  } = useMessagingActions({
    currentUserId,
    selectedShift,
    showNotice,
    setChatConversation,
    chatConversation,
    setChatMessages,
    chatText,
    setChatText,
    setConversations,
    setNotifications,
    setScreen,
    role,
    openShift,
  });

  const {
    pickProfilePhoto,
    requestProfileBack,
  } = useProfileFlowActions({
    currentUserId,
    photoBusy,
    setPhotoBusy,
    showNotice,
    setProfile,
    refreshCoreData,
    role,
    waiterFormDirty,
    managerFormDirty,
    setFormError,
    applyProfileToForms,
    profile,
    profileBackTarget,
    setScreen,
    setRole,
    askConfirm,
  });

  const filteredShifts = useMemo(
    () =>
      filterShifts({
        shifts,
        shiftQuery,
        shiftFilter,
        favorites,
        role,
        profile,
      }),
    [shifts, shiftQuery, shiftFilter, favorites, role, profile]
  );

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  if (booting) {
    return (
      <Shell>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={C.gold} size="large" />
          <Text style={{ color: C.muted, marginTop: 14 }}>Se încarcă TuraX...</Text>
        </View>
      </Shell>
    );
  }

  if (!session) {
    return (
      <AuthScreen
        authMode={authMode}
        setAuthMode={setAuthMode}
        email={authEmail}
        setEmail={setAuthEmail}
        password={authPassword}
        setPassword={setAuthPassword}
        name={authName}
        setName={setAuthName}
        showPassword={showAuthPassword}
        setShowPassword={setShowAuthPassword}
        rememberMe={rememberMe}
        setRememberMe={setRememberMe}
        message={authMessage}
        busy={authBusy}
        onLogin={handleLogin}
        onSignup={handleSignup}
        onResetPassword={resetPassword}
      />
    );
  }

  if (!role) {
    return (
      <RoleScreen
        error={dbError}
        onBack={handleSignOut}
        onChoose={chooseRole}
      />
    );
  }
  const appScreen = (
    <AppRouter
      screen={screen}
      setScreen={setScreen}
      role={role}
      profile={profile}
      conversation={conversation}
      chatConversation={chatConversation}
      chatMessages={chatMessages}
      chatText={chatText}
      setChatText={setChatText}
      currentUserId={currentUserId}
      notice={notice}
      confirmDialog={confirmDialog}
      setConfirmDialog={setConfirmDialog}
      shifts={shifts}
      filteredShifts={filteredShifts}
      shiftFilter={shiftFilter}
      setShiftFilter={setShiftFilter}
      shiftQuery={shiftQuery}
      setShiftQuery={setShiftQuery}
      selectedShift={selectedShift}
      applications={applications}
      myApplications={myApplications}
      notifications={notifications}
      favorites={favorites}
      toggleFavorite={toggleFavorite}
      unreadCount={unreadCount}
      updateApplication={updateApplication}
      cancelMyApplication={cancelMyApplication}
      deleteAccountBusy={deleteAccountBusy}
      handleDeleteAccount={handleDeleteAccount}
      refreshing={refreshing}
      publishBusy={publishBusy}
      applyBusy={applyBusy}
      photoBusy={photoBusy}
      dataLoading={dataLoading}
      dbError={dbError}
      availabilityError={availabilityError}
      dayAvailability={dayAvailability}
      selectedDates={selectedDates}
      setSelectedDates={setSelectedDates}
      waiterDirectory={waiterDirectory}
      waiterDirectoryLoading={waiterDirectoryLoading}
      waiterDirectoryError={waiterDirectoryError}
      selectedWorkerProfile={selectedWorkerProfile}
      setSelectedWorkerProfile={setSelectedWorkerProfile}
      workerProfileLoading={workerProfileLoading}
      workerProfileError={workerProfileError}
      shiftBackTarget={shiftBackTarget}
      withdrawAvailability={withdrawAvailability}
      openConversationFromList={openConversationFromList}
      managerForm={managerForm}
      setManagerForm={setManagerForm}
      waiterForm={waiterForm}
      setWaiterForm={setWaiterForm}
      formError={formError}
      requestProfileBack={requestProfileBack}
      saveManagerProfile={saveManagerProfile}
      saveWaiterProfile={saveWaiterProfile}
    />
  );

  return appScreen;
}

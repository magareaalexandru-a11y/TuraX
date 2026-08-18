// TURAX_START_FROM_0700
// TURAX_HOTFIX_PUBLIC_PROFILE_3_1_3_1
// TURAX_UPGRADE_3_1_3
// TURAX_HOTFIX_CUSTOM_ROLE_3_1_2_2
// TURAX_UPGRADE_3_1_2
// Upgrade 3.1.2: UX publicare, navigare si catalog profesionisti



import "react-native-url-polyfill/auto";

import { useEffect, useMemo } from "react";

import { ActivityIndicator, Text, View } from "react-native";

import { C } from "./src/constants/appConstants";

import { isPublishStartAllowed, shiftStartDate, isEmail, formatDateRo, applicationStatusLabel } from "./src/utils/appUtils";

import { Shell } from "./src/components/ui/BasicUI";





import { RoleScreen } from "./src/screens/onboarding/RoleScreen";










import AuthScreen from "./src/screens/auth/AuthScreen";












import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthActions } from "./src/hooks/useAuthActions";
import { useCoreRealtimeSync } from "./src/hooks/useCoreRealtimeSync";
import { useAppBootstrap } from "./src/hooks/useAppBootstrap";
import { useCoreDataActions } from "./src/hooks/useCoreDataActions";
import { useChatRealtime } from "./src/hooks/useChatRealtime";
import { useMessagingActions } from "./src/hooks/useMessagingActions";


import { filterShifts } from "./src/utils/shiftFilterUtils";
import { useShiftActions } from "./src/hooks/useShiftActions";
import { useApplicationActions } from "./src/hooks/useApplicationActions";
import { useProfileActions } from "./src/hooks/useProfileActions";
import { useProfileDerivedState } from "./src/hooks/useProfileDerivedState";
import { useProfileFlowActions } from "./src/hooks/useProfileFlowActions";

import AppRouter from "./src/navigation/AppRouter";
import { useAppState } from "./src/hooks/useAppState";
import { useUiFeedback } from "./src/hooks/useUiFeedback";
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
  const {
    showNotice,
    askConfirm,
    executeConfirm,
  } = useUiFeedback({
    setNotice,
    setConfirmDialog,
    confirmDialog,
  });

  const currentUserId = session?.user?.id || null;
  const isManager = role === "manager";

  const {
    profileComplete,
    waiterFormDirty,
    managerFormDirty,
  } = useProfileDerivedState({
    profile,
    role,
    waiterForm,
    managerForm,
  });

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
    handleDeleteAccount,
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
    deleteAccountBusy,
    setDeleteAccountBusy,
  });

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
    deleteNotification,
    clearNotifications,
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
      chatConversation={chatConversation}
      chatMessages={chatMessages}
      chatText={chatText}
      setChatText={setChatText}
        sendMessage={sendMessage}
      currentUserId={currentUserId}
      notice={notice}
      confirmDialog={confirmDialog}
      setConfirmDialog={setConfirmDialog}
      executeConfirm={executeConfirm}
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
        clearNotifications={clearNotifications}
        deleteNotification={deleteNotification}
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
      acceptedShifts={acceptedShifts}
      applyToShift={applyToShift}
      availabilities={availabilities}
      cancelShiftByManager={cancelShiftByManager}
      conversations={conversations}
      handleSignOut={handleSignOut}
      markAttendance={markAttendance}
      myAvailabilities={myAvailabilities}
      openConversation={openConversation}
      openNotification={openNotification}
      openShift={openShift}
      openWaiterDirectory={openWaiterDirectory}
      openWorkerPublicProfile={openWorkerPublicProfile}
      pickProfilePhoto={pickProfilePhoto}
      publishAvailability={publishAvailability}
      publishError={publishError}
      publishShift={publishShift}
      refresh={refresh}
      setDayAvailability={setDayAvailability}
      setProfileBackTarget={setProfileBackTarget}
      setShiftForm={setShiftForm}
      setWorkerProfileError={setWorkerProfileError}
      shiftForm={shiftForm}
      submitShiftRating={submitShiftRating}
    />
  );

  return appScreen;
}

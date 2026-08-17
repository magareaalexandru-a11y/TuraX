import { C } from "../constants/appConstants";
import { ChatScreen } from "../screens/messages/MessagesScreen";
import React from "react";
import { View } from "react-native";
import { BottomNav } from "../components/navigation/AppNavigation";
import { TuraXNotice, TuraXConfirm } from "../components/ui/FeedbackUI";

import {
  AvailabilityScreen,
  PublishShiftScreen,
  WaiterDirectoryScreen,
  WorkerPublicProfileScreen,
  AvailableWaitersScreen,
  ManagerProfileScreen,
  WaiterProfileScreen,
} from "../screens/onboarding/ProfileScreens";

import HomeScreen from "../screens/home/HomeScreen";
import MessagesScreen from "../screens/messages/MessagesScreen";
import {
  MyWaiterActivityScreen,
  ConfirmedShiftsScreen,
} from "../screens/worker/WorkerActivityScreens";
import NotificationsScreen from "../screens/notifications/NotificationsScreen";
import ShiftDetailScreen from "../screens/shifts/ShiftDetailScreen";
import ShiftsScreen from "../screens/shifts/ShiftsScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";


export default function AppRouter({
  screen,
  setScreen,
  role,
  profile,
  conversation,
  chatConversation,
  chatMessages,
  chatText,
  setChatText,
  sendMessage,
  currentUserId,
  notice,
  confirmDialog,
  setConfirmDialog,
  executeConfirm,
  shifts,
  filteredShifts,
  shiftFilter,
  setShiftFilter,
  shiftQuery,
  setShiftQuery,
  selectedShift,
  applications,
  myApplications,
  notifications,
  favorites,
  toggleFavorite,
  unreadCount,
  updateApplication,
  cancelMyApplication,
  deleteAccountBusy,
  handleDeleteAccount,
  refreshing,
  publishBusy,
  applyBusy,
  photoBusy,
  dataLoading,
  dbError,
  availabilityError,
  dayAvailability,
  selectedDates,
  setSelectedDates,
  waiterDirectory,
  waiterDirectoryLoading,
  waiterDirectoryError,
  selectedWorkerProfile,
  setSelectedWorkerProfile,
  workerProfileLoading,
  workerProfileError,
  shiftBackTarget,
  withdrawAvailability,
  openConversationFromList,
  managerForm,
  setManagerForm,
  waiterForm,
  setWaiterForm,
  formError,
  requestProfileBack,
  saveManagerProfile,
  saveWaiterProfile
}) {
  const appScreen = (
<View style={{ flex: 1, backgroundColor: C.bg }}>
      {screen === "home" && (
        <HomeScreen
          role={role}
          profile={profile}
          shifts={
            role === "waiter"
              ? shifts.filter((shift) =>
                  Array.isArray(profile?.worker_roles) &&
                  profile.worker_roles.some(
                    (workerRole) =>
                      String(workerRole || "").trim().toLocaleLowerCase("ro-RO") ===
                      String(shift.role || "").trim().toLocaleLowerCase("ro-RO")
                  )
                )
              : shifts
          }
          availabilities={availabilities}
          acceptedShifts={acceptedShifts}
          myAvailabilities={myAvailabilities}
          myApplications={myApplications}
          unreadCount={unreadCount}
          dbError={dbError}
          dataLoading={dataLoading}
          refreshing={refreshing}
          onRefresh={refresh}
          onNotifications={() => setScreen("notifications")}
          onSeeShifts={() => setScreen("shifts")}
          onPublish={() => setScreen("publish")}
          onOpenShift={openShift}
          onAvailableWaiters={() => setScreen("availableWaiters")}
          onBrowseWaiters={openWaiterDirectory}
          onMyActivity={() => setScreen("myActivity")}
          onConfirmedShifts={() => setScreen("confirmedShifts")}
        />
      )}

      {screen === "waiterProfile" && (
        <WaiterProfileScreen
          form={waiterForm}
          setForm={setWaiterForm}
          error={formError}
          onBack={() => requestProfileBack("waiter")}
          onSave={saveWaiterProfile}
        />
      )}

      {screen === "managerProfile" && (
        <ManagerProfileScreen
          form={managerForm}
          setForm={setManagerForm}
          error={formError}
          onBack={() => requestProfileBack("manager")}
          onSave={saveManagerProfile}
        />
      )}

      {screen === "shifts" && (
        <ShiftsScreen
          role={role}
          shifts={filteredShifts}
          query={shiftQuery}
          setQuery={setShiftQuery}
          filter={shiftFilter}
          setFilter={setShiftFilter}
          favorites={favorites}
          onFavorite={toggleFavorite}
          onOpenShift={openShift}
          refreshing={refreshing}
          onRefresh={refresh}
        />
      )}

      {screen === "publish" && (
        role === "waiter" ? (
          <AvailabilityScreen
            selectedDates={selectedDates}
            setSelectedDates={setSelectedDates}
            dayAvailability={dayAvailability}
            setDayAvailability={setDayAvailability}
            error={availabilityError}
            onPublish={publishAvailability}
          />
        ) : (
          <PublishShiftScreen
            form={shiftForm}
            setForm={setShiftForm}
            profile={profile}
            error={publishError}
            busy={publishBusy}
            onPublish={publishShift}
          />
        )
      )}

      {screen === "messages" && (
        <MessagesScreen
          role={role}
          conversations={conversations}
          onOpen={openConversationFromList}
        />
      )}

      {screen === "profile" && (
        <ProfileScreen
          role={role}
          profile={profile}
          shifts={shifts}
          acceptedShifts={acceptedShifts}
          onEdit={() => {
            setProfileBackTarget("profile");
            setScreen(role === "waiter" ? "waiterProfile" : "managerProfile");
          }}
          onNotifications={() => setScreen("notifications")}
          onSignOut={handleSignOut}
          onDeleteAccount={handleDeleteAccount}
          deleteAccountBusy={deleteAccountBusy}
          onChangePhoto={pickProfilePhoto}
          photoBusy={photoBusy}
          onOpenShifts={() => setScreen(role === "waiter" ? "myActivity" : "shifts")}
        />
      )}

      {screen === "myActivity" && role === "waiter" && (
        <MyWaiterActivityScreen
          availabilities={myAvailabilities}
          applications={myApplications}
          onBack={() => setScreen("home")}
          onWithdrawAvailability={withdrawAvailability}
          onCancelApplication={cancelMyApplication}
          onRateManager={(application, rating) =>
            submitShiftRating({
              shiftId: application.shift_id,
              revieweeId: application?.shifts?.manager_id,
              rating,
            })
          }
          onOpenShift={(application) => application?.shifts && openShift(application.shifts, "myActivity")}
        />
      )}

      {screen === "confirmedShifts" && role === "waiter" && (
        <ConfirmedShiftsScreen
          applications={myApplications}
          onBack={() => setScreen("home")}
          onOpenShift={(application) => application?.shifts && openShift(application.shifts, "confirmedShifts")}
        />
      )}

      {screen === "waiterDirectory" && role === "manager" && (
        <WaiterDirectoryScreen
          rows={waiterDirectory}
          loading={waiterDirectoryLoading}
          error={waiterDirectoryError}
          onBack={() => setScreen("home")}
          onMessage={(r) => openConversation({ waiter: r })}
          onOpenProfile={openWorkerPublicProfile}
        />
      )}

      {screen === "workerProfile" && role === "manager" && (
        <WorkerPublicProfileScreen
          worker={selectedWorkerProfile}
          loading={workerProfileLoading}
          error={workerProfileError}
          onBack={() => {
            setSelectedWorkerProfile(null);
            setWorkerProfileError("");
            setScreen("waiterDirectory");
          }}
          onMessage={(w) =>
            openConversation({
              waiter: {
                waiter_id: w.waiter_id || w.id,
                waiter_name:
                  w.waiter_name ||
                  w.full_name ||
                  "Profesionist HoReCa",
                waiter_avatar_url:
                  w.waiter_avatar_url ||
                  w.avatar_url ||
                  null,
              },
            })
          }
        />
      )}

      {screen === "availableWaiters" && (
        <AvailableWaitersScreen
          rows={availabilities}
          onBack={() => setScreen("home")}
          onMessage={(r) =>
            openConversation({
              waiter: { waiter_id: r.waiter_id, waiter_name: r.waiter_name, waiter_avatar_url: r.waiter_avatar_url },
            })
          }
        />
      )}

      {screen === "shiftDetail" && (
        <ShiftDetailScreen
          role={role}
          shift={selectedShift}
          applications={applications}
          favorite={selectedShift ? favorites.includes(selectedShift.id) : false}
          onBack={() => setScreen(shiftBackTarget)}
          onFavorite={() => selectedShift && toggleFavorite(selectedShift.id)}
          currentApplication={selectedShift ? myApplications.find((a) => a.shift_id === selectedShift.id) || null : null}
          onApply={applyToShift}
          applyBusy={applyBusy}
          onMessage={() => openConversation({ shift: selectedShift })}
          onApplicationStatus={updateApplication}
          onCancelShift={cancelShiftByManager}
          onAttendance={markAttendance}
          onRateApplicant={(application, rating) =>
            submitShiftRating({
              shiftId: application.shift_id,
              revieweeId: application.waiter_id,
              rating,
            })
          }
          onMessageApplicant={(a) => openConversation({ waiter: a })}
        />
      )}

      {screen === "notifications" && (
        <NotificationsScreen
          notifications={notifications}
          onBack={() => setScreen("home")}
          onOpen={openNotification}
        />
      )}

      {screen === "chat" && (
        <ChatScreen
          role={role}
          conversation={chatConversation}
          messages={chatMessages}
          currentUserId={currentUserId}
          text={chatText}
          setText={setChatText}
          onBack={() => setScreen("messages")}
          onSend={sendMessage}
        />
      )}

      {!["availableWaiters", "waiterDirectory", "workerProfile", "confirmedShifts", "myActivity", "shiftDetail", "notifications", "chat"].includes(screen) && (
        <BottomNav screen={screen} setScreen={setScreen} />
      )}
      <TuraXNotice notice={notice} />
      <TuraXConfirm
        dialog={confirmDialog}
        onCancel={() => setConfirmDialog(null)}
        onConfirm={executeConfirm}
      />
    </View>
  );

  return appScreen;
}

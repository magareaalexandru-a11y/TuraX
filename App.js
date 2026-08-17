// TURAX_START_FROM_0700
// TURAX_HOTFIX_PUBLIC_PROFILE_3_1_3_1
// TURAX_UPGRADE_3_1_3
// TURAX_HOTFIX_CUSTOM_ROLE_3_1_2_2
// TURAX_UPGRADE_3_1_2
// Upgrade 3.1.2: UX publicare, navigare si catalog profesionisti
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
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
import { createClient } from "@supabase/supabase-js";

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
import {
  WaiterProfileScreen,
  ManagerProfileScreen,
} from "./src/screens/onboarding/ProfileScreens";

import {
  PickerBox,
  TimePickerBox,
  DarkCalendar,
  AvailabilityScreen,
  PublishShiftScreen,
} from "./src/screens/publishing/PublishingScreens";

import {
  WaiterDirectoryScreen,
  WorkerPublicProfileScreen,
  AvailableWaitersScreen,
} from "./src/screens/professionals/ProfessionalScreens";

import ShiftCard from "./src/components/shifts/ShiftCard";

import HomeScreen from "./src/screens/home/HomeScreen";

import AuthScreen from "./src/screens/auth/AuthScreen";

import { MessagesScreen, ChatScreen } from "./src/screens/messages/MessagesScreen";

import { MyWaiterActivityScreen, ConfirmedShiftsScreen } from "./src/screens/worker/WorkerActivityScreens";

import NotificationsScreen from "./src/screens/notifications/NotificationsScreen";

import ShiftDetailScreen from "./src/screens/shifts/ShiftDetailScreen";

import ShiftsScreen from "./src/screens/shifts/ShiftsScreen";
import ProfileScreen from "./src/screens/profile/ProfileScreen";

import { useAuthActions } from "./src/hooks/useAuthActions";
import { useCoreRealtimeSync } from "./src/hooks/useCoreRealtimeSync";
import { useChatRealtime } from "./src/hooks/useChatRealtime";
import { profileToForms } from "./src/utils/profileFormUtils";
import { buildWaiterProfileSave, buildManagerProfileSave } from "./src/utils/profileSaveUtils";
import { filterShifts } from "./src/utils/shiftFilterUtils";
import { useShiftActions } from "./src/hooks/useShiftActions";
import { useApplicationActions } from "./src/hooks/useApplicationActions";
import { useProfileActions } from "./src/hooks/useProfileActions";

import AppRouter from "./src/navigation/AppRouter";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://hfqijvzfjmuysuwdoxej.supabase.co";
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_KJkUOxPP0_8JFtbTzWN0oA_qGA_gtcm";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default function App() {
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [screen, setScreen] = useState("home");
  const [profileBackTarget, setProfileBackTarget] = useState("role");
  const [dbError, setDbError] = useState("");

  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");

  const [waiterForm, setWaiterForm] = useState({
    fullName: "",
    city: "",
    experience: "",
    description: "",
    workerRoles: [],
    customRoleEnabled: false,
    customWorkerRole: "",
    workTypes: [],
    horecaSkills: [],
  });
  const [managerForm, setManagerForm] = useState({
    locationName: "",
    locationType: "",
    locationCity: "",
    locationAddress: "",
    contactName: "",
    contactPhone: "",
  });
  const [formError, setFormError] = useState("");

  const [shifts, setShifts] = useState([]);
  const [availabilities, setAvailabilities] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [acceptedShifts, setAcceptedShifts] = useState([]);
  const [myAvailabilities, setMyAvailabilities] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [shiftQuery, setShiftQuery] = useState("");
  const [shiftFilter, setShiftFilter] = useState("Toate");
  const [selectedShift, setSelectedShift] = useState(null);
  const [applications, setApplications] = useState([]);

  const [selectedDates, setSelectedDates] = useState([]);
  const [dayAvailability, setDayAvailability] = useState({});
  const [availabilityError, setAvailabilityError] = useState("");

  const [shiftForm, setShiftForm] = useState({
    role: "Ospătar",
    customRole: "",
    locationName: "",
    city: "",
    address: "",
    date: "",
    start: "",
    end: "",
    workersNeeded: "1",
    hourlyRate: "",
    description: "",
  });
  const [publishError, setPublishError] = useState("");

  const [chatConversation, setChatConversation] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [notice, setNotice] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [deleteAccountBusy, setDeleteAccountBusy] = useState(false);
  const [publishBusy, setPublishBusy] = useState(false);
  const [applyBusy, setApplyBusy] = useState(false);
  const [waiterDirectory, setWaiterDirectory] = useState([]);
  const [waiterDirectoryLoading, setWaiterDirectoryLoading] = useState(false);
  const [waiterDirectoryError, setWaiterDirectoryError] = useState("");
  const [selectedWorkerProfile, setSelectedWorkerProfile] = useState(null);
  const [workerProfileLoading, setWorkerProfileLoading] = useState(false);
  const [workerProfileError, setWorkerProfileError] = useState("");
  const [shiftBackTarget, setShiftBackTarget] = useState("shifts");

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

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      try {
        const savedRemember = (await AsyncStorage.getItem("turax_remember_me")) === "1";
        const savedEmail = await AsyncStorage.getItem("turax_remember_email");
        if (!mounted) return;
        setRememberMe(savedRemember);
        if (savedEmail) setAuthEmail(savedEmail);

        const { data } = await supabase.auth.getSession();
        let current = data.session;

        if (current && !savedRemember) {
          await supabase.auth.signOut({ scope: "local" });
          current = null;
        }

        if (!mounted) return;
        setSession(current);
        if (current?.user?.id) {
          await loadProfile(current.user.id, true);
        }
      } catch (e) {
        if (mounted) setDbError(e?.message || "Eroare la inițializarea aplicației.");
      } finally {
        if (mounted) setBooting(false);
      }
    };

    boot();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      if (!nextSession) {
        setSession(null);
        setRole(null);
        setProfile(null);
        setScreen("home");
        setBooting(false);
        return;
      }

      setBooting(true);
      setSession(nextSession);
      setTimeout(async () => {
        if (!mounted) return;
        await loadProfile(nextSession.user.id, true);
        if (mounted) setBooting(false);
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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




  const refreshCoreData = async (silent = false) => {
    if (!currentUserId || !role) return;
    if (!silent) setDataLoading(true);
    setDbError("");
    try {
      const [shiftResult, favoriteResult, notificationResult, conversationResult] = await Promise.all([
        role === "waiter"
          ? supabase
              .from("shifts")
              .select("*")
              .eq("status", "open")
              .gte("shift_date", todayIso())
              .order("shift_date", { ascending: true })
          : supabase
              .from("shifts")
              .select("*")
              .eq("manager_id", currentUserId)
              .order("shift_date", { ascending: false }),
        supabase.from("favorites").select("shift_id").eq("user_id", currentUserId),
        supabase
          .from("notifications")
          .select("*")
          .eq("user_id", currentUserId)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("conversations")
          .select("*")
          .or(`manager_id.eq.${currentUserId},waiter_id.eq.${currentUserId}`)
          .order("updated_at", { ascending: false }),
      ]);

      const commonError = [shiftResult, favoriteResult, notificationResult, conversationResult].find((r) => r.error)?.error;
      if (commonError) throw commonError;

      const incomingShifts = shiftResult.data || [];
      const visibleShifts = role === "waiter"
        ? incomingShifts.filter((s) => {
            const start = shiftStartDate(s);
            return s.status === "open" && !!start && start.getTime() > Date.now();
          })
        : incomingShifts;
      setShifts(visibleShifts);
      setFavorites((favoriteResult.data || []).map((x) => x.shift_id));
      setNotifications(notificationResult.data || []);

      const conversationRows = conversationResult.data || [];
      let enrichedConversations = conversationRows;
      if (conversationRows.length > 0) {
        const ids = conversationRows.map((c) => c.id);
        const { data: unreadRows, error: unreadError } = await supabase
          .from("messages")
          .select("conversation_id")
          .in("conversation_id", ids)
          .is("read_at", null)
          .neq("sender_id", currentUserId);
        if (unreadError) throw unreadError;
        const counts = (unreadRows || []).reduce((acc, row) => {
          acc[row.conversation_id] = (acc[row.conversation_id] || 0) + 1;
          return acc;
        }, {});
        enrichedConversations = conversationRows.map((c) => ({ ...c, unread_count: counts[c.id] || 0 }));
      }
      setConversations(enrichedConversations);

      if (role === "manager") {
        const { data, error } = await supabase
          .from("availability")
          .select("*")
          .gte("available_date", todayIso())
          .order("available_date", { ascending: true })
          .limit(100);
        if (error) throw error;
        setAvailabilities(data || []);
        setAcceptedShifts([]);
        setMyAvailabilities([]);
        setMyApplications([]);
      } else {
        const [availabilityResult, applicationsResult] = await Promise.all([
          supabase
            .from("availability")
            .select("*")
            .eq("waiter_id", currentUserId)
            .gte("available_date", todayIso())
            .order("available_date", { ascending: true }),
          supabase
            .from("applications")
            .select("*, shifts(*)")
            .eq("waiter_id", currentUserId)
            .order("created_at", { ascending: false }),
        ]);
        if (availabilityResult.error) throw availabilityResult.error;
        if (applicationsResult.error) throw applicationsResult.error;

        const apps = applicationsResult.data || [];
        setMyAvailabilities(availabilityResult.data || []);
        setMyApplications(apps);
        setAcceptedShifts(apps.filter((a) => ["accepted", "completed", "no_show"].includes(a.status)));
        setAvailabilities([]);
      }
    } catch (e) {
      setDbError(
        `Datele nu pot fi încărcate. Dacă tocmai ai aplicat upgrade-ul, rulează și migrarea Supabase. Detaliu: ${e?.message || e}`
      );
    } finally {
      setDataLoading(false);
      setRefreshing(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await refreshCoreData(true);
  };

  const {
    toggleFavorite,
    openShift,
    openWaiterDirectory,
    openWorkerPublicProfile,
    reloadSelectedShift,
    applyToShift,
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

  const publishShift = async () => {
    if (publishBusy) return;
    setPublishError("");
    const needed = Number(shiftForm.workersNeeded);
    const rate = Number(shiftForm.hourlyRate);
    const effectiveRole =
      shiftForm.role === "Altele"
        ? String(shiftForm.customRole || "").trim()
        : String(shiftForm.role || "").trim();

    if (!effectiveRole) {
      return setPublishError("Alege rolul căutat.");
    }

    if (shiftForm.role === "Altele" && effectiveRole.length < 2) {
      return setPublishError("Specifică rolul necesar.");
    }

    if (effectiveRole.length > 60) {
      return setPublishError("Denumirea rolului poate avea maximum 60 de caractere.");
    }

    if (!shiftForm.locationName.trim()) return setPublishError("Completează numele locației.");
    if (!shiftForm.city.trim()) return setPublishError("Completează orașul.");
    if (!shiftForm.date) return setPublishError("Selectează data turei.");
    if (!shiftForm.start || !shiftForm.end) return setPublishError("Selectează intervalul orar.");
    if (!Number.isInteger(needed) || needed < 1) return setPublishError("Numărul de persoane necesare trebuie să fie cel puțin 1.");
    if (!Number.isFinite(rate) || rate <= 0) return setPublishError("Introdu un tarif orar valid.");

    if (!isPublishStartAllowed(shiftForm.date, shiftForm.start)) {
      return setPublishError("Tura trebuie să înceapă cu cel puțin 60 de minute de acum.");
    }

    setPublishBusy(true);
    try {
      const { error } = await supabase.rpc("publish_shift", {
        p_role: effectiveRole,
        p_location_name: shiftForm.locationName.trim(),
        p_city: shiftForm.city.trim(),
        p_address: shiftForm.address.trim() || null,
        p_shift_date: shiftForm.date,
        p_start_time: shiftForm.start,
        p_end_time: shiftForm.end,
        p_workers_needed: needed,
        p_hourly_rate: rate,
        p_description: shiftForm.description.trim() || null,
      });

      if (error) return setPublishError(error.message);

      setShiftForm({
        role: "Ospătar",
        customRole: "",
        locationName: profile?.location_name || "",
        city: profile?.location_city || "",
        address: profile?.location_address || "",
        date: "",
        start: "",
        end: "",
        workersNeeded: "1",
        hourlyRate: "",
        description: "",
      });
      await refreshCoreData(true);
      showNotice("Tura a fost publicată.");
      setScreen("home");
    } finally {
      setPublishBusy(false);
    }
  };

  const openConversation = async ({ shift = null, waiter = null } = {}) => {
    if (!currentUserId) return;

    const contextShift = shift || selectedShift || null;
    const otherUserId = role === "waiter" ? contextShift?.manager_id : waiter?.waiter_id;

    if (!otherUserId) {
      showNotice("Nu am putut identifica participantul conversației.", "error");
      return;
    }

    const { data, error } = await supabase
      .rpc("ensure_conversation", {
        p_other_user_id: otherUserId,
        p_shift_id: contextShift?.id || null,
      })
      .single();

    if (error) return showNotice(error.message, "error");

    setChatConversation(data);
    await loadChat(data.id);
    setScreen("chat");
  };

  const loadChat = async (conversationId) => {
    const readResult = await supabase.rpc("mark_conversation_read", {
      p_conversation_id: conversationId,
    });
    if (readResult.error) console.log("TuraX read messages:", readResult.error.message);

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) return Alert.alert("TuraX", error.message);
    setChatMessages(data || []);
    setConversations((prev) => prev.map((c) => c.id === conversationId ? { ...c, unread_count: 0 } : c));
    setNotifications((prev) => prev.map((n) => {
      const payload = n.data && typeof n.data === "object" ? n.data : {};
      return n.type === "message_new" && payload.conversation_id === conversationId && !n.read_at
        ? { ...n, read_at: new Date().toISOString() }
        : n;
    }));
  };

  const sendMessage = async () => {
    const body = chatText.trim();
    if (!body || !chatConversation?.id) return;
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      conversation_id: chatConversation.id,
      sender_id: currentUserId,
      body,
      created_at: new Date().toISOString(),
      _sending: true,
    };
    setChatText("");
    setChatMessages((prev) => [...prev, optimistic]);

    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: chatConversation.id, sender_id: currentUserId, body })
      .select("*")
      .single();
    if (error) {
      setChatMessages((prev) => prev.filter((m) => m.id !== tempId));
      setChatText(body);
      return Alert.alert("TuraX", error.message);
    }

    setChatMessages((prev) => {
      const clean = prev.filter((m) => m.id !== tempId && m.id !== data.id);
      return [...clean, data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    });
    setConversations((prev) => prev.map((c) => c.id === chatConversation.id ? {
      ...c,
      last_message: body,
      last_message_at: data.created_at,
      last_sender_id: currentUserId,
    } : c));
  };

  const openConversationFromList = async (conversation) => {
    setChatConversation(conversation);
    await loadChat(conversation.id);
    setScreen("chat");
  };

  const markNotificationRead = async (n) => {
    if (!n?.id || n.read_at) return;
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: now } : x)));
    await supabase.from("notifications").update({ read_at: now }).eq("id", n.id);
  };

  const openNotification = async (n) => {
    if (!n) return;
    await markNotificationRead(n);
    const payload = n.data && typeof n.data === "object" ? n.data : {};

    if (n.type === "message_new" && payload.conversation_id) {
      const { data: conversation, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", payload.conversation_id)
        .maybeSingle();
      if (error) return Alert.alert("TuraX", error.message);
      if (conversation) {
        await openConversationFromList(conversation);
        return;
      }
    }

    if (payload.shift_id) {
      const { data: shift, error } = await supabase
        .from("shifts")
        .select("*")
        .eq("id", payload.shift_id)
        .maybeSingle();
      if (error) return Alert.alert("TuraX", error.message);
      if (shift) {
        await openShift(shift);
        return;
      }
    }

    if (role === "waiter" && ["application_status", "application_cancelled"].includes(n.type)) {
      setScreen("myActivity");
      return;
    }

    showNotice("Notificarea a fost marcată ca citită.", "info");
  };

  const pickProfilePhoto = async () => {
    if (!currentUserId || photoBusy) return;
    setPhotoBusy(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showNotice("Permite accesul la fotografii pentru a alege poza de profil.", "error");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.78,
        base64: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.base64) return showNotice("Fotografia nu a putut fi citită.", "error");
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        return showNotice("Alege o fotografie mai mică de 5 MB.", "error");
      }

      const mimeType = asset.mimeType || "image/jpeg";
      const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
      const objectPath = `${currentUserId}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("turax-avatars")
        .upload(objectPath, decode(asset.base64), { contentType: mimeType, upsert: true, cacheControl: "3600" });
      if (uploadError) return showNotice(uploadError.message, "error");

      const { data: publicData } = supabase.storage.from("turax-avatars").getPublicUrl(objectPath);
      const publicUrl = `${publicData.publicUrl}?v=${Date.now()}`;
      const { data: updatedProfile, error: profileError } = await supabase
        .rpc("sync_my_avatar", { p_avatar_url: publicUrl })
        .single();
      if (profileError) return showNotice(profileError.message, "error");

      setProfile(updatedProfile);
      await refreshCoreData(true);
      showNotice(role === "manager" ? "Logo-ul locației a fost actualizat." : "Poza de profil a fost actualizată.");
    } catch (e) {
      showNotice(e?.message || "Fotografia nu a putut fi încărcată.", "error");
    } finally {
      setPhotoBusy(false);
    }
  };

  const requestProfileBack = (kind) => {
    const dirty = kind === "waiter" ? waiterFormDirty : managerFormDirty;
    const leave = () => {
      setFormError("");
      applyProfileToForms(profile);
      if (profileBackTarget === "profile") {
        setScreen("profile");
      } else {
        setRole(null);
        setScreen("home");
      }
    };
    if (!dirty) return leave();
    askConfirm({
      title: "Renunți la modificări?",
      message: "Ai modificări nesalvate în profil.",
      confirmLabel: "Renunță",
      cancelLabel: "Rămân aici",
      danger: true,
      onConfirm: leave,
    });
  };

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

  if (screen === "waiterProfile") {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <WaiterProfileScreen
          form={waiterForm}
          setForm={setWaiterForm}
          error={formError}
          onBack={() => requestProfileBack("waiter")}
          onSave={saveWaiterProfile}
        />
        <TuraXNotice notice={notice} />
        <TuraXConfirm dialog={confirmDialog} onCancel={() => setConfirmDialog(null)} onConfirm={executeConfirm} />
      </View>
    );
  }

  if (screen === "managerProfile") {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <ManagerProfileScreen
          form={managerForm}
          setForm={setManagerForm}
          error={formError}
          onBack={() => requestProfileBack("manager")}
          onSave={saveManagerProfile}
        />
        <TuraXNotice notice={notice} />
        <TuraXConfirm dialog={confirmDialog} onCancel={() => setConfirmDialog(null)} onConfirm={executeConfirm} />
      </View>
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
    />
  );

  return appScreen;
}

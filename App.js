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

import { MessagesScreen, ChatScreen } from "./src/screens/messages/MessageScreens";

import { MyWaiterActivityScreen, ConfirmedShiftsScreen } from "./src/screens/worker/WorkerActivityScreens";

import NotificationsScreen from "./src/screens/notifications/NotificationsScreen";

import ShiftDetailScreen from "./src/screens/shifts/ShiftDetailScreen";

import ShiftsScreen from "./src/screens/shifts/ShiftsScreen";
import ProfileScreen from "./src/screens/profile/ProfileScreen";

import { useAuthActions } from "./src/hooks/useAuthActions";
import { useCoreRealtimeSync } from "./src/hooks/useCoreRealtimeSync";
import { useChatRealtime } from "./src/hooks/useChatRealtime";
import { profileToForms } from "./src/utils/profileFormUtils";
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

  const applyProfileToForms = (p) => {
    const forms = profileToForms(p);
    if (!forms) return;

    setWaiterForm(forms.waiterForm);
    setManagerForm(forms.managerForm);
  };

  const loadProfile = async (userId, chooseScreen = false) => {
    if (!userId) return null;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) {
      setDbError(`Profilul nu poate fi încărcat: ${error.message}`);
      return null;
    }
    setDbError("");
    setProfile(data || null);
    const nextRole = data?.role || null;
    setRole(nextRole);
    applyProfileToForms(data);
    if (chooseScreen && nextRole) {
      const complete =
        nextRole === "waiter"
          ? !!(
              data?.full_name &&
              data?.city &&
              data?.experience !== null && data?.experience !== undefined && Number(data.experience) >= 0 &&
              Array.isArray(data?.worker_roles) &&
              data.worker_roles.length > 0 &&
              Array.isArray(data?.work_types) &&
              data.work_types.length > 0 &&
              Array.isArray(data?.horeca_skills) &&
              data.horeca_skills.length > 0
            )
          : !!(data?.location_name && data?.location_city && data?.contact_name && data?.contact_phone);
      if (!complete) setProfileBackTarget("role");
      setScreen(complete ? "home" : nextRole === "waiter" ? "waiterProfile" : "managerProfile");
    }
    return data;
  };

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

  const chooseRole = async (nextRole) => {
    if (!currentUserId) return;
    setDbError("");
    const payload = {
      id: currentUserId,
      role: nextRole,
      email: session?.user?.email || null,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();

    if (error) {
      setDbError(`Rolul nu a putut fi salvat: ${error.message}`);
      return;
    }
    setProfile(data);
    setRole(nextRole);
    applyProfileToForms(data);
    setProfileBackTarget("role");
    setScreen(nextRole === "waiter" ? "waiterProfile" : "managerProfile");
  };

  const saveWaiterProfile = async () => {
    setFormError("");

    const exp = Number(waiterForm.experience);

    if (waiterForm.fullName.trim().length < 2)
      return setFormError("Completează numele complet.");

    if (waiterForm.city.trim().length < 2)
      return setFormError("Completează orașul.");

    if (!Number.isFinite(exp) || exp < 0 || exp > 60)
      return setFormError("Introdu corect anii de experiență.");

    const customRole = waiterForm.customRoleEnabled
      ? String(waiterForm.customWorkerRole || "").trim()
      : "";

    if (waiterForm.customRoleEnabled && customRole.length < 2)
      return setFormError("Specifică rolul HoReCa.");

    if (customRole.length > 60)
      return setFormError("Rolul poate avea maximum 60 de caractere.");

    const workerRoles = [
      ...(waiterForm.workerRoles || []),
      ...(customRole ? [customRole] : []),
    ]
      .map((x) => String(x).trim())
      .filter(Boolean);

    const uniqueRoles = workerRoles.filter(
      (x, i, arr) =>
        arr.findIndex(
          (y) =>
            y.toLocaleLowerCase("ro-RO") ===
            x.toLocaleLowerCase("ro-RO")
        ) === i
    );

    if (uniqueRoles.length === 0)
      return setFormError("Selectează cel puțin un rol profesional.");

    if (waiterForm.workTypes.length === 0)
      return setFormError("Selectează cel puțin un tip de experiență.");

    if (waiterForm.horecaSkills.length === 0)
      return setFormError("Selectează cel puțin o competență HoReCa.");

    const payload = {
      id: currentUserId,
      role: "waiter",
      full_name: waiterForm.fullName.trim(),
      city: waiterForm.city.trim(),
      experience: exp,
      description: waiterForm.description.trim() || null,
      worker_roles: uniqueRoles,
      work_types: waiterForm.workTypes,
      horeca_skills: waiterForm.horecaSkills,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();

    if (error) return setFormError(error.message);

    await AsyncStorage.setItem(
      "turax_waiter_profile",
      JSON.stringify(payload)
    );

    setProfile(data);
    setRole("waiter");
    applyProfileToForms(data);
    showNotice("Profilul a fost actualizat.");
    setScreen("home");
  };

  const saveManagerProfile = async () => {
    setFormError("");
    if (managerForm.locationName.trim().length < 2) return setFormError("Completează numele locației.");
    if (managerForm.locationType.trim().length < 2) return setFormError("Completează tipul locației.");
    if (managerForm.locationCity.trim().length < 2) return setFormError("Completează orașul.");
    if (managerForm.locationAddress.trim().length < 3) return setFormError("Completează adresa sau zona.");
    if (managerForm.contactName.trim().length < 2) return setFormError("Completează persoana de contact.");
    if (cleanPhone(managerForm.contactPhone).length < 7) return setFormError("Introdu un număr de telefon valid.");

    const payload = {
      id: currentUserId,
      role: "manager",
      location_name: managerForm.locationName.trim(),
      location_type: managerForm.locationType.trim(),
      location_city: managerForm.locationCity.trim(),
      location_address: managerForm.locationAddress.trim(),
      contact_name: managerForm.contactName.trim(),
      contact_phone: cleanPhone(managerForm.contactPhone),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();

    if (error) return setFormError(error.message);
    await AsyncStorage.setItem("turax_manager_profile", JSON.stringify(payload));
    setProfile(data);
    setRole("manager");
    showNotice("Profilul a fost actualizat.");
    setScreen("home");
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

  const toggleFavorite = async (shiftId) => {
    const isFav = favorites.includes(shiftId);
    setFavorites((prev) => (isFav ? prev.filter((id) => id !== shiftId) : [...prev, shiftId]));
    const result = isFav
      ? await supabase.from("favorites").delete().eq("user_id", currentUserId).eq("shift_id", shiftId)
      : await supabase.from("favorites").insert({ user_id: currentUserId, shift_id: shiftId });
    if (result.error) {
      setFavorites((prev) => (isFav ? [...prev, shiftId] : prev.filter((id) => id !== shiftId)));
      Alert.alert("TuraX", result.error.message);
    }
  };

  const openShift = async (shift, backTarget = "shifts") => {
    setShiftBackTarget(backTarget);
    setSelectedShift(shift);
    setApplications([]);
    if (role === "manager" && shift?.id) {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("shift_id", shift.id)
        .order("created_at", { ascending: true });
      if (!error) setApplications(data || []);
    }
    setScreen("shiftDetail");
  };

  const openWaiterDirectory = async () => {
    setScreen("waiterDirectory");
    setWaiterDirectoryLoading(true);
    setWaiterDirectoryError("");
    try {
      const { data, error } = await supabase.rpc("list_waiter_directory");
      if (error) throw error;
      setWaiterDirectory(data || []);
    } catch (e) {
      setWaiterDirectoryError(e?.message || "Catalogul nu poate fi incarcat.");
    } finally {
      setWaiterDirectoryLoading(false);
    }
  };

  const openWorkerPublicProfile = async (worker) => {
    if (!worker?.waiter_id) return;

    setSelectedWorkerProfile(worker);
    setWorkerProfileError("");
    setWorkerProfileLoading(true);
    setScreen("workerProfile");

    try {
      const { data, error } = await supabase.rpc(
        "get_worker_public_profile",
        { p_waiter_id: worker.waiter_id }
      );

      if (error) throw error;

      if (data) {
        setSelectedWorkerProfile(data);
      }
    } catch (e) {
      setWorkerProfileError(
        e?.message || "Profilul profesionistului nu a putut fi încărcat."
      );
    } finally {
      setWorkerProfileLoading(false);
    }
  };

  const reloadSelectedShift = async () => {
    if (!selectedShift?.id) return;
    const { data: freshShift, error: shiftError } = await supabase
      .from("shifts")
      .select("*")
      .eq("id", selectedShift.id)
      .maybeSingle();
    if (shiftError) {
      showNotice(shiftError.message, "error");
      return;
    }
    if (freshShift) setSelectedShift(freshShift);

    if (role === "manager") {
      const { data: freshApplications, error: applicationsError } = await supabase
        .from("applications")
        .select("*")
        .eq("shift_id", selectedShift.id)
        .order("created_at", { ascending: true });
      if (applicationsError) {
        showNotice(applicationsError.message, "error");
        return;
      }
      setApplications(freshApplications || []);
    }
  };

  const applyToShift = async () => {
    if (!selectedShift?.id || !currentUserId || applyBusy) return;

    const allowedRoles = Array.isArray(profile?.worker_roles)
      ? profile.worker_roles
      : [];

    const roleMatches = allowedRoles.some(
      (workerRole) =>
        String(workerRole || "").trim().toLocaleLowerCase("ro-RO") ===
        String(selectedShift.role || "").trim().toLocaleLowerCase("ro-RO")
    );

    if (role === "waiter" && !roleMatches) {
      showNotice("Rolul acestei ture nu este inclus în profilul tău.", "error");
      return;
    }

    const existing = myApplications.find((a) => a.shift_id === selectedShift.id);
    if (existing) {
      showNotice(`Ai deja o candidatură pentru această tură: ${applicationStatusLabel(existing.status)}.`, "info");
      return;
    }

    const start = shiftStartDate(selectedShift);
    if (!start || start.getTime() <= Date.now()) {
      showNotice("Tura a început deja și nu mai primește candidaturi.", "error");
      return;
    }

    setApplyBusy(true);
    try {
      const { error } = await supabase.rpc("apply_to_shift", { p_shift_id: selectedShift.id });
      if (error) return showNotice(error.message, "error");
      await refreshCoreData(true);
      await reloadSelectedShift();
      showNotice("Candidatura a fost trimisă. Status: În așteptare.");
    } finally {
      setApplyBusy(false);
    }
  };

  const updateApplication = async (applicationId, status) => {
    const { error } = await supabase.rpc("manager_set_application_status", {
      p_application_id: applicationId,
      p_status: status,
    });
    if (error) return Alert.alert("TuraX", error.message);
    setApplications((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status } : a)));
    await refreshCoreData(true);
    await reloadSelectedShift();
    showNotice(status === "accepted" ? "Candidatura a fost acceptată." : "Candidatura a fost respinsă.");
  };

  const publishAvailability = async () => {
    setAvailabilityError("");
    if (selectedDates.length === 0) return setAvailabilityError("Selectează cel puțin o dată.");

    for (const date of selectedDates) {
      const info = dayAvailability[date] || {};
      if (!info.start || !info.end || !info.rate) {
        return setAvailabilityError(`Completează ora de început, ora de final și tariful pentru ${formatDateRo(date)}.`);
      }
      if (!isPublishStartAllowed(date, info.start)) {
        return setAvailabilityError(`Pentru ${formatDateRo(date)}, ora de început trebuie să fie cu cel puțin 60 de minute în viitor.`);
      }
      if (Number(info.rate) <= 0) return setAvailabilityError("Tariful trebuie să fie mai mare decât 0.");
    }

    const rows = selectedDates.map((date) => {
      const info = dayAvailability[date];
      return {
        waiter_id: currentUserId,
        waiter_name: profile?.full_name || "Ospătar",
        city: profile?.city || null,
        available_date: date,
        start_time: info.start,
        end_time: info.end,
        desired_rate: Number(info.rate),
        waiter_avatar_url: profile?.avatar_url || null,
      };
    });

    const { error } = await supabase
      .from("availability")
      .upsert(rows, { onConflict: "waiter_id,available_date" });

    if (error) return setAvailabilityError(error.message);

    setSelectedDates([]);
    setDayAvailability({});
    await refreshCoreData(true);
    showNotice("Disponibilitatea a fost publicată.");
    setScreen("myActivity");
  };

  const withdrawAvailability = (row) => {
    askConfirm({
      title: "Retrage disponibilitatea?",
      message: `${formatDateRo(row.available_date)} · ${String(row.start_time || "").slice(0, 5)}–${String(row.end_time || "").slice(0, 5)}`,
      confirmLabel: "Retrage",
      danger: true,
      onConfirm: async () => {
        const { error } = await supabase
          .from("availability")
          .delete()
          .eq("id", row.id)
          .eq("waiter_id", currentUserId);
        if (error) return showNotice(error.message, "error");
        await refreshCoreData(true);
        showNotice("Disponibilitatea a fost retrasă.");
      },
    });
  };

  const cancelMyApplication = (application) => {
    const confirmed = application.status === "accepted";
    const allowed = !confirmed || canCancelConfirmedShift(application.shifts);
    if (confirmed && !allowed) {
      showNotice("Anularea este blocată cu 48 de ore sau mai puțin înainte de începerea turei.", "error");
      return;
    }

    askConfirm({
      title: confirmed ? "Anulezi tura confirmată?" : "Retragi candidatura?",
      message: confirmed
        ? "Locul va fi eliberat pentru alt ospătar. Regula de 48h este verificată și de server."
        : "Candidatura va apărea în istoric ca anulată.",
      confirmLabel: confirmed ? "Anulează tura" : "Retrage",
      danger: true,
      onConfirm: async () => {
        const { error } = await supabase.rpc("cancel_my_application", {
          p_application_id: application.id,
        });
        if (error) return showNotice(error.message, "error");
        await refreshCoreData(true);
        showNotice(confirmed ? "Tura a fost anulată și locul a fost eliberat." : "Candidatura a fost retrasă.");
      },
    });
  };

  const cancelShiftByManager = (shift) => {
    if (!shift?.id) return;
    askConfirm({
      title: "Anulezi tura?",
      message: "Candidații aflați în așteptare sau deja confirmați vor fi anunțați automat.",
      confirmLabel: "Anulează tura",
      danger: true,
      onConfirm: async () => {
        const { error } = await supabase.rpc("manager_cancel_shift", {
          p_shift_id: shift.id,
          p_reason: "Anulată de manager din aplicația TuraX",
        });
        if (error) return showNotice(error.message, "error");
        await refreshCoreData(true);
        await reloadSelectedShift();
        showNotice("Tura a fost anulată. Participanții au fost notificați.");
      },
    });
  };

  const markAttendance = (application, result) => {
    const noShow = result === "no_show";
    askConfirm({
      title: noShow ? "Marchezi neprezentarea?" : "Confirmi tura finalizată?",
      message: noShow
        ? "Această acțiune va rămâne în istoricul turei și ospătarul va putea primi un rating corespunzător."
        : "Confirmă că ospătarul s-a prezentat și tura s-a încheiat.",
      confirmLabel: noShow ? "Marchează no-show" : "Confirmă prezența",
      danger: noShow,
      onConfirm: async () => {
        const { error } = await supabase.rpc("manager_mark_attendance", {
          p_application_id: application.id,
          p_result: result,
        });
        if (error) return showNotice(error.message, "error");
        await refreshCoreData(true);
        await reloadSelectedShift();
        showNotice(noShow ? "Neprezentarea a fost înregistrată." : "Tura a fost marcată ca finalizată.");
      },
    });
  };

  const submitShiftRating = async ({ shiftId, revieweeId, rating }) => {
    const { error } = await supabase.rpc("submit_shift_review", {
      p_shift_id: shiftId,
      p_reviewee_id: revieweeId,
      p_rating: rating,
      p_comment: null,
    });
    if (error) return showNotice(error.message, "error");
    showNotice(`Rating salvat: ${rating}/5.`);
  };

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

  const filteredShifts = useMemo(() => {
    let list = [...shifts];
    const q = shiftQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((s) =>
        [s.location_name, s.city, s.role, s.description]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }
    if (role === "manager") {
      if (shiftFilter === "Active") list = list.filter((s) => ["open", "closed"].includes(s.status) && !hasShiftEnded(s));
      if (shiftFilter === "Ocupate") list = list.filter((s) => s.status === "closed");
      if (shiftFilter === "Finalizate") list = list.filter((s) => s.status === "completed");
      if (shiftFilter === "Anulate") list = list.filter((s) => s.status === "cancelled");
      return list;
    }

    const myWorkerRoles = Array.isArray(profile?.worker_roles)
      ? profile.worker_roles
      : [];

    if (myWorkerRoles.length > 0) {
      list = list.filter((shift) =>
        myWorkerRoles.some(
          (workerRole) =>
            String(workerRole || "").trim().toLocaleLowerCase("ro-RO") ===
            String(shift.role || "").trim().toLocaleLowerCase("ro-RO")
        )
      );
    }

    if (shiftFilter === "Azi") list = list.filter((s) => s.shift_date === todayIso());
    if (shiftFilter === "Mâine") list = list.filter((s) => s.shift_date === addDaysIso(1));
    if (shiftFilter === "Weekend") {
      list = list.filter((s) => {
        const d = new Date(`${s.shift_date}T12:00:00`).getDay();
        return d === 0 || d === 6;
      });
    }
    if (shiftFilter === "Favorite") list = list.filter((s) => favorites.includes(s.id));
    return list;
  }, [shifts, shiftQuery, shiftFilter, favorites, role, profile]);

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

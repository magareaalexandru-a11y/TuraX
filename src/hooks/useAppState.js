import { useState } from "react";

export function useAppState() {
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
    address: "",
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

  return {
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
  };
}

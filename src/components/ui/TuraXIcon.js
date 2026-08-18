import React from "react";
import { View } from "react-native";
import {
  ArrowLeft,
  Briefcase,
  CalendarDays,
  Camera,
  MessageCircle,
  Check,
  CircleCheck,
  ChevronDown,
  ChevronRight,
  X,
  Eye,
  EyeOff,
  Heart,
  MapPin,
  Lock,
  Bell,
  User,
  Send,
  Star,
  Clock,
  House,
  Search,
  CirclePlus,
  Mail,
  LogIn,
  Circle,
  Phone,
  Banknote,
  CircleX,
  Pencil,
  LogOut,
  Map,
  Users,
  CircleUserRound,
  UtensilsCrossed,
  Trash2,
} from "lucide-react-native";

const ICONS = {
  "briefcase-outline": Briefcase,
  "call-outline": Phone,
  "cash-outline": Banknote,
  "close-circle-outline": CircleX,
  "create-outline": Pencil,
  "log-out-outline": LogOut,
  "map-outline": Map,
  "paper-plane-outline": Send,
  "people-outline": Users,
  "person-circle-outline": CircleUserRound,
  "restaurant-outline": UtensilsCrossed,
  "trash-outline": Trash2,
  "arrow-back": ArrowLeft,
  "business-outline": Briefcase,
  "calendar-outline": CalendarDays,
  "camera-outline": Camera,
  "chatbubble-outline": MessageCircle,
  "chatbubble-ellipses-outline": MessageCircle,
  "checkmark": Check,
  "checkmark-circle": CircleCheck,
  "chevron-down": ChevronDown,
  "chevron-forward": ChevronRight,
  "close": X,
  "eye-outline": Eye,
  "eye-off-outline": EyeOff,
  "heart": Heart,
  "heart-outline": Heart,
  "home-outline": House,
  "location-outline": MapPin,
  "lock-closed-outline": Lock,
  "notifications-outline": Bell,
  "person-outline": User,
  "search-outline": Search,
  "add-circle-outline": CirclePlus,
  "send": Send,
  "star": Star,
  "time-outline": Clock,
  "mail-outline": Mail,
  "log-in-outline": LogIn,
  "alert-circle-outline": Bell,
  "information-circle-outline": Bell,
  "checkmark-circle-outline": CircleCheck,
  "warning-outline": Bell,
  "help-circle-outline": Bell,
};

export function Ionicons({
  name,
  size = 24,
  color = "#FFFFFF",
  style,
  ...props
}) {
  const Icon = ICONS[name];

  if (!Icon) {
    console.warn("TURAX_UNKNOWN_ICON:", name);
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderWidth: 2,
            borderColor: color,
            borderRadius: Math.max(2, size / 4),
          },
          style,
        ]}
      />
    );
  }

  return (
    <Icon
      size={size}
      color={color}
      style={style}
      strokeWidth={2}
      {...props}
    />
  );
}

export default Ionicons;

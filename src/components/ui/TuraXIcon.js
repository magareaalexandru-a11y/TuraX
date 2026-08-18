import React from "react";
import * as Icons from "lucide-react-native";

const ICONS = {
  "arrow-back": Icons.ArrowLeft,
  "business-outline": Icons.Briefcase,
  "calendar-outline": Icons.CalendarDays,
  "camera-outline": Icons.Camera,
  "chatbubble-outline": Icons.MessageCircle,
  "checkmark": Icons.Check,
  "checkmark-circle": Icons.CircleCheck,
  "chevron-down": Icons.ChevronDown,
  "chevron-forward": Icons.ChevronRight,
  "close": Icons.X,
  "eye-outline": Icons.Eye,
  "eye-off-outline": Icons.EyeOff,
  "heart": Icons.Heart,
  "heart-outline": Icons.Heart,
  "location-outline": Icons.MapPin,
  "lock-closed-outline": Icons.Lock,
  "notifications-outline": Icons.Bell,
  "person-outline": Icons.User,
  "send": Icons.Send,
  "star": Icons.Star,
  "time-outline": Icons.Clock,
};

export function Ionicons({
  name,
  size = 24,
  color = "#FFFFFF",
  style,
  ...props
}) {
  const Icon = ICONS[name] || Icons.Circle;

  return (
    <Icon
      width={size}
      height={size}
      size={size}
      color={color}
      style={style}
      strokeWidth={2}
      {...props}
    />
  );
}

export default Ionicons;

import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { C } from "../../constants/appConstants";
import { Shell, ScreenScroll, Title, Field, Chip, Button } from "../../components/ui/BasicUI";
import { EmptyCard } from "../../components/ui/FeedbackUI";
import ShiftCard from "../../components/shifts/ShiftCard";
import { hasShiftEnded } from "../../utils/appUtils";

export default function ShiftsScreen({
  role,
  shifts,
  query,
  setQuery,
  filter,
  setFilter,
  favorites,
  onFavorite,
  onOpenShift,
  onDeleteHistory,
  refreshing,
  onRefresh,
}) {
  const filterItems = role === "waiter"
    ? ["Toate", "Azi", "Mâine", "Weekend", "Favorite"]
    : ["Toate", "Active", "Ocupate", "Finalizate", "Anulate"];

  return (
    <Shell>
      <ScreenScroll refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />} bottom={110}>
        <Title subtitle={role === "waiter" ? "Caută după locație, oraș sau rol." : "Turele publicate de locația ta."}>
          {role === "waiter" ? "Ture disponibile" : "Turele mele"}
        </Title>
        <Field icon="search-outline" value={query} onChangeText={setQuery} placeholder="Caută..." />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} keyboardShouldPersistTaps="handled">
          {filterItems.map((x) => <Chip key={x} label={x} selected={filter === x} onPress={() => setFilter(x)} />)}
        </ScrollView>

        {shifts.length === 0 ? (
          <EmptyCard title="Nicio tură găsită" text="Încearcă alt filtru sau revino mai târziu." />
        ) : (
          shifts.map((s) => {
            const canDeleteFromHistory = role === "manager" && (
              hasShiftEnded(s) || ["completed", "cancelled"].includes(s.status)
            );

            return (
              <View key={s.id}>
                <ShiftCard
                  shift={s}
                  showStatus={role === "manager"}
                  favorite={favorites.includes(s.id)}
                  onFavorite={role === "waiter" ? () => onFavorite(s.id) : null}
                  onPress={() => onOpenShift(s)}
                />
                {canDeleteFromHistory && (
                  <Button
                    label="Șterge din istoric"
                    icon="trash-outline"
                    danger
                    onPress={() => onDeleteHistory("shift", s.id, "Această tură")}
                    style={{ marginTop: -4, marginBottom: 16 }}
                  />
                )}
              </View>
            );
          })
        )}
      </ScreenScroll>
    </Shell>
  );
}

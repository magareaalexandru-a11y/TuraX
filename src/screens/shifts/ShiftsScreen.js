import React from "react";
import {
  RefreshControl,
  ScrollView,
  } from "react-native";

import { C } from "../../constants/appConstants";

import {
  Shell,
  ScreenScroll,
  Title,
  Field,
  Chip,
} from "../../components/ui/BasicUI";
import { EmptyCard } from "../../components/ui/FeedbackUI";

import ShiftCard from "../../components/shifts/ShiftCard";

export default function ShiftsScreen({ role, shifts, query, setQuery, filter, setFilter, favorites, onFavorite, onOpenShift, refreshing, onRefresh }) {
  const filterItems = role === "waiter" ? ["Toate", "Azi", "Mâine", "Weekend", "Favorite"] : ["Toate", "Active", "Ocupate", "Finalizate", "Anulate"];
  return (
    <Shell>
      <ScreenScroll refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />} bottom={110}>
        <Title subtitle={role === "waiter" ? "Caută după locație, oraș sau rol." : "Turele publicate de locația ta."}>{role === "waiter" ? "Ture disponibile" : "Turele mele"}</Title>
        <Field icon="search-outline" value={query} onChangeText={setQuery} placeholder="Caută..." />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} keyboardShouldPersistTaps="handled">
          {filterItems.map((x) => <Chip key={x} label={x} selected={filter === x} onPress={() => setFilter(x)} />)}
        </ScrollView>
        {shifts.length === 0 ? (
          <EmptyCard title="Nicio tură găsită" text="Încearcă alt filtru sau revino mai târziu." />
        ) : (
          shifts.map((s) => (
            <ShiftCard key={s.id} shift={s} showStatus={role === "manager"} favorite={favorites.includes(s.id)} onFavorite={role === "waiter" ? () => onFavorite(s.id) : null} onPress={() => onOpenShift(s)} />
          ))
        )}
      </ScreenScroll>
    </Shell>
  );
}

// TURAX_HOTFIX_PICKER_3_1_2_1

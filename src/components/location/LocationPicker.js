import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";

import { C } from "../../constants/appConstants";
import { Field } from "../ui/BasicUI";
import { supabase } from "../../lib/supabase";

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0B1626" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#A8B1C2" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0B1626" }] },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#24344A" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#101E30" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8490A5" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1B2B40" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#111D2C" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#C4CBD6" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#16263A" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#06101D" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#66758C" }],
  },
];

function addressFromPlace(place) {
  if (!place) return { city: "", address: "" };

  const city =
    place.city ||
    place.subregion ||
    place.region ||
    "";

  const streetBase =
    place.street ||
    place.name ||
    place.district ||
    "";

  const streetNumber =
    place.streetNumber &&
    !String(streetBase).includes(String(place.streetNumber))
      ? String(place.streetNumber)
      : "";

  const address = [streetBase, streetNumber]
    .filter(Boolean)
    .join(" ")
    .trim();

  return { city, address };
}

export function LocationPicker({
  city,
  address,
  onChangeCity,
  onChangeAddress,
}) {
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [citySuggestions, setCitySuggestions] = useState([]);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [citySearching, setCitySearching] = useState(false);
  const [addressSearching, setAddressSearching] = useState(false);

  const skipCityLookup = useRef(false);
  const skipAddressLookup = useRef(false);
  const mapRef = useRef(null);
  const sessionToken = useRef(
    `turax-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

  const renewSessionToken = () => {
    sessionToken.current =
      `turax-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  };

  const callPlaces = async (body) => {
    const { data, error } = await supabase.functions.invoke(
      "places-autocomplete",
      {
        body: {
          ...body,
          sessionToken: sessionToken.current,
        },
      }
    );

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return data;
  };

  useEffect(() => {
    const query = String(city || "").trim();

    if (skipCityLookup.current) {
      skipCityLookup.current = false;
      setCitySuggestions([]);
      return;
    }

    if (query.length < 2) {
      setCitySuggestions([]);
      setCitySearching(false);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setCitySearching(true);

      try {
        const data = await callPlaces({
          action: "autocomplete",
          input: query,
          cityOnly: true,
        });

        if (!cancelled) {
          setCitySuggestions(data?.suggestions || []);
        }
      } catch (error) {
        console.log("TuraX city autocomplete:", error?.message || error);
        if (!cancelled) setCitySuggestions([]);
      } finally {
        if (!cancelled) setCitySearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [city]);

  useEffect(() => {
    const query = String(address || "").trim();

    if (skipAddressLookup.current) {
      skipAddressLookup.current = false;
      setAddressSuggestions([]);
      return;
    }

    if (query.length < 2) {
      setAddressSuggestions([]);
      setAddressSearching(false);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setAddressSearching(true);

      try {
        const searchText = city
          ? `${query}, ${city}`
          : query;

        const data = await callPlaces({
          action: "autocomplete",
          input: searchText,
          cityOnly: false,
        });

        if (!cancelled) {
          setAddressSuggestions(data?.suggestions || []);
        }
      } catch (error) {
        console.log("TuraX address autocomplete:", error?.message || error);
        if (!cancelled) setAddressSuggestions([]);
      } finally {
        if (!cancelled) setAddressSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [address, city]);

  const applyPlaceToMap = (place) => {
    if (
      typeof place?.latitude !== "number" ||
      typeof place?.longitude !== "number"
    ) {
      return;
    }

    const nextRegion = {
      latitude: place.latitude,
      longitude: place.longitude,
      latitudeDelta: 0.0035,
      longitudeDelta: 0.0035,
    };

    setRegion(nextRegion);

    setTimeout(() => {
      mapRef.current?.animateToRegion(nextRegion, 500);
    }, 50);
  };

  const selectCitySuggestion = async (suggestion) => {
    setCitySuggestions([]);
    setLocationError("");
    setCitySearching(true);

    try {
      const data = await callPlaces({
        action: "details",
        placeId: suggestion.placeId,
      });

      const place = data?.place;
      const selectedCity =
        place?.city ||
        place?.name ||
        suggestion.mainText ||
        suggestion.text;

      if (selectedCity) {
        skipCityLookup.current = true;
        onChangeCity(selectedCity);
      }

      applyPlaceToMap(place);
      renewSessionToken();
    } catch (error) {
      console.log("TuraX city selection:", error?.message || error);
      setLocationError("Nu am putut încărca orașul selectat.");
    } finally {
      setCitySearching(false);
    }
  };

  const selectAddressSuggestion = async (suggestion) => {
    setAddressSuggestions([]);
    setLocationError("");
    setAddressSearching(true);

    try {
      const data = await callPlaces({
        action: "details",
        placeId: suggestion.placeId,
      });

      const place = data?.place;

      if (place?.city) {
        skipCityLookup.current = true;
        onChangeCity(place.city);
      }

      const selectedAddress =
        place?.street ||
        place?.name ||
        suggestion.mainText ||
        place?.formattedAddress ||
        suggestion.text;

      if (selectedAddress) {
        skipAddressLookup.current = true;
        onChangeAddress(selectedAddress);
      }

      applyPlaceToMap(place);
      renewSessionToken();
    } catch (error) {
      console.log("TuraX address selection:", error?.message || error);
      setLocationError("Nu am putut încărca adresa selectată.");
    } finally {
      setAddressSearching(false);
    }
  };

  const renderSuggestions = (items, searching, onSelect) => {
    if (!searching && !items.length) return null;

    return (
      <View
        style={{
          marginTop: -8,
          marginBottom: 14,
          borderWidth: 1,
          borderColor: C.border,
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: C.panel,
        }}
      >
        {searching && !items.length ? (
          <View
            style={{
              minHeight: 48,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 14,
            }}
          >
            <ActivityIndicator size="small" color={C.gold} />
            <Text
              style={{
                color: C.muted,
                marginLeft: 10,
                fontSize: 13,
              }}
            >
              Se caută...
            </Text>
          </View>
        ) : (
          items.map((item, index) => (
            <TouchableOpacity
              key={item.placeId}
              activeOpacity={0.75}
              onPress={() => onSelect(item)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderBottomWidth:
                  index === items.length - 1 ? 0 : 1,
                borderBottomColor: C.border,
              }}
            >
              <Text
                style={{
                  color: C.text,
                  fontSize: 15,
                  fontWeight: "700",
                }}
              >
                {item.mainText || item.text}
              </Text>

              {!!item.secondaryText && (
                <Text
                  style={{
                    color: C.muted,
                    fontSize: 12,
                    marginTop: 3,
                  }}
                >
                  {item.secondaryText}
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  };

  const resolveCoordinates = async (latitude, longitude) => {
    setRegion({
      latitude,
      longitude,
      latitudeDelta: 0.008,
      longitudeDelta: 0.008,
    });

    try {
      const places = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const resolved = addressFromPlace(places?.[0]);

      if (resolved.city) onChangeCity(resolved.city);
      if (resolved.address) onChangeAddress(resolved.address);
    } catch (error) {
      console.log("TuraX reverse geocode:", error?.message || error);
      setLocationError(
        "Locația a fost găsită, dar adresa nu a putut fi completată automat."
      );
    }
  };

  const useCurrentLocation = async () => {
    if (loading) return;

    setLoading(true);
    setLocationError("");

    try {
      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setLocationError(
          "Permisiunea pentru locație nu a fost acordată. Poți completa orașul și strada manual."
        );
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      await resolveCoordinates(
        current.coords.latitude,
        current.coords.longitude
      );
    } catch (error) {
      console.log("TuraX current location:", error?.message || error);
      setLocationError(
        "Nu am putut determina locația. Verifică dacă GPS-ul este pornit sau completează manual."
      );
    } finally {
      setLoading(false);
    }
  };

  const moveMarker = async (event) => {
    const coordinate = event?.nativeEvent?.coordinate;
    if (!coordinate) return;

    setLocationError("");

    await resolveCoordinates(
      coordinate.latitude,
      coordinate.longitude
    );
  };

  return (
    <View style={{ marginBottom: 6 }}>
      <TouchableOpacity
        onPress={useCurrentLocation}
        activeOpacity={0.82}
        disabled={loading}
        style={{
          minHeight: 54,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: C.gold,
          backgroundColor: C.panel2,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          marginBottom: 12,
          paddingHorizontal: 16,
        }}
      >
        {loading ? (
          <ActivityIndicator color={C.gold} />
        ) : (
          <Text
            style={{
              color: C.gold,
              fontSize: 16,
              fontWeight: "900",
            }}
          >
            📍 Folosește locația mea
          </Text>
        )}
      </TouchableOpacity>

      {locationError ? (
        <Text
          style={{
            color: C.muted,
            fontSize: 12,
            lineHeight: 18,
            marginBottom: 10,
          }}
        >
          {locationError}
        </Text>
      ) : null}

      {region ? (
        <View
          style={{
            height: 220,
            borderRadius: 20,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: C.border,
            backgroundColor: C.panel,
            marginBottom: 14,
          }}
        >
          <MapView
        ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1 }}
            region={region}
            onRegionChangeComplete={setRegion}
            customMapStyle={DARK_MAP_STYLE}
          >
            <Marker
              coordinate={{
                latitude: region.latitude,
                longitude: region.longitude,
              }}
              draggable
              pinColor={C.gold}
              onDragEnd={moveMarker}
            />
          </MapView>

          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 12,
              right: 12,
              bottom: 10,
              backgroundColor: "rgba(2,11,22,0.86)",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                color: C.text,
                fontSize: 12,
                textAlign: "center",
              }}
            >
              Poți muta pinul pentru a corecta locația.
            </Text>
          </View>
        </View>
      ) : (
        <View
          style={{
            minHeight: 105,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: C.border,
            backgroundColor: C.panel,
            justifyContent: "center",
            alignItems: "center",
            padding: 18,
            marginBottom: 14,
          }}
        >
          <Text
            style={{
              color: C.muted,
              fontSize: 13,
              lineHeight: 19,
              textAlign: "center",
            }}
          >
            Harta va apărea aici după detectarea locației.
          </Text>
        </View>
      )}

      <Field
        icon="location-outline"
        value={city || ""}
        onChangeText={(value) => {
          setLocationError("");
          onChangeCity(value);
        }}
        placeholder="Oraș *"
      />

      {renderSuggestions(
        citySuggestions,
        citySearching,
        selectCitySuggestion
      )}

      <Field
        icon="map-outline"
        value={address || ""}
        onChangeText={(value) => {
          setLocationError("");
          onChangeAddress(value);
        }}
        placeholder="Stradă / Zonă"
      />

      {renderSuggestions(
        addressSuggestions,
        addressSearching,
        selectAddressSuggestion
      )}
    </View>
  );
}

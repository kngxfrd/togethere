import * as Location from "expo-location";
import { Search } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  LayoutChangeEvent,
  PanResponder,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const COLLAPSED_HEIGHT = 140;
const SHEET_GAP = 95; // space left between the search box and the sheet when expanded

// Fallback coordinate used until real location comes back
const FALLBACK_COORD = { latitude: 5.6037, longitude: -0.187 };

// Nominatim requires a descriptive User-Agent identifying your app per their usage policy
const NOMINATIM_USER_AGENT = "Togethere/1.0 (contact@yourapp.com)";

type PlaceSuggestion = {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
};

export default function home() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const [pickupCoord, setPickupCoord] = useState(FALLBACK_COORD);

  // --- Search / autocomplete state ---
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fallback until the search box is measured
  const [expandedHeight, setExpandedHeight] = useState(SCREEN_HEIGHT * 0.85);
  const expandedHeightRef = useRef(expandedHeight);

  const translateY = useRef(
    new Animated.Value(expandedHeight - COLLAPSED_HEIGHT),
  ).current;
  const lastOffset = useRef(expandedHeight - COLLAPSED_HEIGHT);

  // Request permission + get live location on mount
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }

      const initial = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coord = {
        latitude: initial.coords.latitude,
        longitude: initial.coords.longitude,
      };
      setPickupCoord(coord);
      mapRef.current?.animateToRegion(
        { ...coord, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        500,
      );

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 3000,
          distanceInterval: 10,
        },
        (loc) => {
          setPickupCoord({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        },
      );
    })();

    return () => {
      subscription?.remove();
    };
  }, []);

  // Debounced fetch to OpenStreetMap Nominatim whenever the query changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setSuggestions([]);
      setSearching(false);
      setSearchError(null);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: query,
          format: "json",
          limit: "5",
          // Bias results toward the user's current area
          viewbox: `${pickupCoord.longitude - 0.5},${pickupCoord.latitude + 0.5},${pickupCoord.longitude + 0.5},${pickupCoord.latitude - 0.5}`,
          bounded: "0", // 0 = prefer viewbox but don't restrict strictly to it
        });

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${params}`,
          {
            headers: {
              "User-Agent": NOMINATIM_USER_AGENT,
            },
          },
        );

        if (!res.ok) {
          setSearchError(`Request failed (${res.status})`);
          setSuggestions([]);
          return;
        }

        const data: PlaceSuggestion[] = await res.json();
        setSearchError(null);
        setSuggestions(data);
      } catch (err) {
        console.error("Nominatim search error:", err);
        setSearchError("Network error");
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 500); // Nominatim asks for max 1 req/sec, so debounce a bit longer than before

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelectSuggestion = (place: PlaceSuggestion) => {
    setQuery(place.display_name);
    setSuggestions([]);

    mapRef.current?.animateToRegion(
      {
        latitude: parseFloat(place.lat),
        longitude: parseFloat(place.lon),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      500,
    );
  };

  const handleSearchBoxLayout = (e: LayoutChangeEvent) => {
    const { height } = e.nativeEvent.layout;
    const searchBoxBottom = insets.top + 12 + height;
    const newExpandedHeight = SCREEN_HEIGHT - searchBoxBottom - SHEET_GAP;

    expandedHeightRef.current = newExpandedHeight;
    setExpandedHeight(newExpandedHeight);

    const newCollapsedOffset = newExpandedHeight - COLLAPSED_HEIGHT;
    lastOffset.current = newCollapsedOffset;
    translateY.setValue(newCollapsedOffset);
  };

  const springTo = (toValue: number) => {
    lastOffset.current = toValue;
    Animated.spring(translateY, {
      toValue,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
      onPanResponderMove: (_, gesture) => {
        const maxOffset = expandedHeightRef.current - COLLAPSED_HEIGHT;
        const next = lastOffset.current + gesture.dy;
        const clamped = Math.max(0, Math.min(maxOffset, next));
        translateY.setValue(clamped);
      },
      onPanResponderRelease: (_, gesture) => {
        const maxOffset = expandedHeightRef.current - COLLAPSED_HEIGHT;
        const current = lastOffset.current + gesture.dy;
        const midpoint = maxOffset / 2;

        if (gesture.vy > 0.5) {
          springTo(maxOffset);
        } else if (gesture.vy < -0.5) {
          springTo(0);
        } else if (current > midpoint) {
          springTo(maxOffset);
        } else {
          springTo(0);
        }
      },
    }),
  ).current;

  return (
    <SafeAreaView className="flex-1" edges={[]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        showsUserLocation
        showsMyLocationButton={false}
        initialRegion={{
          latitude: pickupCoord.latitude,
          longitude: pickupCoord.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      />

      <View
        style={{ top: insets.top + 12, zIndex: 20 }}
        className="absolute left-5 mt-2 right-20"
        onLayout={handleSearchBoxLayout}
      >
        <View
          className="flex-row items-center rounded-3xl px-5 py-3 bg-white"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Search size={18} color="#6b7280" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Where are you going"
            placeholderTextColor="#9ca3af"
            style={{ outlineStyle: "none" } as any}
            className="flex-1 ml-2 text-base text-gray-900"
          />
          {searching && <ActivityIndicator size="small" color="#9ca3af" />}
        </View>

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <View
            className="mt-2 bg-white rounded-2xl overflow-hidden"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 5,
              zIndex: 20,
              maxHeight: 260,
            }}
          >
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.place_id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="px-4 py-3 border-b border-gray-100"
                  onPress={() => handleSelectSuggestion(item)}
                >
                  <Text className="text-gray-900 text-sm">
                    {item.display_name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Error state, only shown once the user has typed enough to trigger a search */}
        {!searching && searchError && query.trim().length >= 2 && (
          <View
            className="mt-2 bg-white rounded-2xl px-4 py-3"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 5,
              zIndex: 20,
            }}
          >
            <Text className="text-red-500 text-sm">{searchError}</Text>
          </View>
        )}
      </View>

      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: expandedHeight,
          transform: [{ translateY }],
        }}
        className="bg-white rounded-t-3xl"
        {...panResponder.panHandlers}
      >
        <View
          className="absolute inset-0 rounded-t-3xl bg-white"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 10,
          }}
        />

        <View className="items-center py-3">
          <View className="w-10 h-1.5 rounded-full bg-gray-300" />
        </View>

        <View className="px-5">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Recent Searches
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
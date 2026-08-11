import { Coordinate, PostedRide, useRides } from "@/contexts/RideContext";
import * as Location from "expo-location";
import { LocateFixed, MapPin, Search } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  LayoutChangeEvent,
  PanResponder,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const COLLAPSED_HEIGHT = 140;
const SHEET_GAP = 95;
const PEEK_HEIGHT = 200;

const FALLBACK_COORD = { latitude: 5.6037, longitude: -0.187 };
const CURRENT_COMMUTER_NAME = "You";
const MAX_RECENT_SEARCHES = 5;

function DriverMarker({
  ride,
  isSelected,
  isMatch,
  onPress,
}: {
  ride: PostedRide;
  isSelected: boolean;
  isMatch: boolean;
  onPress: () => void;
}) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true);

    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [isSelected, ride.destination]);

  if (!ride.driverLocation) return null;

  return (
    <Marker
      coordinate={ride.driverLocation}
      anchor={{ x: 0.5, y: 1 }}
      opacity={isMatch ? 1 : 0.35}
      onPress={onPress}
      tracksViewChanges={tracksViewChanges}
      zIndex={isSelected ? 1000 : 1}
    >
      <View style={{ alignItems: "center" }}>
        <View
          style={{
            backgroundColor: isSelected ? "#C0392B" : "#ffffff",
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 5,
            marginBottom: 4,
            minWidth: 55,
            maxWidth: 170,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
            elevation: 3,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              fontSize: 12,
              fontWeight: "600",
              textAlign: "center",
              color: isSelected ? "#fff" : "#111827",
            }}
          >
            {ride.destination}
          </Text>
        </View>

        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: isSelected
              ? "rgba(17,24,39,0.18)"
              : "rgba(249,115,22,0.18)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "#fff",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: isSelected ? "#111827" : "#C0392B",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 3,
              elevation: 5,
            }}
          >
            <Image
              source={require("../../pics/Sedan-160-temp.png")}
              style={{ width: 22, height: 22 }}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
    </Marker>
  );
}

export default function home() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { postedRides, requests, requestRide } = useRides();

  const [pickupCoord, setPickupCoord] = useState(FALLBACK_COORD);
  const [hasCenteredOnUser, setHasCenteredOnUser] = useState(false);

  // --- Search state — filters against the destinations already on the map ---
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // --- Recent searches (session-only; swap for persisted storage later) ---
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // --- Ride selected from a map marker, shown in the bottom sheet ---
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);

  const [expandedHeight, setExpandedHeight] = useState(SCREEN_HEIGHT * 0.85);
  const expandedHeightRef = useRef(expandedHeight);

  // How far the search box + dropdown extend down from the top — used so
  // "centered" means centered in the visible strip of map, not the full
  // screen (which is partly covered by the search UI and the sheet).
  const topObstructionRef = useRef(insets.top + 12 + 60);

  const translateY = useRef(
    new Animated.Value(expandedHeight - COLLAPSED_HEIGHT),
  ).current;
  const lastOffset = useRef(expandedHeight - COLLAPSED_HEIGHT);

  const driverMarkers = useMemo(
    () => postedRides.filter((r) => r.driverLocation),
    [postedRides],
  );

  const matchingRides = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return driverMarkers;
    return driverMarkers.filter((r) => r.destination.toLowerCase().includes(q));
  }, [query, driverMarkers]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return [];
    return matchingRides;
  }, [query, matchingRides]);

  // Frames the given coordinates so they land centered in the map area
  // that's actually visible — i.e. below the search box/dropdown and
  // above the collapsed bottom sheet.
  const centerOnCoordinates = (coords: Coordinate[]) => {
    if (coords.length === 0) return;

    if (coords.length === 1) {
      mapRef.current?.animateToRegion(
        {
          ...coords[0],
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        350,
      );
      return;
    }

    mapRef.current?.fitToCoordinates(coords, {
      edgePadding: {
        top: topObstructionRef.current + 40,
        right: 70,
        bottom: COLLAPSED_HEIGHT + 40,
        left: 70,
      },
      animated: true,
    });
  };

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
      setHasCenteredOnUser(true);

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

  // Frame the map around the user + all drivers once, when both are known.
  useEffect(() => {
    if (!hasCenteredOnUser) return;
    const coords = driverMarkers
      .map((r) => r.driverLocation)
      .filter((c): c is Coordinate => !!c);
    centerOnCoordinates([pickupCoord, ...coords]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCenteredOnUser, driverMarkers.length]);

  // Center on whatever the search currently matches.
  useEffect(() => {
    if (query.trim().length === 0) return;
    const coords = matchingRides
      .map((r) => r.driverLocation)
      .filter((c): c is Coordinate => !!c);
    centerOnCoordinates(coords);
  }, [matchingRides, query]);

  const addRecentSearch = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const withoutDupe = prev.filter(
        (s) => s.toLowerCase() !== trimmed.toLowerCase(),
      );
      return [trimmed, ...withoutDupe].slice(0, MAX_RECENT_SEARCHES);
    });
  };

  const goToRide = (ride: PostedRide) => {
    setSelectedRideId(ride.id);
    setShowSuggestions(false);
    if (ride.driverLocation) {
      centerOnCoordinates([ride.driverLocation]);
    }

    // Bring the sheet up just enough to show the ride card and stay
    // interactive, but don't pull it down if it's already more open
    // than that (e.g. the user had it fully expanded already).
    const peekOffset = Math.max(
      0,
      expandedHeightRef.current - PEEK_HEIGHT,
    );
    if (lastOffset.current > peekOffset) {
      springTo(peekOffset);
    }
  };

  const handleSelectSuggestion = (ride: PostedRide) => {
    setQuery(ride.destination);
    addRecentSearch(ride.destination);
    goToRide(ride);

    if (lastOffset.current > 20) {
      springTo(0);
    }
  };

  const handleSubmitSearch = () => {
    addRecentSearch(query);
    setShowSuggestions(false);
  };

  const handleTapRecentSearch = (text: string) => {
    setQuery(text);
    addRecentSearch(text);
  };

  // Always recenters on wherever pickupCoord currently is — kept live by
  // the watchPositionAsync subscription above, so this never snaps back
  // to a stale location.
  const handleRecenter = () => {
    mapRef.current?.animateToRegion(
      {
        ...pickupCoord,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      350,
    );
  };

  // Tapping the map outside any marker clears the selection and drops
  // the sheet back to its original collapsed state.
  const handleDeselect = () => {
    if (!selectedRideId) return;
    setSelectedRideId(null);
    const maxOffset = expandedHeightRef.current - COLLAPSED_HEIGHT;
    springTo(maxOffset);
  };

  const selectedRide: PostedRide | undefined =
    postedRides.find((r) => r.id === selectedRideId) ?? undefined;

  const selectedRideStatus = selectedRide
  ? requests.find((r) => r.rideId === selectedRide.id)?.status
  : undefined;

  const handleRequestRide = () => {
  if (!selectedRide) return;
  requestRide(selectedRide);
};

  const handleSearchBoxLayout = (e: LayoutChangeEvent) => {
    const { height } = e.nativeEvent.layout;
    const searchBoxBottom = insets.top + 12 + height;
    topObstructionRef.current = searchBoxBottom;

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
        onPress={handleDeselect}
        initialRegion={{
          latitude: pickupCoord.latitude,
          longitude: pickupCoord.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {driverMarkers.map((ride) => (
          <DriverMarker
            key={ride.id}
            ride={ride}
            isSelected={ride.id === selectedRideId}
            isMatch={
              query.trim().length === 0 ||
              matchingRides.some((m) => m.id === ride.id)
            }
            onPress={() => goToRide(ride)}
          />
        ))}
      </MapView>

      <TouchableOpacity
        onPress={handleRecenter}
        activeOpacity={0.8}
        style={{
          position: "absolute",
          right: 16,
          bottom: COLLAPSED_HEIGHT + 20,
          zIndex: 15,
          width: 46,
          height: 46,
          borderRadius: 23,
          backgroundColor: "#fff",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 6,
        }}
      >
        <LocateFixed size={22} color="#C0392B" />
      </TouchableOpacity>

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
            onChangeText={(text) => {
              setQuery(text);
              setShowSuggestions(true);
              setSelectedRideId(null);
            }}
            onFocus={() => setShowSuggestions(true)}
            onSubmitEditing={handleSubmitSearch}
            returnKeyType="search"
            placeholder="Search destinations on the map"
            placeholderTextColor="#9ca3af"
            style={{ outlineStyle: "none" } as any}
            className="flex-1 ml-2 text-base text-gray-900"
          />
        </View>

        {showSuggestions && query.trim().length > 0 && (
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
            {suggestions.length > 0 ? (
              <FlatList
                data={suggestions}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="flex-row items-center px-4 py-3 border-b border-gray-100"
                    onPress={() => handleSelectSuggestion(item)}
                  >
                    <View className="w-8 h-8 rounded-full bg-[#FDEDEC] items-center justify-center mr-3">
                      <MapPin size={16} color="#C0392B" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 text-sm font-medium">
                        {item.destination}
                      </Text>
                      <Text className="text-gray-500 text-xs mt-0.5">
                        {item.driverName} · {item.fare}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View className="px-4 py-3">
                <Text className="text-gray-500 text-sm">
                  No drivers heading to "{query.trim()}"
                </Text>
              </View>
            )}
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

        {selectedRide ? (
          <View className="px-5">
            <View className="flex-row items-center mb-1">
              <View className="w-7 h-7 rounded-full bg-[#FDEDEC] items-center justify-center mr-2">
                <MapPin size={14} color="#C0392B" />
              </View>
              <Text className="text-lg font-semibold text-gray-900">
                {selectedRide.driverName} → {selectedRide.destination}
              </Text>
            </View>
            <Text className="text-sm text-gray-500 mb-1">
              {selectedRide.date}
            </Text>
            <Text className="text-sm text-gray-700 mb-1">
              {selectedRide.fare}
            </Text>
            <Text className="text-sm text-gray-500 mb-4">
              {selectedRide.seatsFilled}/{selectedRide.seatsTotal} seats filled
            </Text>

            {selectedRideStatus === "accepted" ? (
              <View className="self-start bg-green-100 rounded-full px-4 py-2">
                <Text className="text-green-700 text-sm font-medium">
                  Request Accepted!
                </Text>
              </View>
            ) : selectedRideStatus === "pending" ? (
              <View className="self-start bg-yellow-100 rounded-full px-4 py-2">
                <Text className="text-yellow-700 text-sm font-medium">
                  Request sent
                </Text>
              </View>
            ) : selectedRideStatus === "declined" ? (
              <View className="self-start bg-red-100 rounded-full px-4 py-2">
                <Text className="text-red-700 text-sm font-medium">
                  Declined
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleRequestRide}
                disabled={selectedRide.seatsFilled >= selectedRide.seatsTotal}
                activeOpacity={0.8}
                className={`self-start rounded-full px-5 py-2.5 ${
                  selectedRide.seatsFilled >= selectedRide.seatsTotal
                    ? "bg-gray-200"
                    : "bg-[#C0392B]"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    selectedRide.seatsFilled >= selectedRide.seatsTotal
                      ? "text-gray-500"
                      : "text-white"
                  }`}
                >
                  {selectedRide.seatsFilled >= selectedRide.seatsTotal
                    ? "Full"
                    : "Request ride"}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => setSelectedRideId(null)}
              className="mt-4"
            >
              <Text className="text-sm text-gray-400">Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="px-5 flex-1">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Nearby drivers
            </Text>
            {driverMarkers.length === 0 ? (
              <Text className="text-gray-500 mt-2">
                No drivers have posted rides yet.
              </Text>
            ) : (
              <FlatList
                data={matchingRides}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="flex-row items-center py-3 border-b border-gray-100"
                    onPress={() => goToRide(item)}
                  >
                    <View className="w-8 h-8 rounded-full bg-[#FDEDEC] items-center justify-center mr-3">
                      <MapPin size={16} color="#C0392B" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-medium text-gray-900">
                        {item.driverName} → {item.destination}
                      </Text>
                      <View className="flex-row justify-between mt-1">
                        <Text className="text-sm text-gray-500">{item.date}</Text>
                        <Text className="text-sm text-gray-700">{item.fare}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text className="text-gray-500 mt-2">
                    No drivers heading to "{query.trim()}"
                  </Text>
                }
              />
            )}

            {query.trim().length === 0 && recentSearches.length > 0 && (
              <>
                <Text className="text-lg font-semibold text-gray-900 mt-6 mb-2">
                  Recent Searches
                </Text>
                {recentSearches.map((s) => (
                  <TouchableOpacity
                    key={s}
                    className="flex-row items-center py-3 border-b border-gray-100"
                    onPress={() => handleTapRecentSearch(s)}
                  >
                    <MapPin size={16} color="#C0392B" style={{ marginRight: 10 }} />
                    <Text className="text-base text-gray-900">{s}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}
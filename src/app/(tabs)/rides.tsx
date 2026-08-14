import { useRef, useState, useCallback } from "react";
import { MapPin, Plus, X } from "lucide-react-native";
import * as Location from "expo-location";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Animated,
  Dimensions,
  FlatList,
  PanResponder,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { useUserRole } from "@/hooks/useUserRole";
import { useRides, PostedRide } from "@/contexts/RideContext";
import { useTheme } from "@/hooks/useTheme";
import { api } from "@/lib/api";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.75;

// Formats a Date as YYYY-MM-DD (zero-padded, local time — not UTC, so the
// day shown always matches the day picked on-screen).
function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Rides() {
  const role = useUserRole();
  const isDriver = role === "driver";
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const { postedRides, requests, postRide } = useRides();

  // Driver's own posted rides, fetched from the dedicated endpoint rather
  // than filtered client-side, so it's correct no matter who's logged in.
  const [myRides, setMyRides] = useState<PostedRide[]>([]);

  const loadMyRides = useCallback(async () => {
    if (!isDriver) return;
    try {
      const data = await api.get("/rides/mine/");
      setMyRides(data.map((r: any) => ({ ...r, id: String(r.id) })));
    } catch {
      // leave whatever was already shown
    }
  }, [isDriver]);

  useFocusEffect(
    useCallback(() => {
      loadMyRides();
    }, [loadMyRides])
  );

  // Post-a-ride sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fare, setFare] = useState("");
  const [seats, setSeats] = useState("");

  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  const openSheet = async () => {
    setSheetOpen(true);
    translateY.setValue(SHEET_HEIGHT);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(translateY, {
      toValue: SHEET_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSheetOpen(false);
      setDestination("");
      setDate("");
      setShowDatePicker(false);
      setFare("");
      setSeats("");
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > SHEET_HEIGHT * 0.25) {
          closeSheet();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

  const canSubmit =
    destination.trim().length > 0 &&
    date.trim().length > 0 &&
    fare.trim().length > 0 &&
    seats.trim().length > 0;

  const handlePostRide = async () => {
    if (!canSubmit) return;

    let driverLocation: { latitude: number; longitude: number } | null = null;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        driverLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      }
    } catch {
      // ride still posts without a map marker if location can't be read
    }

    try {
      // No driverName here — the backend attaches the logged-in driver
      // automatically from the JWT.
      await postRide({
        destination: destination.trim(),
        date: date.trim(),
        fare: fare.trim(),
        seatsTotal: Number(seats.trim()) || 0,
        driverLocation,
      });
      await loadMyRides();
      closeSheet();
    } catch (err: any) {
      // TODO: surface this in the sheet UI instead of swallowing it
      console.error("Failed to post ride:", err.message);
    }
  };

  return (
    <View className="flex-1">
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 px-6 pt-6 mb-6">
          {isDriver ? "Your posted rides" : "Rides"}
        </Text>

        {isDriver ? (
          <FlatList
            data={myRides}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
            renderItem={({ item }) => {
              const rideRequests = requests.filter((r) => r.rideId === item.id);
              return (
                <View className="py-4 border-b border-gray-100 dark:border-gray-800">
                  <View className="flex-row items-center">
                    <MapPin size={14} color="#C0392B" style={{ marginRight: 4 }} />
                    <Text className="text-base font-medium text-gray-900 dark:text-gray-100">
                      {item.destination}
                    </Text>
                  </View>
                  <View className="flex-row justify-between mt-1.5">
                    <Text className="text-sm text-gray-500 dark:text-gray-400">{item.date}</Text>
                    <Text className="text-sm text-gray-700 dark:text-gray-300">{item.fare}</Text>
                  </View>
                  <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-2">
                    {item.seatsFilled}/{item.seatsTotal} seats filled
                  </Text>

                  {rideRequests.length > 0 ? (
                    <View className="mt-1 gap-1">
                      {rideRequests.map((req) => (
                        <View
                          key={req.id}
                          className="flex-row items-center justify-between py-1"
                        >
                          <Text className="text-sm text-gray-700 dark:text-gray-300">
                            {req.commuterName}
                          </Text>
                          <View
                            className={`rounded-full px-3 py-1 ${
                              req.status === "accepted"
                                ? "bg-green-100 dark:bg-green-900"
                                : req.status === "declined"
                                ? "bg-red-100 dark:bg-red-900"
                                : "bg-yellow-100 dark:bg-yellow-900"
                            }`}
                          >
                            <Text
                              className={`text-xs font-medium ${
                                req.status === "accepted"
                                  ? "text-green-700 dark:text-green-300"
                                  : req.status === "declined"
                                  ? "text-red-700 dark:text-red-300"
                                  : "text-yellow-700 dark:text-yellow-300"
                              }`}
                            >
                              {req.status === "accepted"
                                ? "Accepted"
                                : req.status === "declined"
                                ? "Declined"
                                : "Pending"}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      No bookings yet
                    </Text>
                  )}
                </View>
              );
            }}
            ListEmptyComponent={
              <Text className="text-gray-500 dark:text-gray-400 mt-8 text-center">
                You haven't posted any rides yet.
              </Text>
            }
          />
        ) : (
          <FlatList
            data={postedRides}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
            renderItem={({ item }) => (
              <View className="py-4 border-b border-gray-100 dark:border-gray-800">
                <View className="flex-row items-center">
                  <MapPin size={14} color="#C0392B" style={{ marginRight: 4 }} />
                  <Text className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {item.destination}
                  </Text>
                </View>
                <View className="flex-row justify-between mt-1.5">
                  <Text className="text-sm text-gray-500 dark:text-gray-400">{item.date}</Text>
                  <Text className="text-sm text-gray-700 dark:text-gray-300">{item.fare}</Text>
                </View>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Driver — {item.driverName} · {item.seatsFilled}/{item.seatsTotal} seats filled
                </Text>
              </View>
            )}
            ListEmptyComponent={
              <Text className="text-gray-500 dark:text-gray-400 mt-8 text-center">No rides yet.</Text>
            }
          />
        )}

        {isDriver && (
          <TouchableOpacity
            onPress={openSheet}
            activeOpacity={0.85}
            style={{
              position: "absolute",
              right: 20,
              bottom: insets.bottom,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 10,
              elevation: 8,
            }}
            className="w-14 h-14 rounded-full bg-[#C0392B] items-center justify-center"
          >
            <Plus size={26} color="#ffffff" />
          </TouchableOpacity>
        )}
      </SafeAreaView>

      {sheetOpen && (
        <>
          <TouchableWithoutFeedback onPress={closeSheet}>
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: SHEET_HEIGHT,
              }}
            />
          </TouchableWithoutFeedback>

          <Animated.View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: SHEET_HEIGHT,
              backgroundColor: isDark ? "#0a0a0f" : "#ffffff",
              transform: [{ translateY }],
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              elevation: 20,
            }}
            className="rounded-t-3xl"
          >
            <View
              {...panResponder.panHandlers}
              className="flex-row items-center justify-between px-6 pt-3 pb-2"
            >
              <View style={{ width: 28 }} />
              <View className="w-10 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
              <TouchableOpacity onPress={closeSheet} hitSlop={10}>
                <X size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                Post a ride
              </Text>

              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-2">Destination</Text>
              <TextInput
                value={destination}
                onChangeText={setDestination}
                placeholder="e.g. Asafo VIP Station"
                placeholderTextColor="#9CA3AF"
                style={{ outlineStyle: "none" } as any}
                className="bg-gray-100 dark:bg-gray-900 rounded-2xl px-4 py-3.5 mb-5 text-base text-gray-900 dark:text-gray-100"
              />

              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-2">Date</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
                className="bg-gray-100 dark:bg-gray-900 rounded-2xl px-4 py-3.5 mb-5"
              >
                <Text
                  className={
                    date
                      ? "text-base text-gray-900 dark:text-gray-100"
                      : "text-base text-gray-400 dark:text-gray-500"
                  }
                >
                  {date || "YYYY-MM-DD"}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date ? new Date(date) : new Date()}
                  mode="date"
                  minimumDate={new Date()}
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === "ios");
                    if (event.type === "dismissed") return;
                    if (selectedDate) {
                      setDate(formatDate(selectedDate));
                    }
                  }}
                />
              )}

              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-2">Fare</Text>
              <TextInput
                value={fare}
                onChangeText={setFare}
                placeholder="e.g. 25.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="numbers-and-punctuation"
                style={{ outlineStyle: "none" } as any}
                className="bg-gray-100 dark:bg-gray-900 rounded-2xl px-4 py-3.5 mb-5 text-base text-gray-900 dark:text-gray-100"
              />

              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-2">Available seats</Text>
              <TextInput
                value={seats}
                onChangeText={setSeats}
                placeholder="e.g. 4"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                style={{ outlineStyle: "none" } as any}
                className="bg-gray-100 dark:bg-gray-900 rounded-2xl px-4 py-3.5 mb-8 text-base text-gray-900 dark:text-gray-100"
              />

              <TouchableOpacity
                onPress={handlePostRide}
                disabled={!canSubmit}
                activeOpacity={0.8}
                className={`rounded-2xl py-4 items-center ${
                  canSubmit ? "bg-[#C0392B]" : "bg-red-300 dark:bg-red-900"
                }`}
              >
                <Text className="text-white font-semibold text-base">
                  Post Ride
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </>
      )}
    </View>
  );
}
import { useRef, useState } from "react";
import { Plus, X } from "lucide-react-native";
import * as Location from "expo-location";
import {
  Animated,
  Dimensions,
  FlatList,
  PanResponder,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useUserRole } from "@/hooks/useUserRole";
import { useRides } from "@/contexts/RideContext";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.75;

// Placeholder identity until real auth/profile data is wired in.
const CURRENT_DRIVER_NAME = "Kwame";

export default function Rides() {
  const role = useUserRole();
  const isDriver = role === "driver";
  const insets = useSafeAreaInsets();

  const { postedRides, requests, postRide } = useRides();

  // Post-a-ride sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
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

    // Capture the driver's current location at the moment they post,
    // so this ride actually shows up as a marker on the commuter's map.
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
      // If location can't be read, the ride still posts — it just won't
      // appear as a map marker until driverLocation is available.
    }

    postRide({
      driverName: CURRENT_DRIVER_NAME,
      destination: destination.trim(),
      date: date.trim(),
      fare: fare.trim(),
      seatsTotal: Number(seats.trim()) || 0,
      driverLocation,
    });

    closeSheet();
  };

  return (
    <View className="flex-1">
      <SafeAreaView className="flex-1 bg-white">
        <Text className="text-2xl font-bold text-gray-900 px-6 pt-6 mb-6">
          {isDriver ? "Your posted rides" : "Available rides"}
        </Text>

        {isDriver ? (
          <FlatList
            data={postedRides.filter((r) => r.driverName === CURRENT_DRIVER_NAME)}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
            renderItem={({ item }) => {
              const rideRequests = requests.filter((r) => r.rideId === item.id);
              return (
                <View className="py-4 border-b border-gray-100">
                  <Text className="text-base font-medium text-gray-900">
                    {item.destination}
                  </Text>
                  <View className="flex-row justify-between mt-1.5">
                    <Text className="text-sm text-gray-500">{item.date}</Text>
                    <Text className="text-sm text-gray-700">{item.fare}</Text>
                  </View>
                  <Text className="text-sm text-gray-500 mt-1 mb-2">
                    {item.seatsFilled}/{item.seatsTotal} seats filled
                  </Text>

                  {rideRequests.length > 0 ? (
                    <View className="mt-1 gap-1">
                      {rideRequests.map((req) => (
                        <View
                          key={req.id}
                          className="flex-row items-center justify-between py-1"
                        >
                          <Text className="text-sm text-gray-700">
                            {req.commuterName}
                          </Text>
                          <View
                            className={`rounded-full px-3 py-1 ${
                              req.status === "accepted"
                                ? "bg-green-100"
                                : req.status === "declined"
                                ? "bg-red-100"
                                : "bg-yellow-100"
                            }`}
                          >
                            <Text
                              className={`text-xs font-medium ${
                                req.status === "accepted"
                                  ? "text-green-700"
                                  : req.status === "declined"
                                  ? "text-red-700"
                                  : "text-yellow-700"
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
                    <Text className="text-xs text-gray-400 mt-1">
                      No bookings yet
                    </Text>
                  )}
                </View>
              );
            }}
            ListEmptyComponent={
              <Text className="text-gray-500 mt-8 text-center">
                You haven't posted any rides yet.
              </Text>
            }
          />
        ) : (
          <FlatList
            data={postedRides}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
            renderItem={({ item }) => {
              return (
                <View className="py-4 border-b border-gray-100">
                  <Text className="text-base font-medium text-gray-900">
                    {item.destination}
                  </Text>
                  <View className="flex-row justify-between mt-1.5">
                    <Text className="text-sm text-gray-500">{item.date}</Text>
                    <Text className="text-sm text-gray-700">{item.fare}</Text>
                  </View>
                  <Text className="text-sm text-gray-500 mt-1">
                    Driver — {item.driverName} · {item.seatsFilled}/{item.seatsTotal} seats filled
                  </Text>
                </View>
              );
            }}
            ListEmptyComponent={
              <Text className="text-gray-500 mt-8 text-center">No rides yet.</Text>
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
              bottom: insets.bottom + 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 10,
              elevation: 8,
            }}
            className="w-14 h-14 rounded-full bg-black items-center justify-center"
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
              backgroundColor: "#ffffff",
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
              <View className="w-10 h-1.5 bg-gray-300 rounded-full" />
              <TouchableOpacity onPress={closeSheet} hitSlop={10}>
                <X size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text className="text-xl font-bold text-gray-900 mb-6">
                Post a ride
              </Text>

              <Text className="text-sm text-gray-500 mb-2">Destination</Text>
              <TextInput
                value={destination}
                onChangeText={setDestination}
                placeholder="e.g. Asafo VIP Station"
                style={{ outlineStyle: "none" } as any}
                className="bg-gray-100 rounded-2xl px-4 py-3.5 mb-5 text-base text-gray-900"
              />

              <Text className="text-sm text-gray-500 mb-2">Date</Text>
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="e.g. Jul 25, 2026"
                style={{ outlineStyle: "none" } as any}
                className="bg-gray-100 rounded-2xl px-4 py-3.5 mb-5 text-base text-gray-900"
              />

              <Text className="text-sm text-gray-500 mb-2">Fare</Text>
              <TextInput
                value={fare}
                onChangeText={setFare}
                placeholder="e.g. GHS 25.00"
                keyboardType="numbers-and-punctuation"
                style={{ outlineStyle: "none" } as any}
                className="bg-gray-100 rounded-2xl px-4 py-3.5 mb-5 text-base text-gray-900"
              />

              <Text className="text-sm text-gray-500 mb-2">Available seats</Text>
              <TextInput
                value={seats}
                onChangeText={setSeats}
                placeholder="e.g. 4"
                keyboardType="number-pad"
                style={{ outlineStyle: "none" } as any}
                className="bg-gray-100 rounded-2xl px-4 py-3.5 mb-8 text-base text-gray-900"
              />

              <TouchableOpacity
                onPress={handlePostRide}
                disabled={!canSubmit}
                activeOpacity={0.8}
                className={`rounded-2xl py-4 items-center ${
                  canSubmit ? "bg-black" : "bg-gray-300"
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
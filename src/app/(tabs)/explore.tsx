import { useCallback, useMemo, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { useRides, PostedRide } from "@/contexts/RideContext";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.6;

type SortOption = "newest" | "priceLowHigh" | "seatsAvailable";

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "priceLowHigh", label: "Price: Low to High" },
  { key: "seatsAvailable", label: "Seats Available" },
];

// Fare strings look like "$12.50" — strip anything that isn't a digit or
// decimal point so they sort numerically rather than lexicographically.
const parseFare = (fare: string) => parseFloat(fare.replace(/[^0-9.]/g, "")) || 0;

export default function Explore() {
  const { postedRides, requests, requestRide, refresh } = useRides();
  const [selectedRide, setSelectedRide] = useState<PostedRide | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const translateY = useState(new Animated.Value(SHEET_HEIGHT))[0];

  const openRide = (ride: PostedRide) => {
    setSelectedRide(ride);
    setSheetOpen(true);
    translateY.setValue(SHEET_HEIGHT);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  const closeRide = () => {
    Animated.timing(translateY, {
      toValue: SHEET_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSheetOpen(false);
      setSelectedRide(null);
    });
  };

  const panResponder = useState(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > SHEET_HEIGHT * 0.25) {
          closeRide();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
        }
      },
    })
  )[0];

  const statusFor = (ride: PostedRide) =>
    requests.find((r) => r.rideId === ride.id)?.status;

  const handleSendRequest = async () => {
    if (!selectedRide) return;
    setRequesting(true);
    try {
      await requestRide(selectedRide);
      closeRide();
    } catch (err: any) {
      console.error("Failed to send request:", err.message);
    } finally {
      setRequesting(false);
    }
  };

  const selectedStatus = selectedRide ? statusFor(selectedRide) : undefined;

  // "Newest" relies on postedRides already coming back newest-first from
  // the API (no createdAt field on PostedRide to sort by client-side), so
  // that option is a no-op copy; the other two sort explicitly.
  const sortedRides = useMemo(() => {
    const rides = [...postedRides];
    switch (sortBy) {
      case "priceLowHigh":
        return rides.sort((a, b) => parseFare(a.fare) - parseFare(b.fare));
      case "seatsAvailable":
        return rides.sort(
          (a, b) =>
            (b.seatsTotal - b.seatsFilled) - (a.seatsTotal - a.seatsFilled)
        );
      case "newest":
      default:
        return rides;
    }
  }, [postedRides, sortBy]);

  return (
    <View className="flex-1">
      <SafeAreaView className="flex-1 bg-white">
        <Text className="text-2xl font-bold text-gray-900 px-6 pt-7 mb-4">
          Explore
        </Text>

        <View className="flex-row px-6 mb-4" style={{ gap: 8 }}>
          {SORT_OPTIONS.map((opt) => {
            const active = sortBy === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setSortBy(opt.key)}
                activeOpacity={0.75}
                className={`px-3 py-1.5 rounded-full border ${
                  active
                    ? "bg-black"
                    : "bg-gray-100 border-gray-200"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    active ? "text-white" : "text-gray-700"
                  }`}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
          {sortedRides.length === 0 && (
            <Text className="text-gray-400 text-center mt-10">
              No rides posted yet — check back soon.
            </Text>
          )}

          {sortedRides.map((ride) => {
            const status = statusFor(ride);
            const full = ride.seatsFilled >= ride.seatsTotal;
            return (
              <TouchableOpacity
                key={ride.id}
                className="bg-gray-50 rounded-2xl px-4 py-4 mb-3 flex-row items-center"
                activeOpacity={0.7}
                onPress={() => openRide(ride)}
              >
                <Image
                  source={require("../../pics/Sedan-160-temp.png")}
                  style={{ width: 56, height: 56, marginRight: 12 }}
                  resizeMode="contain"
                />

                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">
                    {ride.destination}
                  </Text>
                  <Text className="text-sm text-gray-500 mt-0.5">
                    {ride.driverName} · {ride.date}
                  </Text>
                  <View className="flex-row justify-between items-center mt-2">
                    <Text className="text-sm text-gray-700">{ride.fare}</Text>
                    <Text className="text-xs text-gray-400">
                      {ride.seatsFilled}/{ride.seatsTotal} seats
                      {full ? " · Full" : ""}
                    </Text>
                  </View>
                  {status && (
                    <Text
                      className={`text-xs font-medium mt-2 ${
                        status === "accepted"
                          ? "text-green-700"
                          : status === "declined"
                          ? "text-red-700"
                          : "text-yellow-700"
                      }`}
                    >
                      {status === "accepted" ? "Accepted — check Chats" : status === "declined" ? "Declined" : "Request sent"}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {sheetOpen && (
        <>
          <TouchableWithoutFeedback onPress={closeRide}>
            <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: SHEET_HEIGHT }} />
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
            <View {...panResponder.panHandlers} className="items-center pt-3 pb-2">
              <View className="w-10 h-1.5 bg-gray-300 rounded-full" />
            </View>

            {selectedRide && (
              <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                <View className="items-center mb-4">
                  <Image
                    source={require("../../pics/Sedan-160-temp.png")}
                    style={{ width: 140, height: 140 }}
                    resizeMode="contain"
                  />
                </View>

                <Text className="text-xl font-bold text-gray-900 mb-1">
                  {selectedRide.driverName}
                </Text>
                <Text className="text-gray-500 mb-6">Driver</Text>

                <View className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <Text className="text-sm text-gray-500 mb-1">Destination</Text>
                  <Text className="text-base font-semibold text-gray-900 mb-3">
                    {selectedRide.destination}
                  </Text>
                  <Text className="text-sm text-gray-500 mb-1">Date</Text>
                  <Text className="text-base font-semibold text-gray-900 mb-3">
                    {selectedRide.date}
                  </Text>
                  <Text className="text-sm text-gray-500 mb-1">Fare</Text>
                  <Text className="text-base font-semibold text-gray-900 mb-3">
                    {selectedRide.fare}
                  </Text>
                  <Text className="text-sm text-gray-500 mb-1">Seats</Text>
                  <Text className="text-base font-semibold text-gray-900">
                    {selectedRide.seatsFilled}/{selectedRide.seatsTotal} filled
                  </Text>
                </View>

                {selectedStatus === "accepted" ? (
                  <View className="bg-green-100 rounded-2xl py-4 items-center">
                    <Text className="text-green-700 font-semibold">Accepted — check Chats</Text>
                  </View>
                ) : selectedStatus === "pending" ? (
                  <View className="bg-yellow-100 rounded-2xl py-4 items-center">
                    <Text className="text-yellow-700 font-semibold">Request sent</Text>
                  </View>
                ) : selectedStatus === "declined" ? (
                  <View className="bg-red-100 rounded-2xl py-4 items-center">
                    <Text className="text-red-700 font-semibold">Declined</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    className={`rounded-2xl py-4 items-center ${
                      selectedRide.seatsFilled >= selectedRide.seatsTotal || requesting
                        ? "bg-gray-300"
                        : "bg-black"
                    }`}
                    activeOpacity={0.8}
                    disabled={selectedRide.seatsFilled >= selectedRide.seatsTotal || requesting}
                    onPress={handleSendRequest}
                  >
                    <Text className="text-white font-semibold text-base">
                      {requesting
                        ? "Sending…"
                        : selectedRide.seatsFilled >= selectedRide.seatsTotal
                        ? "Full"
                        : "Send Request"}
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </Animated.View>
        </>
      )}
    </View>
  );
}
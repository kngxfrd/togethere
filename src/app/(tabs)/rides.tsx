import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Ride = {
  id: string;
  destination: string;
  date: string;
  fare: string;
};

const MOCK_RIDES: Ride[] = [
  {
    id: "1",
    destination: "Asafo VIP Station",
    date: "Jul 20, 2026",
    fare: "GHS 25.00",
  },
  {
    id: "2",
    destination: "Chancellor's Hall Area",
    date: "Jul 18, 2026",
    fare: "GHS 15.00",
  },
];

export default function rides() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <Text className="text-2xl font-bold text-gray-900 px-6 pt-6 mb-6">
        Your rides
      </Text>
      <FlatList
        data={MOCK_RIDES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View className="py-4 border-b border-gray-100">
            <Text className="text-base font-medium text-gray-900">
              {item.destination}
            </Text>
            <View className="flex-row justify-between mt-1.5">
              <Text className="text-sm text-gray-500">{item.date}</Text>
              <Text className="text-sm text-gray-700">{item.fare}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text className="text-gray-500 mt-8 text-center">No rides yet.</Text>
        }
      />
    </SafeAreaView>
  );
}
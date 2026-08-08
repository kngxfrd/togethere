import { createContext, useContext, useMemo, useState, ReactNode } from "react";

export type RideStatus = "pending" | "accepted" | "declined";

export type Coordinate = { latitude: number; longitude: number };

export type PostedRide = {
  id: string;
  driverName: string;
  destination: string;
  date: string;
  fare: string;
  seatsFilled: number;
  seatsTotal: number;
  driverLocation: Coordinate | null;
};

export type RideRequest = {
  id: string;
  rideId: string;
  commuterName: string;
  driverName: string;
  destination: string;
  date: string;
  fare: string;
  status: RideStatus;
  requestedAt: string;
};

const INITIAL_POSTED_RIDES: PostedRide[] = [
  {
    id: "1",
    driverName: "Kwame",
    destination: "Asafo VIP Station",
    date: "Jul 22, 2026",
    fare: "GHS 25.00",
    seatsFilled: 3,
    seatsTotal: 4,
    driverLocation: { latitude: 6.6885, longitude: -1.6244 },
  },
  {
    id: "2",
    driverName: "Kwame",
    destination: "KNUST Campus",
    date: "Jul 21, 2026",
    fare: "GHS 18.00",
    seatsFilled: 1,
    seatsTotal: 4,
    driverLocation: { latitude: 6.6745, longitude: -1.5716 },
  },
];

type PostRideInput = {
  driverName: string;
  destination: string;
  date: string;
  fare: string;
  seatsTotal: number;
  driverLocation: Coordinate | null;
};

type RideContextType = {
  postedRides: PostedRide[];
  requests: RideRequest[];
  postRide: (ride: PostRideInput) => void;
  requestRide: (ride: PostedRide, commuterName: string) => void;
  acceptRequest: (requestId: string) => void;
  declineRequest: (requestId: string) => void;
};

const RideContext = createContext<RideContextType | null>(null);

export function RideProvider({ children }: { children: ReactNode }) {
  const [postedRides, setPostedRides] = useState<PostedRide[]>(INITIAL_POSTED_RIDES);
  const [requests, setRequests] = useState<RideRequest[]>([]);

  const postRide = (ride: PostRideInput) => {
    setPostedRides((prev) => [
      { id: Date.now().toString(), seatsFilled: 0, ...ride },
      ...prev,
    ]);
  };

  const requestRide = (ride: PostedRide, commuterName: string) => {
    setRequests((prev) => [
      {
        id: `req-${Date.now()}`,
        rideId: ride.id,
        commuterName,
        driverName: ride.driverName,
        destination: ride.destination,
        date: ride.date,
        fare: ride.fare,
        status: "pending",
        requestedAt: new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
      },
      ...prev,
    ]);
  };

  const acceptRequest = (requestId: string) => {
    setRequests((prev) => {
      const target = prev.find((r) => r.id === requestId);
      if (target) {
        setPostedRides((rides) =>
          rides.map((r) =>
            r.id === target.rideId
              ? { ...r, seatsFilled: Math.min(r.seatsFilled + 1, r.seatsTotal) }
              : r
          )
        );
      }
      return prev.map((r) =>
        r.id === requestId ? { ...r, status: "accepted" as RideStatus } : r
      );
    });
  };

  const declineRequest = (requestId: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, status: "declined" as RideStatus } : r
      )
    );
  };

  const value = useMemo(
    () => ({ postedRides, requests, postRide, requestRide, acceptRequest, declineRequest }),
    [postedRides, requests]
  );

  return <RideContext.Provider value={value}>{children}</RideContext.Provider>;
}

export function useRides() {
  const ctx = useContext(RideContext);
  if (!ctx) throw new Error("useRides must be used within a RideProvider");
  return ctx;
}
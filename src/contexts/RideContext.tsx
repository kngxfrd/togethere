import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export type RideStatus = "pending" | "accepted" | "declined";
export type Coordinate = { latitude: number; longitude: number };

export type PostedRide = {
  id: string;
  driverId: string;       // add this
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
  commuterId: string;     // add this
  commuterName: string;
  driverName: string;
  destination: string;
  date: string;
  fare: string;
  status: RideStatus;
  requestedAt: string;
};

type PostRideInput = {
  destination: string;
  date: string;
  fare: string;
  seatsTotal: number;
  driverLocation: Coordinate | null;
};

type RideContextType = {
  postedRides: PostedRide[];
  requests: RideRequest[];
  loading: boolean;
  postRide: (ride: PostRideInput) => Promise<void>;
  requestRide: (ride: PostedRide) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const RideContext = createContext<RideContextType | null>(null);

// Backend ids are numbers; the app's existing types use strings
// everywhere (keyExtractors, template literals like `req-${id}`), so
// normalize at the boundary rather than touching every screen.
const toRide = (r: any): PostedRide => ({ ...r, id: String(r.id), driverId: String(r.driverId) });
const toRequest = (r: any): RideRequest => ({
  ...r,
  id: String(r.id),
  rideId: String(r.rideId),
  commuterId: String(r.commuterId),
});

export function RideProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [postedRides, setPostedRides] = useState<PostedRide[]>([]);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const [rides, myRequests] = await Promise.all([
        api.get("/rides/"),
        api.get("/requests/"),
      ]);
      setPostedRides(rides.map(toRide));
      setRequests(myRequests.map(toRequest));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [isLoggedIn]);

  const postRide = async (ride: PostRideInput) => {
    const created = await api.post("/rides/", ride);
    setPostedRides((prev) => [toRide(created), ...prev]);
  };

  const requestRide = async (ride: PostedRide) => {
    const created = await api.post(`/rides/${ride.id}/requests/`);
    setRequests((prev) => [toRequest(created), ...prev]);
  };

  const acceptRequest = async (requestId: string) => {
    const updated = await api.patch(`/requests/${requestId}/respond/`, { action: "accept" });
    const updatedReq = toRequest(updated);
    setRequests((prev) => prev.map((r) => (r.id === requestId ? updatedReq : r)));
    // Seat count changed server-side — refetch rides so seatsFilled stays accurate.
    const rides = await api.get("/rides/");
    setPostedRides(rides.map(toRide));
  };

  const declineRequest = async (requestId: string) => {
    const updated = await api.patch(`/requests/${requestId}/respond/`, { action: "decline" });
    const updatedReq = toRequest(updated);
    setRequests((prev) => prev.map((r) => (r.id === requestId ? updatedReq : r)));
  };

  const value = useMemo(
    () => ({ postedRides, requests, loading, postRide, requestRide, acceptRequest, declineRequest, refresh }),
    [postedRides, requests, loading]
  );

  return <RideContext.Provider value={value}>{children}</RideContext.Provider>;
}

export function useRides() {
  const ctx = useContext(RideContext);
  if (!ctx) throw new Error("useRides must be used within a RideProvider");
  return ctx;
}
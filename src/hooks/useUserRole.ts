import { useAuth } from "./useAuth";

export type UserRole = "commuter" | "driver";

// Reads the signed-up/logged-in user's role from auth state.
// Falls back to "commuter" only while there's no signed-in user yet,
// so screens don't crash pre-login.
export function useUserRole(): UserRole {
  const { user } = useAuth();
  return user?.role ?? "commuter";
}
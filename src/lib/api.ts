import AsyncStorage from "@react-native-async-storage/async-storage";

// TODO: replace with your machine's LAN IP (ipconfig) for phone/simulator
// testing, or your deployed URL once the backend is hosted.
const BASE_URL = "http://172.20.10.5:8000/api";

const ACCESS_KEY = "auth:access";
const REFRESH_KEY = "auth:refresh";

let unauthorizedHandler: (() => void) | null = null;
// Lets AuthProvider register "sign the user out" without api.ts importing
// useAuth directly (that would create a circular import).
export function setUnauthorizedHandler(fn: () => void) {
  unauthorizedHandler = fn;
}

export async function setTokens(access: string, refresh: string) {
  await AsyncStorage.multiSet([[ACCESS_KEY, access], [REFRESH_KEY, refresh]]);
}

export async function clearTokens() {
  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
}

async function getAccessToken() {
  return AsyncStorage.getItem(ACCESS_KEY);
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = await AsyncStorage.getItem(REFRESH_KEY);
  if (!refresh) return null;

  const res = await fetch(`${BASE_URL}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) return null;

  const data = await res.json();
  await AsyncStorage.setItem(ACCESS_KEY, data.access);
  return data.access;
}

// DRF validation errors don't have one fixed shape. Common cases:
//   { "detail": "Not found." }                          <- generic/auth errors
//   { "date_of_birth": ["Date has wrong format..."] }    <- per-field errors
//   { "non_field_errors": ["..."] }                      <- serializer-level errors
//   ["Some top-level error"]                             <- rare, whole-payload list
// This walks whatever shape comes back and produces one readable string.
function parseErrorBody(body: any, status: number): string {
  if (!body || (typeof body === "object" && Object.keys(body).length === 0)) {
    return `Request failed (${status})`;
  }

  if (typeof body === "string") return body;

  if (typeof body.detail === "string") return body.detail;

  if (Array.isArray(body)) {
    return body.map(String).join(" ");
  }

  if (typeof body === "object") {
    const messages: string[] = [];
    for (const [field, value] of Object.entries(body)) {
      const text = Array.isArray(value) ? value.map(String).join(" ") : String(value);
      messages.push(field === "non_field_errors" ? text : `${field}: ${text}`);
    }
    if (messages.length > 0) return messages.join("\n");
  }

  return `Request failed (${status})`;
}

async function request(path: string, options: RequestInit = {}, retried = false): Promise<any> {
  const token = await getAccessToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // Access token expired mid-session — refresh once and retry the same call.
  if (res.status === 401 && !retried) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request(path, options, true);
    }
    await clearTokens();
    unauthorizedHandler?.();
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(parseErrorBody(body, res.status));
  }

  return res.status === 204 ? null : res.json();
}

export const api = {
  get: (path: string) => request(path),
  post: (path: string, body?: object) =>
    request(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  patch: (path: string, body?: object) =>
    request(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
};
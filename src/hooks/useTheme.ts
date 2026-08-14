import { useColorScheme } from "nativewind";

/**
 * Shared dark-mode hook built on top of NativeWind's useColorScheme.
 *
 * NativeWind persists the chosen scheme itself (no AsyncStorage wiring
 * needed) and every `dark:` className in the app reacts to it automatically
 * once it's set here — this hook is just a small, friendlier wrapper so
 * screens don't have to know about "light" | "dark" | "system" directly.
 */
export function useTheme() {
  const { colorScheme, setColorScheme } = useColorScheme();

  const isDark = colorScheme === "dark";

  const toggle = () => {
    setColorScheme(isDark ? "light" : "dark");
  };

  return {
    isDark,
    colorScheme,
    toggle,
    setColorScheme,
  };
}
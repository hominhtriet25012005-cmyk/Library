import { useEffect, useMemo, useState } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { useUserSettings } from "./useUserSettings";
import { createLibraryTheme } from "../theme";

const getSystemDarkMode = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const AppThemeProvider = ({ children }) => {
  const { settings } = useUserSettings();
  const [systemDarkMode, setSystemDarkMode] = useState(getSystemDarkMode);
  const preference = settings.appearance.theme;
  const mode =
    preference === "system"
      ? systemDarkMode
        ? "dark"
        : "light"
      : preference === "dark"
        ? "dark"
        : "light";

  const theme = useMemo(() => createLibraryTheme(mode), [mode]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) => setSystemDarkMode(event.matches);
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener?.(handleChange);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener?.(handleChange);
      }
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default AppThemeProvider;

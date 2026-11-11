import { useEffect, useMemo } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { createLibraryTheme } from "../theme";

const AppThemeProvider = ({ children }) => {
  const mode = "light";
  const theme = useMemo(() => createLibraryTheme(mode), []);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default AppThemeProvider;

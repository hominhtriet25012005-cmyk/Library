import { useMemo } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { createLibraryTheme } from "../theme";

const AppThemeProvider = ({ children }) => {
  const theme = useMemo(() => createLibraryTheme(), []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default AppThemeProvider;

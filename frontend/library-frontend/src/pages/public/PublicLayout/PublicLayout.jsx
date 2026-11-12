import { createContext, useContext, useEffect, useMemo } from "react";
import { Box } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { Outlet, useLocation } from "react-router-dom";
import PublicNavbar from "./PublicNavbar";
import PublicFooter from "./PublicFooter";
import {
  createPublicTheme,
  publicFonts,
  publicPalette,
} from "./publicTheme";

const PublicLayoutContext = createContext(false);

export const useInsidePublicLayout = () => useContext(PublicLayoutContext);

const PublicLayout = ({ children }) => {
  const insideParentLayout = useContext(PublicLayoutContext);
  const publicTheme = useMemo(() => createPublicTheme(), []);
  const location = useLocation();

  useEffect(() => {
    if (insideParentLayout) return;
    if (location.hash) {
      const targetId = location.hash.replace(/^#/, "");
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [insideParentLayout, location.pathname, location.hash]);

  if (insideParentLayout) {
    return children ?? <Outlet />;
  }

  return (
    <PublicLayoutContext.Provider value={true}>
      <ThemeProvider theme={publicTheme}>
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            bgcolor: publicPalette.background,
            color: publicPalette.textPrimary,
            fontFamily: publicFonts.sans,
          }}
        >
          <PublicNavbar />
          <Box component="main" sx={{ flexGrow: 1 }}>
            {children ?? <Outlet />}
          </Box>
          <PublicFooter />
        </Box>
      </ThemeProvider>
    </PublicLayoutContext.Provider>
  );
};

export default PublicLayout;

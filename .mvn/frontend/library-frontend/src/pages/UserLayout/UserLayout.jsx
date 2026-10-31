import { useState } from "react";
import { Box, Toolbar } from "@mui/material";
import { Outlet } from "react-router-dom";
import UserSidebar from "./UserSidebar";
import Navbar from "./Navbar";
import { drawerWidth } from "./layout";

const UserLayout = ({ preview = false }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <Navbar
        preview={preview}
        handleDrawerToggle={() => setMobileOpen((open) => !open)}
      />
      <UserSidebar
        preview={preview}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Toolbar />
        <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3, md: 3.5 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default UserLayout;

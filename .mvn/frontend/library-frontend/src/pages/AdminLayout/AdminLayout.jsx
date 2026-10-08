import { useState } from "react";
import { Box, Toolbar } from "@mui/material";
import { Outlet } from "react-router-dom";
import AdminSidebar, { adminDrawerWidth } from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import { readAdminDensity, saveAdminDensity } from "./adminPreferences";

const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [density, setDensity] = useState(readAdminDensity);
  const changeDensity = (value) => { setDensity(value); saveAdminDensity(value); };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f4f8ff" }}>
      <AdminTopbar onMenuClick={() => setMobileOpen((open) => !open)} density={density} onDensityChange={changeDensity} />
      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, width: { md: `calc(100% - ${adminDrawerWidth}px)` }, minHeight: "100vh" }}>
        <Toolbar />
        <Box sx={{ px: density === "compact" ? { xs: 1.5, sm: 2, lg: 2.5 } : { xs: 2, sm: 3, lg: 4 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;

import React from "react";
import { Box, Drawer } from "@mui/material";
import SidebarDrawer from "./SidebarDrawer";

const drawerWidth = "240px";
const UserSidebar = () => {
  return (
    <Box
      component={"nav"}
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      {/* Desktop drawer */}

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            border: "none",
          },
        }}
        open
      >
        <SidebarDrawer />
      </Drawer>
    </Box>
  );
};

export default UserSidebar;

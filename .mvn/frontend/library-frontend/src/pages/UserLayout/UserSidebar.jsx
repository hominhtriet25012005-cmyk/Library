import { Box, Drawer } from "@mui/material";
import SidebarDrawer from "./SidebarDrawer";
import { drawerWidth } from "./layout";

const UserSidebar = ({ mobileOpen, onClose, preview = false }) => {
  return (
    <Box
      component={"nav"}
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
        }}
      >
        <SidebarDrawer preview={preview} onNavigate={onClose} />
      </Drawer>
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
        <SidebarDrawer preview={preview} />
      </Drawer>
    </Box>
  );
};

export default UserSidebar;

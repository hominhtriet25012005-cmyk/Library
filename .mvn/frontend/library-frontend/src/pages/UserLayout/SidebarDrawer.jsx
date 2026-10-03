import { Box } from "@mui/material";
import React from "react";
import Avatar from "@mui/material/Avatar";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Tooltip from "@mui/material/Tooltip";
import { alpha } from "@mui/material/styles";
import { useLocation } from "react-router-dom";
import { navigationItems } from "./NavigationItems";
import { secondaryItems } from "./NavigationItems";
import { useNavigate } from "react-router-dom";
import Logout from "@mui/icons-material/Logout";

const SidebarDrawer = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    console.log("Logout");
  };
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
        color: "white",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "300px",
          background:
            "radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 100%)",
          pointerEvents: "none",
        },
      }}
    >
      <Box
        sx={{
          p: 3,
          display: "flex",
          alignItems: "center",
          gap: 2,
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              fontWeight: "bold",
              fontSize: "1.3rem",
              boxShadow: "0 8px 24px rgba(102, 126, 234, 0.4)",
            }}
          >
            <MenuBook />
          </Avatar>
        </Box>

        <Box>
          <Typography
            variant="h6"
            sx={{
              color: "purple",
              letterSpacing: 0.5,
              background: "linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            ZoshBook
          </Typography>
          <Typography
            variant="caption"
            sx={{
              opacity: 0.7,
              fontWeight: 500,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Library Hub
          </Typography>
        </Box>
      </Box>

      {/* Main Navigation Items */}

      <List>
        {navigationItems.map((item, index) => {
          const active = isActive(item.path, location);
          return (
            <ListItem key={index}>
              <Tooltip title={item.description} placement="right">
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 2.5,
                    py: 1.5,
                    px: 2,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                    bgcolor: active
                      ? "linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.25) 100%)"
                      : "transparent",
                    border: active
                      ? "1px solid rgba(99, 102, 241, 0.3)"
                      : "1px solid transparent",
                    backdropFilter: active ? "blur(10px)" : "none",
                    "&:hover": {
                      bgcolor: active
                        ? alpha("#6366f1", 0.3)
                        : "rgba(255, 255, 255, 0.05)",
                      transform: "translateX(6px)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                    },
                    "&::before": active
                      ? {
                          content: '""',
                          position: "absolute",
                          left: 0,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 4,
                          height: "70%",
                          borderRadius: "0 4px 4px 0",
                          background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          boxShadow: "0 0 12px rgba(102, 126, 234, 0.6)",
                        }
                      : {},
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 48,
                      color: active ? "#818cf8" : "rgba(255, 255, 255, 0.7)",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>

                  {item.title}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
        <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.05)", mx: 2 }} />

        {/* secondaryItems */}
        {secondaryItems.map((item, index) => {
          const active = isActive(item.path);
          return (
            <ListItem key={index}>
              <Tooltip title={item.description} placement="right">
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 2.5,
                    py: 1.5,
                    px: 2,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                    bgcolor: active
                      ? "linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.25) 100%)"
                      : "transparent",
                    border: active
                      ? "1px solid rgba(99, 102, 241, 0.3)"
                      : "1px solid transparent",
                    backdropFilter: active ? "blur(10px)" : "none",
                    "&:hover": {
                      bgcolor: active
                        ? alpha("#6366f1", 0.3)
                        : "rgba(255, 255, 255, 0.05)",
                      transform: "translateX(6px)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                    },
                    "&::before": active
                      ? {
                          content: '""',
                          position: "absolute",
                          left: 0,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 4,
                          height: "70%",
                          borderRadius: "0 4px 4px 0",
                          background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          boxShadow: "0 0 12px rgba(102, 126, 234, 0.6)",
                        }
                      : {},
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 48,
                      color: active ? "#818cf8" : "rgba(255, 255, 255, 0.7)",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>

                  {item.title}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}

        <Box sx={{ px: 2 }}>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2.5,
              py: 1.5,
              px: 2,
              background:
                "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              transition: "all 0.3s ease",
              "&:hover": {
                background:
                  "linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.25) 100%)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                transform: "translateY(-2px)",
                boxShadow: "0 8px 24px rgba(239, 68, 68, 0.25)",
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 48,
                color: "red",
                transition: "all 0.3s ease",
              }}
            >
              <Logout />
            </ListItemIcon>
            Logout
          </ListItemButton>

          <p className="pt-4 text-xs text-gray-600">
            @2026 Library App. All rights reserved.
          </p>
        </Box>
      </List>
    </Box>
  );
};
export default SidebarDrawer;

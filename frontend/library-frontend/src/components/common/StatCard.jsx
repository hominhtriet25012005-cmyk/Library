import React from "react";
import { Box, Paper, Skeleton, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const colorMap = {
  primary: "#1769ff",
  success: "#16a34a",
  error: "#ef4444",
  warning: "#f59e0b",
  info: "#0284c7",
  secondary: "#102d62",
  navy: "#102d62",
  default: "#64748b",
};

const resolveColor = (theme, color) => {
  if (color === "default") {
    return theme.palette.mode === "dark"
      ? theme.palette.grey[300]
      : theme.palette.grey[600];
  }
  if (color === "navy" || color === "secondary") {
    return theme.palette.mode === "dark" ? "#8bb8ff" : colorMap.navy;
  }
  if (theme.palette[color]?.main) return theme.palette[color].main;
  if (!color) return theme.palette.primary.main;
  if (typeof color === "string" && color.startsWith("#")) return color;
  return theme.palette.primary.main;
};

const renderIcon = (icon) => {
  if (!icon) return null;
  if (React.isValidElement(icon)) return icon;
  if (
    typeof icon === "function" ||
    (typeof icon === "object" && icon.$$typeof)
  ) {
    const IconComp = icon;
    return <IconComp sx={{ fontSize: 24 }} />;
  }
  return null;
};

/**
 * StatCard - Thẻ hiển thị chỉ số thống kê chuẩn hóa
 */
export const StatCard = ({
  title,
  value,
  detail,
  subtitle,
  icon,
  color = "primary",
  loading = false,
  onClick,
  sx = {},
}) => {
  const theme = useTheme();
  const description = detail || subtitle;
  const hasDescription = Boolean(description);

  if (loading) {
    return (
      <Skeleton
        variant="rounded"
        height={hasDescription ? 132 : 90}
        sx={{ borderRadius: 3, ...sx }}
      />
    );
  }

  const isClickable = Boolean(onClick);
  const actualColor = resolveColor(theme, color);
  const iconNode = renderIcon(icon);

  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        p: 2.5,
        py: hasDescription ? 2.5 : 2,
        borderRadius: 3,
        bgcolor: "background.paper",
        borderColor: "divider",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.2s ease-in-out",
        cursor: isClickable ? "pointer" : "default",
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 1px 3px rgba(0, 0, 0, 0.28)"
            : "0 1px 3px rgba(15, 23, 42, 0.04)",
        "&:hover": isClickable
          ? {
              transform: "translateY(-2px)",
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 4px 12px rgba(0, 0, 0, 0.36)"
                  : "0 4px 12px rgba(15, 23, 42, 0.08)",
              borderColor: actualColor,
            }
          : {
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 2px 8px rgba(0, 0, 0, 0.32)"
                  : "0 2px 8px rgba(15, 23, 42, 0.06)",
            },
        ...sx,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: hasDescription ? "flex-start" : "center",
          gap: 1.5,
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            noWrap
            sx={{
              fontWeight: 500,
              mb: hasDescription ? 0.75 : 0.5,
              fontSize: "0.85rem",
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: actualColor,
              lineHeight: 1.15,
              fontSize: { xs: "1.75rem", sm: "2rem" },
            }}
          >
            {value === null || value === undefined ? "—" : value}
          </Typography>
        </Box>

        {iconNode && (
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              bgcolor: `${actualColor}18`, // 10% opacity tint with guaranteed valid hex
              color: actualColor,
              flexShrink: 0,
              "& svg": { fontSize: 24 },
            }}
          >
            {iconNode}
          </Box>
        )}
      </Box>

      {description && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 1.5, fontSize: "0.78rem" }}
        >
          {description}
        </Typography>
      )}
    </Paper>
  );
};

export default StatCard;

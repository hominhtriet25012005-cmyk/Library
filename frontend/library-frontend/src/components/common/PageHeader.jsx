import React from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const renderIcon = (icon, defaultSize = 28) => {
  if (!icon) return null;
  if (React.isValidElement(icon)) return icon;
  if (
    typeof icon === "function" ||
    (typeof icon === "object" && icon.$$typeof)
  ) {
    const IconComp = icon;
    return <IconComp sx={{ fontSize: defaultSize }} />;
  }
  return null;
};

const renderAction = (action) => {
  if (!action) return null;
  if (React.isValidElement(action)) return action;
  if (typeof action === "object" && action.label) {
    const {
      label,
      icon,
      onClick,
      to,
      variant = "contained",
      disabled = false,
      color = "primary",
      sx = {},
    } = action;
    const buttonProps = to ? { component: RouterLink, to } : { onClick };

    return (
      <Button
        variant={variant}
        color={color}
        disabled={disabled}
        startIcon={renderIcon(icon, 20)}
        {...buttonProps}
        sx={{
          borderRadius: "10px",
          fontWeight: 600,
          textTransform: "none",
          px: 2.5,
          py: 0.8,
          ...sx,
        }}
      >
        {label}
      </Button>
    );
  }
  return null;
};

/**
 * PageHeader - Header đồng bộ cho tất cả các trang Admin và User
 *
 * @param {string|React.ReactNode} title - Tiêu đề chính của trang
 * @param {string|React.ReactNode} [subtitle] - Mô tả tóm tắt của trang
 * @param {string} [badge] - Nhãn huy hiệu nhỏ (tuỳ chọn)
 * @param {React.ReactNode|React.ComponentType} [icon] - Icon minh họa đặt cạnh tiêu đề
 * @param {React.ReactNode|Object} [action] - Nút hành động chính ở góc phải (Element hoặc object cấu hình)
 * @param {React.ReactNode} [extra] - Khối mở rộng (tabs, filter nhanh)
 */
export const PageHeader = ({
  title,
  subtitle,
  badge,
  icon,
  action,
  extra,
  sx = {},
}) => {
  const iconNode = renderIcon(icon, 28);
  const actionNode = renderAction(action);

  return (
    <Box
      component="header"
      sx={{
        mb: 3,
        width: "100%",
        ...sx,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.25}
            sx={{ mb: 0.5, flexWrap: "wrap" }}
          >
            {iconNode && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "primary.main",
                  "& svg": { fontSize: 28 },
                }}
              >
                {iconNode}
              </Box>
            )}
            <Typography
              component="h1"
              variant="h5"
              sx={{
                fontWeight: 750,
                color: "#102d62",
                lineHeight: 1.25,
              }}
            >
              {title}
            </Typography>
            {badge && (
              <Chip
                label={badge}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ height: 22, fontSize: "0.75rem", fontWeight: 700 }}
              />
            )}
          </Stack>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {actionNode && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flexShrink: 0,
              width: { xs: "100%", sm: "auto" },
              justifyContent: { xs: "flex-start", sm: "flex-end" },
            }}
          >
            {actionNode}
          </Box>
        )}
      </Stack>

      {extra && <Box sx={{ mt: 2 }}>{extra}</Box>}
    </Box>
  );
};

export default PageHeader;

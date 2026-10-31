import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";

const renderIcon = (icon) => {
  if (!icon) return <InboxRoundedIcon sx={{ fontSize: 32 }} />;
  if (React.isValidElement(icon)) return icon;
  if (
    typeof icon === "function" ||
    (typeof icon === "object" && icon.$$typeof)
  ) {
    const IconComp = icon;
    return <IconComp sx={{ fontSize: 32 }} />;
  }
  return <InboxRoundedIcon sx={{ fontSize: 32 }} />;
};

/**
 * EmptyState - Hiển thị trạng thái khi không có dữ liệu
 *
 * @param {string} [title="Không có dữ liệu"] - Tiêu đề
 * @param {string} [description="Chưa có bản ghi nào phù hợp với yêu cầu này."] - Mô tả chi tiết
 * @param {React.ReactNode|React.ComponentType} [icon] - Icon minh họa
 * @param {string} [actionLabel] - Nhãn nút hành động (nếu có)
 * @param {string} [actionText] - Alias cho actionLabel
 * @param {function} [onAction] - Hàm kích hoạt khi bấm nút hành động
 * @param {string} [actionTo] - Đường dẫn chuyển trang nếu dùng Link
 */
export const EmptyState = ({
  title = "Không có dữ liệu",
  description,
  message, // alias for description
  icon,
  actionLabel,
  actionText, // alias for actionLabel
  onAction,
  actionTo,
  sx = {},
}) => {
  const displayDesc =
    description ??
    message ??
    "Chưa có bản ghi nào phù hợp với điều kiện tìm kiếm hoặc dữ liệu đang trống.";
  const displayActionText = actionLabel ?? actionText;

  return (
    <Box
      sx={{
        py: { xs: 5, sm: 7 },
        px: 3,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        ...sx,
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: 3.5,
          bgcolor: "#f1f5f9",
          color: "#94a3b8",
          display: "grid",
          placeItems: "center",
          mb: 2,
        }}
      >
        {renderIcon(icon)}
      </Box>

      <Typography
        variant="h6"
        sx={{ fontWeight: 700, color: "#1e293b", mb: 0.75 }}
      >
        {title}
      </Typography>

      {displayDesc && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            maxWidth: 460,
            mb: displayActionText ? 2.5 : 0,
            lineHeight: 1.6,
          }}
        >
          {displayDesc}
        </Typography>
      )}

      {displayActionText &&
        (actionTo ? (
          <Button
            component={RouterLink}
            to={actionTo}
            variant="outlined"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: 2.5,
            }}
          >
            {displayActionText}
          </Button>
        ) : onAction ? (
          <Button
            variant="outlined"
            onClick={onAction}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: 2.5,
            }}
          >
            {displayActionText}
          </Button>
        ) : null)}
    </Box>
  );
};

export default EmptyState;

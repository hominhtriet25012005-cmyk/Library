import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

/**
 * ConfirmDialog - Modal xác nhận hành động an toàn
 */
export const ConfirmDialog = ({
  open,
  title,
  content,
  message,
  error,
  confirmText,
  confirmLabel,
  cancelText,
  cancelLabel,
  variant,
  severity,
  loading = false,
  onConfirm,
  onClose,
  onCancel,
  maxWidth = "xs",
}) => {
  const displayContent = content ?? message;
  const displayConfirm = confirmText ?? confirmLabel ?? "Xác nhận";
  const displayCancel = cancelText ?? cancelLabel ?? "Hủy";
  const handleClose = onClose ?? onCancel;
  const resolvedVariant = variant ?? severity ?? "primary";

  const getButtonStyles = () => {
    switch (resolvedVariant) {
      case "danger":
      case "error":
        return {
          bgcolor: "#dc2626",
          color: "#ffffff",
          "&:hover": { bgcolor: "#b91c1c" },
        };
      case "warning":
        return {
          bgcolor: "#d97706",
          color: "#ffffff",
          "&:hover": { bgcolor: "#b45309" },
        };
      default:
        return {
          bgcolor: "#1769ff",
          color: "#ffffff",
          "&:hover": { bgcolor: "#0d4ed3" },
        };
    }
  };

  return (
    <Dialog
      open={Boolean(open)}
      onClose={loading ? undefined : handleClose}
      maxWidth={maxWidth}
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3.5,
            p: 0.5,
          },
        },
      }}
    >
      <DialogTitle
        sx={{ pt: 2.5, px: 3, pb: 1, fontWeight: 750, color: "#0f172a" }}
      >
        {title}
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 1.5 }}>
        {typeof displayContent === "string" ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ lineHeight: 1.6 }}
          >
            {displayContent}
          </Typography>
        ) : (
          displayContent
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions
        sx={{ px: 3, py: 2, borderTop: "1px solid #f1f5f9", gap: 1 }}
      >
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{
            color: "#64748b",
            fontWeight: 600,
            borderRadius: 2,
            px: 2.5,
            "&:hover": { bgcolor: "#f1f5f9" },
          }}
        >
          {displayCancel}
        </Button>

        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          startIcon={
            loading ? <CircularProgress size={16} color="inherit" /> : null
          }
          sx={{
            fontWeight: 600,
            borderRadius: 2,
            px: 2.5,
            height: 40,
            ...getButtonStyles(),
          }}
        >
          {loading ? "Đang xử lý…" : displayConfirm}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;

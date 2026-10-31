import {
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";

/**
 * SearchFilterBar - Thanh tìm kiếm và bộ lọc chuẩn hóa
 *
 * @param {string} [searchValue] - Giá trị ô tìm kiếm
 * @param {function} [onSearchChange] - Hàm cập nhật từ khóa tìm kiếm: (val) => void
 * @param {function} [onSearchSubmit] - Hàm submit tìm kiếm (khi nhấn Enter hoặc icon search)
 * @param {string} [searchPlaceholder="Tìm kiếm..."] - Gợi ý trong ô tìm kiếm
 * @param {React.ReactNode} [children] - Các bộ lọc bổ sung (Select, DatePicker...)
 * @param {React.ReactNode} [filters] - Các bộ lọc bổ sung truyền qua prop
 * @param {function} [onReset] - Hàm đặt lại toàn bộ bộ lọc
 * @param {React.ReactNode} [actions] - Các nút thao tác bổ sung bên phải
 */
export const SearchFilterBar = ({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = "Tìm kiếm...",
  searchLabel,
  submitLabel = "Tìm",
  showSearchButton = true,
  children,
  filters,
  onReset,
  actions,
  sx = {},
}) => {
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && onSearchSubmit) {
      event.preventDefault();
      onSearchSubmit(searchValue);
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 1.5, sm: 2 },
        mb: 2.5,
        borderRadius: 3,
        bgcolor: "#ffffff",
        borderColor: "#e2e8f0",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
        ...sx,
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", md: "center" }}
      >
        {onSearchChange !== undefined && (
          <TextField
            size="small"
            placeholder={searchPlaceholder}
            value={searchValue ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            slotProps={{
              htmlInput: { "aria-label": searchLabel || searchPlaceholder },
              input: {
                startAdornment: (
                  <InputAdornment position="start" sx={{ color: "#94a3b8" }}>
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchValue ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label="Xóa từ khóa tìm kiếm"
                      onClick={() => onSearchChange("")}
                      edge="end"
                    >
                      <ClearRoundedIcon
                        fontSize="small"
                        sx={{ fontSize: 16 }}
                      />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
            sx={{
              flex: { xs: 1, md: 2 },
              minWidth: { sm: 220 },
              "& .MuiOutlinedInput-root": {
                height: 40,
                borderRadius: 2,
              },
            }}
          />
        )}

        {(children || filters) && (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", sm: "center" }}
            flexWrap="wrap"
            sx={{ flex: { md: 3 } }}
          >
            {children}
            {filters}
          </Stack>
        )}

        {((onSearchSubmit && showSearchButton) || onReset || actions) && (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent={{ xs: "flex-end", md: "flex-end" }}
            sx={{ ml: { md: "auto" } }}
          >
            {onSearchSubmit && showSearchButton && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => onSearchSubmit(searchValue)}
              >
                {submitLabel}
              </Button>
            )}
            {onReset && (
              <Tooltip title="Đặt lại bộ lọc">
                <IconButton
                  size="small"
                  onClick={onReset}
                  sx={{
                    height: 38,
                    width: 38,
                    borderRadius: 2,
                    border: "1px solid #e2e8f0",
                    color: "#64748b",
                    "&:hover": { bgcolor: "#f8fafc", color: "#0f172a" },
                  }}
                >
                  <RestartAltRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {actions}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
};

export default SearchFilterBar;

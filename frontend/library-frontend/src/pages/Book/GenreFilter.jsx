import { useMemo } from "react";
import { Box, Button, Radio, Typography } from "@mui/material";
import RadioButtonChecked from "@mui/icons-material/RadioButtonCheckedRounded";
import RadioButtonUnchecked from "@mui/icons-material/RadioButtonUncheckedRounded";

const GenreFilter = ({ genres = [], selectedGenreId, onGenreSelect }) => {
  const sortedGenres = useMemo(() => {
    return [...genres].sort(
      (a, b) =>
        (a.displayOrder ?? 0) - (b.displayOrder ?? 0) ||
        (a.name || "").localeCompare(b.name || "", "vi"),
    );
  }, [genres]);

  return (
    <Box sx={{ width: "100%" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1.5,
          pb: 1.25,
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, color: "#1e293b", fontSize: "0.95rem" }}
        >
          Thể loại
        </Typography>

        {selectedGenreId && (
          <Button
            size="small"
            onClick={() => onGenreSelect(null)}
            sx={{
              p: 0,
              minWidth: "auto",
              textTransform: "none",
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "#1769ff",
              "&:hover": {
                bgcolor: "transparent",
                textDecoration: "underline",
              },
            }}
          >
            Xóa lọc
          </Button>
        )}
      </Box>

      {/* All Genres Option */}
      <Box
        onClick={() => onGenreSelect(null)}
        sx={{
          display: "flex",
          alignItems: "center",
          px: 1,
          py: 0.6,
          mb: 0.5,
          borderRadius: "8px",
          cursor: "pointer",
          transition: "all 0.15s ease",
          bgcolor: !selectedGenreId
            ? "rgba(23, 105, 255, 0.08)"
            : "transparent",
          color: !selectedGenreId ? "#1769ff" : "#334155",
          "&:hover": {
            bgcolor: !selectedGenreId ? "rgba(23, 105, 255, 0.12)" : "#f8fafc",
          },
        }}
      >
        <Radio
          checked={!selectedGenreId}
          size="small"
          icon={<RadioButtonUnchecked sx={{ fontSize: 16 }} />}
          checkedIcon={<RadioButtonChecked sx={{ fontSize: 16 }} />}
          sx={{
            p: 0.5,
            mr: 1,
            color: "#94a3b8",
            "&.Mui-checked": {
              color: "#1769ff",
            },
            pointerEvents: "none",
          }}
        />
        <Typography
          variant="body2"
          sx={{
            fontSize: "0.875rem",
            fontWeight: !selectedGenreId ? 600 : 500,
            userSelect: "none",
          }}
        >
          Tất cả thể loại
        </Typography>
      </Box>

      {/* Genre List */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 0.25,
          maxHeight: 340,
          overflowY: "auto",
          pl: 2,
          pr: 0.5,
          "&::-webkit-scrollbar": {
            width: "4px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#cbd5e1",
            borderRadius: "9999px",
            "&:hover": {
              backgroundColor: "#94a3b8",
            },
          },
        }}
      >
        {sortedGenres.map((genre) => {
          const isSelected = Number(selectedGenreId) === Number(genre.id);
          return (
            <Box
              key={genre.id}
              onClick={() => onGenreSelect(isSelected ? null : genre.id)}
              sx={{
                display: "flex",
                alignItems: "center",
                px: 1,
                py: 0.6,
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                bgcolor: isSelected
                  ? "rgba(23, 105, 255, 0.08)"
                  : "transparent",
                color: isSelected ? "#1769ff" : "#334155",
                "&:hover": {
                  bgcolor: isSelected ? "rgba(23, 105, 255, 0.12)" : "#f8fafc",
                },
              }}
            >
              <Radio
                checked={isSelected}
                size="small"
                icon={<RadioButtonUnchecked sx={{ fontSize: 16 }} />}
                checkedIcon={<RadioButtonChecked sx={{ fontSize: 16 }} />}
                sx={{
                  p: 0.5,
                  mr: 1,
                  color: "#94a3b8",
                  "&.Mui-checked": {
                    color: "#1769ff",
                  },
                  pointerEvents: "none",
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: isSelected ? 600 : 500,
                  userSelect: "none",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {genre.name}
              </Typography>
            </Box>
          );
        })}

        {sortedGenres.length === 0 && (
          <Typography
            variant="caption"
            sx={{ color: "#94a3b8", px: 1, py: 1, display: "block" }}
          >
            Chưa có thể loại nào
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default GenreFilter;

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import { booksApi } from "../../../api/books";
import PublicLayout from "../PublicLayout/PublicLayout";
import { publicFonts, publicPalette } from "../PublicLayout/publicTheme";
import PublicBookCard from "./PublicBookCard";

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: "createdAt-DESC", label: "Mới cập nhật" },
  { value: "title-ASC", label: "Tên kinh sách (A–Z)" },
  { value: "title-DESC", label: "Tên kinh sách (Z–A)" },
  { value: "author-ASC", label: "Tác giả / Dịch giả (A–Z)" },
  { value: "publicationYear-DESC", label: "Năm xuất bản (Mới nhất)" },
];

const AVAILABILITY_OPTIONS = [
  { value: "ALL", label: "Tất cả ấn phẩm" },
  { value: "AVAILABLE", label: "Còn sách tại thư viện" },
  { value: "CHECKED_OUT", label: "Tạm hết sách" },
];

const parseSortParam = (raw) => {
  const found = SORT_OPTIONS.find((item) => item.value === raw);
  const target = found ? found.value : "createdAt-DESC";
  const [sortBy, sortDirection] = target.split("-");
  return { sortValue: target, sortBy, sortDirection };
};

const parseAvailabilityParam = (raw) => {
  const valid = AVAILABILITY_OPTIONS.some((item) => item.value === raw);
  return valid ? raw : "ALL";
};

const parseGenreParam = (raw) => {
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const parsePageParam = (raw) => {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed - 1 : 0;
};

export const PublicBooksPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Đọc trạng thái bộ lọc trực tiếp từ URL query string để chia sẻ đường dẫn
  const queryText = searchParams.get("q") ?? "";
  const selectedGenreId = parseGenreParam(searchParams.get("genreId"));
  const availability = parseAvailabilityParam(searchParams.get("availability"));
  const { sortValue, sortBy, sortDirection } = parseSortParam(
    searchParams.get("sort"),
  );
  const currentPage = parsePageParam(searchParams.get("page"));

  const [searchInput, setSearchInput] = useState(queryText);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [genres, setGenres] = useState([]);
  const [genresLoading, setGenresLoading] = useState(true);
  const [genresError, setGenresError] = useState("");

  const [catalog, setCatalog] = useState(null);
  const [booksLoading, setBooksLoading] = useState(true);
  const [booksError, setBooksError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // Đồng bộ ô input khi URL thay đổi (ví dụ bấm nút Xóa bộ lọc hoặc Back trình duyệt)
  useEffect(() => {
    setSearchInput(queryText);
  }, [queryText]);

  const updateFilterParams = useCallback(
    (updates) => {
      const next = new URLSearchParams(searchParams);

      Object.entries(updates).forEach(([key, value]) => {
        if (
          value === null ||
          value === undefined ||
          value === "" ||
          (key === "availability" && value === "ALL") ||
          (key === "sort" && value === "createdAt-DESC") ||
          (key === "page" && Number(value) <= 1)
        ) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });

      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  // Tải danh sách thể loại từ API thật
  useEffect(() => {
    const controller = new AbortController();
    setGenresLoading(true);
    setGenresError("");

    booksApi
      .genres({ signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        const activeGenres = Array.isArray(data)
          ? data.filter((item) => item && item.active !== false)
          : [];
        activeGenres.sort(
          (a, b) =>
            (a.displayOrder ?? 0) - (b.displayOrder ?? 0) ||
            String(a.name ?? "").localeCompare(String(b.name ?? ""), "vi"),
        );
        setGenres(activeGenres);
      })
      .catch((error) => {
        if (controller.signal.aborted || error?.name === "AbortError") return;
        setGenresError(
          error?.message || "Chưa tải được danh mục chủ đề kinh sách.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setGenresLoading(false);
      });

    return () => controller.abort();
  }, [retryCount]);

  // Tải danh sách sách theo bộ lọc & phân trang từ API thật
  useEffect(() => {
    const controller = new AbortController();
    setBooksLoading(true);
    setBooksError("");

    booksApi
      .search(
        {
          searchTerm: queryText,
          genreId: selectedGenreId,
          availability,
          page: currentPage,
          size: PAGE_SIZE,
          sortBy,
          sortDirection,
        },
        { signal: controller.signal },
      )
      .then((response) => {
        if (controller.signal.aborted) return;
        if (!response || !Array.isArray(response.content)) {
          throw new Error("Phản hồi danh mục kinh sách không hợp lệ.");
        }
        setCatalog(response);
      })
      .catch((error) => {
        if (controller.signal.aborted || error?.name === "AbortError") return;
        setCatalog(null);
        setBooksError(
          error?.message ||
            "Không thể tải danh mục kinh sách. Vui lòng thử lại.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setBooksLoading(false);
      });

    return () => controller.abort();
  }, [
    queryText,
    selectedGenreId,
    availability,
    currentPage,
    sortBy,
    sortDirection,
    retryCount,
  ]);

  const hasActiveFilters = Boolean(
    queryText.trim() ||
    selectedGenreId !== null ||
    availability !== "ALL" ||
    sortValue !== "createdAt-DESC",
  );

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    updateFilterParams({
      q: searchInput.trim(),
      page: 1,
    });
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearchParams(new URLSearchParams());
    setMobileFilterOpen(false);
  };

  const selectedGenreName = useMemo(() => {
    if (selectedGenreId === null) return "";
    const found = genres.find((item) => Number(item.id) === selectedGenreId);
    return found?.name || "";
  }, [genres, selectedGenreId]);

  const books = catalog?.content ?? [];
  const hasExactTotal =
    !booksLoading &&
    !booksError &&
    Number.isInteger(catalog?.totalElements) &&
    catalog.totalElements >= 0;
  const totalPages = Math.max(Number(catalog?.totalPages ?? 0), 0);

  const renderFilterSidebarContent = (inDrawer = false) => (
    <Stack spacing={3}>
      {inDrawer && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography
            variant="h6"
            sx={{
              fontFamily: publicFonts.serif,
              fontWeight: 700,
              color: publicPalette.textPrimary,
            }}
          >
            Bộ lọc tra cứu
          </Typography>
          <IconButton
            onClick={() => setMobileFilterOpen(false)}
            aria-label="Đóng bộ lọc"
          >
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      )}

      {/* Lọc theo Thể loại / Chủ đề */}
      <Box>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            color: publicPalette.textPrimary,
            mb: 1.5,
            fontSize: "0.92rem",
          }}
        >
          Chủ đề kinh sách
        </Typography>

        {genresLoading ? (
          <Stack spacing={1}>
            {[1, 2, 3, 4, 5].map((item) => (
              <Skeleton
                key={item}
                variant="rounded"
                height={36}
                sx={{ borderRadius: "8px" }}
              />
            ))}
          </Stack>
        ) : genresError ? (
          <Alert
            severity="warning"
            sx={{ borderRadius: "10px", fontSize: "0.82rem" }}
          >
            {genresError}
          </Alert>
        ) : (
          <Stack spacing={0.5}>
            <Button
              onClick={() => {
                updateFilterParams({ genreId: null, page: 1 });
                if (inDrawer) setMobileFilterOpen(false);
              }}
              sx={{
                justifyContent: "space-between",
                px: 1.5,
                py: 0.9,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: selectedGenreId === null ? 700 : 500,
                color:
                  selectedGenreId === null
                    ? publicPalette.primary
                    : publicPalette.textSecondary,
                bgcolor:
                  selectedGenreId === null
                    ? publicPalette.primaryLight
                    : "transparent",
                "&:hover": {
                  bgcolor: publicPalette.primaryLight,
                  color: publicPalette.primary,
                },
              }}
            >
              <span>Tất cả chủ đề</span>
            </Button>

            {genres.map((genre) => {
              const active = Number(genre.id) === selectedGenreId;
              return (
                <Button
                  key={genre.id}
                  onClick={() => {
                    updateFilterParams({ genreId: genre.id, page: 1 });
                    if (inDrawer) setMobileFilterOpen(false);
                  }}
                  sx={{
                    justifyContent: "space-between",
                    textAlign: "left",
                    px: 1.5,
                    py: 0.9,
                    borderRadius: "8px",
                    textTransform: "none",
                    fontWeight: active ? 700 : 500,
                    color: active
                      ? publicPalette.primary
                      : publicPalette.textSecondary,
                    bgcolor: active
                      ? publicPalette.primaryLight
                      : "transparent",
                    "&:hover": {
                      bgcolor: publicPalette.primaryLight,
                      color: publicPalette.primary,
                    },
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {genre.name}
                  </Box>
                  {Number.isInteger(genre.bookCount) &&
                    genre.bookCount >= 0 && (
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{
                          ml: 1,
                          px: 0.9,
                          py: 0.15,
                          borderRadius: "6px",
                          bgcolor: active
                            ? "#FFFFFF"
                            : publicPalette.surfaceMuted,
                          color: active
                            ? publicPalette.primary
                            : publicPalette.textSecondary,
                          fontWeight: 700,
                        }}
                      >
                        {genre.bookCount}
                      </Typography>
                    )}
                </Button>
              );
            })}
          </Stack>
        )}
      </Box>

      <Divider sx={{ borderColor: publicPalette.border }} />

      {/* Lọc theo Tình trạng còn sách */}
      <Box>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            color: publicPalette.textPrimary,
            mb: 1.25,
            fontSize: "0.92rem",
          }}
        >
          Tình trạng còn sách
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            value={availability}
            onChange={(event) => {
              updateFilterParams({
                availability: event.target.value,
                page: 1,
              });
              if (inDrawer) setMobileFilterOpen(false);
            }}
            sx={{
              borderRadius: "10px",
              bgcolor: publicPalette.background,
            }}
          >
            {AVAILABILITY_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Divider sx={{ borderColor: publicPalette.border }} />

      {/* Nút Xóa bộ lọc */}
      <Button
        variant="outlined"
        startIcon={<RestartAltRoundedIcon />}
        disabled={!hasActiveFilters}
        onClick={handleResetFilters}
        fullWidth
        sx={{
          borderRadius: "10px",
          borderColor: publicPalette.border,
          color: publicPalette.textPrimary,
          "&:hover": {
            borderColor: publicPalette.primary,
            bgcolor: publicPalette.primaryLight,
          },
        }}
      >
        Xóa bộ lọc
      </Button>
    </Stack>
  );

  return (
    <PublicLayout>
      {/* 4.1 HEADER */}
      <Box
        component="section"
        sx={{
          py: { xs: 4, md: 5.5 },
          bgcolor: publicPalette.surface,
          borderBottom: `1px solid ${publicPalette.border}`,
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Box
            sx={{
              maxWidth: 850,
              mx: "auto",
              textAlign: "center",
            }}
          >
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontFamily: publicFonts.serif,
                fontSize: { xs: "1.85rem", sm: "2.35rem" },
                fontWeight: 700,
                color: publicPalette.textPrimary,
                mb: 1,
              }}
            >
              Kho kinh sách Phật giáo
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* 4.2 & 4.3 KHU VỰC BỘ LỌC & DANH SÁCH KINH SÁCH */}
      <Container
        maxWidth="lg"
        sx={{ py: { xs: 4, md: 6 }, px: { xs: 2, sm: 3, md: 4 } }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "260px 1fr" },
            gap: 4,
            alignItems: "start",
          }}
        >
          {/* Sidebar bộ lọc trên Desktop */}
          <Paper
            variant="outlined"
            sx={{
              display: { xs: "none", md: "block" },
              p: 2.5,
              borderRadius: "14px",
              borderColor: publicPalette.border,
              bgcolor: publicPalette.surface,
              position: "sticky",
              top: 88,
            }}
          >
            {renderFilterSidebarContent(false)}
          </Paper>

          {/* Cột phải: Thanh công cụ Sắp xếp + Lưới thẻ sách + Phân trang */}
          <Box sx={{ minWidth: 0 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                mb: 3,
                borderRadius: "12px",
                borderColor: publicPalette.border,
                bgcolor: publicPalette.surface,
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ flexWrap: "wrap", rowGap: 1 }}
              >
                <Button
                  variant="outlined"
                  startIcon={<FilterListRoundedIcon />}
                  onClick={() => setMobileFilterOpen(true)}
                  sx={{
                    display: { xs: "inline-flex", md: "none" },
                    borderColor: publicPalette.border,
                    color: publicPalette.textPrimary,
                  }}
                >
                  Bộ lọc
                </Button>

                {queryText && (
                  <Chip
                    label={`Từ khóa: "${queryText}"`}
                    onDelete={() => updateFilterParams({ q: "", page: 1 })}
                    size="small"
                    sx={{
                      bgcolor: publicPalette.surfaceMuted,
                      color: publicPalette.textPrimary,
                    }}
                  />
                )}

                {selectedGenreId !== null && (
                  <Chip
                    label={`Chủ đề: ${selectedGenreName || `#${selectedGenreId}`}`}
                    onDelete={() =>
                      updateFilterParams({ genreId: null, page: 1 })
                    }
                    size="small"
                    sx={{
                      bgcolor: publicPalette.primaryLight,
                      color: publicPalette.primary,
                      fontWeight: 600,
                    }}
                  />
                )}

                {availability !== "ALL" && (
                  <Chip
                    label={
                      availability === "AVAILABLE"
                        ? "Chỉ sách hiện còn"
                        : "Sách tạm hết"
                    }
                    onDelete={() =>
                      updateFilterParams({ availability: "ALL", page: 1 })
                    }
                    size="small"
                    sx={{
                      bgcolor: publicPalette.accentLight,
                      color: publicPalette.accentDark,
                      fontWeight: 600,
                    }}
                  />
                )}

                {!queryText &&
                  selectedGenreId === null &&
                  availability === "ALL" && (
                    <Typography
                      variant="body2"
                      sx={{ color: publicPalette.textSecondary }}
                    >
                      Hiển thị toàn bộ danh mục kinh sách công khai
                    </Typography>
                  )}
              </Stack>

              <Stack direction="row" spacing={1.25} alignItems="center">
                <Typography
                  variant="body2"
                  sx={{
                    color: publicPalette.textSecondary,
                    whiteSpace: "nowrap",
                  }}
                >
                  Sắp xếp:
                </Typography>
                <FormControl size="small" sx={{ minWidth: 205 }}>
                  <Select
                    value={sortValue}
                    onChange={(event) =>
                      updateFilterParams({
                        sort: event.target.value,
                        page: 1,
                      })
                    }
                    sx={{
                      borderRadius: "10px",
                      bgcolor: publicPalette.background,
                      fontSize: "0.88rem",
                    }}
                  >
                    {SORT_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Paper>

            {/* 4.5 Trạng thái Loading / Error / Empty / Danh sách kết quả */}
            {booksLoading ? (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    lg: "repeat(3, 1fr)",
                  },
                  gap: 3,
                }}
              >
                {[1, 2, 3, 4, 5, 6].map((index) => (
                  <Skeleton
                    key={index}
                    variant="rounded"
                    height={390}
                    sx={{ borderRadius: "14px" }}
                  />
                ))}
              </Box>
            ) : booksError ? (
              <Alert
                severity="error"
                action={
                  <Button
                    color="inherit"
                    size="small"
                    startIcon={<RefreshRoundedIcon />}
                    onClick={() => setRetryCount((value) => value + 1)}
                  >
                    Thử lại
                  </Button>
                }
                sx={{ borderRadius: "12px" }}
              >
                {booksError}
              </Alert>
            ) : books.length === 0 ? (
              <Paper
                variant="outlined"
                sx={{
                  p: { xs: 4, sm: 6 },
                  textAlign: "center",
                  borderRadius: "14px",
                  borderColor: publicPalette.border,
                  bgcolor: publicPalette.surface,
                }}
              >
                <MenuBookOutlinedIcon
                  sx={{ fontSize: 48, color: publicPalette.accent, mb: 1.5 }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: publicFonts.serif,
                    fontWeight: 700,
                    color: publicPalette.textPrimary,
                    mb: 1,
                  }}
                >
                  Không tìm thấy kinh sách phù hợp
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: publicPalette.textSecondary,
                    maxWidth: 460,
                    mx: "auto",
                    mb: 3,
                  }}
                >
                  Không có ấn phẩm nào khớp với từ khóa hoặc bộ lọc hiện tại.
                  Bạn có thể thử từ khóa khác hoặc đặt lại bộ lọc.
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<RestartAltRoundedIcon />}
                  onClick={handleResetFilters}
                >
                  Xóa bộ lọc
                </Button>
              </Paper>
            ) : (
              <>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, 1fr)",
                      lg: "repeat(3, 1fr)",
                    },
                    gap: 3,
                  }}
                >
                  {books.map((book) => (
                    <PublicBookCard key={book.id} book={book} />
                  ))}
                </Box>

                {totalPages > 1 && (
                  <Box
                    sx={{
                      mt: 4.5,
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <Pagination
                      color="primary"
                      count={totalPages}
                      page={currentPage + 1}
                      onChange={(_, nextPage) => {
                        updateFilterParams({ page: nextPage });
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      sx={{
                        "& .MuiPaginationItem-root": {
                          borderRadius: "8px",
                          fontWeight: 600,
                        },
                      }}
                    />
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
      </Container>

      {/* Drawer bộ lọc trên Mobile */}
      <Drawer
        anchor="left"
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        PaperProps={{
          sx: {
            width: 300,
            bgcolor: publicPalette.surface,
            p: 2.5,
          },
        }}
      >
        {renderFilterSidebarContent(true)}
      </Drawer>
    </PublicLayout>
  );
};

export default PublicBooksPage;

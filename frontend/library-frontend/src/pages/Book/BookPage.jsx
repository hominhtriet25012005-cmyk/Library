import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import GenreFilter from "./GenreFilter";
import BookCard from "./BookCard";
import { booksApi } from "../../api/books";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SortIcon from "@mui/icons-material/SortRounded";
import SearchIcon from "@mui/icons-material/SearchRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import ViewListRoundedIcon from "@mui/icons-material/ViewListRounded";
import {
  PageHeader,
  TablePaginationBar,
  EmptyState,
} from "../../components/common";
import { useAuth } from "../../auth/useAuth";
import { useUserSettings } from "../../settings/useUserSettings";
import {
  addUserSearchHistory,
  getUserSearchHistory,
} from "../../settings/userSettings";

const genres = [
  {
    active: true,
    bookCount: 2,
    code: "PROGRAMMING",
    id: 10,
    name: "Lập trình",
  },
  {
    active: true,
    bookCount: 120,
    code: "FICTION",
    createdAt: "2025-10-10T10:40:08.725525",
    description:
      "Thể loại truyện hư cấu, tập trung vào nhân vật, cốt truyện và chủ đề.",
    displayOrder: 1,
    id: 1,
    name: "Tiểu thuyết",
    parentGenreId: null,
    parentGenreName: null,
    subGenres: null,
    updatedAt: "2025-10-10T10:40:08.725525",
  },
  {
    active: true,
    bookCount: 30,
    code: "MYSTERY",
    createdAt: "2025-10-10T10:45:05.321987",
    description:
      "Thể loại xoay quanh việc phá án, khám phá bí mật và các tình tiết hồi hộp.",
    displayOrder: 5,
    id: 5,
    name: "Trinh thám",
    parentGenreId: null,
    parentGenreName: null,
    subGenres: null,
    updatedAt: "2025-10-10T10:45:05.321987",
  },
];

const books = [
  {
    active: true,
    alreadyHaveLoan: null,
    alreadyHaveReservation: null,
    author: "Eric Evans",
    availableCopies: 0,
    coverImageUrl:
      "http://res.cloudinary.com/dxoqwusir/image/upload/v1761368808/domain_driven_design.jpg",
    createdAt: "2025-10-12T08:15:10.555666",
    description:
      "Cuốn sách nền tảng về áp dụng thiết kế hướng miền cho các hệ thống phần mềm phức tạp.",
    genreCode: "PROGRAMMING",
    genreId: 10,
    genreName: "Lập trình",
    id: 13,
    isbn: "978-0-321-12521-7",
    language: "English",
    pages: 560,
    price: 799,
    publicationDate: "2003-08-30",
    publisher: "Addison-Wesley",
    title: "Domain-Driven Design",
    totalCopies: 1,
    updatedAt: "2025-12-24T17:05:40.777666",
  },
  {
    active: true,
    alreadyHaveLoan: null,
    alreadyHaveReservation: null,
    author: "Martin Fowler",
    availableCopies: 2,
    coverImageUrl:
      "http://res.cloudinary.com/dxoqwusir/image/upload/v1761368807/refactoring.jpg",
    createdAt: "2025-10-15T16:40:22.333444",
    description:
      "Hướng dẫn cải thiện mã nguồn hiện có bằng các kỹ thuật tái cấu trúc.",
    genreCode: "PROGRAMMING",
    genreId: 10,
    genreName: "Lập trình",
    id: 12,
    isbn: "978-0-13-475759-9",
    language: "English",
    pages: 448,
    price: 649,
    publicationDate: "2018-11-20",
    publisher: "Addison-Wesley",
    title: "Refactoring",
    totalCopies: 3,
    updatedAt: "2025-12-23T12:30:55.999888",
  },
];

const BookPage = ({ preview = false }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const { user } = useAuth();
  const { settings } = useUserSettings();
  const userId = user?.id ?? "guest";

  const pageSize = settings?.appearance?.booksPerPage || 12;
  const [viewMode, setViewMode] = React.useState(
    settings?.appearance?.defaultBookView || "grid",
  );

  React.useEffect(() => {
    if (settings?.appearance?.defaultBookView) {
      setViewMode(settings.appearance.defaultBookView);
    }
  }, [settings?.appearance?.defaultBookView]);

  React.useEffect(() => {
    if (urlQuery) {
      setSearchTerm(urlQuery);
      setPage(0);
      if (!preview) setLoading(true);
    }
  }, [urlQuery, preview]);

  const [searchHistory, setSearchHistory] = React.useState(() =>
    settings?.privacy?.saveSearchHistory ? getUserSearchHistory(userId) : [],
  );

  React.useEffect(() => {
    if (settings?.privacy?.saveSearchHistory) {
      setSearchHistory(getUserSearchHistory(userId));
    } else {
      setSearchHistory([]);
    }
  }, [settings?.privacy?.saveSearchHistory, userId]);

  React.useEffect(() => {
    const handleHistoryCleared = () => setSearchHistory([]);
    const handleHistoryUpdated = (e) => {
      if (e.detail?.userId === userId) {
        setSearchHistory(e.detail.history || []);
      }
    };
    window.addEventListener(
      "library:search-history-cleared",
      handleHistoryCleared,
    );
    window.addEventListener(
      "library:search-history-updated",
      handleHistoryUpdated,
    );
    return () => {
      window.removeEventListener(
        "library:search-history-cleared",
        handleHistoryCleared,
      );
      window.removeEventListener(
        "library:search-history-updated",
        handleHistoryUpdated,
      );
    };
  }, [userId]);

  const [selectedGenreId, setSelectedGenreId] = React.useState(null);
  const [availabilityFilter, setAvailabilityFilter] = React.useState("ALL");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortBy, setSortBy] = React.useState("createdAt");
  const [sortDirection, setSortDirection] = React.useState("DESC");
  const [page, setPage] = React.useState(0);
  const [catalog, setCatalog] = React.useState(null);
  const [loadedGenres, setLoadedGenres] = React.useState([]);
  const [loading, setLoading] = React.useState(!preview);
  const [catalogError, setCatalogError] = React.useState("");
  const [genreError, setGenreError] = React.useState("");
  const [retry, setRetry] = React.useState(0);

  React.useEffect(() => {
    if (preview) return;
    const controller = new AbortController();
    booksApi
      .genres({ signal: controller.signal })
      .then((data) => {
        const activeGenres = data.filter((genre) => genre.active);
        activeGenres.sort(
          (a, b) =>
            (a.displayOrder ?? 0) - (b.displayOrder ?? 0) ||
            (a.name || "").localeCompare(b.name || "", "vi"),
        );
        setLoadedGenres(activeGenres);
        setGenreError("");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setGenreError(error.message);
      });
    return () => controller.abort();
  }, [preview, retry]);

  React.useEffect(() => {
    if (preview) return;
    const controller = new AbortController();
    const timer = setTimeout(
      () => {
        if (searchTerm.trim() && settings?.privacy?.saveSearchHistory) {
          addUserSearchHistory(userId, searchTerm.trim());
        }
        booksApi
          .search(
            {
              searchTerm,
              genreId: selectedGenreId,
              availability: availabilityFilter,
              page,
              size: pageSize,
              sortBy,
              sortDirection,
            },
            { signal: controller.signal },
          )
          .then((data) => {
            setCatalog(data);
            setCatalogError("");
          })
          .catch((error) => {
            if (error.name !== "AbortError") setCatalogError(error.message);
          })
          .finally(() => {
            if (!controller.signal.aborted) setLoading(false);
          });
      },
      searchTerm.trim() ? 300 : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    preview,
    searchTerm,
    selectedGenreId,
    availabilityFilter,
    page,
    pageSize,
    sortBy,
    sortDirection,
    retry,
    settings?.privacy?.saveSearchHistory,
    userId,
  ]);

  const handleGenreChange = (event) => {
    setSelectedGenreId(event);
    setPage(0);
    if (!preview) setLoading(true);
  };

  const handleSortChange = (value) => {
    const [field, direction] = value.split("-");
    setSortBy(field);
    setSortDirection(direction.toUpperCase());
    setPage(0);
    if (!preview) setLoading(true);
  };

  const getCurrentSortValue = () => {
    return `${sortBy}-${sortDirection.toLowerCase()}`;
  };

  const visibleBooks = preview
    ? books
        .filter(
          (book) => selectedGenreId == null || book.genreId === selectedGenreId,
        )
        .filter(
          (book) =>
            availabilityFilter === "ALL" ||
            (availabilityFilter === "AVAILABLE" && book.availableCopies > 0) ||
            (availabilityFilter === "CHECKED_OUT" &&
              book.availableCopies === 0),
        )
        .filter((book) =>
          [book.title, book.author, book.genreName].some((value) =>
            value?.toLowerCase().includes(searchTerm.trim().toLowerCase()),
          ),
        )
        .sort((a, b) => {
          const comparison = String(a[sortBy] ?? "").localeCompare(
            String(b[sortBy] ?? ""),
          );
          return sortDirection === "ASC" ? comparison : -comparison;
        })
    : (catalog?.content ?? []);

  return (
    <Box
      component="section"
      aria-label="Khám phá kho sách"
      sx={{
        width: "100%",
        maxWidth: 1440,
        mx: "auto",
      }}
    >
      {/* Header */}
      <PageHeader
        title="Khám phá kho sách"
        subtitle="Tìm kiếm theo thể loại, tác giả và tình trạng mượn trả từ kho tài nguyên thư viện"
        icon={AutoStoriesRoundedIcon}
      />

      {/* Main Content Layout */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          gap: 3.5,
          alignItems: "flex-start",
        }}
      >
        {/* Left Sidebar Filter */}
        <Box
          sx={{
            width: { xs: "100%", lg: 280 },
            flexShrink: 0,
            display: "grid",
            gap: 2.5,
          }}
        >
          {/* Thể loại */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2.5,
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <GenreFilter
              onGenreSelect={handleGenreChange}
              genres={preview ? genres : loadedGenres}
              selectedGenreId={selectedGenreId}
            />
            {genreError && (
              <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 2 }}>
                Không tải được thể loại: {genreError}
              </Alert>
            )}
          </Paper>

          {/* Tình trạng sách */}
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, color: "text.primary", mb: 2 }}
            >
              Tình trạng sách
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={availabilityFilter}
                onChange={(e) => {
                  setAvailabilityFilter(e.target.value);
                  setPage(0);
                  if (!preview) setLoading(true);
                }}
                sx={{ borderRadius: "10px" }}
              >
                <MenuItem value="ALL">Tất cả sách</MenuItem>
                <MenuItem value="AVAILABLE">Còn sách mượn</MenuItem>
                <MenuItem value="CHECKED_OUT">Đang được mượn hết</MenuItem>
              </Select>
            </FormControl>
          </Paper>
        </Box>

        {/* Right Books Main Area */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            width: "100%",
            display: "grid",
            gap: 2.5,
          }}
        >
          {/* Search & Sort Bar */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2.5,
              borderColor: "divider",
              bgcolor: "background.paper",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems="center"
              sx={{ width: "100%" }}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="Tìm theo tên sách, tác giả hoặc ISBN..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                  if (!preview) setLoading(true);
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: "#94a3b8" }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                }}
              />

              <FormControl
                size="small"
                sx={{ width: { xs: "100%", sm: 220 }, flexShrink: 0 }}
              >
                <InputLabel id="book-sort-label">Sắp xếp theo</InputLabel>
                <Select
                  labelId="book-sort-label"
                  value={getCurrentSortValue()}
                  onChange={(e) => handleSortChange(e.target.value)}
                  label="Sắp xếp theo"
                  startAdornment={
                    <InputAdornment position="start">
                      <SortIcon sx={{ color: "#94a3b8" }} />
                    </InputAdornment>
                  }
                  sx={{ borderRadius: "10px" }}
                >
                  <MenuItem value="title-asc">Tên sách (A–Z)</MenuItem>
                  <MenuItem value="title-desc">Tên sách (Z–A)</MenuItem>
                  <MenuItem value="author-asc">Tác giả (A–Z)</MenuItem>
                  <MenuItem value="author-desc">Tác giả (Z–A)</MenuItem>
                  <MenuItem value="createdAt-desc">Mới cập nhật</MenuItem>
                  <MenuItem value="createdAt-asc">Cũ nhất</MenuItem>
                </Select>
              </FormControl>

              {/* Chế độ xem: Lưới (Grid) hoặc Danh sách (List) */}
              <Stack
                direction="row"
                spacing={0.5}
                sx={{
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark" ? "#17243a" : "#f1f5f9",
                  p: 0.5,
                  borderRadius: 2,
                  flexShrink: 0,
                  alignSelf: { xs: "flex-end", sm: "center" },
                }}
              >
                <Tooltip title="Xem dạng lưới (Grid)" arrow>
                  <IconButton
                    size="small"
                    onClick={() => setViewMode("grid")}
                    color={viewMode === "grid" ? "primary" : "default"}
                    sx={{
                      bgcolor: (theme) =>
                        viewMode === "grid"
                          ? theme.palette.mode === "dark"
                            ? "#0f172a"
                            : "#ffffff"
                          : "transparent",
                      boxShadow:
                        viewMode === "grid"
                          ? "0 1px 3px rgba(0,0,0,0.1)"
                          : "none",
                      borderRadius: 1.5,
                    }}
                  >
                    <GridViewRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Xem dạng danh sách (List)" arrow>
                  <IconButton
                    size="small"
                    onClick={() => setViewMode("list")}
                    color={viewMode === "list" ? "primary" : "default"}
                    sx={{
                      bgcolor: (theme) =>
                        viewMode === "list"
                          ? theme.palette.mode === "dark"
                            ? "#0f172a"
                            : "#ffffff"
                          : "transparent",
                      boxShadow:
                        viewMode === "list"
                          ? "0 1px 3px rgba(0,0,0,0.1)"
                          : "none",
                      borderRadius: 1.5,
                    }}
                  >
                    <ViewListRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>

            {/* Gợi ý lịch sử tìm kiếm gần đây */}
            {searchHistory.length > 0 && !searchTerm && (
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ flexWrap: "wrap", gap: 0.75, pt: 0.5 }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: "#64748b", fontWeight: 600 }}
                >
                  Tìm gần đây:
                </Typography>
                {searchHistory.map((term, idx) => (
                  <Chip
                    key={idx}
                    label={term}
                    size="small"
                    clickable
                    onClick={() => {
                      setSearchTerm(term);
                      setPage(0);
                      if (!preview) setLoading(true);
                    }}
                    sx={{
                      height: 24,
                      fontSize: "0.75rem",
                      bgcolor: "#f1f5f9",
                      "&:hover": { bgcolor: "#e2e8f0" },
                    }}
                  />
                ))}
              </Stack>
            )}
          </Paper>

          {/* Error Message */}
          {!preview && catalogError && (
            <Alert
              severity="error"
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setLoading(true);
                    setRetry((value) => value + 1);
                  }}
                >
                  Thử lại
                </Button>
              }
              sx={{ borderRadius: 2 }}
            >
              Không tải được danh sách sách: {catalogError}
            </Alert>
          )}

          {/* Loading Indicator */}
          {loading && !preview ? (
            <Box
              sx={{
                py: 10,
                textAlign: "center",
                bgcolor: "background.paper",
                borderRadius: 2.5,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <CircularProgress size={32} />
              <Typography variant="body2" sx={{ mt: 1.5, color: "#64748b" }}>
                Đang tìm kiếm kho sách...
              </Typography>
            </Box>
          ) : visibleBooks.length > 0 ? (
            viewMode === "grid" ? (
              /* Books Grid */
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    xl: "repeat(3, minmax(0, 1fr))",
                  },
                  gap: 2.5,
                }}
              >
                {visibleBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onViewDetails={
                      preview
                        ? undefined
                        : (id) => navigate(`/user/books/${id}`)
                    }
                  />
                ))}
              </Box>
            ) : (
              /* Books List View */
              <Stack spacing={2}>
                {visibleBooks.map((book) => (
                  <Paper
                    key={book.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      borderColor: "divider",
                      bgcolor: "background.paper",
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      gap: 2.5,
                      alignItems: { xs: "flex-start", sm: "center" },
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: "#1769ff",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      },
                    }}
                  >
                    <Box
                      component="img"
                      src={
                        book.coverImageUrl ||
                        "https://placehold.co/100x140?text=No+Cover"
                      }
                      alt={book.title}
                      sx={{
                        width: { xs: 80, sm: 80 },
                        height: { xs: 112, sm: 112 },
                        borderRadius: 1.5,
                        objectFit: "cover",
                        flexShrink: 0,
                        bgcolor: "#f1f5f9",
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mb: 0.5, flexWrap: "wrap", gap: 0.5 }}
                      >
                        {book.genreName && (
                          <Chip
                            label={book.genreName}
                            size="small"
                            variant="outlined"
                            color="primary"
                            sx={{
                              height: 20,
                              fontSize: "0.7rem",
                              fontWeight: 600,
                            }}
                          />
                        )}
                        <Chip
                          label={
                            book.availableCopies > 0
                              ? `Còn ${book.availableCopies}/${book.totalCopies} cuốn`
                              : "Hết sách"
                          }
                          size="small"
                          color={
                            book.availableCopies > 0 ? "success" : "default"
                          }
                          sx={{
                            height: 20,
                            fontSize: "0.7rem",
                            fontWeight: 700,
                          }}
                        />
                      </Stack>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 750,
                          color: "#0f172a",
                          lineHeight: 1.3,
                          mb: 0.25,
                        }}
                      >
                        {book.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 0.75 }}
                      >
                        Tác giả: <strong>{book.author}</strong>{" "}
                        {book.publisher ? `• NXB: ${book.publisher}` : ""}
                      </Typography>
                      {book.description && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            lineHeight: 1.5,
                          }}
                        >
                          {book.description}
                        </Typography>
                      )}
                    </Box>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() =>
                        preview ? undefined : navigate(`/user/books/${book.id}`)
                      }
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 700,
                        px: 2.5,
                        whiteSpace: "nowrap",
                        alignSelf: { xs: "stretch", sm: "center" },
                      }}
                    >
                      Xem chi tiết
                    </Button>
                  </Paper>
                ))}
              </Stack>
            )
          ) : (
            /* Empty State */
            <EmptyState
              icon={MenuBookRoundedIcon}
              title="Không tìm thấy sách phù hợp"
              description="Thử tìm kiếm với từ khóa khác hoặc xóa bớt các bộ lọc thể loại."
              actionText="Xóa bộ lọc"
              onAction={() => {
                setSearchTerm("");
                setSelectedGenreId(null);
                setAvailabilityFilter("ALL");
              }}
            />
          )}

          {/* Server-side Pagination */}
          {!preview && !loading && !catalogError && catalog?.totalPages > 1 && (
            <TablePaginationBar
              page={page}
              totalPages={catalog.totalPages}
              totalElements={catalog.totalElements}
              pageSize={pageSize}
              onPageChange={(newPage) => {
                setPage(newPage);
                setLoading(true);
              }}
              itemLabel="đầu sách"
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default BookPage;

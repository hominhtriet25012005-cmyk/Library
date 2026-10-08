import React from "react";
import { useNavigate } from "react-router-dom";
import GenreFilter from "./GenreFilter";
import BookCard from "./BookCard";
import { booksApi } from "../../api/books";
import WishlistStatus from "../../wishlist/WishlistStatus";
import {
  Alert,
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Pagination,
} from "@mui/material";
import SortIcon from "@mui/icons-material/SortRounded";
import SearchIcon from "@mui/icons-material/SearchRounded";

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
        setLoadedGenres(data.filter((genre) => genre.active));
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
        booksApi
          .search(
            {
              searchTerm,
              genreId: selectedGenreId,
              availability: availabilityFilter,
              page,
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
    sortBy,
    sortDirection,
    retry,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
      {/* header */}
      <div className="bg-white border-b border-gray-200 text-center">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-4xl text-gray-900 mb-2">
            <h1 className="font-bold">
              Khám phá{" "}
              <span className="bg-gradient-to-r from-blue-700 to-sky-700 bg-clip-text text-transparent">
                kho sách
              </span>
            </h1>

            <p className="text-lg text-gray-600">
              Tìm sách theo thể loại, tác giả và tình trạng còn sách
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* sidebar -filter */}
          <aside className="lg:w-72 space-y-6">
            {/* filterr container */}
            <div className="space-y-6">
              {/* Genre Filter */}
              <GenreFilter
                onGenreSelect={handleGenreChange}
                genres={preview ? genres : loadedGenres}
                selectedGenreId={selectedGenreId}
              />
              {genreError && (
                <Alert severity="warning">
                  Không tải được thể loại: {genreError}
                </Alert>
              )}

              {/* Availability Filter */}
              <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                  Tình trạng sách
                </h3>

                <FormControl fullWidth>
                  <Select
                    value={availabilityFilter}
                    onChange={(e) => {
                      setAvailabilityFilter(e.target.value);
                      setPage(0);
                      if (!preview) setLoading(true);
                    }}
                  >
                    <MenuItem value={"ALL"}>Tất cả sách</MenuItem>
                    <MenuItem value="AVAILABLE">Còn sách</MenuItem>
                    <MenuItem value="CHECKED_OUT">Đã hết sách</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>
            {/* */}
          </aside>

          {/* Main Content Area */}

          <main className="flex-1 space-y-6">
            {!preview && <WishlistStatus />}
            {/* search and sort  */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1">
                <TextField
                  fullWidth
                  placeholder="Tìm theo tên sách, tác giả hoặc ISBN..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(0);
                    if (!preview) setLoading(true);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon className="text-gray-400" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&:hover fieldset": {
                        borderColor: "#1769ff",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#1769ff",
                      },
                    },
                  }}
                />
              </div>

              {/* Sort Dropdown */}
              <div className="md:w-64">
                <FormControl fullWidth>
                  <InputLabel>Sắp xếp theo</InputLabel>

                  <Select
                    value={getCurrentSortValue()}
                    onChange={(e) => handleSortChange(e.target.value)}
                    label="Sắp xếp theo"
                    startAdornment={
                      <InputAdornment position="start">
                        <SortIcon className="text-gray-400" />
                      </InputAdornment>
                    }
                    sx={{
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#E5E7EB",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#1769ff",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#1769ff",
                      },
                    }}
                  >
                    <MenuItem value="title-asc">Tên sách (A–Z)</MenuItem>
                    <MenuItem value="title-desc">Tên sách (Z–A)</MenuItem>
                    <MenuItem value="author-asc">Tác giả (A–Z)</MenuItem>
                    <MenuItem value="author-desc">Tác giả (Z–A)</MenuItem>
                    <MenuItem value="createdAt-desc">Mới nhất</MenuItem>
                    <MenuItem value="createdAt-asc">Cũ nhất</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>

            {/* Books Grid */}
            {!preview && catalogError ? (
              <Alert
                severity="error"
                action={
                  <Button
                    color="inherit"
                    onClick={() => {
                      setLoading(true);
                      setRetry((value) => value + 1);
                    }}
                  >
                    Thử lại
                  </Button>
                }
              >
                Không tải được danh sách sách: {catalogError}
              </Alert>
            ) : loading && !preview ? (
              <p
                role="status"
                className="rounded-xl bg-white p-6 text-gray-600"
              >
                Đang tải sách...
              </p>
            ) : visibleBooks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
              </div>
            ) : (
              <p className="rounded-xl bg-white p-6 text-gray-600">
                Không tìm thấy sách phù hợp với bộ lọc.
              </p>
            )}
            {!preview &&
              !loading &&
              !catalogError &&
              catalog?.totalPages > 1 && (
                <div className="flex justify-center pt-4">
                  <Pagination
                    color="primary"
                    page={page + 1}
                    count={catalog.totalPages}
                    onChange={(_, value) => {
                      setPage(value - 1);
                      setLoading(true);
                    }}
                  />
                </div>
              )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default BookPage;

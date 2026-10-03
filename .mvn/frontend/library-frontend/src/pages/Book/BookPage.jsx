import React from "react";
import GenreFilter from "./GenreFilter";
import {
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { Sort, Search } from "@mui/icons-material";

// import { SortIcon, SearchIcon } from "@mui/icons-material";

const genres = [
  {
    active: true,
    bookCount: 120,
    code: "FICTION",
    createdAt: "2025-10-10T10:40:08.725525",
    description:
      "Genre that includes imaginative or invented stories, often exploring characters, plots, and themes.",
    displayOrder: 1,
    id: 1,
    name: "Fiction",
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
      "Genre focused on solving crimes, uncovering secrets, and suspenseful investigations.",
    displayOrder: 5,
    id: 5,
    name: "Mystery",
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
      "A foundational book on applying domain-driven design principles to complex software projects.",
    genreCode: "PROGRAMMING",
    genreId: 10,
    genreName: "PROGRAMMING",
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
      "A comprehensive guide to improving existing code through refactoring techniques.",
    genreCode: "PROGRAMMING",
    genreId: 10,
    genreName: "PROGRAMMING",
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

const BookPage = () => {
  const [selectedGenreId, setSelectedGenreId] = React.useState(null);
  const [availabilityFilter, setAvailabilityFilter] = React.useState("ALL");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortBy, setSortBy] = React.useState("createdAt");
  const [sortDirection, setSortDirection] = React.useState("DESC");

  const handleGenreChange = (event) => {
    const genreId = event.target.value;

    setSelectedGenreId(genreId);
  };

  console.log("Selected Genre ID:", selectedGenreId);

  const handleSortChange = (value) => {
    const [field, direction] = value.split("-");

    setSortBy(field);
    setSortDirection(direction.toUpperCase());
  };

  const getCurrentSortValue = () => {
    return `${sortBy}-${sortDirection.toLowerCase()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* header */}
      <div className="bg-white border-b border-gray-200 text-center">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-4xl text-gray-900 mb-2">
            <h1 className="font-bold">
              Browse Our{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Collection
              </span>
            </h1>

            <p className="text-lg text-gray-600">
              Discover thousands of books across all genres
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
              <GenreFilter onGenreSelect={handleGenreChange} genres={genres} />

              {/* Availability Filter */}
              <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                  Availability
                </h3>

                <FormControl fullWidth>
                  <Select
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                  >
                    <MenuItem value={"ALL"}>All Books</MenuItem>
                    <MenuItem value="AVAILABLE">Available Only</MenuItem>
                    <MenuItem value="CHECKED_OUT">Checked Out</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>
            {/* */}
          </aside>

          {/* Main Content Area */}

          <main className="flex-1 space-y-6">
            {/* search and sort  */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1">
                <TextField
                  fullWidth
                  placeholder="Search by title, author, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                        borderColor: "#4F46E5",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#4F46E5",
                      },
                    },
                  }}
                />
              </div>

              {/* Sort Dropdown */}
              <div className="md:w-64">
                <FormControl fullWidth>
                  <InputLabel>Sort By</InputLabel>

                  <Select
                    value={getCurrentSortValue()}
                    onChange={(e) => handleSortChange(e.target.value)}
                    label="Sort By"
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
                        borderColor: "#4F46E5",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#4F46E5",
                      },
                    }}
                  >
                    <MenuItem value="title-asc">Title (A-Z)</MenuItem>
                    <MenuItem value="title-desc">Title (Z-A)</MenuItem>
                    <MenuItem value="author-asc">Author (A-Z)</MenuItem>
                    <MenuItem value="author-desc">Author (Z-A)</MenuItem>
                    <MenuItem value="createdAt-desc">Newest First</MenuItem>
                    <MenuItem value="createdAt-asc">Oldest First</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>

            {/* Books Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"></div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default BookPage;

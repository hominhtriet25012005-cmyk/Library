import { createTheme } from "@mui/material/styles";

/**
 * Bảng màu và cấu hình nhận diện thị giác dành riêng cho khu vực Public
 * Đề tài: Thiết kế và xây dựng hệ thống website quản lý thư viện sách kinh Phật
 */
export const publicPalette = {
  background: "#FAF8F3",
  surface: "#FFFFFF",
  surfaceMuted: "#F3EFE6",
  primary: "#315B4C",
  primaryDark: "#244539",
  primaryLight: "#EBF1EE",
  accent: "#A98247",
  accentDark: "#8C6833",
  accentLight: "#F6EFE4",
  textPrimary: "#26332D",
  textSecondary: "#64716A",
  border: "#E7E4DB",
  status: {
    available: {
      bg: "#E7F2EC",
      text: "#234E3E",
      border: "#C4DCD0",
    },
    unavailable: {
      bg: "#F5ECE0",
      text: "#7D5626",
      border: "#E3CFB4",
    },
    error: {
      bg: "#FDF2F2",
      text: "#9B2C2C",
      border: "#F3C7C7",
    },
  },
};

const libraryFontFamily =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const publicFonts = {
  sans: libraryFontFamily,
  serif: libraryFontFamily,
};

export const publicNavigationItems = [
  { label: "Trang chủ", path: "/" },
  { label: "Kho kinh sách", path: "/books" },
  { label: "Giới thiệu", path: "/about" },
  { label: "Liên hệ", path: "/contact" },
];

export const isPublicNavActive = (itemPath, currentPathname = "/") => {
  if (itemPath === "/") {
    return currentPathname === "/";
  }
  if (itemPath === "/books") {
    return (
      currentPathname === "/books" || currentPathname.startsWith("/books/")
    );
  }
  return (
    currentPathname === itemPath || currentPathname.startsWith(`${itemPath}/`)
  );
};

export const createPublicTheme = () =>
  createTheme({
    palette: {
      mode: "light",
      primary: {
        main: publicPalette.primary,
        dark: publicPalette.primaryDark,
        light: publicPalette.primaryLight,
        contrastText: "#FFFFFF",
      },
      secondary: {
        main: publicPalette.accent,
        dark: publicPalette.accentDark,
        light: publicPalette.accentLight,
        contrastText: "#FFFFFF",
      },
      background: {
        default: publicPalette.background,
        paper: publicPalette.surface,
      },
      text: {
        primary: publicPalette.textPrimary,
        secondary: publicPalette.textSecondary,
      },
      divider: publicPalette.border,
      success: {
        main: "#2F6B55",
        light: "#E7F2EC",
        dark: "#234E3E",
      },
      warning: {
        main: "#A98247",
        light: "#F5ECE0",
        dark: "#7D5626",
      },
      error: {
        main: "#B83B3B",
        light: "#FDF2F2",
        dark: "#9B2C2C",
      },
    },
    typography: {
      fontFamily: publicFonts.sans,
      h1: {
        fontFamily: publicFonts.serif,
        fontWeight: 700,
        color: publicPalette.textPrimary,
        letterSpacing: "-0.015em",
      },
      h2: {
        fontFamily: publicFonts.serif,
        fontWeight: 700,
        color: publicPalette.textPrimary,
        letterSpacing: "-0.01em",
      },
      h3: {
        fontFamily: publicFonts.serif,
        fontWeight: 700,
        color: publicPalette.textPrimary,
      },
      h4: {
        fontWeight: 700,
        color: publicPalette.textPrimary,
      },
      h5: {
        fontWeight: 650,
        color: publicPalette.textPrimary,
      },
      h6: {
        fontWeight: 650,
        color: publicPalette.textPrimary,
      },
      body1: {
        color: publicPalette.textPrimary,
        lineHeight: 1.7,
      },
      body2: {
        color: publicPalette.textSecondary,
        lineHeight: 1.65,
      },
      button: {
        textTransform: "none",
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 10,
            textTransform: "none",
            fontWeight: 600,
            transition: "all 0.2s ease",
            "&:focus-visible": {
              outline: `2px solid ${publicPalette.accent}`,
              outlineOffset: 2,
            },
          },
          containedPrimary: {
            backgroundColor: publicPalette.primary,
            color: "#FFFFFF",
            "&:hover": {
              backgroundColor: publicPalette.primaryDark,
            },
          },
          outlinedPrimary: {
            borderColor: publicPalette.primary,
            color: publicPalette.primary,
            "&:hover": {
              borderColor: publicPalette.primaryDark,
              backgroundColor: publicPalette.primaryLight,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
          outlined: {
            borderColor: publicPalette.border,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            backgroundColor: publicPalette.surface,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: publicPalette.border,
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: publicPalette.accent,
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: publicPalette.primary,
              borderWidth: "1.5px",
            },
          },
        },
      },
    },
  });

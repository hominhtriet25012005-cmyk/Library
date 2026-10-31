import { createTheme } from "@mui/material/styles";

// Design Tokens - Bảng màu chủ đạo của Hệ thống Quản lý Thư viện
export const brandColors = {
  primary: {
    50: "#eef5ff",
    100: "#d9e8ff",
    200: "#bcd7ff",
    300: "#8ec0ff",
    400: "#599eff",
    main: "#1769ff",
    dark: "#0d4ed3",
    light: "#e8f0ff",
    contrastText: "#ffffff",
  },
  navy: {
    main: "#102d62",
    dark: "#0a1931",
    light: "#1c499c",
    sidebar: "#0d2552",
    contrastText: "#ffffff",
  },
  semantic: {
    success: {
      main: "#16a34a",
      light: "#dcfce7",
      dark: "#15803d",
      text: "#15803d",
    },
    warning: {
      main: "#d97706",
      light: "#fef3c7",
      dark: "#b45309",
      text: "#b45309",
    },
    error: {
      main: "#dc2626",
      light: "#fee2e2",
      dark: "#b91c1c",
      text: "#b91c1c",
    },
    info: {
      main: "#0284c7",
      light: "#e0f2fe",
      dark: "#0369a1",
      text: "#0369a1",
    },
  },
  neutral: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
  },
};

export const createLibraryTheme = (mode = "light") => {
  const isDark = mode === "dark";
  const neutralText = isDark ? "#e2e8f0" : brandColors.neutral[900];
  const secondaryText = isDark ? "#a8b6ca" : brandColors.neutral[500];
  const surface = isDark ? "#111c2e" : "#ffffff";
  const border = isDark ? "#293952" : brandColors.neutral[200];

  return createTheme({
  palette: {
    mode,
    primary: brandColors.primary,
    secondary: {
      main: "#65a5ff",
      light: "#eff6ff",
      dark: "#3b82f6",
      contrastText: "#ffffff",
    },
    success: {
      main: brandColors.semantic.success.main,
      light: brandColors.semantic.success.light,
      dark: brandColors.semantic.success.dark,
    },
    warning: {
      main: brandColors.semantic.warning.main,
      light: brandColors.semantic.warning.light,
      dark: brandColors.semantic.warning.dark,
    },
    error: {
      main: brandColors.semantic.error.main,
      light: brandColors.semantic.error.light,
      dark: brandColors.semantic.error.dark,
    },
    info: {
      main: brandColors.semantic.info.main,
      light: brandColors.semantic.info.light,
      dark: brandColors.semantic.info.dark,
    },
    text: {
      primary: neutralText,
      secondary: secondaryText,
    },
    background: {
      default: isDark ? "#0b1220" : "#f6f9fc",
      paper: surface,
    },
    divider: border,
    grey: brandColors.neutral,
  },
  typography: {
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
    h4: {
      fontWeight: 750,
      letterSpacing: "-0.02em",
      color: neutralText,
    },
    h5: {
      fontWeight: 700,
      letterSpacing: "-0.01em",
      color: neutralText,
    },
    h6: {
      fontWeight: 650,
      color: neutralText,
    },
    subtitle1: {
      fontWeight: 600,
    },
    body2: {
      color: isDark ? "#c1ccda" : brandColors.neutral[600],
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          textTransform: "none",
          transition: "all 0.18s ease-in-out",
        },
        containedPrimary: {
          backgroundColor: brandColors.primary.main,
          "&:hover": {
            backgroundColor: brandColors.primary.dark,
            boxShadow: "0 2px 8px rgba(23, 105, 255, 0.28)",
          },
        },
        outlined: {
          borderColor: border,
          "&:hover": {
            borderColor: brandColors.primary.main,
            backgroundColor: isDark ? "rgba(23, 105, 255, 0.12)" : brandColors.primary[50],
          },
        },
        sizeMedium: {
          height: 40,
          padding: "8px 18px",
        },
        sizeSmall: {
          height: 32,
          padding: "4px 12px",
          fontSize: "0.8125rem",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12,
        },
        outlined: {
          borderColor: border,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          borderColor: border,
          boxShadow: isDark ? "0 1px 3px rgba(0, 0, 0, 0.25)" : "0 1px 3px rgba(15, 23, 42, 0.05)",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: surface,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: border,
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: isDark ? "#40536d" : brandColors.neutral[300],
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: brandColors.primary.main,
            borderWidth: "1.5px",
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: isDark ? "#17243a" : brandColors.neutral[50],
          "& .MuiTableCell-root": {
            color: isDark ? "#c1ccda" : brandColors.neutral[600],
            fontWeight: 700,
            fontSize: "0.8125rem",
            borderBottom: `1px solid ${border}`,
            letterSpacing: "0.02em",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: isDark ? "#24334a" : brandColors.neutral[100],
          fontSize: "0.875rem",
          padding: "12px 16px",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: isDark ? "rgba(96, 165, 250, 0.08)" : "rgba(23, 105, 255, 0.025)",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 6,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow:
            "0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)",
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          fontSize: "1.15rem",
          color: neutralText,
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: "16px 24px",
          borderTop: `1px solid ${isDark ? "#24334a" : brandColors.neutral[100]}`,
        },
      },
    },
  },
  });
};

export const theme = createLibraryTheme();

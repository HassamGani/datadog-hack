"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#5b8def",
    },
    secondary: {
      main: "#13c2c2",
    },
    background: {
      default: "#0f172a",
      paper: "#111827",
    },
    text: {
      primary: "#f8fafc",
      secondary: "#94a3b8",
    },
    divider: "rgba(148, 163, 184, 0.24)",
  },
  typography: {
    fontFamily: "var(--font-geist-sans)",
    h4: {
      fontWeight: 600,
      letterSpacing: "0.01em",
    },
    subtitle1: {
      color: "#cbd5f5",
    },
    body1: {
      color: "#e2e8f0",
    },
    body2: {
      color: "#94a3b8",
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.95))",
          border: "1px solid rgba(148, 163, 184, 0.12)",
          boxShadow: "0 20px 40px rgba(15, 23, 42, 0.45)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(18px)",
          border: "1px solid rgba(148, 163, 184, 0.12)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 999,
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(148, 163, 184, 0.08)",
          borderRadius: 999,
          padding: "4px",
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          border: "none",
          borderRadius: 999,
          padding: "6px 22px",
          color: "#cbd5f5",
          "&.Mui-selected": {
            backgroundColor: "rgba(91, 141, 239, 0.24)",
            color: "#ffffff",
          },
        },
      },
    },
  },
});

export default theme;


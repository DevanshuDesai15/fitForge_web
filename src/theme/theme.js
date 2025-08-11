import { createTheme } from "@mui/material";

// Define the color palette for easy maintenance
const colors = {
  // Primary brand colors (emerald)
  primary: {
    main: "#22c55e",
    light: "#34d399",
    dark: "#16a34a",
    contrastText: "#0b0f14",
  },

  // Secondary colors (indigo)
  secondary: {
    main: "#6366f1",
    light: "#818cf8",
    dark: "#4f46e5",
  },

  // Background colors (neutral darks)
  background: {
    default: "#0b0f14",
    paper: "#12161f",
    surface: "#151b26",
    dark: "#070a0f",
    medium: "#0f141b",
    gradient: {
      primary: "linear-gradient(135deg, #0b0f14 0%, #12161f 50%, #1a2230 100%)",
      hero: "linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(99, 102, 241, 0.10) 100%)",
      card: "linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))",
      home: "linear-gradient(135deg, #0b0f14 0%, #12161f 50%, #1a2230 100%)",
      button: "linear-gradient(45deg, #16a34a 0%, #34d399 100%)",
      buttonHover: "linear-gradient(45deg, #34d399 0%, #16a34a 100%)",
    },
  },

  // Text colors
  text: {
    primary: "#e5e7eb",
    secondary: "#9ca3af",
    muted: "rgba(229, 231, 235, 0.72)",
    disabled: "rgba(229, 231, 235, 0.42)",
    hint: "rgba(229, 231, 235, 0.6)",
  },

  // Status colors
  status: {
    error: "#ef4444",
    warning: "#f59e0b",
    success: "#22c55e",
    info: "#0ea5e9",
  },

  // Action colors for different workout actions
  actions: {
    library: "#22c55e",
    templates: "#6366f1",
    quickAdd: "#f59e0b",
    progress: "#0ea5e9",
  },

  // Difficulty levels
  difficulty: {
    beginner: "#22c55e",
    intermediate: "#f59e0b",
    expert: "#ef4444",
    unknown: "#9e9e9e",
  },

  // Border and divider colors
  border: {
    main: "rgba(255, 255, 255, 0.08)",
    strong: "rgba(255, 255, 255, 0.16)",
    primary: "rgba(34, 197, 94, 0.28)",
    light: "rgba(255, 255, 255, 0.04)",
  },

  // Surface colors for cards and containers
  surface: {
    primary: "rgba(34, 197, 94, 0.06)",
    secondary: "rgba(99, 102, 241, 0.08)",
    tertiary: "rgba(14, 165, 233, 0.08)",
    hover: "rgba(255, 255, 255, 0.06)",
    transparent: "rgba(255, 255, 255, 0.03)",
  },
};

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    text: colors.text,
    error: {
      main: colors.status.error,
    },
    warning: {
      main: colors.status.warning,
    },
    success: {
      main: colors.status.success,
    },
    info: {
      main: colors.status.info,
    },
    // Custom palette extensions
    status: colors.status,
    actions: colors.actions,
    difficulty: colors.difficulty,
    border: colors.border,
    surface: colors.surface,
  },
  typography: {
    fontFamily:
      "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    h1: { fontFamily: "Bebas Neue, Inter, sans-serif", letterSpacing: "0.5px" },
    h2: {
      fontFamily: "Bebas Neue, Inter, sans-serif",
      letterSpacing: "0.25px",
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: colors.background.gradient.card,
          boxShadow: `0 0 20px rgba(0, 0, 0, 0.25)`,
          border: `1px solid ${colors.border.main}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        contained: {
          background: colors.background.gradient.button,
          color: colors.primary.contrastText,
          "&:hover": {
            background: colors.background.gradient.buttonHover,
          },
        },
      },
    },
  },
});

// Export colors for use in styled components
export { colors };

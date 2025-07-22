import { createTheme } from "@mui/material";

// Define the color palette for easy maintenance
const colors = {
  // Primary brand colors
  primary: {
    main: "#00ff9f", // Vibrant green
    light: "#00e676", // Light green
    dark: "#00c853", // Dark green
    contrastText: "#000",
  },

  // Secondary colors
  secondary: {
    main: "#ff00ff", // Vibrant magenta
    light: "#ff4081",
    dark: "#c51162",
  },

  // Background colors
  background: {
    default: "#121212", // Main background
    paper: "#1e1e1e", // Card background
    surface: "#2d2d2d", // Elevated surface
    dark: "#0a0a0a", // Darker background
    medium: "#1a1a1a", // Medium background
    gradient: {
      primary: "linear-gradient(135deg, #121212 0%, #1a1a1a 50%, #2d2d2d 100%)",
      hero: "linear-gradient(135deg, rgba(0, 255, 159, 0.15) 0%, rgba(0, 229, 118, 0.05) 100%)",
      card: "linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))",
      home: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2d2d2d 100%)",
      button: "linear-gradient(45deg, #00ff9f 30%, #00e676 90%)",
      buttonHover: "linear-gradient(45deg, #00e676 30%, #00ff9f 90%)",
    },
  },

  // Text colors
  text: {
    primary: "#ffffff",
    secondary: "#b3b3b3",
    muted: "rgba(255, 255, 255, 0.7)",
    disabled: "rgba(255, 255, 255, 0.5)",
    hint: "rgba(255, 255, 255, 0.6)",
  },

  // Status colors
  status: {
    error: "#ff4444",
    warning: "#ffc107",
    success: "#4caf50",
    info: "#00bcd4",
  },

  // Action colors for different workout actions
  actions: {
    library: "#4caf50", // Green
    templates: "#9c27b0", // Purple
    quickAdd: "#ff9800", // Orange
    progress: "#00bcd4", // Cyan
  },

  // Difficulty levels
  difficulty: {
    beginner: "#4caf50", // Green
    intermediate: "#ffc107", // Yellow
    expert: "#f44336", // Red
    unknown: "#9e9e9e", // Grey
  },

  // Border and divider colors
  border: {
    main: "rgba(255, 255, 255, 0.1)",
    strong: "rgba(255, 255, 255, 0.2)",
    primary: "rgba(0, 255, 159, 0.3)",
    light: "rgba(255, 255, 255, 0.05)",
  },

  // Surface colors for cards and containers
  surface: {
    primary: "rgba(0, 255, 159, 0.05)",
    secondary: "rgba(0, 255, 159, 0.1)",
    tertiary: "rgba(0, 255, 159, 0.15)",
    hover: "rgba(0, 255, 159, 0.1)",
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
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: colors.background.gradient.card,
          boxShadow: `0 0 20px rgba(0, 255, 159, 0.1)`,
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

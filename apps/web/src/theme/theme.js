import { createTheme } from "@mui/material";

// Define the color palette for easy maintenance
const colors = {
  // Primary brand colors (yellow/lime from new palette)
  primary: {
    main: "#dded00", // Primary - a0
    light: "#e8f15d", // Primary - a20
    dark: "#e3ef3f", // Primary - a10
    contrastText: "#121212", // Dark surface for contrast
    variants: {
      a0: "#dded00",
      a10: "#e3ef3f",
      a20: "#e8f15d",
      a30: "#edf377",
      a40: "#f1f58f",
      a50: "#f5f7a6",
    },
  },

  // Secondary colors (keeping some complementary colors)
  secondary: {
    main: "#717171", // Surface - a40 for secondary elements
    light: "#8b8b8b", // Surface - a50
    dark: "#575757", // Surface - a30
  },

  // Background colors (dark surface palette)
  background: {
    default: "#121212", // Surface - a0
    paper: "#282828", // Surface - a10
    surface: "#3f3f3f", // Surface - a20
    dark: "#121212", // Surface - a0
    medium: "#242417", // Tonal - a0
    gradient: {
      primary: "linear-gradient(135deg, #121212 0%, #282828 50%, #3f3f3f 100%)",
      hero: "linear-gradient(135deg, rgba(221, 237, 0, 0.12) 0%, rgba(40, 40, 40, 0.10) 100%)",
      card: "linear-gradient(rgba(221, 237, 0, 0.03), rgba(221, 237, 0, 0.03))",
      home: "linear-gradient(135deg, #121212 0%, #282828 50%, #3f3f3f 100%)",
      button: "linear-gradient(45deg, #dded00 0%, #e8f15d 100%)",
      buttonHover: "linear-gradient(45deg, #e8f15d 0%, #dded00 100%)",
    },
  },

  // Text colors (adjusted for new theme)
  text: {
    primary: "#ffffff",
    secondary: "#8b8b8b", // Surface - a50
    muted: "rgba(255, 255, 255, 0.72)",
    disabled: "rgba(255, 255, 255, 0.42)",
    hint: "rgba(255, 255, 255, 0.6)",
  },

  // Status colors
  status: {
    error: "#ef4444",
    warning: "#f59e0b",
    success: "#dded00", // Using primary color for success
    info: "#717171", // Using secondary for info
  },

  // Action colors for different workout actions
  actions: {
    library: "#dded00", // Primary
    templates: "#e8f15d", // Primary variant
    quickAdd: "#edf377", // Primary variant
    progress: "#f1f58f", // Primary variant
  },

  // Difficulty levels
  difficulty: {
    beginner: "#dded00", // Primary
    intermediate: "#edf377", // Primary variant
    expert: "#ef4444", // Keep red for expert
    unknown: "#717171", // Secondary
  },

  // Border and divider colors
  border: {
    main: "rgba(255, 255, 255, 0.08)",
    strong: "rgba(255, 255, 255, 0.16)",
    primary: "rgba(221, 237, 0, 0.28)",
    light: "rgba(255, 255, 255, 0.04)",
  },

  // Surface colors for cards and containers
  surface: {
    primary: "rgba(221, 237, 0, 0.06)",
    secondary: "rgba(40, 40, 40, 0.08)",
    tertiary: "rgba(63, 63, 63, 0.08)",
    hover: "rgba(221, 237, 0, 0.06)",
    transparent: "rgba(255, 255, 255, 0.03)",
    // Additional surface variants from palette
    variants: {
      a0: "#121212",
      a10: "#282828",
      a20: "#3f3f3f",
      a30: "#575757",
      a40: "#717171",
      a50: "#8b8b8b",
    },
    tonal: {
      a0: "#242417",
      a10: "#39382c",
      a20: "#4e4e43",
      a30: "#65655b",
      a40: "#7d7d74",
      a50: "#96958e",
    },
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

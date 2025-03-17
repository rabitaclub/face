export const themeConfig = {
  name: "Rabita",
  
  // Navigation
  navigation: {
    sidebarWidth: "240px",
    bottomNavHeight: "64px",
    // Animation durations in ms
    animationDuration: 300,
  },
  
  // Color scheme
  colors: {
    // Light mode (default)
    light: {
      background: "var(--background)",
      foreground: "var(--foreground)",
      primary: "#f07b3f",
      secondary: "#ea5455",
      accent: "#29a19c",
      muted: "rgba(45, 64, 89, 0.1)"
    },
    // Dark mode
    dark: {
      background: "var(--background)",
      foreground: "var(--foreground)",
      primary: "#f07b3f",
      secondary: "#ea5455",
      accent: "#29a19c",
      muted: "rgba(255, 212, 96, 0.1)"
    }
  },
  
  // Layout configurations
  layout: {
    contentMaxWidth: "1200px",
    sidebarBreakpoint: "lg",
  },
  
  // Font configurations
  fonts: {
    sans: "var(--font-geist-sans)",
    mono: "var(--font-geist-mono)",
    // Font sizes
    size: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem"
    }
  },
  
  // Animation configurations
  animation: {
    default: {
      type: "spring",
      stiffness: 400,
      damping: 30
    },
    subtle: {
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  },
  
  // Borders and shadows
  borderRadius: {
    sm: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "1rem"
  },
  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
  }
}; 
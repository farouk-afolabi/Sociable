import { createTheme } from "@mui/material/styles";

const sharedTypography = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    '"Segoe UI"',
    "Roboto",
    "sans-serif",
  ].join(","),
  h1: { fontWeight: 700, letterSpacing: "-0.02em" },
  h2: { fontWeight: 700, letterSpacing: "-0.015em" },
  h3: { fontWeight: 600, letterSpacing: "-0.01em" },
  h4: { fontWeight: 600 },
  h5: { fontWeight: 600 },
  h6: { fontWeight: 600 },
  body1: { lineHeight: 1.65 },
  body2: { lineHeight: 1.6 },
};

const sharedShape = { borderRadius: 12 };

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary:   { main: "#6366F1", light: "#818CF8", dark: "#4F46E5", contrastText: "#fff" },
    secondary: { main: "#EC4899", light: "#F472B6", dark: "#DB2777", contrastText: "#fff" },
    background: { default: "#F1F5F9", paper: "#FFFFFF" },
    text:       { primary: "#0F172A", secondary: "#64748B" },
    divider:    "rgba(15, 23, 42, 0.08)",
  },
  typography: sharedTypography,
  shape: sharedShape,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-thumb": { background: "#CBD5E1", borderRadius: 3 },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
          "&:hover": { boxShadow: "0 4px 12px rgba(99,102,241,0.12)" },
          transition: "box-shadow 0.2s ease",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 8,
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #6366F1 0%, #818CF8 100%)",
          "&:hover": { background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)" },
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            "&:hover fieldset": { borderColor: "#6366F1" },
            "&.Mui-focused fieldset": { borderColor: "#6366F1" },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 6 } },
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary:   { main: "#818CF8", light: "#A5B4FC", dark: "#6366F1", contrastText: "#fff" },
    secondary: { main: "#F472B6", light: "#FBCFE8", dark: "#EC4899", contrastText: "#fff" },
    background: { default: "#0F172A", paper: "#1E293B" },
    text:       { primary: "#F1F5F9", secondary: "#94A3B8" },
    divider:    "rgba(241, 245, 249, 0.08)",
  },
  typography: sharedTypography,
  shape: sharedShape,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-thumb": { background: "#334155", borderRadius: 3 },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          border: "1px solid rgba(241,245,249,0.06)",
          "&:hover": { boxShadow: "0 4px 16px rgba(129,140,248,0.15)", borderColor: "rgba(129,140,248,0.3)" },
          transition: "box-shadow 0.2s ease, border-color 0.2s ease",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, borderRadius: 8 },
        containedPrimary: {
          background: "linear-gradient(135deg, #6366F1 0%, #818CF8 100%)",
          "&:hover": { background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)" },
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            "&:hover fieldset": { borderColor: "#818CF8" },
            "&.Mui-focused fieldset": { borderColor: "#818CF8" },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
  },
});

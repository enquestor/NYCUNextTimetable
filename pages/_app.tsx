import type { AppProps } from "next/app";
import Layout from "../components/Layout";
import { AppBar, PaletteOptions, ThemeProvider } from "@mui/material";

import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface PaletteOptions {
    mode?: "light" | "dark";
  }
  interface ThemeOptions {
    palette?: PaletteOptions;
    props?: any;
  }
}

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#3f51b5",
    },
    secondary: {
      main: "#f50057",
    },
  },
  shape: {
    borderRadius: 12,
  },
  spacing: 8,
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ThemeProvider>
  );
}

export default MyApp;

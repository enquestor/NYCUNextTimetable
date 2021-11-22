import {
  AppBar,
  Box,
  Button,
  CssBaseline,
  ThemeProvider,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import { createTheme, Theme } from "@mui/material/styles";
import { useMemo, useState } from "react";
import Cookies from "js-cookie";
import styles from "../styles/Layout.module.css";
import { useRouter } from "next/router";

declare module "@mui/material/styles" {
  interface PaletteOptions {
    mode?: "light" | "dark";
  }
  interface ThemeOptions {
    palette?: PaletteOptions;
    props?: any;
  }
}

export default ({ children }: any) => {
  const router = useRouter();

  const [theme, setTheme] = useState<"light" | "dark">(preferredTheme());
  const themeOptions = useMemo<Theme>(
    () => createTheme(getThemeOptions(theme)),
    [theme]
  );

  return (
    <ThemeProvider theme={themeOptions}>
      <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <CssBaseline />
        <AppBar position="sticky">
          <Toolbar>
            <div className={styles.appname} onClick={() => router.push("/")}>
              <TaskAltIcon />
              <Typography variant="h6" noWrap sx={{ pl: 3 }}>
                NYCU Timetable
              </Typography>
            </div>
            <Box sx={{ flexGrow: 1 }} />
            <Button color="inherit">關於</Button>
          </Toolbar>
        </AppBar>
        {children}
      </Box>
    </ThemeProvider>
  );
};

export const getThemeOptions = (mode: "light" | "dark") => ({
  palette: {
    mode: mode,
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

const preferredTheme = (): "light" | "dark" => {
  if (Cookies.get("paletteMode") !== undefined) {
    return Cookies.get("paletteMode") as "light" | "dark";
  }
  return useMediaQuery("(prefers-color-scheme: dark)") ? "dark" : "light";
};

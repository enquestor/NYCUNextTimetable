import {
  AppBar,
  Box,
  Button,
  CssBaseline,
  FormControl,
  MenuItem,
  Select,
  ThemeProvider,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import { createTheme, Theme } from "@mui/material/styles";
import { useMemo, useState } from "react";
import Cookies from "js-cookie";

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
  const [theme, setTheme] = useState<"light" | "dark">(preferredTheme());
  const themeOptions = useMemo<Theme>(
    () => createTheme(getThemeOptions(theme)),
    [theme]
  );

  return (
    <ThemeProvider theme={themeOptions}>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <CssBaseline />
        <AppBar position="sticky" elevation={0}>
          <Toolbar>
            <TaskAltIcon />
            <Typography
              variant="h6"
              component="div"
              noWrap
              sx={{ pl: 3, flexGrow: 1 }}
            >
              NYCU Timetable
            </Typography>
            <Button color="inherit">About</Button>
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

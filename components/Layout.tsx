import {
  AppBar,
  Box,
  Button,
  Container,
  CssBaseline,
  Toolbar,
  Typography,
} from "@mui/material";
import TaskAltIcon from "@mui/icons-material/TaskAlt";

export default ({ children }: any) => {
  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar position="fixed" elevation={0}>
        <Toolbar>
          <TaskAltIcon />
          <Typography
            variant="h6"
            component="div"
            noWrap
            sx={{ flexGrow: 1, pl: 3 }}
          >
            NYCU Timetable
          </Typography>
          <Button color="inherit">About</Button>
        </Toolbar>
      </AppBar>
      <Container>{children}</Container>
    </Box>
  );
};

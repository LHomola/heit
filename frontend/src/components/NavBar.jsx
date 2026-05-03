import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function NavBar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>HEIT</Typography>
        {currentUser && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Display the link to the notice board to all users. */}
            <Button color="inherit" onClick={() => navigate("/notice-board")}>
              Notice Board
            </Button>
            <Button color="inherit" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
            <Typography variant="body2">
              {currentUser.full_name} ({currentUser.role})
            </Typography>
            <Button color="inherit" onClick={handleLogout}>Log out</Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

/**
 * ResidentDashboard
 *
 * Residents are able to see a list of their own tickets or navigate to the form for creating tickets. *
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, Box, Button, CircularProgress, Container, Typography,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import TicketTable from "../../components/TicketTable";

export default function ResidentDashboard() {
  // Get the JWT token
  const { token } = useAuth();
  // Assign useNavigate for navigation
  const navigate = useNavigate();

  // Local state for ticket list, loading spinner and error message
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Retrieve the resident user's tickets (backend GET /tickets/ endpoint ensures the resident will only see their own tickets)
  useEffect(() => {
    fetch("/api/tickets/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => (res.ok ? res.json() : Promise.reject(`HTTP ${res.status}`)))
      .then(setTickets)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [token]);

  // Show spinner to confirm API call is in progress
  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Header row showing the title positioned on the left and a Create button on the right */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5">My Tickets</Typography>
        <Button variant="contained" onClick={() => navigate("/tickets/new")}>
          Report an Issue
        </Button>
      </Box>

      {/* Show an error message if the API call failed */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Show a table containing the user's tickets or display an message if there are no tickets to be retrieved */}
      {tickets.length === 0 ? (
        <Typography color="text.secondary">
          You have not reported any issues yet.
        </Typography>
      ) : (
        <TicketTable tickets={tickets} />
      )}
    </Container>
  );
}

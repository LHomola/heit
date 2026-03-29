/**
 * ManagerDashboard
 *
 * Management company staff are able to see all the tickets in the system, navigate to the ticket detail page or create a ticket on behalf of a resident.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, Box, Button, CircularProgress, Container, Typography,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import TicketTable from "../../components/TicketTable";

export default function ManagerDashboard() {
  // Get the JWT token
  const { token }    = useAuth();
  // Assign useNavigate for navigation
  const navigate     = useNavigate();

  // Local state for ticket list, loading spinner and error message
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // Retrieve all tickets
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

  // Add an "Action" column to the TicketTable for a button that navigates to the ticket's details page
  const extraColumns = [
    {
      label: "Action",
      render: (t) => (
        <Button size="small" onClick={() => navigate(`/tickets/${t.id}`)}>
          View / Assign
        </Button>
      ),
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Header row showing the title positioned on the left and a Create button on the right */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5">All Tickets</Typography>
        <Button variant="contained" onClick={() => navigate("/tickets/new")}>
          Create Ticket
        </Button>
      </Box>

      {/* Show an error message if the API call failed */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Show a table containing all the tickets or display an message if there are no tickets to be retrieved */}
      {tickets.length === 0 ? (
        <Typography color="text.secondary">No tickets yet.</Typography>
      ) : (
        <TicketTable tickets={tickets} extraColumns={extraColumns} />
      )}
    </Container>
  );
}

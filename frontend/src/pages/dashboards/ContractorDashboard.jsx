/**
 * ContractorDashboard
 *
 * Contractors are able to see tickets assigned to them and navigate to the ticket detail page.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, Box, Button, CircularProgress, Container, Typography,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import TicketTable from "../../components/TicketTable";

export default function ContractorDashboard() {
  // Get the JWT token
  const { token }    = useAuth();
  // Assign useNavigate for navigation
  const navigate     = useNavigate();

  // Local state for ticket list, loading spinner and error message
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // Retrieve tickets assigned to the contractor (backend GET /tickets/ endpoint ensures the contractor only sees tickets where assigned_to value matches their user id)
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

  // Add an "Action" column to the TicketTable for a button that navigates to the ticket's' details page
  const extraColumns = [
    {
      label: "Action",
      render: (t) => (
        <Button size="small" onClick={() => navigate(`/tickets/${t.id}`)}>
          Update Status
        </Button>
      ),
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Header row showing the title */}
      <Typography variant="h5" sx={{ mb: 2 }}>My Assigned Tickets</Typography>

      {/* Show an error message if the API call failed */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Show a table containing the tickets assigned to the contractor or display a message if there are no tickets to be retrieved */}
      {tickets.length === 0 ? (
        <Typography color="text.secondary">
          No tickets are assigned to you yet.
        </Typography>
      ) : (
        <TicketTable tickets={tickets} extraColumns={extraColumns} />
      )}
    </Container>
  );
}

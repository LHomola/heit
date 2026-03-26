import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

// Each status is given a different color (default color is gray)
const STATUS_COLOUR = {
  open:        "default",
  triaged:     "info",
  assigned:    "secondary",
  in_progress: "warning",
  resolved:    "success",
  closed:      "default",
};

// token (from App.jsx) is used to send authorization header
export default function TicketList({ token }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // Obtain the list of tickets when the page loads
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/tickets/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setTickets(await res.json());
      } catch (e) {
        setError(e.message);
      } finally {
        // clear loading indicator
        setLoading(false);
      }
    }
    load();
  }, [token]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Tickets</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {tickets.length === 0 ? (
        // Inform residents they have no tickets
        <Typography color="text.secondary">No tickets yet.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell>{t.id}</TableCell>
                  <TableCell>{t.title}</TableCell>
                  <TableCell>
                    <Chip
                      label={t.status.replace("_", " ")}
                      color={STATUS_COLOUR[t.status] ?? "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{t.category_id}</TableCell>
                  <TableCell>
                    {new Date(t.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}
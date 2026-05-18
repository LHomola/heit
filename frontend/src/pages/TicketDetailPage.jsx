/**
 * TicketDetailPage
 *
 * All types of users have access to this page with some differences.
 *
 * 1. Managers are provided with the option to assign the ticket to a cotnractor
 * 2. Manager and contractors can update the status of the ticket (manager can set any status, contractors only in_progress or resolved)
 * 3. Residents can only see the details but are not able to assign the ticket or update its status
 *
 * Ticket ID is extracted from the URL parameter (e.g. /tickets/3)
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert, Box, Button, Chip, CircularProgress, Container,
  Divider, FormControl, FormControlLabel, InputLabel, MenuItem,
  Paper, Select, Switch, TextField, Typography,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";

// Ticket status chip colors
const STATUS_COLOUR = {
  open: "default", // grey
  triaged: "info", //blue
  assigned: "secondary", // purple
  in_progress: "warning", // orange
  resolved: "success", // green
  closed: "default", // grey
};

// Here we define which statuses is each user allowed to set
const MANAGER_STATUSES = ["open", "triaged", "assigned", "in_progress", "resolved", "closed"];
const CONTRACTOR_STATUSES = ["in_progress", "resolved"];

export default function TicketDetailPage() {
  // extract the ticket ID from the URL
  const { id } = useParams();
  // logged in user and JWT token
  const { token, currentUser } = useAuth();
  const navigate = useNavigate();

  // Core page state
  const [ticket, setTicket] = useState(null); // ticket object from the API
  const [contractors, setContractors] = useState([]); // list of contractors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State of the assign form (used by managers)
  const [selectedContractor, setSelectedContractor] = useState(""); // id of the selected contractor
  const [assignError, setAssignError] = useState("");
  const [assignSuccess, setAssignSuccess] = useState("");

  // State of the status update form(used by managers and contractors)
  const [newStatus, setNewStatus] = useState(""); // selected status value
  const [statusNote, setStatusNote] = useState(""); // optional note explaining the change
  const [statusError, setStatusError] = useState("");
  const [statusSuccess, setStatusSuccess] = useState("");

  // State of AI suggestion
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // State of the ticket's visibility
  const [visibilityError, setVisibilityError] = useState("");
  const [visibilitySaving, setVisibilitySaving] = useState(false);

  // State for the resident close action
  const [closeError, setCloseError] = useState("");
  const [closeLoading, setCloseLoading] = useState(false);

  // Load ticket data
  useEffect(() => {
    async function load() {
      try {
        // Look up the ticket using its ID
        const ticketRes = await fetch(`/api/tickets/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!ticketRes.ok) throw new Error(`HTTP ${ticketRes.status}`);
        const ticketData = await ticketRes.json();
        setTicket(ticketData);
        // Select the current status of the ticket in the dropdown
        setNewStatus(ticketData.status);

        // Get the list of contractors (needed only by managers)
        if (currentUser.role === "manager") {
          const usersRes = await fetch("/api/users/?role=contractor", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (usersRes.ok) {
            const list = await usersRes.json();
            setContractors(list);
            // Select the currently assigned contractors in the dropdown
            if (ticketData.assigned_to) setSelectedContractor(ticketData.assigned_to);
          }
        }
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, token, currentUser.role]);

  // Handler for assigning ticket to a contractor
  async function handleAssign() {
    setAssignError("");
    setAssignSuccess("");
    const res = await fetch(`/api/tickets/${id}/assign`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ assigned_to: parseInt(selectedContractor) }),
    });
    if (!res.ok) {
      const data = await res.json();
      setAssignError(data.detail || "Assignment failed");
      return;
    }
    // Update the local ticket state with the response -> UI will update to show the new status and assignment without having to reload the whole page
    const updated = await res.json();
    setTicket(updated);
    setNewStatus(updated.status);
    setAssignSuccess("Ticket assigned successfully");
  }

  // Handler for updating ticket status
  async function handleStatusUpdate() {
    setStatusError("");
    setStatusSuccess("");
    const res = await fetch(`/api/tickets/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus, note: statusNote || null }),
    });
    if (!res.ok) {
      const data = await res.json();
      setStatusError(data.detail || "Status update failed");
      return;
    }
    const updated = await res.json();
    setTicket(updated);
    setStatusSuccess("Status updated");
    setStatusNote("");
  }

  // Handler for requesting an AI suggestion from the backend
  async function handleAiSuggest() {
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch(`/api/tickets/${id}/ai-suggest`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        setAiError(data.detail || "AI suggestion failed");
        return;
      }
      // Update local ticket state so that the suggestion appears immediately
      const updated = await res.json();
      setTicket(updated);
    } catch {
      setAiError("Failed to connect to AI service");
    } finally {
      setAiLoading(false);
    }
  }

  // Handler for closing the ticket (only available to the resident who owns it)
  async function handleClose() {
    setCloseError("");
    setCloseLoading(true);
    try {
      const res = await fetch(`/api/tickets/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "closed", note: null }),
      });
      if (!res.ok) {
        const data = await res.json();
        setCloseError(data.detail || "Failed to close the ticket");
        return;
      }
      // Replace the ticket in local state so the UI updates straight away
      const updated = await res.json();
      setTicket(updated);
    } catch {
      setCloseError("Failed to connect to the server");
    } finally {
      setCloseLoading(false);
    }
  }

  // Handler for switching the ticket's public state
  async function handleVisibilityToggle(e) {
    const newValue = e.target.checked;
    setVisibilityError("");
    setVisibilitySaving(true);

    const res = await fetch(`/api/tickets/${id}/visibility`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ is_public: newValue }),
    });

    setVisibilitySaving(false);

    if (!res.ok) {
      const data = await res.json();
      setVisibilityError(data.detail || "Visibility was not updated");
      return;
    }

    // Storing updated ticket received from the server
    const updated = await res.json();
    setTicket(updated);
  }

  // Loading and error states
  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
      <CircularProgress />
    </Box>
  );

  if (error) return (
    <Container sx={{ mt: 4 }}>
      <Alert severity="error">{error}</Alert>
      <Button sx={{ mt: 2 }} onClick={() => navigate("/dashboard")}>← Back</Button>
    </Container>
  );

  if (!ticket) return null;

  // Determine which statuses is the user allowed to use
  const availableStatuses =
    currentUser.role === "manager" ? MANAGER_STATUSES : CONTRACTOR_STATUSES;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      {/* Back button */}
      <Button onClick={() => navigate(-1)}>← Back</Button>

      <Paper sx={{ p: 3 }}>
        {/* Ticket header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Typography variant="overline" color="text.secondary">
            Ticket #{ticket.id}
          </Typography>
          <Chip
            label={ticket.status.replace("_", " ")}
            color={STATUS_COLOUR[ticket.status] ?? "default"}
          />
        </Box>

        {/* Title and description */}
        <Typography variant="h5" sx={{ mb: 1 }}>{ticket.title}</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>{ticket.description}</Typography>

        {/* Creation date and assigned contractor */}
        <Typography variant="body2" color="text.secondary">
          Created: {new Date(ticket.created_at).toLocaleString()}
        </Typography>
        {ticket.assigned_to && (
          <Typography variant="body2" color="text.secondary">
            Assigned to contractor id: {ticket.assigned_to}
          </Typography>
        )}

        {/* Visibility toggle (only visible to the creator and any manager) */}
        {(
          (currentUser.role === "resident" && ticket.created_by === currentUser.id)
          || currentUser.role === "manager"
        ) && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              Notice Board Visibility
            </Typography>

            {visibilityError && <Alert severity="error" sx={{ mb: 2 }}>{visibilityError}</Alert>}

            <FormControlLabel
              control={
                <Switch
                  checked={ticket.is_public}
                  onChange={handleVisibilityToggle}
                  disabled={visibilitySaving}
                />
              }
              label={
                ticket.is_public
                  ? "Public — anyone can see this ticket on the notice board"
                  : "Private — only staff and the ticket owner can see this ticket"
              }
            />
          </>
        )}

        {/* Manager section for assigning contractors */}
        {currentUser.role === "manager" && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Assign to Contractor
            </Typography>

            {assignError   && <Alert severity="error"   sx={{ mb: 2 }}>{assignError}</Alert>}
            {assignSuccess && <Alert severity="success" sx={{ mb: 2 }}>{assignSuccess}</Alert>}

            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <FormControl size="small" sx={{ minWidth: 240 }}>
                <InputLabel>Contractor</InputLabel>
                <Select
                  value={selectedContractor}
                  label="Contractor"
                  onChange={e => setSelectedContractor(e.target.value)}
                >
                  {/* Map contractor to dropdown positions */}
                  {contractors.map(c => (
                    <MenuItem key={c.id} value={c.id}>{c.full_name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={handleAssign}
                disabled={!selectedContractor} // if nothing is selected, disable button
              >
                Assign
              </Button>
            </Box>
          </>
        )}

        {/* Manager and contractors section for changing status */}
        {(currentUser.role === "manager" || currentUser.role === "contractor") && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Update Status
            </Typography>

            {statusError   && <Alert severity="error"   sx={{ mb: 2 }}>{statusError}</Alert>}
            {statusSuccess && <Alert severity="success" sx={{ mb: 2 }}>{statusSuccess}</Alert>}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 380 }}>
              <FormControl size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={newStatus}
                  label="Status"
                  onChange={e => setNewStatus(e.target.value)}
                >
                  {/* Show statuses allowed to be used by the given user */}
                  {availableStatuses.map(s => (
                    <MenuItem key={s} value={s}>{s.replace("_", " ")}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Note (optional)"
                size="small"
                multiline
                rows={2}
                value={statusNote}
                onChange={e => setStatusNote(e.target.value)}
              />

              <Button
                variant="outlined"
                onClick={handleStatusUpdate}
                disabled={newStatus === ticket.status}  // if no new status is selected, disable button
              >
                Save Status
              </Button>
            </Box>
          </>
        )}

        {/* AI Suggestion section only for residents */}
        {currentUser.role === "resident" && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              AI Suggestion
            </Typography>

            {aiError && <Alert severity="error" sx={{ mb: 2 }}>{aiError}</Alert>}

            {ticket.ai_suggestion ? (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
                <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                  {ticket.ai_suggestion}
                </Typography>
              </Paper>
            ) : (
              <Button
                variant="outlined"
                onClick={handleAiSuggest}
                disabled={aiLoading}
              >
                {aiLoading ? "Getting suggestion…" : "Get AI Suggestion"}
              </Button>
            )}
          </>
        )}

        {/* Close ticket button - only the resident who owns the ticket can see it */}
        {currentUser.role === "resident" && ticket.created_by === currentUser.id && (
          <>
            <Divider sx={{ my: 3 }} />

            {closeError && <Alert severity="error" sx={{ mb: 2 }}>{closeError}</Alert>}

            <Button
              variant="outlined"
              color="error"
              onClick={handleClose}
              disabled={ticket.status === "closed" || closeLoading}
            >
              {ticket.status === "closed"
                ? "Ticket closed"
                : closeLoading
                  ? "Closing…"
                  : "Close ticket"}
            </Button>
          </>
        )}
      </Paper>
    </Container>
  );
}

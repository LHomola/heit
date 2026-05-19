/**
 * Notice Board page
 *
 * This is a notice board where tickets that residents have made public can be viewed.
 * This page can be accessed by any authenticated user. Anyone can also like a ticket.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, Box, Button, Card, CardActionArea, CardContent,
  Chip, CircularProgress, Container, IconButton, ToggleButton,
  ToggleButtonGroup, Typography,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { useAuth } from "../context/AuthContext";

export default function NoticeBoardPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  // List of tickets returned by backend
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // When the user clicks the toggle button, new ordering is retrieved from the server
  const [sort, setSort] = useState("recent");
  useEffect(() => {
    fetch(`/api/tickets/notice-board?sort=${sort}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => (res.ok ? res.json() : Promise.reject(`HTTP ${res.status}`)))
      .then(setTickets)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [token, sort]);

  // This function handles the tap on the like button
  // The state of the button is switched immediately for a more "immediate" feel,
  // however, if the server rejects the request, the UI is updated to match the true state
  async function toggleLike(ticket) {
    const wasLiked = ticket.liked_by_me;
    const method = wasLiked ? "DELETE" : "POST";

    // Take note of the state before the switch
    const beforeUpdate = {
      liked_by_me: ticket.liked_by_me,
      like_count:  ticket.like_count,
    };

    // Make the switch
    setTickets(prev =>
      prev.map(t =>
        t.id === ticket.id
          ? {
              ...t,
              liked_by_me: !wasLiked,
              like_count:  t.like_count + (wasLiked ? -1 : 1),
            }
          : t
      )
    );

    try {
      const res = await fetch(`/api/tickets/${ticket.id}/like`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Confirm values on the server and update UI accordingly if needed
      const data = await res.json();
      setTickets(prev =>
        prev.map(t =>
          t.id === ticket.id
            ? { ...t, liked_by_me: data.liked_by_me, like_count: data.like_count }
            : t
        )
      );
    } catch {
      // if the server rejects the request, undo the change
      setTickets(prev =>
        prev.map(t =>
          t.id === ticket.id ? { ...t, ...beforeUpdate } : t
        )
      );
      setError("Couldn't update like, please try again.");
    }
  }

  // Loading spinner
  if (loading && tickets.length === 0) return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      {/* Header containing title on the left and sort type toggle on the right */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5">Notice Board</Typography>

        <ToggleButtonGroup
          size="small"
          value={sort}
          exclusive
          onChange={(_, newSort) => {
            // Ensure that an option is selected
            if (newSort) setSort(newSort);
          }}
        >
          <ToggleButton value="recent">Most Recent</ToggleButton>
          <ToggleButton value="liked">Most Liked</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      {/* No tickets to be shown on the board */}
      {tickets.length === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 4, textAlign: "center" }}>
          No tickets have been made public yet.
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {tickets.map(ticket => (
            <Card key={ticket.id} variant="outlined">
              {/* The ticket card body can be clicked/tapped to access the the ticket detail page. The like button is outside of the clickable area. */}
              <Box sx={{ display: "flex", alignItems: "stretch" }}>
                <CardActionArea
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  sx={{ flex: 1 }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                      <Typography variant="overline" color="text.secondary">
                        Ticket #{ticket.id}
                      </Typography>
                      <Chip size="small" label={ticket.status.replace("_", " ")} />
                    </Box>
                    <Typography variant="h6" sx={{ mb: 1 }}>{ticket.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {ticket.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>

                {/* Like button column */}
                <Box sx={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", px: 2, borderLeft: "1px solid",
                  borderColor: "divider",
                }}>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(ticket);
                    }}
                    aria-label={ticket.liked_by_me ? "Remove like" : "Add like"}
                    color={ticket.liked_by_me ? "error" : "default"}
                  >
                    {ticket.liked_by_me
                      ? <FavoriteIcon />
                      : <FavoriteBorderIcon />}
                  </IconButton>
                  <Typography variant="caption" color="text.secondary">
                    {ticket.like_count}
                  </Typography>
                </Box>
              </Box>
            </Card>
          ))}
        </Box>
      )}

      <Box sx={{ mt: 3 }}>
        <Button onClick={() => navigate(-1)}>← Back</Button>
      </Box>
    </Container>
  );
}
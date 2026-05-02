/**
 * CreateTicketPage
 *
 * Residents and managers can see the following details:
 * - Ticket title
 * - Ticket description
 * - Issue type categories
 * - Option to make the ticket public
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, Box, Button, Container, FormControl, FormControlLabel,
  InputLabel, MenuItem, Paper, Select, Switch, TextField, Typography,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";

export default function CreateTicketPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  // Retrieving categories from the API
  const [categories, setCategories] = useState([]);

  // Form field status
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(""); // ID of the selected category
  const [isPublic, setIsPublic] = useState(false); // Should the ticket be public

  // Submission status
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false); // This is needed to prevent double clicking

  // Authorize (no role restriction)and fetch available categories -> populate the category dropdown
  useEffect(() => {
    fetch("/api/categories/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => (res.ok ? res.json() : []))
      .then(setCategories);
  }, [token]);

  // Handler for form submission - if the POST action is successful, user is redirected to the dashboard
  async function handleSubmit(e) {
    e.preventDefault(); // prevent browser default form submission
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/tickets/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        description,
        category_id: parseInt(categoryId),
        is_public: isPublic,
      }),
    });

    setSubmitting(false);

    // Error
    if (!res.ok) {
      const data = await res.json();
      setError(data.detail || "Failed to submit ticket");
      return;
    }

    // Success
    navigate("/dashboard");
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      {/* Back button */}
      <Button onClick={() => navigate("/dashboard")} sx={{ mb: 2 }}>← Back</Button>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>Report an Issue</Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {/* Title */}
          <TextField
            label="Title"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          {/* Description */}
          <TextField
            label="Description"
            required
            multiline
            rows={4}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />

          {/* Categories dropdown */}
          <FormControl required>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryId}
              label="Category"
              onChange={e => setCategoryId(e.target.value)}
            >
              {categories.map(c => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Public ticket status change */}
          <FormControlLabel
            control={
              <Switch
                checked={isPublic}
                onChange={e => setIsPublic(e.target.checked)}
              />
            }
            label="Make ticket public (i.e., visible to other residents on the notice board)"
          />

          {/* Submit button */}
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}


import { useState } from "react";
import {
  Box, Button, Container, TextField,
  Typography, Alert, Paper
} from "@mui/material";

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [user, setUser]         = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Get token
    const loginRes = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!loginRes.ok) {
      const data = await loginRes.json();
      setError(data.detail || "Login failed");
      return;
    }

    const { access_token } = await loginRes.json();
    localStorage.setItem("heit_token", access_token);

    // Confirm identity
    const meRes = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!meRes.ok) {
      setError("Could not fetch user details");
      return;
    }

    const me = await meRes.json();
    setUser(me);
    if (onLogin) onLogin(me, access_token);
  }

  if (user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>Logged in</Typography>
          <Typography><strong>Name:</strong> {user.full_name}</Typography>
          <Typography><strong>Email:</strong> {user.email}</Typography>
          <Typography><strong>Role:</strong> {user.role}</Typography>
          <Button
            sx={{ mt: 2 }} variant="outlined"
            onClick={() => { localStorage.removeItem("heit_token"); setUser(null); }}
          >
            Log out
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>HEIT — Login</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField label="Email" type="email" fullWidth required
            margin="normal" value={email}
            onChange={e => setEmail(e.target.value)} />
          <TextField label="Password" type="password" fullWidth required
            margin="normal" value={password}
            onChange={e => setPassword(e.target.value)} />
          <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 2 }}>
            Login
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
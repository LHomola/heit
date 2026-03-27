import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Container, TextField,
  Typography, Alert, Paper,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

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

    const meRes = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!meRes.ok) {
      setError("Could not fetch user details");
      return;
    }

    const me = await meRes.json();
    login(me, access_token);
    navigate("/dashboard");
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

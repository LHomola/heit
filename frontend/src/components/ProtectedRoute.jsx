import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "./Layout"; // imported here so the pages don't need to import it indivually

// All protected pages (that require authentication) get the Layout (NavBar) injected automatically
// Users who have not been verified are sent to /login
export default function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

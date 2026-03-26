import { useState } from "react";
import Login from "./pages/Login";
import TicketList from "./pages/TicketList";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken]           = useState(null);

  function handleLogin(user, accessToken) {
    setCurrentUser(user);
    setToken(accessToken);
  }

  function handleLogout() {
    localStorage.removeItem("heit_token");
    setCurrentUser(null);
    setToken(null);
  }

  return (
    <div style={{ fontFamily: "Arial" }}>
      {/* Logout button */}
      {currentUser && (
        <div style={{ padding: "0.5rem 2rem", background: "#f8f8f8", borderBottom: "1px solid #ddd", fontSize: "0.85rem" }}>
          <button onClick={handleLogout}>
            Log out ({currentUser.full_name})
          </button>
        </div>
      )}

      {/* If user is not logged in, display login form, otherwise display a list of their tickets */}
      {!currentUser ? (
        <Login onLogin={handleLogin} />
      ) : (
        <TicketList token={token} />
      )}
    </div>
  );
}

export default App;
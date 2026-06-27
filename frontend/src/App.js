import { useState } from "react";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [page, setPage] = useState(
    localStorage.getItem("token") ? "dashboard" : "landing"
  );

  const goTo = (p) => setPage(p);

  const handleLogin = () => setPage("dashboard");
  const handleLogout = () => {
    localStorage.removeItem("token");
    setPage("landing");
  };

  if (page === "dashboard") return <Dashboard onLogout={handleLogout} />;
  if (page === "login") return <Login onLogin={handleLogin} onBack={() => goTo("landing")} />;
  return <Landing onGetStarted={() => goTo("login")} />;
}
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const token = localStorage.getItem("token");

  // HARD SAFE CHECK
  if (!token || token === "null" || token === "undefined") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

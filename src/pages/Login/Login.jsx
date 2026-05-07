// Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./Login.css";
import axiosInstance from "../../utils/axiosInstance"; // ✅ Correct spelling

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.warning("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      const response = await axiosInstance.post("/admin/login", {
        userName: email,
        password: password,
      });

      const data = response.data;
      if (data.success) {
        if (data.token) {
          localStorage.setItem("token", data.token);
          if (data.user) {
            localStorage.setItem("userData", JSON.stringify(data.user));
          }
        }
        toast.success(data.message || "Login successful 🎉");

        setTimeout(() => {
          navigate("/dashboard");
        }, 800);
      } else {
        toast.error(data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);

      if (error.response) {
        toast.error(
          error.response.data?.message ||
            "Login failed. Please check your credentials.",
        );
      } else if (error.request) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h1
          className="crm-logo"
          style={{ fontWeight: "bold", fontSize: "28px" }}
        >
          Shah Construction
        </h1>

        <h2 className="login-heading">Log in to Admin Dashboard</h2>
        <p className="login-subtext">
          Welcome back! Please enter your details.
        </p>

        <div className="form-group">
          <label>Email / Username</label>
          <input
            type="text"
            placeholder="Enter email / username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>

        <div className="form-group password-group">
          <label>Password</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleLogin()}
            />
            <span
              className="toggle-eye"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>
        </div>

        <button className="login-btn" onClick={handleLogin} disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </div>
    </div>
  );
}

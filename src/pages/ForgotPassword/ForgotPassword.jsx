import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [password, setPassword] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  /* ---------- STEP 1: SEND OTP ---------- */
  const sendOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success(data.message || "OTP sent successfully");
      setStep(2);
    } catch (err) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- STEP 2: VERIFY OTP ---------- */
  const verifyOtp = async () => {
    setLoading(true);
    try {
      const otpValue = otp.join("");

      if (otpValue.length < 6) {
        toast.warning("Please enter 6-digit OTP");
        return;
      }

      const res = await fetch(`${BASE_URL}/admin/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpValue }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error("Invalid OTP");

      toast.success("OTP verified successfully");
      setStep(3);
    } catch (err) {
      toast.error(err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- RESEND OTP ---------- */
  const resendOtp = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      toast.info(data.message || "OTP resent");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    }
  };

  /* ---------- STEP 3: SET PASSWORD ---------- */
  const setNewPassword = async () => {
    setLoading(true);
    try {
      if (password.length < 6) {
        toast.warning("Password must be at least 6 characters");
        return;
      }

      const res = await fetch(`${BASE_URL}/admin/auth/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Password updated successfully");
      navigate("/");
    } catch (err) {
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- OTP INPUT ---------- */
  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h1 className="crm-logo">CRM</h1>

        {step === 1 && (
          <>
            <h2>Forgot Password</h2>
            <p>Enter your email to receive OTP</p>

            <div className="form-group">
              <input
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button className="login-btn" onClick={sendOtp} disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </>
        )}

        {step === 2 && (
          <div className="otp-modal">
            <h3>Enter OTP</h3>

            <div className="otp-box">
              {otp.map((v, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  maxLength="1"
                  value={v}
                  onChange={(e) => handleOtpChange(e.target.value, i)}
                />
              ))}
            </div>

            <button className="verify-btn" onClick={verifyOtp} disabled={loading}>
              Verify OTP
            </button>

            <p className="resend" onClick={resendOtp}>
              Resend OTP
            </p>
          </div>
        )}

        {step === 3 && (
          <>
            <h3>Set New Password</h3>

            <div className="form-group">
              <input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button className="login-btn" onClick={setNewPassword} disabled={loading}>
              Update Password
            </button>
          </>
        )}
      </div>
    </div>
  );
}

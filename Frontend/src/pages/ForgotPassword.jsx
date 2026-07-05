import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import bg from "../assets/login.png";
import arrow from "../assets/arrow.png";

export default function ForgotPassword() {
  const backendUrl = import.meta.env.VITE_BACKEND_URI || "http://localhost:8080";
  const forgotPasswordUrl = `${backendUrl}/api/auth/forgot-password`;
  const verifyOtpUrl = `${backendUrl}/api/auth/verify-otp`;
  const resetPasswordUrl = `${backendUrl}/api/auth/reset-password`; // change if needed

  const [step, setStep] = useState(1); // 1 = send OTP, 2 = verify OTP, 3 = reset password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const clearAlerts = () => {
    setMessage(null);
    setError(null);
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    clearAlerts();

    try {
      setLoading(true);
      const { data } = await axios.post(forgotPasswordUrl, { email });
      // expected: { message: "OTP sent to your email.", success: true }
      setMessage(data?.message || "OTP sent.");
      setStep(2);
      setResendCooldown(60); // 60 seconds cooldown before resend
    } catch (err) {
      console.error("Forgot Password error:", err);
      setError(err?.response?.data?.message || "Failed to send OTP. Please check your email.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    clearAlerts();

    try {
      setLoading(true);
      const { data } = await axios.post(verifyOtpUrl, { email, otp });
      // expected: success response if OTP verified
      setMessage(data?.message || "OTP verified.");
      setStep(3);
    } catch (err) {
      console.error("Verify OTP error:", err);
      setError(err?.response?.data?.message || "OTP verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e?.preventDefault();
    clearAlerts();

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.post(resetPasswordUrl, {
        email,
        newPassword,
      });
      // expected success response
      setMessage(data?.message || "Password reset successfully.");
      // Optionally navigate to login after brief timeout
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      console.error("Reset Password error:", err);
      setError(err?.response?.data?.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    clearAlerts();

    try {
      setLoading(true);
      const { data } = await axios.post(forgotPasswordUrl, { email });
      setMessage(data?.message || "OTP resent.");
      setResendCooldown(60);
    } catch (err) {
      console.error("Resend OTP error:", err);
      setError(err?.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] font-dmsans pb-6 flex flex-col items-center justify-center bg-white px-4">
      <div className="bg-transparent flex justify-center items-center relative z-10">
        <img src={bg} alt="" className="w-[336px] h-auto object-contain" />
      </div>

      {/* Card */}
      <div className="relative z-20 bottom-24 rounded-2xl overflow-hidden shadow-lg mx-auto w-full max-w-sm">
        <div className="p-8 bg-gradient-to-b from-[#B8D9C8] to-[#4B9B6E] text-white py-10">
          <h1 className="text-center font-dmsans text-[34px] font-semibold tracking-wide">
            {step === 1 && "Forgot Password"}
            {step === 2 && "Verify OTP"}
            {step === 3 && "Reset Password"}
          </h1>

          {/* Alerts */}
          {message && (
            <div className="mt-4 p-2 rounded-md bg-white/20 text-white text-center">
              {message}
            </div>
          )}
          {error && (
            <div className="mt-4 p-2 rounded-md bg-red-600/80 text-white text-center">
              {error}
            </div>
          )}

          {/* Step 1: Send OTP */}
          {step === 1 && (
            <form className="mt-6 space-y-4" onSubmit={handleSendOtp}>
              <label className="block">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full px-4 py-3 rounded-full bg-white text-[#8D8D8D] outline-none focus:ring-2 ring-[#975b00]"
                  required
                />
              </label>

              <div className="pt-2 flex justify-center">
                <button
                  type="submit"
                  disabled={loading || !email}
                  className={`mt-5 font-dmsans relative flex items-center justify-center gap-3 
                    px-8 py-3 rounded-full backdrop-blur-xl bg-white/30 text-white 
                    font-semibold shadow-[0_4px_20px_rgba(255,255,255,0.4)] border border-white/40
                    hover:bg-white/40 transition w-2/3 ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  <span className="drop-shadow-md tracking-wide">
                    {loading ? "Sending..." : "Send OTP"}
                  </span>
                  <img src={arrow} alt="arrow" className="h-6 drop-shadow-lg" />
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Verify OTP */}
          {step === 2 && (
            <form className="mt-6 space-y-4" onSubmit={handleVerifyOtp}>
              <label className="block">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full px-4 py-3 rounded-full bg-white text-[#8D8D8D] outline-none focus:ring-2 ring-[#975b00]"
                  required
                />
              </label>

              <label className="block">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="w-full px-4 py-3 rounded-full bg-white text-[#8D8D8D] outline-none focus:ring-2 ring-[#975b00]"
                  required
                />
              </label>

              <div className="flex justify-between items-center gap-2">
                <button
                  type="submit"
                  disabled={loading || !otp || !email}
                  className={`mt-2 flex-1 font-dmsans px-6 py-3 rounded-full bg-white/30 text-white font-semibold shadow border border-white/40 ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading || resendCooldown > 0}
                  className={`mt-2 px-4 py-2 rounded-full font-dmsans text-sm border border-white/40 ${resendCooldown > 0 ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                </button>
              </div>

              <div className="text-center mt-2">
                <button
                  type="button"
                  className="underline text-white text-sm"
                  onClick={() => setStep(1)}
                >
                  Change email
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {step === 3 && (
            <form className="mt-6 space-y-4" onSubmit={handleResetPassword}>
              <label className="block">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password"
                  className="w-full px-4 py-3 rounded-full bg-white text-[#8D8D8D] outline-none focus:ring-2 ring-[#975b00]"
                  required
                />
              </label>

              <label className="block">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm New Password"
                  className="w-full px-4 py-3 rounded-full bg-white text-[#8D8D8D] outline-none focus:ring-2 ring-[#975b00]"
                  required
                />
              </label>

              <div className="pt-2 flex justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className={`mt-5 font-dmsans relative flex items-center justify-center gap-3 
                    px-8 py-3 rounded-full backdrop-blur-xl bg-white/30 text-white 
                    font-semibold shadow-[0_4px_20px_rgba(255,255,255,0.4)] border border-white/40
                    hover:bg-white/40 transition w-2/3 ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  <span className="drop-shadow-md tracking-wide">
                    {loading ? "Resetting..." : "Reset Password"}
                  </span>
                  <img src={arrow} alt="arrow" className="h-6 drop-shadow-lg" />
                </button>
              </div>
            </form>
          )}

          <h1 className="mt-6 text-center font-dmsans base font-semibold tracking-tighter">
            Remember your password?{" "}
            <span className="underline cursor-pointer" onClick={() => navigate("/login")}>
              Login.
            </span>
          </h1>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import logo from "../../assets/logo.svg";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export function ResetPassword() {
  const [searchParams]   = useSearchParams();
  const token            = searchParams.get("token") || "";
  const navigate         = useNavigate();

  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [success,         setSuccess]         = useState(false);
  const [error,           setError]           = useState("");

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-5 py-10">
        <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-8 flex flex-col items-center gap-4 text-center">
          <AlertCircle size={40} className="text-red-400" />
          <h3 className="text-lg font-semibold text-gray-800 m-0">Invalid reset link</h3>
          <p className="text-sm text-gray-500 m-0">This link is missing a token. Please request a new one.</p>
          <Link to="/forgot-password" className="text-teal-600 font-medium no-underline text-sm hover:text-teal-800">
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/auth/reset-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-5 sm:px-8 py-10"
      style={{ animation: "pageEnter 0.3s ease-out both" }}
    >
      <div className="flex flex-row justify-center items-center mb-6">
        <Link to="/" className="no-underline text-teal-500">
          <img src={logo} alt="logo" id="logo" />
        </Link>
        <p className="ml-2 text-xl font-semibold">DwaTrack</p>
      </div>

      <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6 sm:p-10">
        {success ? (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center">
              <CheckCircle size={32} className="text-teal-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 m-0">Password updated!</h3>
            <p className="text-sm text-gray-500 m-0">Your password has been reset. Redirecting you to sign in…</p>
          </div>
        ) : (
          <>
            <h3 className="font-semibold text-xl m-0">Set new password</h3>
            <p className="text-gray-500 font-normal text-sm mt-1 mb-5">
              Choose a strong password for your account.
            </p>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="password" className="font-medium text-sm">New password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="border border-gray-300 rounded-md p-2 pr-10 text-gray-500 font-normal w-full outline-none focus:border-teal-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-0"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="confirmPassword" className="font-medium text-sm">Confirm new password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="border border-gray-300 rounded-md p-2 text-gray-500 font-normal w-full outline-none focus:border-teal-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-teal-500 h-12 text-white font-medium rounded-md hover:bg-teal-600 border-none w-full cursor-pointer disabled:opacity-60"
              >
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

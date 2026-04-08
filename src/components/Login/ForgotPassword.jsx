import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, ArrowLeft } from "lucide-react";
import logo from "../../assets/logo.svg";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export function ForgotPassword() {
  const [email,     setEmail]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [sent,      setSent]      = useState(false);
  const [error,     setError]     = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/auth/forgot-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setSent(true);
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
        {sent ? (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center">
              <CheckCircle size={32} className="text-teal-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 m-0">Check your email</h3>
            <p className="text-sm text-gray-500 m-0">
              If <span className="font-medium text-gray-700">{email}</span> is registered,
              you'll receive a password reset link shortly. Check your spam folder if you don't see it.
            </p>
            <Link
              to="/login"
              className="mt-2 text-sm text-teal-600 hover:text-teal-800 font-medium no-underline flex items-center gap-1"
            >
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h3 className="font-semibold text-xl m-0">Forgot password?</h3>
            <p className="text-gray-500 font-normal text-sm mt-1 mb-5">
              Enter your account email and we'll send you a reset link.
            </p>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="font-medium text-sm">Email</label>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john.doe@gmail.com"
                  className="border border-gray-300 rounded-md p-2 text-gray-500 font-normal w-full outline-none focus:border-teal-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-teal-500 h-12 text-white font-medium rounded-md hover:bg-teal-600 border-none w-full cursor-pointer disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>

              <Link
                to="/login"
                className="text-sm text-gray-400 hover:text-gray-600 no-underline text-center flex items-center justify-center gap-1"
              >
                <ArrowLeft size={13} /> Back to sign in
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

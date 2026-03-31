import logo from "../../assets/logo.svg";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error || "Invalid credentials");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-5 sm:px-8 py-10" style={{ animation: "pageEnter 0.3s ease-out both" }}>

      <div className="flex flex-row justify-center items-center mb-6">
        <Link to="/" className="no-underline text-teal-500">
          <img src={logo} alt="logo" id="logo" />
        </Link>
        <p className="ml-2 text-xl font-semibold">DwaTrack</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col bg-white w-full max-w-md rounded-xl shadow-xl gap-3 p-6 sm:p-10"
      >
        <h3 className="font-semibold text-xl m-0">Sign in</h3>
        <p className="text-gray-500 font-normal text-sm mt-0">Enter your credentials to access your account</p>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg m-0">{error}</p>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="font-medium text-sm">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 rounded-md p-2 text-gray-500 font-normal w-full outline-none focus:border-teal-400"
            required
            placeholder="mysetupghana@gmail.com"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="font-medium text-sm">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-300 rounded-md p-2 pr-10 text-gray-500 font-normal w-full outline-none focus:border-teal-400"
              required
              placeholder="********"
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

        <button
          type="submit"
          disabled={loading}
          className="bg-teal-500 h-12 text-white font-medium rounded-md hover:bg-teal-600 border-none w-full mt-2 cursor-pointer disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <Link to="/forgot-password" className="text-teal-500 hover:text-teal-700 font-medium no-underline text-center text-sm">
          Forgot Password?
        </Link>
        <p className="text-gray-500 text-center font-medium text-sm m-0">
          Don't have an account?
          <Link to="/signup" className="ml-1.5 text-teal-500 hover:text-teal-700 font-medium no-underline">
            Create account
          </Link>
        </p>
      </form>
    </div>
  );
}

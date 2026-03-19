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

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = login(email, password);
    setLoading(false);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error || "Invalid credentials");
    }
  }

  return (
    <>
      <div className="pb-20">

        <div className="flex flex-row justify-center items-center mt-10 mb-2">
          <Link to="/" className="no-underline text-teal-500 ml-5">
            <img src={logo} alt="logo" id="logo" />
          </Link>
          <p className="ml-2 size-auto font-2xl">KoboTrack</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col mx-auto w-100 p-6 pl-12 pr-12 pb-10 rounded-xl shadow-xl gap-2 mt-0">
          <h3 className="font-medium">Sign in</h3>
          <p className="text-gray-600 font-medium mt-0">Enter your credentials to access your account</p>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg m-0">{error}</p>
          )}

          <label htmlFor="email" className="font-medium">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 rounded-md p-2 text-gray-500 font-medium w-full"
            required
            placeholder="mysetupghana@gmail.com"
          />

          <label htmlFor="password" className="font-medium">Password</label>
          <div className="relative mb-3">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-300 rounded-md p-2 pr-10 text-gray-500 font-medium w-93"
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

          <button
            type="submit"
            disabled={loading}
            className="bg-teal-500 h-12 text-white font-medium py-2 px-4 rounded-md hover:bg-teal-600 focus:outline-none focus:ring-2 border-none w-full mb-3 cursor-pointer disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
          <Link to="/forgot-password" className="text-teal-500 hover:text-green-600 font-medium no-underline text-center">Forgot Password ?</Link>
          <p className="text-gray-500 text-center font-medium">Don't have an account ?
            <Link to="/signup" className="ml-2 text-teal-500 hover:text-green-600 font-medium no-underline">Create account</Link>
          </p>
        </form>
      </div>
    </>
  );
}

import logo from "../../assets/logo.svg";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { MapPin, Loader, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function SignUp() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [data, setData] = useState({
    businessName: "",
    businessEmail: "",
    phoneNumber: "",
    city: "",
    businessLogo: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  function handleChange(identifier, newValue) {
    setData((prevData) => ({ ...prevData, [identifier]: newValue }));
  }

  function handleUseLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const json = await res.json();
          const city =
            json.address?.city ||
            json.address?.town ||
            json.address?.village ||
            json.address?.county ||
            "";
          const country = json.address?.country || "";
          handleChange("city", city && country ? `${city}, ${country}` : city || country);
        } catch {
          // silently fail
        } finally {
          setLocating(false);
        }
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (data.password !== data.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (data.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    const result = signup(data);
    setLoading(false);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error || "Something went wrong. Please try again.");
    }
  }

  const inputClass = "border border-gray-300 rounded-md p-2 text-gray-500 font-normal w-full outline-none focus:border-teal-400";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">

      <div className="flex flex-row justify-center items-center mb-6">
        <Link to="/" className="no-underline text-teal-500">
          <img src={logo} alt="logo" id="logo" />
        </Link>
        <p className="ml-2 text-xl font-semibold">KoboTrack</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col bg-white rounded-xl gap-3 shadow-xl p-6 sm:p-10 w-full max-w-lg"
      >
        <h4 className="text-2xl font-semibold mt-0 mb-0">Create account</h4>
        <p className="font-light text-gray-400 mt-0 mb-2">
          Register your business and start tracking every kobo!
        </p>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg m-0">{error}</p>
        )}

        {/* Business details */}
        <p className="font-semibold text-sm mb-0 mt-1">Business details</p>
        <hr className="border-gray-200 m-0" />

        <div className="flex flex-col gap-1">
          <label htmlFor="businessName" className="font-medium text-sm">Business name</label>
          <input
            type="text"
            id="businessName"
            name="businessName"
            className={inputClass}
            required
            placeholder="My Setup Ghana"
            onChange={(e) => handleChange('businessName', e.target.value)}
            value={data.businessName}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="businessEmail" className="font-medium text-sm">Business email</label>
          <input
            type="email"
            id="businessEmail"
            name="businessEmail"
            className={inputClass}
            required
            placeholder="mysetupghana@gmail.com"
            onChange={(e) => handleChange('businessEmail', e.target.value)}
            value={data.businessEmail}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="number" className="font-medium text-sm">Phone number</label>
          <input
            type="tel"
            id="number"
            name="number"
            className={inputClass}
            required
            placeholder="024 123 4567"
            onChange={(e) => handleChange('phoneNumber', e.target.value)}
            value={data.phoneNumber}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="city" className="font-medium text-sm">City or town</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              id="city"
              name="city"
              className="border border-gray-300 rounded-md p-2 text-gray-500 font-normal flex-1 min-w-0 outline-none focus:border-teal-400"
              required
              placeholder="Accra"
              onChange={(e) => handleChange('city', e.target.value)}
              value={data.city}
            />
            <button
              type="button"
              onClick={handleUseLocation}
              disabled={locating}
              className="flex items-center gap-1 text-xs text-teal-600 bg-transparent border-none cursor-pointer whitespace-nowrap hover:text-teal-800 disabled:opacity-50 shrink-0 p-1"
            >
              {locating ? <Loader size={13} className="animate-spin" /> : <MapPin size={13} />}
              <span className="hidden sm:inline">{locating ? "Locating..." : "Use current location"}</span>
              <span className="sm:hidden">{locating ? "..." : "Locate"}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="logo" className="font-medium text-sm">Business logo</label>
          <input
            type="file"
            id="logo"
            name="logo"
            accept="image/*"
            className="border border-gray-300 rounded-md p-2 text-gray-500 font-normal w-full"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => handleChange('businessLogo', ev.target.result);
              reader.readAsDataURL(file);
            }}
          />
        </div>

        {/* Account details */}
        <p className="font-semibold text-sm mb-0 mt-2">Your account</p>
        <hr className="border-gray-200 m-0" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="fname" className="font-medium text-sm">First name</label>
            <input
              type="text"
              id="fname"
              name="fname"
              className={inputClass}
              required
              placeholder="John"
              onChange={(e) => handleChange('firstName', e.target.value)}
              value={data.firstName}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="lname" className="font-medium text-sm">Last name</label>
            <input
              type="text"
              id="lname"
              name="lname"
              className={inputClass}
              required
              placeholder="Doe"
              onChange={(e) => handleChange('lastName', e.target.value)}
              value={data.lastName}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="font-medium text-sm">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            className={inputClass}
            required
            placeholder="john.doe@gmail.com"
            onChange={(e) => handleChange('email', e.target.value)}
            value={data.email}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="font-medium text-sm">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              className="border border-gray-300 rounded-md p-2 pr-10 text-gray-500 font-normal w-full outline-none focus:border-teal-400"
              required
              placeholder="********"
              onChange={(e) => handleChange('password', e.target.value)}
              value={data.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-0"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <p className="text-xs text-gray-400 m-0 mt-0.5">At least 8 characters</p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="confirmPassword" className="font-medium text-sm">Confirm password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              className="border border-gray-300 rounded-md p-2 pr-10 text-gray-500 font-normal w-full outline-none focus:border-teal-400"
              required
              placeholder="********"
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              value={data.confirmPassword}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-0"
            >
              {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-teal-500 text-white rounded-md border-none font-medium hover:bg-teal-600 w-full h-12 cursor-pointer disabled:opacity-60 mt-2"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="text-center font-medium text-gray-400 text-sm m-0">
          Already have an account?
          <Link to="/login" className="no-underline text-teal-500 ml-1.5">Sign in</Link>
        </p>
      </form>
    </div>
  );
}

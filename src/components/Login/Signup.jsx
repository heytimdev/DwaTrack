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
    setData((prevData) => {
      return {
        ...prevData,
        [identifier]: newValue,
      }
    })
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
          // silently fail — user can type manually
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

  return (
    <>
      <div className="pb-10">
        <div className=" flex flex-row justify-center items-center mt-10">
          <Link to="/" className="no-underline text-teal-500 ml-5">
            <img src={logo} alt="logo" id="logo" />
          </Link>
          <p className="ml-2 size-auto font-2xl">KoboTrack</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col bg-white rounded-xl gap-2 shadow-xl p-6 w-120 mx-auto mt-10 pl-12 pr-12">
          <h4 className="text-2xl font-medium mt-2 mb-0">Create account</h4>
          <p className="font-light text-gray-400 mt-0 ">
            Register your business and start tracking every kobo!
          </p>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg m-0">{error}</p>
          )}

          <p className="font-medium mb-0">Business details</p>
          <p className="h-0.5 w-full bg-gray-300 mt-0"></p>
          <label htmlFor="businessName" className="font-medium ">
            Business name
          </label>
          <input
            type="text"
            id="businessName"
            name="businessName"
            className="border border-gray-300 rounded-md p-2 text-gray-500 font-medium w-full"
            required
            placeholder="My setup ghana"
            onChange={(event) => handleChange('businessName', event.target.value)}
            value={data.businessName}
          />
          <label htmlFor="businessEmail" className="font-medium">
            Business email
          </label>
          <input
            type="email"
            id="businessEmail"
            name="businessEmail"
            className="border border-gray-300 rounded-md p-2 text-gray-500 font-medium w-full"
            required
            placeholder="mysetupghana@gmail.com"
            onChange={(event) => handleChange('businessEmail', event.target.value)}
            value={data.businessEmail}
          />
          <label htmlFor="number" className="font-medium">
            Phone number
          </label>
          <input
            type="tel"
            id="number"
            name="number"
            className="border border-gray-300 rounded-md p-2 text-gray-500 font-medium w-full"
            required
            placeholder="024 123 4567"
            onChange={(event) => handleChange('phoneNumber', event.target.value)}
            value={data.phoneNumber}
          />
          <label htmlFor="city" className="font-medium">
            City or town
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              id="city"
              name="city"
              className="border border-gray-300 rounded-md p-2 text-gray-500 font-medium flex-1 min-w-0"
              required
              placeholder="Accra"
              onChange={(event) => handleChange('city', event.target.value)}
              value={data.city}
            />
            <button
              type="button"
              onClick={handleUseLocation}
              disabled={locating}
              className="flex items-center gap-1 text-xs text-teal-600 bg-transparent border-none cursor-pointer whitespace-nowrap hover:text-teal-800 disabled:opacity-50 shrink-0 p-1"
            >
              {locating ? <Loader size={13} className="animate-spin" /> : <MapPin size={13} />}
              {locating ? "Locating..." : "Use current location"}
            </button>
          </div>
          <label htmlFor="logo" className="font-medium">
            Business logo
          </label>
          <input
            type="file"
            id="logo"
            name="logo"
            accept="image/*"
            className="border border-gray-300 rounded-md p-2 mb-4 text-gray-500 font-medium w-full"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (e) => handleChange('businessLogo', e.target.result);
              reader.readAsDataURL(file);
            }}
          />

          <p className="mb-0">Your account</p>
          <p className="h-0.5 w-full bg-gray-300 mt-0"></p>
          <div></div>
          <label htmlFor="fname" className="font-medium">
            First name
          </label>
          <input
            type="text"
            id="fname"
            name="fname"
            className="border border-gray-300 rounded-md p-2 text-gray-500 font-medium w-full"
            required
            placeholder="John"
            onChange={(event) => handleChange('firstName', event.target.value)}
            value={data.firstName}
          />
          <label htmlFor="lname" className="font-medium">
            Last name
          </label>
          <input
            type="text"
            id="lname"
            name="lname"
            className="border border-gray-300 rounded-md p-2 text-gray-500 font-medium w-full"
            required
            placeholder="Doe"
            onChange={(event) => handleChange('lastName', event.target.value)}
            value={data.lastName}
          />
          <label htmlFor="email" className="font-medium">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className="border border-gray-300 rounded-md p-2 text-gray-500 font-medium w-full"
            required
            placeholder="john.doe@gmail.com"
            onChange={(event) => handleChange('email', event.target.value)}
            value={data.email}
          />
          <label htmlFor="password" className="font-medium">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              className="border border-gray-300 rounded-md p-2 pr-10 mb-0 text-gray-500 font-medium w-md"
              required
              placeholder="********"
              onChange={(event) => handleChange('password', event.target.value)}
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
          <h5 className="mt-0 font-medium">At least 8 characters</h5>
          <label htmlFor="confirmPassword" className="font-medium">
            Confirm password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              className="border border-gray-300 rounded-md p-2 pr-10 text-gray-500 font-medium w-md"
              required
              placeholder="********"
              onChange={(event) => handleChange('confirmPassword', event.target.value)}
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
          <button
            type="submit"
            disabled={loading}
            className="bg-teal-500 text-white rounded-md p-2 mt-4 border-none font-medium hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 w-full h-12 text-md cursor-pointer disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
          <div>
            <p className="text-center mt-4 font-medium text-gray-400">
              Already have an account?
              <Link to="/login" className=" no-underline text-teal-500 ml-1.5">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </>
  );
}

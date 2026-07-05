import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import bg from "../assets/login.png";
import arrow from "../assets/arrow.png";

export default function Login() {
  const backendUrl = import.meta.env.VITE_BACKEND_URI
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const response = await axios.post(backendUrl + "/api/auth/login", {
        email,
        password,
      });

      console.log("Response:", response.data);
      // Store only the user object, not the entire response
      localStorage.setItem("userData", JSON.stringify(response.data.user));
      localStorage.setItem("isLoggedIn", "true")
      alert(`Welcome back, ${response.data.user.name}!`);


      navigate("/");
    } catch (error) {
      console.error("Login error:", error.response ? error.response.data : error);
      alert(error.response?.data?.message || "Login failed. Please check credentials.");
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
        <div className="p-8 bg-gradient-to-b from-[#B8D9C8] to-[#4B9B6E] text-white py-20">
          <h1 className="text-center font-dmsans text-[44px] font-semibold tracking-wide">
            LOGIN
          </h1>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
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
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 rounded-full bg-white text-[#212121] outline-none focus:ring-2 ring-[#975b00]"
                required
              />
            </label>

            <div className="pt-2 flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className={`mt-5 font-dmsans flex items-center justify-center gap-3 px-8 py-3 rounded-full bg-white text-orange-600 font-semibold shadow-md hover:shadow-lg transition w-2/3 ${loading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
              >
                <span>{loading ? "Logging in..." : "Login"}</span>
                <img src={arrow} alt="arrow" className="h-6" />
              </button>
            </div>
          </form>
          <h1 className="mt-4 text-center font-dmsans base font-semibold tracking-tighter"><span className="underline" onClick={() => { navigate("/forgot-password") }}>Forgot Password?</span></h1>
          <h1 className="mt-8 text-center font-dmsans base font-semibold tracking-tighter">Dont have any account ? <span className="underline" onClick={() => { navigate("/register") }}>Sign up.</span></h1>
        </div>
      </div>
    </div>
  );
}
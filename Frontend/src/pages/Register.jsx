import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import bg from "../assets/register.png";
import arrow from "../assets/arrow.png";

export default function Register() {
      const backendUrl = import.meta.env.VITE_BACKEND_URI
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // handle input changes
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.type === "email"
                ? "email"
                : e.target.type === "password"
                    ? "password"
                    : "name"]: e.target.value,
        });
    };

    // handle submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("Registering...");

        try {
            const response = await axios.post(backendUrl+
                "/api/auth/register",
                formData,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.status === 200 || response.status === 201) {
                setMessage("Registration successful! Redirecting to login...");
                setFormData({ name: "", email: "", password: "" });


                setTimeout(() => navigate("/login"), 1500);
            }
        } catch (error) {
            console.error(error);
            setMessage("Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[90vh] font-dmsans pb-6 flex flex-col items-center justify-center bg-white px-4">
            {/* Illustration */}
            <div className="bg-transparent flex justify-center items-center relative z-10">
                <img
                    src={bg}
                    alt="Register illustration"
                    className="w-[336px] h-auto object-contain"
                />
            </div>

            {/* Card */}
            <div className="relative z-20 bottom-24 rounded-2xl overflow-hidden shadow-lg mx-auto w-full max-w-sm">
                <div className="p-8 bg-gradient-to-b from-[#B8D9C8] to-[#4B9B6E] text-white py-20">
                    <h1 className="text-center font-dmsans text-[44px] font-semibold tracking-wide">
                        REGISTER
                    </h1>

                    <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                        {/* Name input */}
                        <label className="block">
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white rounded-full text-[#212121] outline-none focus:ring-2 ring-[#975b00]"
                                required
                            />
                        </label>

                        {/* Email input */}
                        <label className="block">
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white rounded-full text-[#212121] outline-none focus:ring-2 ring-[#975b00]"
                                required
                            />
                        </label>

                        {/* Password input */}
                        <label className="block">
                            <input
                                type="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white rounded-full text-[#212121] outline-none focus:ring-2 ring-[#975b00]"
                                required
                            />
                        </label>

                        {/* Submit button */}
                        <div className="pt-2 flex justify-center">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`mt-5 font-dmsans flex items-center justify-center gap-3 px-8 py-3 rounded-full bg-white text-green-700 font-semibold shadow-md hover:shadow-lg transition w-2/3 ${loading ? "opacity-70 cursor-not-allowed" : ""
                                    }`}
                            >
                                <span>{loading ? "Registering..." : "REGISTER"}</span>
                                <img src={arrow} alt="arrow" className="h-6" />
                            </button>
                        </div>
                    </form>
                    <h1 className="mt-8 text-center font-dmsans base font-semibold tracking-tighter">Already have account ? <span className="underline" onClick={() => { navigate("/login") }}>Sign in.</span></h1>
                    {/* Message */}
                    {message && (
                        <p className="mt-4 text-center text-sm font-medium text-white">
                            {message}
                        </p>
                    )}
                </div>
            </div>

        </div>
    );
}



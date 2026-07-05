import React from "react";
import Notification from "../assets/Alarm.png";
import search from "../assets/Search.png";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem("userData")) || {};
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const name = userData.name || "User";

  // Handle logout logic
  const handleLogout = () => {
    localStorage.clear(); // clear all stored user data
    navigate("/"); // redirect to home or login page
    window.location.reload(); // reload to update UI instantly
  };

  return (
    <header className="bg-[#4B9B6E] font-dmsans text-white rounded-b-[60px] pb-6 pt-10">
      <div className="max-w-4xl mx-auto px-6 py-6 relative">
        {/* Top row: brand + actions */}
        <div className="flex items-center justify-between">
          {/* Brand */}
          <div className="flex flex-col items-start">
            <div className="text-[28px] font-literata font-extrabold tracking-wide">
              HEKA
            </div>
            <p className="text-xs leading-[15px] max-w-[170px]">care that cares</p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 border border-white rounded-lg text-sm font-medium bg-transparent hover:bg-white/10"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="px-3 py-1.5 border border-white rounded-lg text-sm font-medium bg-transparent hover:bg-white/10"
              >
                Sign In
              </button>
            )}

            <button
              aria-label="notifications"
              className="w-10 h-10 rounded-lg bg-white/90 flex items-center justify-center"
            >
              <img
                src={Notification}
                alt="Notification Icon"
                className="invert opacity-50 w-6 h-6"
              />
            </button>
          </div>
        </div>

        {/* Middle content: user name + search bar */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex flex-col">
            <div className="text-[22px] font-bold tracking-tighter">Welcome</div>
            <div className="text-[22px] font-bold tracking-tighter">{name}</div>
          </div>

          <div className="mt-4">
            <div className="flex items-center bg-white rounded-full px-4 py-3">
              <img src={search} alt="Search Icon" className="w-8 h-8" />
              <input
                type="text"
                placeholder="Search"
                className="ml-2 font-dmsans bg-transparent outline-none text-gray-700 placeholder-gray-400 w-full text-lg font-semibold tracking-tighter"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

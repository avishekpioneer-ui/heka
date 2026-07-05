import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import arrow from "../assets/arrow.png";
import delhi from "../assets/delhi.png";
import mumbai from "../assets/mumbai.png";
import kolkata from "../assets/kolkata.png";

const cities = [
  { name: "Kolkata", icon: kolkata },
  { name: "Delhi", icon: delhi },
  { name: "Mumbai", icon: mumbai },
];

const ChooseCity = () => {
  const navigate = useNavigate();
  const { service } = useParams(); 

  const handleCityClick = (cityName) => {
    navigate(`/find-${service}/${cityName.toLowerCase()}`);
  };

  return (
    <div className="font-dmsans min-h-screen flex items-center justify-center bg-[#e0ffee] px-4">
      <div className="w-full max-w-md">
        {/* Heading */}
        <h1 className="text-5xl text-center text-[#2F3B59] mb-20 tracking-tighter font-medium">
          Choose Your City
        </h1>

        {/* City Options */}
        <div className="space-y-5">
          {cities.map((city, index) => (
            <button
              key={index}
              onClick={() => handleCityClick(city.name)}
              className="w-full flex items-center gap-5 bg-white shadow-md rounded-2xl pl-3 py-3 transition hover:shadow-lg active:scale-[0.97]"
            >
              <div className="p-3 rounded-xl bg-[#93D8B1] flex items-center justify-center">
                <img src={city.icon} alt={city.name} className="w-8 h-8" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#2F3B59] tracking-tighter text-2xl font-medium">
                  {city.name}
                </span>
                <img src={arrow} alt="" className="w-6 h-6 opacity-50" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChooseCity;

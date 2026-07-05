import React from "react";
import home from "../assets/home.png"
import addpatient from "../assets/patientIcon.png"
import seting from "../assets/settings.png"
import question from "../assets/question.png"
import { useNavigate } from "react-router-dom";
export default function Footer() {
  const navigate=useNavigate()
  return (
    <footer className="font-dmsans bg-[#4B9B6E] text-white py-3 fixed bottom-0 w-full z-50">
      <div className="flex justify-around items-center text-center">
        {/* Home */}
        <div onClick={()=>{navigate("/")}} className="flex flex-col items-center">
          <img src={home} alt="" className="w-6 h-6 mb-1" />
          <span className="font-dmsans text-xs">Home</span>
        </div>

        {/* Reports */}
        <div onClick={()=>{navigate("/patient/add")}} className="flex flex-col items-center">
          <img src={addpatient} className="w-6 h-6 mb-1 invert" />
          <span className="font-dmsans text-xs">Add Patient</span>
        </div>

        {/* Help */}
        <div className="flex flex-col items-center">
          <a href="tel:6289924753" className="border-1 border-white text-white px-3 py-2 text-sm font-bold tracking-tighter rounded-lg" >Emergency</a>
        </div>
      </div>
    </footer>
  );
}
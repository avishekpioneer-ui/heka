import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import hospitalIcon from "../assets/hospitalIcon.png"
import hotelIcon from "../assets/hotelIcon.png"
import roomIcon from "../assets/roomIcon.png"
import ambulanceIcon from "../assets/ambulanceIcon.png"
import emergencyIcon from "../assets/emergencyIcon.png"
import doctorIcon from "../assets/doctorIcon.png"
import homeCareIcon from "../assets/homeCareIcon.png"
import admissionIcon from "../assets/admissionIcon.png"
import labIcon from "../assets/labIcon.png"
import patientIcon from "../assets/patientIcon.png"
import Allopathy from "../assets/Allopathy.png"
import Homeopathy from "../assets/Homeopathy.png"
import Ayurvedic from "../assets/Ayurvedic.png"
import Card from './Card'
import PillButton from './PillButton'

import phone from "../assets/phone.png"
import wp from "../assets/wp.png"

const ServicesSwipe = () => {
  const navigate = useNavigate()
  const [showPopup, setShowPopup] = useState(false)

  const categories = [
    { id: 1, title1: 'Find', title2: 'Hospitals', icon: hospitalIcon, route: "/choose-city/hospitals" },
    { id: 2, title1: 'Find', title2: 'Hotels', icon: hotelIcon, route: "/choose-city/hotels" },
    { id: 3, title1: 'Find', title2: 'Rooms', icon: roomIcon, route: "/choose-city/rooms" },
    { id: 4, title1: 'Book', title2: 'Ambulance', icon: ambulanceIcon, route: "/choose-city/ambulance" },
    { id: 5, title1: 'Emergency', title2: 'Services', icon: emergencyIcon, route: "/choose-city/services" },
    { id: 6, title1: 'Doctor', title2: 'Consultation', icon: doctorIcon, route: "/consultation" },
    { id: 7, title1: 'Home Care', title2: 'Services', icon: homeCareIcon, route: "/choose-city/home-care" },
    { id: 8, title1: 'Hospital', title2: 'Admission', icon: admissionIcon, route: "/admission", isPopup: true },
    { id: 9, title1: 'Lab', title2: 'Test', icon: labIcon, route: "/test" },
    { id: 10, title1: 'Add Patient', title2: 'Details', icon: patientIcon, route: "/patient-details" },
  ]

  const handleCardClick = (c) => {
    if (c.isPopup) {
      setShowPopup(true)
    } else {
      navigate(c.route)
    }
  }

  return (
    <div className="font-dmsans min-h-screen bg-[#EDEFF2] pb-10 pt-16 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="capitalize text-5xl text-center text-[#2F3B59] mb-16 tracking-tight font-medium">
          everything you need all in one place
        </h1>

        <div className="mt-8 flex flex-col items-start justify-start gap-2 px-6">
          <PillButton label="Allopathy" img={Allopathy} />
          <PillButton label="Homeopathy" img={Homeopathy} />
          <PillButton label="Ayurvedic" img={Ayurvedic} />
        </div>

        <div className="mt-12 overflow-x-auto no-scrollbar">
          <div className="flex gap-6 px-1">
            {categories.map((c) => (
              <div
                key={c.id}
                onClick={() => handleCardClick(c)}
                className="flex-shrink-0 min-w-[260px]"
              >
                <Card title1={c.title1} title2={c.title2} img={c.icon} />
              </div>
            ))}
          </div>
        </div>
        <p className="capitalize mt-10 text-sm text-[#727272] tracking-tighter font-medium">
          swipe left / right to view all services
        </p>

        {showPopup && (
          <div className="dm-sans fixed inset-0 bg-black/50 backdrop-blur-[4px] bg-opacity-50 flex items-center justify-center z-50 px-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm text-center">
              <h1 className="text-4xl py-10 tracking-tighter text-center text-[#2F3B59] font-medium capitalize">Hospital Admission</h1>
              <div className="space-y-4">
                <a href="tel:7439537213" className="flex items-center justify-center gap-3 w-full py-3 bg-[#4052D6] hover:bg-indigo-700 text-white font-medium rounded-xl tracking-tight">
                  <img src={phone} alt="" className='w-6 h-6'/> Call Now
                </a>
                <a href="https://wa.me/7439537213" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full py-3 bg-green-600 text-white font-medium rounded-xl tracking-tight"
                ><img src={wp} alt="" className='w-6 h-6'/> WhatsApp</a>
              </div>
              <button onClick={() => setShowPopup(false)} className="mt-6 text-sm text-gray-500 underline">Cancel</button>
            </div>
          </div>
        )}

        <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      </div>
    </div>
  )
}

export default ServicesSwipe


import React from 'react'
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

const Services=()=> {
    const navigate = useNavigate()
    const categories = [
        { id: 1, title1: 'Find', title2: 'Hospitals', icon: hospitalIcon, route: "/choose-city/hospitals" },
        { id: 2, title1: 'Find', title2: 'Hotels', icon: hotelIcon, route: "/choose-city/hotels" },
        { id: 3, title1: 'Find', title2: 'Rooms', icon: roomIcon, route: "/choose-city/rooms" },
        { id: 4, title1: 'Book', title2: 'Ambulance', icon: ambulanceIcon, route: "/choose-city/ambulance" },
        { id: 5, title1: 'Emergency', title2: 'Services', icon: emergencyIcon, route: "/choose-city/services" },

        { id: 6, title1: 'Doctor', title2: 'Consultation', icon: doctorIcon, route: "/consultation" },
        { id: 7, title1: 'Home Care', title2: 'Services', icon: homeCareIcon, route: "/choose-city/home-care" },
        { id: 8, title1: 'Hospital', title2: 'Admission', icon: admissionIcon, route: "/admission" },
        { id: 9, title1: 'Lab', title2: 'Test', icon: labIcon, route: "/lab-test" },
        { id: 10, title1: 'Add Patient', title2: 'Details', icon: patientIcon, route: "/patient-details" },
    ];


    return (
        <div className="min-h-screen bg-gray-100 py-16 px-6">
            <div className="max-w-6xl mx-auto text-center">
                <h1 className="font-semibold text-4xl md:text-5xl letter-spacing:-5% text-[#293653]">Everything You Need</h1>
                <h2 className="font-semibold text-4xl md:text-5xl letter-spacing:-5% text-[#293653]">All In One Place</h2>


                <div className="mt-8 flex items-center justify-center gap-4">
                    <PillButton label="Allopathy" img={Allopathy} />
                    <PillButton label="Homeopathy" img={Homeopathy} />
                    <PillButton label="Ayurvedic" img={Ayurvedic} />
                </div>

                <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.map((c) => (
                        <div
                            key={c.id}
                            onClick={() => navigate(c.route)}
                            className="cursor-pointer"
                        >
                            <Card title1={c.title1} title2={c.title2} img={c.icon} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
export default Services
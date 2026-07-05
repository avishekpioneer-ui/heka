import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

import allopathy from "../assets/Allopathy.png";
import homeopathy from "../assets/Homeopathy.png";
import ayurvedic from "../assets/Ayurvedic.png";
import moreThan from "../assets/moreThan.png"
import roundArrow from "../assets/roundarrow.png"

// import ic1 from "../assets/hospital.webp";
// import ic2 from "../assets/hotel.jpg";
// import ic3 from "../assets/room.jpg";
// import ic4 from "../assets/ambulance.png";
// import ic5 from "../assets/emergency.jfif";
// import ic6 from "../assets/doctor.jfif";
// import ic7 from "../assets/homecare.webp";
// import ic8 from "../assets/hospitaladmission.webp";
// import ic9 from "../assets/labtest.jpg";
// import ic10 from "../assets/addpatient.jpg";

import ic1 from "../assets/new/hospital.png"
import ic2 from "../assets/new/hotels.png"
import ic3 from "../assets/new/rooms.png"
import ic4 from "../assets/new/bookambulance.png"
import ic5 from "../assets/new/emergency.png"
import ic6 from "../assets/new/doctor.png"
import ic7 from "../assets/new/homecare.png"
import ic8 from "../assets/new/hospital.png"
import ic9 from "../assets/new/lab.png"
import ic10 from "../assets/new/addpatient.png"

import phone from "../assets/phone.png";
import wp from "../assets/wp.png";

const services = [
    { title: "Find", sub: "Hospitals", image: ic1, route: "/choose-city/hospitals" },
    { title: "Find", sub: "Hotels", image: ic2, route: "/choose-city/hotels" },
    { title: "Find", sub: "Rooms", image: ic3, route: "/choose-city/rooms" },
    { title: "Emergency", sub: "Services", image: ic5, route: "/choose-city/services" },
    { title: "Home Care", sub: "Services", image: ic7, route: "/choose-city/home-care" },
    { title: "Doctor", sub: "Consultations", image: ic6, route: "/consultation" },
    { title: "Hospital", sub: "Admission", image: ic8, route: "/admission", isPopup: true },
    { title: "Add Patient", sub: "Details", image: ic10, route: "/patient/add" },
    { title: "Book", sub: "Ambulance", image: ic4, route: "/choose-city/ambulance" },
    { title: "Lab", sub: "Tests", image: ic9, route: "/test" },

];

const categories = [
    { title: "Allopathy", icon: allopathy },
    { title: "Homeopathy", icon: homeopathy },
    { title: "Ayurvedic", icon: ayurvedic },
];



export default function AllServices() {
    const [selectedCategory, setSelectedCategory] = useState("Allopathy");
    const [showPopup, setShowPopup] = useState(false);
    const navigate = useNavigate();

    const filteredServices = services;

    const handleCardClick = (c) => {
        if (c.isPopup) {
            setShowPopup(true);
        } else {
            navigate(c.route);
        }
    };

    useEffect(() => {
        AOS.init({})
        AOS.refresh()
    }, [])

    return (
        <div className="font-dmsans w-full bg-white flex flex-col gap-20 items-center p-4 rounded-[24px]">
            <div className="bg-white flex flex-col gap-10 w-full">
                <div className="flex flex-col gap-1">
                    <div className="flex gap-1 items-center">
                        <h1 className="text-[34px] font-semibold text-[#4B9B6E] tracking-tighter">All Services</h1>
                        <img src={roundArrow} alt="" className="h-[36px] w-[36px]" />
                    </div>
                    {/* <p className="text-[#4B9B6E] text-xs leading-[15px] max-w-[170px]">Lorem ipsum dolor sit amet, consectetur adipiscing elit,</p> */}
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 gap-x-6 px-1 gap-y-5 w-full">
                    {services.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => handleCardClick(item)}
                            className="flex flex-col gap-2 items-center text-center focus:outline-none active:scale-95 transition-transform duration-150"
                        >
                            <img
                                src={item.image}
                                alt={item.title}
                                className="h-[76px] w-[76px] object-contain"
                            />
                            <div className="font-dmsans tracking-tighter flex flex-col text-[16px] font-semibold text-[#4B9B6E] -space-y-2">
                                <p>{item.title}</p>
                                <p>{item.sub}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* --- Popup for Hospital Admission --- */}
            {showPopup && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-6">
                    <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm text-center">
                        <h1 className="text-2xl sm:text-3xl py-6 tracking-tighter text-[#2F3B59] font-medium capitalize">
                            Hospital Admission
                        </h1>

                        <div className="space-y-4">
                            <a
                                href="tel:6289924753"
                                className="flex items-center justify-center gap-3 w-full py-3 bg-[#4052D6] hover:bg-indigo-700 text-white font-medium rounded-xl tracking-tight"
                            >
                                <img src={phone} alt="phone" className="w-6 h-6" /> Call Now
                            </a>

                            <a
                                href="https://wa.me/6289924753"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-3 w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl tracking-tight"
                            >
                                <img src={wp} alt="whatsapp" className="w-6 h-6" /> WhatsApp
                            </a>
                        </div>

                        <button onClick={() => setShowPopup(false)} className="mt-6 text-sm text-gray-500 underline">
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}


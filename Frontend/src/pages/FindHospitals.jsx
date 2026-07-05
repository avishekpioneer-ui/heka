import React from "react"
import { useParams } from "react-router-dom"
import DB from "../data/db.js"
import hospitalIcon from "../assets/hospitalIcon.png"

const FindHospitals = () => {
    const { city } = useParams()
    const formattedCity = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase()
    const cityHospitals = DB.hospitals[formattedCity] || []

    return (
        <div className="font-dmsans min-h-screen bg-[#e0ffee] px-4 py-8 flex flex-col items-center justify-center pb-28">
            <div className="flex flex-col gap-4 mb-20">
                <h1 className="text-5xl text-center text-[#787c86] tracking-tight font-medium">Hospitals in</h1>
                <h1 className="text-5xl text-center text-[#2F3B59] tracking-tight font-medium">{formattedCity}</h1>
            </div>
            {cityHospitals.length === 0 ? (
                <p className="text-center text-gray-600">No hospitals found.</p>
            ) : (
                <div className="space-y-5 w-full mx-auto">
                    {cityHospitals.map((h, i) => (
                        <div key={i} className="w-full bg-white p-4 rounded-2xl shadow-md flex items-start space-x-4">
                            <div className="p-3 rounded-xl bg-[#93D8B1] flex items-center justify-center">
                                <img src={hospitalIcon} alt={h.name} className="w-8 h-8 opacity-60" />
                            </div>
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1">
                                    <h2 className="text-2xl font-semibold text-[#2F3B59] tracking-tighter">{h.name}</h2>
                                    <p className="text-[#6b6b6b] tracking-tight">{h.address}</p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    {/* <p className="text-[#005A03] font-bold tracking-tighter">☎ {h.phone}</p> */}
                                    <div className="flex flex-wrap gap-1">
                                        {h.services.map((service, idx) => (
                                            <span key={idx} className="bg-[#93D8B1] text-gray-800 text-sm font-medium px-2 py-1 rounded-md tracking-tight">
                                                {service}
                                            </span>
                                        ))}
                                    </div>
                                    {/* <p className="text-[#6b6b6b] tracking-tight">Rating: {h.rating} ⭐</p> */}
                                    {/* <p className="text-[#6b6b6b] tracking-tight">Reviews: {h.reviews}</p> */}
                                    <p className="text-[#6b6b6b] tracking-tight">Working Hours: {h.hours}</p>
                                </div>
                                <a href="tel:6289924753" className="bg-[#4B9B6E] hover:bg-[#235e3c] text-white font-semibold py-2 px-3 rounded-lg w-36 tracking-tighter">
                                    Contact Heka
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default FindHospitals

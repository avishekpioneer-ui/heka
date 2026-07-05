import React from "react"
import { useParams } from "react-router-dom"
import DB from "../data/db.js"
import roomIcon from "../assets/roomIcon.png"

const FindRooms = () => {
    const { city } = useParams()
    const formattedCity = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase()
    const cityRooms = DB.rooms[formattedCity] || []

    return (
        <div className="font-dmsans min-h-screen bg-[#e0ffee] px-4 py-8 flex flex-col items-center justify-center pb-28">
            <div className="flex flex-col gap-4 mb-20">
                <h1 className="text-5xl text-center text-[#787c86] tracking-tight font-medium">Rooms in</h1>
                <h1 className="text-5xl text-center text-[#2F3B59] tracking-tight font-medium">{formattedCity}</h1>
            </div>
            {cityRooms.length === 0 ? (
                <p className="text-center text-gray-600">No rooms found.</p>
            ) : (
                <div className="space-y-5 w-full mx-auto">
                    {cityRooms.map((r, i) => (
                        <div key={i} className="w-full bg-white p-4 rounded-2xl shadow-md flex items-start space-x-4">
                            <div className=" p-3 rounded-xl bg-[#93D8B1] flex items-center justify-center">
                                <img src={roomIcon} alt={r.name} className="w-8 h-8 opacity-60" />
                            </div>
                            <div className="flex flex-col gap-4 w-full">
                                <div className="flex flex-col gap-1">
                                    <h2 className="text-2xl font-semibold text-[#2F3B59] tracking-tighter">{r.name}</h2>
                                    <p className="text-[#6b6b6b] tracking-tight">{r.address}</p>
                                </div>
                                <div className="flex gap-1">
                                    <p className="text-gray-800 font-semibold tracking-tighter bg-gray-200 text-sm px-2 py-1 rounded-md">₹ {r.price}</p>
                                    <p className="text-gray-800 font-semibold tracking-tighter bg-gray-200 text-sm px-2 py-1 rounded-md">{r.type}</p>
                                </div>
                                <div className="flex flex-wrap gap-1 text-[#6b6b6b] tracking-tight">
                                    <p>Beds: {r.beds}</p>
                                    <p className="text-[#005A03] font-bold">{r.amenities.join(", ")}</p>
                                    <p>Check-in: {r.checkIn}</p>
                                    <p>Check-out: {r.checkOut}</p>
                                    <p>Reviews: {r.reviews}+ </p>
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

export default FindRooms

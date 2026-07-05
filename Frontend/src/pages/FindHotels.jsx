import React from "react"
import { useParams } from "react-router-dom"
import DB from "../data/db.js"
import hotelIcon from "../assets/hotelIcon.png"

const FindHotels = () => {
    const { city } = useParams()
    const formattedCity = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase()
    const cityHotels = DB.hotels[formattedCity] || []

    const renderStars = (rating) => {
        const stars = []
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <span key={i} className="text-[#212121] text-lg">
                    {i <= rating ? "★" : "☆"}
                </span>
            )
        }
        return stars
    }

    return (
        <div className="font-dmsans min-h-screen bg-[#e0ffee] px-4 py-8 flex flex-col items-center justify-center pb-28">
            <div className="flex flex-col gap-4 mb-20">
                <h1 className="text-5xl text-center text-[#787c86] tracking-tight font-medium">Hotels in</h1>
                <h1 className="text-5xl text-center text-[#2F3B59] tracking-tight font-medium">{formattedCity}</h1>
            </div>
            {cityHotels.length === 0 ? (
                <p className="text-center text-gray-600">No hotels found.</p>
            ) : (
                <div className="space-y-5 w-full max-w-md">
                    {cityHotels.map((h, i) => {
                        const ratingNum = parseInt(h.rating) || 0
                        return (
                            <div key={i} className="w-full bg-white p-4 rounded-2xl shadow-md flex items-start space-x-4">
                                <div className="p-3 rounded-xl bg-[#93D8B1] flex items-center justify-center">
                                    <img src={hotelIcon} alt={h.name} className="w-8 h-8 opacity-60" />
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-2xl font-semibold text-[#2F3B59] tracking-tighter">{h.name}</h2>
                                        <p className="text-[#6b6b6b] tracking-tight">{h.address}</p>
                                        <div className="flex flex-wrap gap-1">
                                            {h.amenities.map((amenity, idx) => (
                                                <span key={idx} className="bg-gray-200 text-gray-800 text-sm font-medium px-2 py-1 rounded-md tracking-tight">
                                                    {amenity}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[#005A03] font-bold tracking-tighter">☎ {h.phone}</p>
                                        <div className="flex">{renderStars(ratingNum)}</div>
                                        {h.hours && <p className="text-[#6b6b6b] tracking-tight">{h.hours}</p>}
                                    </div>
                                    <a href="tel:6289924753" className="bg-[#4B9B6E] hover:bg-[#235e3c] text-white font-semibold py-2 px-3 rounded-lg w-36 tracking-tighter">
                                        Contact Heka
                                    </a>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default FindHotels

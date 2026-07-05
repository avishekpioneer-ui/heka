import React from "react"
import { useNavigate } from "react-router-dom"
import arrow from "../assets/arrow.png"

const LabTest = () => {
    const navigate=useNavigate()
    return (
        <div className="font-dmsans min-h-screen w-full bg-[#e0ffee] flex flex-col items-center justify-center px-10 space-y-6">
            <div onClick={()=>navigate("/test/home")} className="bg-white w-full p-6 rounded-2xl shadow-md flex flex-col items-start gap-10 justify-between text-center">
                <h1 className="text-4xl py-10 tracking-tighter text-center text-[#2F3B59] font-medium capitalize">lab test at home</h1>
                <div className="flex gap-2 items-center">
                    <p className="text-base text-[#727272] tracking-tight font-medium">Click To Proceed</p>
                    <img src={arrow} alt="" className="w-6 h-6 opacity-50" />
                </div>
            </div>
            <div onClick={()=>navigate("/test/center")} className="bg-white w-full p-6 rounded-2xl shadow-md flex flex-col items-start gap-10 justify-between text-center">
                <h1 className="text-4xl py-10 tracking-tighter text-center text-[#2F3B59] font-medium capitalize">lab test at center</h1>
                <div className="flex gap-2 items-center">
                    <p className="text-base text-[#727272] tracking-tight font-medium">Click To Proceed</p>
                    <img src={arrow} alt="" className="w-6 h-6 opacity-50" />
                </div>
            </div>
        </div>
    )
}

export default LabTest

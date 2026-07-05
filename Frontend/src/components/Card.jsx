
import React from "react"
import arrow from "../assets/arrow.png"

function Card({ title1, title2, img }) {
  return (


    <div className="w-full box-border bg-white rounded-xl p-6 flex flex-col gap-10 justify-between min-h-[150px] transition overflow-hidden">
      <div className="flex items-center gap-4">
        <div className="flex-none p-3 bg-blue-100 rounded-lg flex items-center justify-center">
          <img src={img} alt={`${title1} ${title2} icon`} className="h-8 w-8 sm:h-10 sm:w-10 object-contain opacity-60" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-[26px] font-dmsans text-left text-[#454545] tracking-tighter -mb-2.5">{title1}</h1>
          <h1 className="text-[26px] font-dmsans text-left text-[#454545] tracking-tighter">{title2}</h1>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <p className="text-sm text-[#727272] tracking-tighter font-medium">Click To Proceed</p>
        <img src={arrow} alt="" className="w-6 h-6 opacity-50" />
      </div>
    </div>




  )
}

export default Card;
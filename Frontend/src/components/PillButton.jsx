
import React from "react"
export default function PillButton({ label, img, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={
        "font-dmsans flex items-center justify-start gap-2 bg-[#212121] text-[#D0D0D0] rounded-full px-5 pr-10 py-4 text-lg tracking-tight transition-colors duration-150 hover:bg-gray-700"} >
      {img && (
        <img src={img} alt="" aria-hidden="true" className="h-6 w-6 object-contain"/> )}
      <span className="font-dmsans">{label}</span>
    </button>
    )
}
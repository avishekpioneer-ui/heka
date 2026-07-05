import React, { useState } from "react";

import Homeopathy from "../assets/Homeopathy.png"
import Allopathy from "../assets/Allopathy.png"
import Ayurvedic from "../assets/Ayurvedic.png"
import roundArrow from "../assets/roundarrow.png"

export default function CategoriesCard() {
    const [selected, setSelected] = useState("Allopathy");

    const cats = [
        {
            key: "Allopathy",
            label: "Allopathy",
            icon: <img src={Allopathy} alt="" />

        },
        {
            key: "Ayurvedic",
            label: "Ayurvedic",
            icon: <img src={Ayurvedic} alt="" />
        },
        {
            key: "Homeopathy",
            label: "Homeopathy",
            icon: <img src={Homeopathy} alt="" />
        },
        
    ];

    return (
        <section className="font-dmsans">
            <div className="w-full mx-auto rounded-[30px] bg-white p-6 flex flex-col gap-10">
                <div className="flex flex-col gap-1">
                    <div className="flex gap-1 items-center">
                        <h1 className="text-[34px] font-semibold text-[#4B9B6E] tracking-tighter">Categories</h1>
                        <img src={roundArrow} alt="" className="h-[36px] w-[36px]" />
                    </div>
                    {/* <p className="text-[#4B9B6E] text-xs leading-[15px] max-w-[170px]">Lorem ipsum dolor sit amet, consectetur adipiscing elit,</p> */}
                </div>

                <div className="flex gap-4 justify-center">
                    {cats.map((c) => {
                        const active = selected === c.key;
                        return (
                            <button
                                key={c.key}
                                onClick={() => setSelected(c.key)}
                                aria-pressed={active}
                                className={`w-[94px] h-[88px] flex flex-col items-center justify-center rounded-[18px] border transition-shadow focus:outline-none ${active
                                        ? "bg-[#4B9B6E] text-white font-medium text-base tracking-tight"
                                        : "bg-white text-[#7D7D7D] border-[#CFCFCF] border-2"
                                    }`}
                            >
                                <div className="mb-1">
                                    {React.cloneElement(c.icon, {
                                        className: `w-8 h-8 ${active ? "text-white" : "invert opacity-40"
                                            }`,
                                    })}
                                </div>
                                <span
                                    className={`text-sm font-medium tracking-tighter ${active ? "text-white" : "text-[#7D7D7D]"
                                        }`}
                                >
                                    {c.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

            </div>
        </section>
    );
}

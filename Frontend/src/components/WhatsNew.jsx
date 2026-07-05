"use client";
import React from "react";

import train from "../assets/train.jpg";
import flight from "../assets/flight.jpg";
import cab from "../assets/cab.jpg";
import food from "../assets/food.jpg";
import roundArrow from "../assets/roundarrow.png"
import insurance from "../assets/insurance.webp"
import govscheme from "../assets/govscheme.png"

const WhatsNew = () => {
    const cards = [
        { title: "Train Tickets", image: train },
        { title: "Flight Tickets", image: flight },
        { title: "Cab Services", image: cab },
        { title: "Food Delivery", image: food },
        { title: "Insurance", image: insurance },
        { title: "Government Schemes", image: govscheme },
    ];

    return (
        <div className="font-dmsans w-full flex flex-col gap-14 bg-white rounded-2xl p-4 sm:p-6 md:p-8 mx-auto mt-10">
            <div className="flex flex-col gap-1">
                <div className="flex gap-1 items-center">
                    <h1 className="text-[34px] font-semibold text-[#4B9B6E] tracking-tighter">Whats New</h1>
                    <img src={roundArrow} alt="" className="h-[36px] w-[36px]" />
                </div>
                {/* <p className="text-[#4B9B6E] text-xs leading-[15px] max-w-[170px]">Lorem ipsum dolor sit amet, consectetur adipiscing elit,</p> */}
            </div>

            <div className="block md:hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <div className="flex gap-3 sm:gap-4 px-1">
                        {cards.map((card, index) => (
                            <a
                                href="tel:6289924753"
                                key={index}
                                className="flex-shrink-0 w-[192px] h-[138px] rounded-[24px] relative overflow-hidden"
                            >
                                <img
                                    src={card.image}
                                    alt={card.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-2">
                                    <p className="text-white text-[24px] font-medium tracking-tight">
                                        {card.title}
                                    </p>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
                <p className="text-[#4B9B6E] text-xs tracking-tight mt-8 text-center">
                    Swipe left / right to view all
                </p>
            </div>


            <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                {cards.map((card, index) => (
                    <div
                        key={index}
                        className="rounded-xl relative overflow-hidden h-[140px] lg:h-[160px]"
                    >
                        <img
                            src={card.image}
                            alt={card.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-end p-3">
                            <p className="text-white text-sm md:text-base font-semibold">
                                {card.title}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </div>
    );
};

export default WhatsNew;

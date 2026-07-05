import React from 'react';
import Marquee from 'react-fast-marquee';

const PartnerShip = () => {
    return (
        <div className="mt-14 font-dmsans flex flex-col gap-4 items-center justify-center">
            <div className="w-full overflow-hidden">
                <Marquee speed={70} gradient={false}>
                    <div className="">
                        <p className="text-[#4B9B6E] text-[44px] font-semibold tracking-tight ml-10">
                            Be Our Partner.
                        </p>
                    </div>
                    <div className="">
                        <p className="text-[#4B9B6E] text-[44px] font-semibold tracking-tight ml-10">
                            Be Our Partner.
                        </p>
                    </div>
                </Marquee>

            </div>

            <a href="tel:6289924753" className="bg-[#4B9B6E] text-white text-lg font-semibold py-3 px-10 rounded-[6px] tracking-tight">
                Call Us
            </a>
        </div>
    );
};

export default PartnerShip;

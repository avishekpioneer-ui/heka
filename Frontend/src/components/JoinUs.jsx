import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AOS from "aos";
import "aos/dist/aos.css";

import roundArrow from "../assets/roundarrow.png";
import ic3 from "../assets/nurse-female.png";  // Default icon
import ic2 from "../assets/nurse-male.png";    // Alternate icon

const API_BASE_URL = import.meta.env.VITE_BACKEND_URI;

export default function JoinUs() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        AOS.init({});
        AOS.refresh();

        const fetchCourses = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/public/courses`);
                setCourses(response.data.courses);
            } catch (error) {
                console.error("Error fetching courses:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    const handleCardClick = (course) => {
        navigate(`/admission-form?service=${course._id}`, {
            state: { selectedService: course._id },
        });
    };

    // Check if logged-in user is a student
    const userData = (() => {
        try { return JSON.parse(localStorage.getItem("userData")); } catch { return null; }
    })();
    const isStudent = userData?.category === "student";

    return (
        <div className="font-dmsans w-full bg-white flex flex-col gap-20 items-center p-4 rounded-[24px] mb-28">
            <div className="bg-white flex flex-col gap-10 w-full">
                <div className="flex flex-col gap-1">
                    <div className="flex gap-1 items-center">
                        <h1 className="text-[34px] font-semibold text-[#4B9B6E] tracking-tighter">To Join Us</h1>
                        <img src={roundArrow} alt="" className="h-[36px] w-[36px]" />
                    </div>
                </div>

                {isStudent ? (
                    /* ---- Student: show only panel button ---- */
                    <div className="flex flex-col items-center gap-4 py-8">
                        <div className="w-20 h-20 rounded-full bg-[#4B9B6E]/10 flex items-center justify-center mb-2">
                            <svg className="w-10 h-10 text-[#4B9B6E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 text-sm">You are already enrolled as a student.</p>
                        <button
                            onClick={() => navigate("/student-panel")}
                            className="flex items-center gap-3 px-8 py-4 bg-[#4B9B6E] text-white font-bold rounded-2xl shadow-lg shadow-green-200 hover:bg-[#3d825b] active:scale-95 transition-all duration-200 text-base"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Go to Student Panel
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                ) : loading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4B9B6E]"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-x-6 px-4 gap-y-5 w-full max-w-[600px] mx-auto">
                        {courses.length > 0 ? (
                            courses.map((course, index) => (
                                <button
                                    type="button"
                                    key={course._id}
                                    onClick={() => handleCardClick(course)}
                                    className="flex flex-col gap-2 items-center text-center focus:outline-none active:scale-95 transition-transform duration-150 bg-transparent"
                                >
                                    <div className="bg-[#93D8B1] p-3 rounded-[12px]">
                                        <img
                                            src={index % 2 === 0 ? ic3 : ic2}
                                            alt={course.courseName}
                                            className="h-[44px] w-[44px] object-contain"
                                        />
                                    </div>
                                    <div className="font-dmsans tracking-tighter flex flex-col text-[16px] font-semibold text-[#4B9B6E] -space-y-2">
                                        <p className="mt-2 leading-tight">{course.courseName}</p>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <p className="col-span-2 text-center text-gray-500">No courses available at the moment.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
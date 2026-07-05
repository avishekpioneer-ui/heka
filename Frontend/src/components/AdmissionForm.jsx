import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

// ✅ Get backend URL from environment variable
const API_BASE_URL = import.meta.env.VITE_BACKEND_URI;

const buildPayload = (form, courses, coachingCenters, selectedAssignment) => {
  const selectedCenter = coachingCenters.find(c => c._id === form.coachingCenter);
  const selectedCourse = courses.find(c => c._id === form.service);

  return {
    fullName: form.fullName,
    email: form.email,
    courseType: selectedCourse?.courseName || "",
    coachingCenter: selectedCenter?.name || "",
    courseFee: selectedAssignment?.price || 0,
    dateOfBirth: form.dob,
    gender: form.gender,
    fatherOrMotherName: form.parentName,
    phoneNumber: form.phone,
    alternatePhoneNumber: form.altPhone,
    aadharNumber: form.aadhar,
    permanentAddress: form.permanentAddress,

    // Store reference IDs for the database
    courseId: form.service,
    coachingCenterId: form.coachingCenter,

    educations: form.education.map((e) => ({
      degreeOrClass: e.className,
      institute: e.institute,
      boardOrUniversity: e.board,
      passingYear: Number(e.year),
      marksOrGrade: e.marks,
      stream: e.stream,
    })),

    workExperiences: form.experience.map((e) => ({
      companyName: e.company,
      designation: e.designation,
      reportingPerson: e.reportingPerson,
      reportingContact: e.address || "",
      jobResponsibilities: e.responsibilities,
    })),
  };
};


export default function AdmissionForm() {
  const location = useLocation();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [coachingCenters, setCoachingCenters] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [availableCenters, setAvailableCenters] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    service: "",
    coachingCenter: "",
    fullName: "",
    dob: "",
    gender: "",
    parentName: "",
    permanentAddress: "",
    presentAddress: "",
    phone: "",
    altPhone: "",
    email: "",
    aadhar: "",
    education: [{ id: Date.now(), className: "", institute: "", board: "", year: "", marks: "", stream: "" }],
    experience: [{ id: Date.now(), company: "", address: "", designation: "", reportingPerson: "", responsibilities: "" }],
    agreed: false
  });

  // Fetch courses, Coaching Centres, and assignments on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, centersRes, assignmentsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/public/courses`),
          axios.get(`${API_BASE_URL}/api/public/coaching-centers`),
          axios.get(`${API_BASE_URL}/api/public/assignments`)
        ]);

        const activeCourses = coursesRes.data.courses;
        const activeCenters = centersRes.data.coachingCenters;
        const activeAssignments = assignmentsRes.data.assignments;

        setCourses(activeCourses);
        setCoachingCenters(activeCenters);
        setAssignments(activeAssignments);

        // Set default selections if data exists
        if (activeCourses.length > 0 && activeAssignments.length > 0) {
          const firstCourse = activeCourses[0];
          const centersForFirstCourse = activeAssignments
            .filter(a => a.courseId?._id === firstCourse._id)
            .map(a => a.coachingCenterId?._id); // Store IDs

          setAvailableCenters(centersForFirstCourse);
          setForm(f => ({
            ...f,
            service: firstCourse._id,
            coachingCenter: centersForFirstCourse[0] || "" // Use ID directly
          }));
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to load courses and Coaching Centres. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update available centers when course selection changes
  useEffect(() => {
    if (form.service && assignments.length > 0) {
      const centersForCourse = assignments
        .filter(a => a.courseId?._id === form.service)
        .map(a => a.coachingCenterId?._id); // Store IDs

      setAvailableCenters(centersForCourse);

      // Reset coaching center selection if current selection is not available for new course
      if (!centersForCourse.includes(form.coachingCenter)) { // Check ID inclusion
        setForm(f => ({ ...f, coachingCenter: centersForCourse[0] || "" }));
      }
    }
  }, [form.service, assignments]);

  // Get current selected assignment (for fee)
  const selectedAssignment = assignments.find(a =>
    a.courseId?._id === form.service && a.coachingCenterId?._id === form.coachingCenter
  );

  // Get selected center details for display
  const selectedCenter = coachingCenters.find(c => c._id === form.coachingCenter);

  // ✅ Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const addEducation = () => setForm({ ...form, education: [...form.education, { id: Date.now(), className: "", institute: "", board: "", year: "", marks: "", stream: "" }] });
  const removeEducation = (id) => setForm({ ...form, education: form.education.filter(e => e.id !== id) });
  const handleEduChange = (id, e) => {
    const { name, value } = e.target;
    setForm({ ...form, education: form.education.map(item => item.id === id ? { ...item, [name]: value } : item) });
  };

  const addExperience = () => setForm({ ...form, experience: [...form.experience, { id: Date.now(), company: "", address: "", designation: "", reportingPerson: "", responsibilities: "" }] });
  const removeExperience = (id) => setForm({ ...form, experience: form.experience.filter(e => e.id !== id) });
  const handleExpChange = (id, e) => {
    const { name, value } = e.target;
    setForm({ ...form, experience: form.experience.map(item => item.id === id ? { ...item, [name]: value } : item) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.agreed) {
      alert("Please accept the Terms & Conditions");
      return;
    }

    const payload = buildPayload(form, courses, coachingCenters, selectedAssignment);

    // ✅ Log payload for debugging
    console.log("Submitting payload:", payload);

    try {
      const res = await fetch(`${API_BASE_URL}/api/students/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      const data = await res.json();
      console.log("Registration Success:", data);

      // Display appropriate message based on whether user is new or existing
      if (data.isExistingUser) {
        alert(data.message);
      } else if (data.credentials) {
        // New student - show credentials
        alert(
          `Admission Form Submitted Successfully!\n\n` +
          `Your login credentials:\n` +
          `Email: ${data.credentials.email}\n` +
          `Password: ${data.credentials.password}\n\n` +
          `Please save these credentials to login to your account.`
        );
      } else {
        alert("Admission Form Submitted Successfully!");
      }

      navigate("/");
    } catch (error) {
      console.error("Submission Error:", error);
      alert("Failed to submit form. Please try again.");
    }
  };

  // Reusable Professional Styles
  const inputClass = "w-full px-4 py-3 text-sm text-gray-700 bg-white border border-gray-300 rounded-xl outline-none transition-all duration-200 hover:border-[#4B9B6E] focus:border-[#4B9B6E] focus:ring-4 focus:ring-[#4B9B6E]/10 placeholder:text-gray-400";
  const labelClass = "block mb-1.5 text-xs font-bold text-gray-600 uppercase tracking-wider ml-1";
  const sectionTitleClass = "flex items-center text-xl font-bold text-gray-800 mb-6";
  const cardClass = "p-6 bg-gray-50/50 rounded-[24px] border border-gray-100 relative mb-4";
  const addButtonClass = "w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold text-sm hover:border-[#4B9B6E] hover:text-[#4B9B6E] hover:bg-[#4B9B6E]/5 transition-all duration-200 flex items-center justify-center gap-2";

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 font-dmsans">
      <div className="max-w-4xl mx-auto bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[32px] overflow-hidden border border-gray-100">

        {/* Header */}
        <div className="bg-[#4B9B6E] px-8 py-10 text-white text-center relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-extrabold tracking-tight uppercase">Admission Application</h1>
            <p className="text-sm font-medium opacity-80 mt-2 italic">Rudraksh Foundation Health Care Training</p>
          </div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-12">

          {/* Course Selection */}
          <section>
            <h2 className={sectionTitleClass}>
              <span className="w-2 h-8 bg-[#4B9B6E] rounded-full mr-3"></span>
              Course Selection
            </h2>

            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4B9B6E]"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {courses.map((course) => (
                    <div
                      key={course._id}
                      onClick={() => setForm({ ...form, service: course._id })}
                      className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all duration-300 hover:shadow-lg ${form.service === course._id
                        ? 'border-[#4B9B6E] bg-[#4B9B6E]/5 shadow-md'
                        : 'border-gray-200 bg-white hover:border-[#4B9B6E]/50'
                        }`}
                    >
                      {/* Selected Indicator */}
                      <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${form.service === course._id
                        ? 'border-[#4B9B6E] bg-[#4B9B6E]'
                        : 'border-gray-300 bg-white'
                        }`}>
                        {form.service === course._id && (
                          <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>

                      {/* Course Icon */}
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${form.service === course._id
                        ? 'bg-[#4B9B6E] text-white'
                        : 'bg-gray-100 text-gray-500'
                        }`}>
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>

                      {/* Course Name */}
                      <h3 className={`font-bold text-xl mb-2 transition-colors duration-300 ${form.service === course._id ? 'text-[#4B9B6E]' : 'text-gray-800'
                        }`}>
                        {course.courseName}
                      </h3>

                      {/* Course Description */}
                      <p className="text-sm text-gray-500 mb-4 leading-relaxed line-clamp-2">
                        {course.description}
                      </p>

                      {/* Course Badge */}
                      <div className="flex items-center gap-3">
                        <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${form.service === course._id
                          ? 'bg-[#4B9B6E]/20 text-[#4B9B6E]'
                          : 'bg-gray-100 text-gray-600'
                          }`}>
                          <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {course.duration}
                        </div>
                        {course.certificateAvailable && (
                          <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${form.service === course._id
                            ? 'bg-[#4B9B6E]/20 text-[#4B9B6E]'
                            : 'bg-gray-100 text-gray-600'
                            }`}>
                            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                            Certified
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected Course Summary */}
                {form.service && (
                  <div className="mt-6 p-5 bg-gradient-to-r from-[#4B9B6E]/10 to-[#4B9B6E]/5 border border-[#4B9B6E]/20 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#4B9B6E] flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Selected Course</p>
                      <p className="text-lg font-bold text-[#4B9B6E]">
                        {courses.find(c => c._id === form.service)?.courseName}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Coaching Center Selection */}
          <section>
            <h2 className={sectionTitleClass}>
              <span className="w-2 h-8 bg-[#4B9B6E] rounded-full mr-3"></span>
              Coaching Center
            </h2>

            {!form.service ? (
              <p className="text-gray-500 italic">Please select a course first to see available Coaching Centres.</p>
            ) : availableCenters.length === 0 ? (
              <p className="text-red-500 bg-red-50 p-4 rounded-xl border border-red-200">
                No Coaching Centres are currently assigned to this course. Please contact support.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {coachingCenters
                  .filter(center => availableCenters.includes(center._id))
                  .map(center => {
                    const price = assignments.find(
                      a => a.courseId?._id === form.service && a.coachingCenterId?._id === center._id
                    )?.price || 0;

                    return (
                      <div
                        key={center._id}
                        onClick={() => setForm({ ...form, coachingCenter: center._id })}
                        className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all duration-300 hover:shadow-lg ${form.coachingCenter === center._id
                          ? 'border-[#4B9B6E] bg-[#4B9B6E]/5 shadow-md'
                          : 'border-gray-200 bg-white hover:border-[#4B9B6E]/50'
                          }`}
                      >
                        {/* Selected Indicator */}
                        <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${form.coachingCenter === center._id
                          ? 'border-[#4B9B6E] bg-[#4B9B6E]'
                          : 'border-gray-300 bg-white'
                          }`}>
                          {form.coachingCenter === center._id && (
                            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>

                        {/* Location Icon */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${form.coachingCenter === center._id
                          ? 'bg-[#4B9B6E] text-white'
                          : 'bg-gray-100 text-gray-500'
                          }`}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>

                        {/* Center Name */}
                        <h3 className={`font-bold text-lg mb-1 transition-colors duration-300 ${form.coachingCenter === center._id ? 'text-[#4B9B6E]' : 'text-gray-800'
                          }`}>
                          {center.name}
                        </h3>

                        {/* Address */}
                        <p className="text-xs text-gray-500 mb-4 truncate">{center.address}</p>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Selected Center Summary */}
            {selectedAssignment && (
              <div className="mt-6 p-5 bg-gradient-to-r from-[#4B9B6E]/10 to-[#4B9B6E]/5 border border-[#4B9B6E]/20 rounded-2xl flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#4B9B6E] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Selected Center</p>
                    <p className="text-sm font-bold text-gray-800">{selectedCenter?.name}</p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Personal Details */}
          <section>
            <h2 className={sectionTitleClass}>
              <span className="w-2 h-8 bg-[#4B9B6E] rounded-full mr-3"></span>
              Personal Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Full Name</label>
                <input name="fullName" placeholder="Full Name" onChange={handleChange} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Date of Birth</label>
                <input name="dob" type="date" onChange={handleChange} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Gender</label>
                <select name="gender" onChange={handleChange} required className={inputClass}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Father's / Mother's Name</label>
                <input name="parentName" placeholder="Guardian Name" onChange={handleChange} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Phone Number</label>
                <input name="phone" placeholder="Primary Contact" onChange={handleChange} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Alternate Phone Number</label>
                <input name="altPhone" placeholder="Secondary Contact" onChange={handleChange} className={inputClass} />
              </div>
              <div className="md:col-span-1">
                <label className={labelClass}>Email ID</label>
                <input name="email" type="email" placeholder="example@mail.com" onChange={handleChange} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Aadhar Number</label>
                <input name="aadhar" placeholder="12 Digit Aadhar" onChange={handleChange} required className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Permanent Address</label>
                <textarea name="permanentAddress" placeholder="Full Address" onChange={handleChange} required className={`${inputClass} h-24 resize-none`} />
              </div>
            </div>
          </section>

          {/* Educational Details */}
          <section>
            <h2 className={sectionTitleClass}>
              <span className="w-2 h-8 bg-[#4B9B6E] rounded-full mr-3"></span>
              Educational Details
            </h2>

            {form.education.map((edu, index) => (
              <div key={edu.id} className={cardClass}>
                {form.education.length > 1 && (
                  <button type="button" onClick={() => removeEducation(edu.id)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 text-xs font-bold bg-white px-2 py-1 rounded-lg border">Remove</button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className={labelClass}>Class / Degree</label>
                    <input name="className" placeholder="e.g. 10th / 12th" onChange={(e) => handleEduChange(edu.id, e)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>School / Institute</label>
                    <input name="institute" placeholder="Name of School" onChange={(e) => handleEduChange(edu.id, e)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Board / University</label>
                    <input name="board" placeholder="e.g. CBSE / State Board" onChange={(e) => handleEduChange(edu.id, e)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Passing Year</label>
                    <input name="year" placeholder="YYYY" onChange={(e) => handleEduChange(edu.id, e)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Marks / Grade</label>
                    <input name="marks" placeholder="Percentage or GPA" onChange={(e) => handleEduChange(edu.id, e)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Stream</label>
                    <input name="stream" placeholder="Arts / Science / Comm" onChange={(e) => handleEduChange(edu.id, e)} className={inputClass} />
                  </div>
                </div>
              </div>
            ))}

            <button type="button" onClick={addEducation} className={addButtonClass}>
              <span>+</span> Add Another Qualification
            </button>
          </section>

          {/* Working Experience */}
          <section>
            <h2 className={sectionTitleClass}>
              <span className="w-2 h-8 bg-[#4B9B6E] rounded-full mr-3"></span>
              Working Experience
            </h2>

            {form.experience.map((exp) => (
              <div key={exp.id} className={cardClass}>
                {form.experience.length > 1 && (
                  <button type="button" onClick={() => removeExperience(exp.id)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 text-xs font-bold bg-white px-2 py-1 rounded-lg border">Remove</button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Name of Company</label>
                    <input name="company" placeholder="Organization Name" onChange={(e) => handleExpChange(exp.id, e)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Designation</label>
                    <input name="designation" placeholder="Job Role" onChange={(e) => handleExpChange(exp.id, e)} className={inputClass} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Reporting Person & Contact</label>
                    <input name="reportingPerson" placeholder="Manager Name and Phone" onChange={(e) => handleExpChange(exp.id, e)} className={inputClass} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Job Responsibilities</label>
                    <textarea name="responsibilities" placeholder="Key tasks performed..." onChange={(e) => handleExpChange(exp.id, e)} className={`${inputClass} h-24 resize-none`} />
                  </div>
                </div>
              </div>
            ))}

            <button type="button" onClick={addExperience} className={addButtonClass}>
              <span>+</span> Add Another Experience
            </button>
          </section>

          {/* Terms & Conditions */}
          <section className="bg-[#F1F5F9] p-8 rounded-[32px] border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4 uppercase tracking-wider">Declaration</h2>
            <div className="text-[12px] text-gray-500 space-y-3 h-32 overflow-y-auto pr-4 leading-relaxed custom-scrollbar">
              <p>I certify that the information furnished in this application form is true, I authorize the trust to carry out any kind of verification for my candidature.</p>
              <p>The course fee is non‑refundable once admission is confirmed.</p>
              <p>Students must maintain at least 75% attendance in classroom sessions.</p>
              <p>Hospital internship is compulsory and may be paid or unpaid depending on hospital policy.</p>
              <p>Certification will be provided only after successful completion of 6 months theory + 6 months internship.</p>
            </div>
            <label className="flex items-center gap-4 mt-6 cursor-pointer group">
              <input type="checkbox" name="agreed" checked={form.agreed} onChange={handleChange} required className="h-6 w-6 rounded-lg border-gray-300 text-[#4B9B6E] focus:ring-[#4B9B6E] cursor-pointer" />
              <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">I agree to the terms and conditions mentioned above</span>
            </label>
          </section>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 pt-4">
            <button type="submit" className="flex-[2] bg-[#4B9B6E] text-white font-bold py-4 rounded-2xl shadow-xl hover:shadow-[#4B9B6E]/30 hover:scale-[1.01] active:scale-95 transition-all duration-300">
              Submit Application
            </button>
            <button type="button" onClick={() => navigate(-1)} className="flex-1 px-8 py-4 border-2 border-gray-200 text-gray-500 font-bold rounded-2xl hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
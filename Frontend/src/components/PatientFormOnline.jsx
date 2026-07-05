import React, { useState } from "react"

const PatientFormOnline = () => {
  const [submitted, setSubmitted] = useState(false)

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    age: "",
    gender: "",
    mobile: "",
    email: "",
    address: "",
    symptoms: "",
    history: "",
    allergies: "",
    insuranceProvider: "",
    insuranceId: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  })

  function handleChange(e) {
    const { name, value } = e.target
    setForm((s) => ({ ...s, [name]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    console.log("Submitting patient data:", form)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="font-dmsans min-h-screen w-full flex flex-col items-center justify-center bg-[#EDEFF2] rounded-2xl shadow-md text-center">
        <div className="text-4xl mb-4">✅</div>
        <h1 className="text-4xl text-center text-[#2F3B59] tracking-tight font-medium">
          Online Appointment Booked Successfully
        </h1>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="font-dmsans max-w-lg mx-auto py-20 px-6 bg-[#EDEFF2] rounded-2xl shadow flex flex-col gap-6" >
      <h1 className="text-5xl text-center text-[#2F3B59] mb-20 tracking-tight font-medium"> Online Doctor Consultation Form </h1>

      {/* Patient Info */}
      <div className="flex flex-col gap-3">
        <h1 className="text-xl tracking-tighter font-medium text-[#2F3B59]"> Patient Info </h1>
        <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="First Name" className="bg-white border border-gray-400 rounded-md p-2 text-base"
          required />
        <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last Name" className="bg-white border border-gray-400 rounded-md p-2 text-base" required/>
        <div className="flex gap-2">
          <input name="age" type="number" value={form.age} onChange={handleChange} placeholder="Age" className="bg-white border border-gray-400 rounded-md p-2 text-base w-1/2" min="0" max="120" required />
          <select name="gender" value={form.gender} onChange={handleChange}  className="bg-white border border-gray-400 rounded-md p-2 text-base w-1/2" required>
            <option value="">Gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
      </div>

      {/* Contact */}
      <div className="flex flex-col gap-3">
        <h1 className="text-xl tracking-tighter font-medium text-[#2F3B59]">Contact</h1>
        <input name="mobile" value={form.mobile} onChange={handleChange} placeholder="Mobile" className="bg-white border border-gray-400 rounded-md p-2 text-base"
          type="tel" pattern="[0-9]{10}" required />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="bg-white border border-gray-400 rounded-md p-2 text-base"
          type="email" required />
        <textarea name="address" value={form.address} onChange={handleChange} placeholder="Address" rows={3} className="bg-white border border-gray-400 rounded-md p-2 text-base" required />
      </div>

      {/* Medical */}
      <div className="flex flex-col gap-3">
        <h1 className="text-xl tracking-tighter font-medium text-[#2F3B59]"> Medical Information</h1>
        <textarea name="symptoms" value={form.symptoms} onChange={handleChange} placeholder="Symptoms" rows={3} className="bg-white border border-gray-400 rounded-md p-2 text-base"
          required />
        <textarea name="history" value={form.history} onChange={handleChange} placeholder="Medical history" rows={3} className="bg-white border border-gray-400 rounded-md p-2 text-base"  />
        <input  name="allergies" value={form.allergies} onChange={handleChange} placeholder="Allergies" className="bg-white border border-gray-400 rounded-md p-2 text-base" />
      </div>

      {/* Insurance & Emergency */}
      <div className="flex flex-col gap-3">
        <h1 className="text-xl tracking-tighter font-medium text-[#2F3B59]">Insurance & Emergency </h1>
        <input name="insuranceProvider" value={form.insuranceProvider} onChange={handleChange} placeholder="Insurance Provider" className=" bg-white border border-gray-400 rounded-md p-2 text-base" required />
        <input name="insuranceId" value={form.insuranceId} onChange={handleChange} placeholder="Insurance ID" className=" bg-white border border-gray-400 rounded-md p-2 text-base"
          required/>
        <input name="emergencyContactName" value={form.emergencyContactName} onChange={handleChange} placeholder="Emergency Contact Name" className=" bg-white border border-gray-400 rounded-md p-2 text-base" required />
        <input name="emergencyContactPhone" value={form.emergencyContactPhone} onChange={handleChange} placeholder="Emergency Contact Phone" className=" bg-white border border-gray-400 rounded-md p-2 text-base" type="tel"  pattern="[0-9]{10}" required />
      </div>
      <button type="submit" className="bg-[#4052D6] hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-lg tracking-tighter mt-4 self-center"  >Book Now</button>
    </form>
  )
}
export default PatientFormOnline

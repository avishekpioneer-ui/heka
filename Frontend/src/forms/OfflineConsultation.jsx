import React, { useState } from "react"

export default function OfflineConsultation() {
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
    // NEW fields for offline registration
    visitDate: "",
    preferredDoctor: "",
    patientType: "",
    paymentMode: "",
  })

  function handleChange(e) {
    const { name, value } = e.target
    setForm((s) => ({ ...s, [name]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    // In an offline registration flow you might save locally or send to a local endpoint.
    // For now we log the form and mark submitted.
    console.log("Offline patient registration:", form)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="font-dmsans min-h-screen w-full flex flex-col items-center justify-center bg-[#e0ffee] rounded-2xl shadow-md text-center">
        <div className="text-4xl mb-4">✅</div>
        <h1 className="text-4xl text-center text-[#2F3B59] tracking-tight font-medium">
          Offline Registration Successful
        </h1>
        <p className="mt-4 text-gray-600 max-w-md">Patient has been registered for an in-person visit. Please keep this window for reference.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="font-dmsans max-w-lg mx-auto py-20 px-6 bg-[#e0ffee] rounded-2xl shadow flex flex-col gap-6" >
      <h1 className="text-5xl text-center text-[#2F3B59] mb-20 tracking-tight font-medium"> Offline Doctor Registration Form </h1>

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

      {/* Offline-specific fields (keeps same design) */}
      <div className="flex flex-col gap-3">
        <h1 className="text-xl tracking-tighter font-medium text-[#2F3B59]">In-person Visit Details</h1>
        <input name="visitDate" value={form.visitDate} onChange={handleChange} placeholder="Visit Date" type="date" className="bg-white border border-gray-400 rounded-md p-2 text-base" required />
        <input name="preferredDoctor" value={form.preferredDoctor} onChange={handleChange} placeholder="Preferred Doctor (optional)" className="bg-white border border-gray-400 rounded-md p-2 text-base" />
        <div className="flex gap-2">
          <select name="patientType" value={form.patientType} onChange={handleChange} className="bg-white border border-gray-400 rounded-md p-2 text-base w-1/2" required>
            <option value="">Patient Type</option>
            <option>New</option>
            <option>Returning</option>
          </select>
          <select name="paymentMode" value={form.paymentMode} onChange={handleChange} className="bg-white border border-gray-400 rounded-md p-2 text-base w-1/2" required>
            <option value="">Payment Mode</option>
            <option>Cash</option>
            <option>Card</option>
            <option>Insurance</option>
          </select>
        </div>
      </div>

      <button type="submit" className="bg-[#4B9B6E] hover:bg-[#235e3c] text-white font-semibold py-4 px-6 rounded-lg tracking-tighter mt-4 self-center"  >Register Offline</button>
    </form>
  )
}
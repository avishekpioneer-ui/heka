import React, { useState } from 'react'

export default function CenterLabTestForm() {
  const [submitted, setSubmitted] = useState(false)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    mobile: '',
    email: '',
    address: '',
    hospital: '',
    department: '',
    doctor: '',
    tests: {
      cbc: false,
      sugar: false,
      lipid: false,
      thyroid: false,
      urine: false,
      covid: false,
      custom: ''
    },
    appointmentDate: '',
    appointmentTime: '',
    visitType: 'In-person',
    notes: '',
    paymentMode: '',
    insuranceProvider: '',
    insuranceId: ''
  })

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    if (name.startsWith('tests.')) {
      const key = name.split('.')[1]
      setForm(s => ({ ...s, tests: { ...s.tests, [key]: type === 'checkbox' ? checked : value } }))
      return
    }
    setForm(s => ({ ...s, [name]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    // Replace with API call
    console.log('Hospital lab appointment:', form)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="font-dmsans min-h-screen w-full flex flex-col items-center justify-center bg-[#e0ffee] rounded-2xl shadow-md text-center">
        <div className="text-4xl mb-4">✅</div>
        <h1 className="text-4xl text-center text-[#2F3B59] tracking-tight font-medium">Hospital Lab Appointment Confirmed</h1>
        <p className="mt-4 text-gray-600 max-w-md">Please arrive 10 minutes before your scheduled time with your ID and any referral documents.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="font-dmsans max-w-lg mx-auto py-20 px-6 bg-[#e0ffee] rounded-2xl shadow flex flex-col gap-6">
      <h1 className="text-5xl text-center text-[#2F3B59] mb-8 tracking-tight font-medium">Hospital Lab Appointment</h1>

      {/* Patient Info */}
      <div className="flex flex-col gap-3">
        <h1 className="text-xl tracking-tighter font-medium text-[#2F3B59]"> Patient Info </h1>
        <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="First Name" className="bg-white border border-gray-400 rounded-md p-2 text-base" required />
        <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last Name" className="bg-white border border-gray-400 rounded-md p-2 text-base" />
        <div className="flex gap-2">
          <input name="age" type="number" value={form.age} onChange={handleChange} placeholder="Age" className="bg-white border border-gray-400 rounded-md p-2 text-base w-1/2" min="0" max="120" />
          <select name="gender" value={form.gender} onChange={handleChange} className="bg-white border border-gray-400 rounded-md p-2 text-base w-1/2">
            <option value="">Gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
      </div>

      {/* Contact */}
      <div className="flex flex-col gap-3">
        <h1 className="text-xl tracking-tighter font-medium text-[#2F3B59]">Contact & Address</h1>
        <input name="mobile" value={form.mobile} onChange={handleChange} placeholder="Mobile" className="bg-white border border-gray-400 rounded-md p-2 text-base" type="tel" pattern="[0-9]{10}" required />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="bg-white border border-gray-400 rounded-md p-2 text-base" type="email" />
        <textarea name="address" value={form.address} onChange={handleChange} placeholder="Address" rows={3} className="bg-white border border-gray-400 rounded-md p-2 text-base" />
      </div>

      {/* Hospital selection */}
      <div className="flex flex-col gap-3">
        <h1 className="text-xl tracking-tighter font-medium text-[#2F3B59]">Hospital & Department</h1>
        <select name="hospital" value={form.hospital} onChange={handleChange} className="bg-white border border-gray-400 rounded-md p-2 text-base" required>
          <option value="">Select Hospital</option>
          <option>City General Hospital</option>
          <option>Sunrise Medical Center</option>
          <option>Green Valley Hospital</option>
        </select>
        <select name="department" value={form.department} onChange={handleChange} className="bg-white border border-gray-400 rounded-md p-2 text-base">
          <option value="">Select Department</option>
          <option>Pathology</option>
          <option>Microbiology</option>
          <option>Biochemistry</option>
        </select>
        <input name="doctor" value={form.doctor} onChange={handleChange} placeholder="Referred Doctor (optional)" className="bg-white border border-gray-400 rounded-md p-2 text-base" />
      </div>

      {/* Tests selection */}
      <div className="flex flex-col gap-3">
        <h1 className="text-xl tracking-tighter font-medium text-[#2F3B59]">Select Tests</h1>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-200">
            <input type="checkbox" name="tests.cbc" checked={form.tests.cbc} onChange={handleChange} /> CBC
          </label>
          <label className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-200">
            <input type="checkbox" name="tests.sugar" checked={form.tests.sugar} onChange={handleChange} /> Blood Sugar
          </label>
          <label className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-200">
            <input type="checkbox" name="tests.lipid" checked={form.tests.lipid} onChange={handleChange} /> Lipid Profile
          </label>
          <label className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-200">
            <input type="checkbox" name="tests.thyroid" checked={form.tests.thyroid} onChange={handleChange} /> Thyroid
          </label>
          <label className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-200">
            <input type="checkbox" name="tests.urine" checked={form.tests.urine} onChange={handleChange} /> Urine Exam
          </label>
          <label className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-200">
            <input type="checkbox" name="tests.covid" checked={form.tests.covid} onChange={handleChange} /> COVID Test
          </label>
        </div>
        <input name="tests.custom" value={form.tests.custom} onChange={handleChange} placeholder="Other (specify)" className="bg-white border border-gray-400 rounded-md p-2 text-base" />
      </div>

      {/* Appointment scheduling */}
      <div className="flex flex-col gap-3">
        <h1 className="text-xl tracking-tighter font-medium text-[#2F3B59]">Appointment Details</h1>
        <div className="flex gap-2">
          <input name="appointmentDate" value={form.appointmentDate} onChange={handleChange} placeholder="Appointment Date" type="date" className="bg-white border border-gray-400 rounded-md p-2 text-base w-1/2" required />
          <input name="appointmentTime" value={form.appointmentTime} onChange={handleChange} placeholder="Appointment Time" type="time" className="bg-white border border-gray-400 rounded-md p-2 text-base w-1/2" required />
        </div>
        <select name="visitType" value={form.visitType} onChange={handleChange} className="bg-white border border-gray-400 rounded-md p-2 text-base w-1/2">
          <option>In-person</option>
          <option>Walk-in</option>
        </select>
        <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Any referral / preparation notes" rows={3} className="bg-white border border-gray-400 rounded-md p-2 text-base" />
      </div>

      {/* Payment & insurance */}
      <div className="flex flex-col gap-3">
        <h1 className="text-xl tracking-tighter font-medium text-[#2F3B59]">Payment & Insurance</h1>
        <div className="flex gap-2">
          <select name="paymentMode" value={form.paymentMode} onChange={handleChange} className="bg-white border border-gray-400 rounded-md p-2 text-base w-1/2">
            <option value="">Payment Mode</option>
            <option>Cash</option>
            <option>Card</option>
            <option>Insurance</option>
          </select>
          <input name="insuranceProvider" value={form.insuranceProvider} onChange={handleChange} placeholder="Insurance Provider (optional)" className="bg-white border border-gray-400 rounded-md p-2 text-base w-1/2" />
        </div>
        <input name="insuranceId" value={form.insuranceId} onChange={handleChange} placeholder="Insurance ID (optional)" className="bg-white border border-gray-400 rounded-md p-2 text-base" />
      </div>

      <button type="submit" className="bg-[#4B9B6E] hover:bg-[#235e3c] text-white font-semibold py-4 px-6 rounded-lg tracking-tighter mt-4 self-center">Confirm Appointment</button>
    </form>
  )
}
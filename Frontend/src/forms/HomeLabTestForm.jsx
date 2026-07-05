import React, { useState } from 'react'

export default function HomeLabTestForm() {
  const [submitted, setSubmitted] = useState(false)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    mobile: '',
    email: '',
    address: '',
    tests: {
      cbc: false,
      sugar: false,
      lipid: false,
      thyroid: false,
      urine: false,
      covid: false,
      custom: ''
    },
    preferredDate: '',
    preferredTime: '',
    technicianRequired: 'Yes',
    samplePickup: 'Home',
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
    // Replace with API call or local save for offline
    console.log('Home lab booking:', form)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="font-dmsans min-h-screen w-full flex flex-col items-center justify-center bg-[#e0ffee] rounded-2xl shadow-md text-center">
        <div className="text-4xl mb-4">✅</div>
        <h1 className="text-4xl text-center text-[#2F3B59] tracking-tight font-medium">Home Lab Test Booked</h1>
        <p className="mt-4 text-gray-600 max-w-md">Our technician will contact you to confirm the exact time. Keep your medicines and ID ready.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="font-dmsans max-w-lg mx-auto py-20 px-6 bg-[#e0ffee] rounded-2xl shadow flex flex-col gap-6">
      <h1 className="text-5xl text-center text-[#2F3B59] mb-8 tracking-tight font-medium">Home Lab Test Booking</h1>

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
        <textarea name="address" value={form.address} onChange={handleChange} placeholder="Pickup Address (include landmark)" rows={3} className="bg-white border border-gray-400 rounded-md p-2 text-base" required />
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

      {/* Scheduling & logistics */}
      <div className="flex flex-col gap-3">
        <h1 className="text-xl tracking-tighter font-medium text-[#2F3B59]">Pickup & Scheduling</h1>
        <div className="flex gap-2">
          <input name="preferredDate" value={form.preferredDate} onChange={handleChange} placeholder="Preferred Date" type="date" className="bg-white border border-gray-400 rounded-md p-2 text-base w-1/2" />
          <input name="preferredTime" value={form.preferredTime} onChange={handleChange} placeholder="Preferred Time" type="time" className="bg-white border border-gray-400 rounded-md p-2 text-base w-1/2" />
        </div>
        <div className="flex gap-2">
          <select name="technicianRequired" value={form.technicianRequired} onChange={handleChange} className="bg-white border border-gray-400 rounded-md p-2 text-base w-1/2">
            <option>Yes</option>
            <option>No</option>
          </select>
          <select name="samplePickup" value={form.samplePickup} onChange={handleChange} className="bg-white border border-gray-400 rounded-md p-2 text-base w-1/2">
            <option value="Home">Home Pickup</option>
            <option value="Center">Drop at Center</option>
          </select>
        </div>
        <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Additional notes / preparation instructions" rows={3} className="bg-white border border-gray-400 rounded-md p-2 text-base" />
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

      <button type="submit" className="bg-[#4B9B6E] hover:bg-[#235e3c] text-white font-semibold py-4 px-6 rounded-lg tracking-tighter mt-4 self-center">Book Home Test</button>
    </form>
  )
}
import React from 'react';

const AdminHospitals = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 font-literata tracking-tight">Hospitals</h1>
        <p className="text-gray-500 mt-1 font-dmsans">Manage affiliated hospitals and clinics</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-green-50 rounded-full mb-6 relative">
          <div className="absolute inset-0 bg-[#4B9B6E]/10 rounded-full animate-ping opacity-20"></div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#4B9B6E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3 font-literata">Hospital Management</h2>
        <p className="text-gray-500 max-w-md mx-auto leading-relaxed">This module is currently under development. Soon you'll be able to add, edit, and manage hospital partnerships directly from here.</p>
        <button className="mt-8 px-8 py-3 bg-[#4B9B6E] text-white rounded-xl hover:bg-[#3d825b] transition-all shadow-lg shadow-green-200 hover:shadow-green-300 font-medium transform hover:-translate-y-0.5">
          Notify Me When Ready
        </button>
      </div>
    </div>
  );
};

export default AdminHospitals;

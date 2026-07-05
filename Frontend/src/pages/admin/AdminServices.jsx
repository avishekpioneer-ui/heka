import React from 'react';

const AdminServices = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 font-literata tracking-tight">Services</h1>
        <p className="text-gray-500 mt-1 font-dmsans">Configure available services and treatments</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-50 rounded-full mb-6 relative">
          <div className="absolute inset-0 bg-blue-400/10 rounded-full animate-ping opacity-20"></div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3 font-literata">Service Configuration</h2>
        <p className="text-gray-500 max-w-md mx-auto leading-relaxed">We're building a powerful interface for you to manage medical services. Stay tuned for updates.</p>
        <button className="mt-8 px-8 py-3 bg-white text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-50 transition-all font-medium">
          Learn More
        </button>
      </div>
    </div>
  );
};

export default AdminServices;

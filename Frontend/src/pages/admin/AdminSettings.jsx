import React from 'react';

const AdminSettings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 font-literata tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1 font-dmsans">System configuration and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 opacity-60">
          <div className="h-12 w-12 bg-gray-100 rounded-xl mb-4"></div>
          <div className="h-6 w-3/4 bg-gray-100 rounded mb-2"></div>
          <div className="h-4 w-full bg-gray-50 rounded"></div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 opacity-60">
          <div className="h-12 w-12 bg-gray-100 rounded-xl mb-4"></div>
          <div className="h-6 w-3/4 bg-gray-100 rounded mb-2"></div>
          <div className="h-4 w-full bg-gray-50 rounded"></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center mt-6">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-purple-50 rounded-full mb-6 relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-500 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3 font-literata">Settings Panel</h2>
        <p className="text-gray-500 max-w-md mx-auto leading-relaxed">Advanced configuration options for the Heka platform will be available here.</p>
      </div>
    </div>
  );
};

export default AdminSettings;

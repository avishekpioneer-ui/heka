import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-gray-50 font-dmsans overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 z-20 px-8 py-4 flex justify-between items-center sticky top-0">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold font-literata text-gray-800 tracking-tight">Admin Portal</h2>
            <span className="text-xs bg-[#4B9B6E]/10 text-[#4B9B6E] px-2.5 py-1 rounded-full font-bold">Coaching</span>
            <button 
              onClick={() => navigate('/opd')}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all border border-gray-200/50 cursor-pointer"
            >
              Switch to OPD 🩺
            </button>
          </div>


          <div className="flex items-center gap-6">
            <button className="relative p-2 text-gray-400 hover:text-[#4B9B6E] transition-colors rounded-full hover:bg-green-50">
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-gray-700 leading-none">Admin User</p>
                <p className="text-xs text-gray-500 mt-1">Administrator</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4B9B6E] to-[#3d825b] flex items-center justify-center text-white font-bold shadow-lg shadow-green-200">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

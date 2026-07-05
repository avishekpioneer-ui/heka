import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { OpdSocketProvider } from './OpdSocketContext';
import OpdNotificationBell from './OpdNotificationBell';

const OpdLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName') || 'Staff';
  const userEmail = localStorage.getItem('userEmail') || '';
  const userCategory = localStorage.getItem('userCategory') || 'staff';
  const userRole = localStorage.getItem('userRoleName') || (userCategory === 'admin' ? 'Admin' : 'Staff');
  const permissionsStr = localStorage.getItem('userPermissions');
  
  const permissions = React.useMemo(() => {
    try {
      return permissionsStr ? JSON.parse(permissionsStr) : [];
    } catch (e) {
      return [];
    }
  }, [permissionsStr]);

  const hasPermission = (perm) => {
    return permissions.includes('*') || permissions.includes(perm);
  };

  useEffect(() => {
    // Basic protection check
    if (!userId) {
      navigate('/opd/login');
    }
  }, [userId, navigate]);

  // Close the mobile sidebar drawer whenever the route changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out of the OPD Portal?')) {
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userCategory');
      localStorage.removeItem('userRoleName');
      localStorage.removeItem('userPermissions');
      navigate('/opd/login');
    }
  };

  const isActive = (path) => {
    if (path === '/opd') {
      return location.pathname === '/opd';
    }
    return location.pathname.startsWith(path);
  };

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/opd',
      permission: 'access_opd',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    {
      name: 'Patients Registry',
      path: '/opd/patients',
      permission: 'manage_patients',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      name: 'Appointments',
      path: '/opd/appointments',
      permission: 'manage_appointments',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      name: 'Consultations',
      path: '/opd/consultations',
      permission: 'manage_consultations',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      name: 'Billing & Invoices',
      path: '/opd/billing',
      permission: 'manage_billing',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      name: 'Diagnostics Catalog',
      path: '/opd/tests',
      permission: 'manage_tests',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      )
    },
    {
      name: 'Pharmacy Catalogue',
      path: '/opd/medicines',
      permission: 'manage_medicines',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      )
    },
    {
      name: 'Roles & Staff',
      path: '/opd/roles',
      permission: 'manage_roles',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      )
    },
    {
      name: 'Reminders Feed',
      path: '/opd/reminders',
      permission: 'access_opd',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      )
    }
  ];

  if (!userId) return null;

  return (
    <OpdSocketProvider userId={userId}>
    <div className="flex h-screen bg-teal-50/20 font-dmsans overflow-hidden">
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* OPD Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-[85vw] max-w-72 sm:w-72 bg-[#0F766E] min-h-screen text-white flex flex-col shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Brand */}
        <div className="p-8 pb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center transform rotate-3 shadow-lg">
            <span className="text-xl font-bold text-white">O</span>
          </div>
          <div className="text-2xl font-bold font-literata tracking-wide text-white">
            HEKA OPD
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden ml-auto text-teal-200 hover:text-white p-1 cursor-pointer"
            aria-label="Close menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* System Toggle Selector (Show only if Category is Admin) */}
        {userCategory === 'admin' && (
          <div className="px-6 mb-2 mt-2">
            <div className="bg-teal-900/60 rounded-xl p-1 flex items-center gap-1 border border-teal-800/40">
              <button 
                className="flex-1 text-center py-2 px-1 text-xs font-semibold rounded-lg text-teal-200 hover:text-white transition-all cursor-pointer"
                onClick={() => navigate('/admin')}
              >
                Coaching
              </button>
              <button 
                className="flex-1 text-center py-2 px-1 text-xs font-semibold rounded-lg bg-teal-500 text-white transition-all shadow-sm cursor-pointer"
                onClick={() => navigate('/opd')}
              >
                OPD Portal
              </button>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <div className="mx-6 mb-6 mt-4 pt-6 border-t border-teal-800/50 flex-1 overflow-y-auto">
          <p className="text-xs uppercase tracking-wider text-teal-200/60 font-semibold mb-4">OPD Modules</p>
          <nav className="flex-1">
            <ul className="space-y-1.5">
              {menuItems
                .filter(item => hasPermission(item.permission))
                .map((item) => {
                  const active = isActive(item.path);
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active
                          ? 'bg-teal-500 text-white shadow-md shadow-teal-900/20 translate-x-1'
                          : 'text-teal-100 hover:bg-white/5 hover:text-white hover:translate-x-1'
                          }`}
                      >
                        <span className={`${active ? 'text-white' : 'text-teal-200 group-hover:text-white'} transition-colors`}>
                          {item.icon}
                        </span>
                        <span className="font-medium text-sm">{item.name}</span>
                        {active && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white opacity-80"></div>
                        )}
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </nav>
        </div>

        {/* Footer Area */}
        <div className="mt-auto mx-6 mb-6 pt-6 border-t border-teal-800/50">
          <div className="mb-4 text-center px-4">
            <p className="text-xs font-semibold text-teal-100 leading-none">{userName}</p>
            <p className="text-[10px] text-teal-200/70 mt-1 uppercase tracking-wider font-bold bg-teal-900/40 py-1 px-2 rounded-full inline-block">
              {userRole}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-4 py-3 rounded-xl transition-all shadow-md shadow-red-950/20 group cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-80 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* OPD Content Body */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-teal-100/50 z-20 px-3 sm:px-4 md:px-8 py-3 md:py-4 flex justify-between items-center gap-2 sticky top-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-teal-700 hover:text-teal-900 p-1 -ml-1 cursor-pointer flex-shrink-0"
              aria-label="Open menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold font-literata text-teal-950 tracking-tight truncate">OPD Portal</h2>
            <span className="hidden sm:inline-block text-xs bg-teal-50 text-[#0D9488] px-2.5 py-1 rounded-full font-bold border border-teal-100 flex-shrink-0">Clinical Space</span>
            {userCategory === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="hidden sm:flex text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-lg font-semibold items-center gap-1 transition-all border border-gray-200/50 cursor-pointer flex-shrink-0"
              >
                Switch to Coaching 📚
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
            <OpdNotificationBell />
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-6">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-teal-950 leading-none">{userName}</p>
                <p className="text-xs text-teal-600 mt-1">{userRole}</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-teal-500 to-[#0F766E] flex items-center justify-center text-white font-bold shadow-lg shadow-teal-100 flex-shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 bg-slate-50/50 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
    </OpdSocketProvider>
  );
};

export default OpdLayout;

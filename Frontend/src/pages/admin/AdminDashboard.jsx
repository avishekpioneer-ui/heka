import React from 'react';

const AdminDashboard = () => {
  const stats = [
    {
      title: 'Total Users',
      value: '1,234',
      change: '+12%',
      trend: 'up',
      color: 'blue',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      title: 'Total Hospitals',
      value: '56',
      change: '+3%',
      trend: 'up',
      color: 'green',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      title: 'Active Services',
      value: '12',
      change: '0%',
      trend: 'neutral',
      color: 'purple',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      title: 'Pending Requests',
      value: '23',
      change: '-5%',
      trend: 'down',
      color: 'yellow',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 font-literata tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1 font-dmsans">Welcome back, here's what's happening today.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white text-gray-600 rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 text-sm font-medium transition-colors">
            Download Report
          </button>
          <button className="px-4 py-2 bg-[#4B9B6E] text-white rounded-xl shadow-md shadow-green-200 hover:bg-[#3d825b] text-sm font-medium transition-colors">
            + Add New User
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const colors = {
            blue: 'bg-blue-50 text-blue-600',
            green: 'bg-green-50 text-green-600',
            purple: 'bg-purple-50 text-purple-600',
            yellow: 'bg-yellow-50 text-yellow-600',
          };
          const trendColors = {
            up: 'text-green-500',
            down: 'text-red-500',
            neutral: 'text-gray-400'
          };

          return (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 group">
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-xl ${colors[stat.color]} group-hover:scale-110 transition-transform duration-300`}>
                  {stat.icon}
                </div>
                <span className={`flex items-center text-xs font-bold ${trendColors[stat.trend]} bg-gray-50 px-2 py-1 rounded-full`}>
                  {stat.trend === 'up' && '↑'}
                  {stat.trend === 'down' && '↓'}
                  {stat.change}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">{stat.value}</h3>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area - Placeholder for Charts */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">User Growth</h3>
            <select className="text-sm border-gray-200 rounded-lg text-gray-500 bg-gray-50 px-3 py-1 outline-none">
              <option>Last 7 Days</option>
              <option>Last Month</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-400 text-sm">Chart Visualization Placeholder</p>
            {/* You would integrate Recharts or Chart.js here */}
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Recent Activity</h3>
          <div className="space-y-0">
            {[1, 2, 3, 4].map((i, idx) => (
              <div key={i} className="flex gap-4 relative pb-8 last:pb-0">
                {/* Timeline visualization */}
                {idx !== 3 && <div className="absolute left-[19px] top-8 bottom-0 w-0.5 bg-gray-100"></div>}

                <div className="relative z-10 w-10 h-10 flex-shrink-0 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                  {i % 2 === 0 ? '📝' : '👤'}
                </div>

                <div className="flex-1 pt-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {i % 2 === 0 ? 'New course added' : 'New student registered'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    <span className="font-medium text-gray-700">Admin {i}</span> • 2 hours ago
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

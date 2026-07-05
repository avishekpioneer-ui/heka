import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal State for viewing details
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!userId) return;
    fetchStudents();
  }, [userId]);

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URI}/api/students`,
        { headers: { 'x-user-id': userId } }
      );

      if (response.data.success) {
        setStudents(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch students');
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      setError('Error connecting to the server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const term = searchTerm.toLowerCase();
    return (
      (student.fullName && student.fullName.toLowerCase().includes(term)) ||
      (student.email && student.email.toLowerCase().includes(term)) ||
      (student.phoneNumber && student.phoneNumber.includes(term))
    );
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const openModal = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedStudent(null);
    setIsModalOpen(false);
  };

  const approveStudent = async (id) => {
    try {
      setApproving(true);
      await axios.put(`${import.meta.env.VITE_BACKEND_URI}/api/students/${id}/approve`, {}, {
        headers: { 'x-user-id': userId }
      });
      // Refresh list and update modal
      await fetchStudents();
      setSelectedStudent(prev => prev ? { ...prev, applicationStatus: 'Approved', paymentStatus: 'verified' } : null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve student.');
    } finally {
      setApproving(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      setApproving(true);
      await axios.put(`${import.meta.env.VITE_BACKEND_URI}/api/students/${id}/status`, { status: newStatus }, {
        headers: { 'x-user-id': userId }
      });
      await fetchStudents();
      setSelectedStudent(prev => prev ? { ...prev, applicationStatus: newStatus, paymentStatus: newStatus === 'Approved' ? 'verified' : prev.paymentStatus } : null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 font-literata tracking-tight">Students Management</h1>
          <p className="text-gray-500 mt-1 font-dmsans">View and manage student details</p>
        </div>
        <button
          onClick={fetchStudents}
          className="px-5 py-2.5 bg-[#4B9B6E] text-white rounded-xl hover:bg-[#3d825b] transition-all shadow-md shadow-green-200 flex items-center gap-2 font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 max-w-md">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            className="block w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4B9B6E] focus:border-transparent transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#4B9B6E] border-t-transparent"></div>
            <p className="mt-3 text-sm text-gray-500 font-medium">Loading students...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center m-4 rounded-xl bg-red-50 border border-red-100">
            <p className="font-semibold text-red-600">Unable to load data</p>
            <p className="text-sm text-red-500 mt-1 mb-3">{error}</p>
            <button
              onClick={fetchStudents}
              className="text-sm bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-16 text-center text-gray-500">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-700">No students found</p>
            <p className="text-sm mt-1">Try adjusting your search terms.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Course Info</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-100">
                  {currentItems.map((student) => (
                    <tr key={student.userId} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm shadow-sm">
                            {student.fullName ? student.fullName.slice(0, 2).toUpperCase() : 'NA'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900 group-hover:text-[#4B9B6E] transition-colors">{student.fullName}</div>
                            <div className="text-xs text-gray-500">{student.gender} • {student.dateOfBirth}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.email}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">{student.phoneNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {student.courseType ? (
                          <span className="px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full bg-green-50 text-green-700 border border-green-100">
                            {student.courseType}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                        <div className="text-xs text-gray-500 mt-1 truncate max-w-[150px]" title={student.coachingCenterName}>{student.coachingCenterName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="truncate max-w-[150px] block" title={student.permanentAddress}>
                          {student.permanentAddress || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {student.applicationStatus === 'Approved' ? (
                            <span className="px-2 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200">Approved</span>
                          ) : (
                            <span className="px-2 py-1 rounded-lg text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">{student.applicationStatus}</span>
                          )}
                          <button
                            onClick={() => openModal(student)}
                            className="text-[#4B9B6E] bg-green-50 hover:bg-[#4B9B6E] hover:text-white px-3 py-1.5 rounded-lg transition-all text-xs font-semibold shadow-sm"
                          >
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="text-sm text-gray-500">
                  Showing <span className="font-semibold text-gray-900">{indexOfFirstItem + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(indexOfLastItem, filteredStudents.length)}</span> of <span className="font-semibold text-gray-900">{filteredStudents.length}</span> results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${currentPage === 1
                      ? 'bg-gray-100 text-gray-400 border-transparent cursor-not-allowed'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm'
                      }`}
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, idx) => {
                    // Simple pagination logic to show max 5 pages
                    if (totalPages > 5 && Math.abs(currentPage - (idx + 1)) > 2) return null;

                    return (
                      <button
                        key={idx + 1}
                        onClick={() => handlePageChange(idx + 1)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${currentPage === idx + 1
                          ? 'bg-[#4B9B6E] text-white shadow-md shadow-green-200'
                          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                          }`}
                      >
                        {idx + 1}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 border-transparent cursor-not-allowed'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm'
                      }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Student Details Modal */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity"
              aria-hidden="true"
              onClick={closeModal}
            ></div>

            {/* Modal panel */}
            <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl transform transition-all border border-gray-100 overflow-hidden animate-fade-in">
              <div className="px-8 pt-8 pb-6">
                <div className="flex justify-between items-start border-b border-gray-100 pb-6 mb-8">
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 font-literata">
                      Student Profile
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Detailed admission record for {selectedStudent.fullName}</p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2.5 rounded-full transition-all group"
                  >
                    <svg className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Personal Info Card */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                      <div className="flex flex-col items-center mb-6">
                        <div className="w-24 h-24 bg-[#4B9B6E] text-white rounded-full flex items-center justify-center text-3xl font-bold shadow-xl shadow-green-100 mb-4 border-4 border-white">
                          {selectedStudent.fullName ? selectedStudent.fullName.slice(0, 2).toUpperCase() : 'NA'}
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 text-center">{selectedStudent.fullName}</h4>
                        <p className="text-sm text-gray-500 font-medium">{selectedStudent.email}</p>
                      </div>
                      <div className="space-y-4 pt-6 border-t border-gray-100">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 font-medium uppercase tracking-wider text-[10px]">Phone</span>
                          <span className="font-bold text-gray-700">{selectedStudent.phoneNumber}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 font-medium uppercase tracking-wider text-[10px]">Date of Birth</span>
                          <span className="font-bold text-gray-700">{selectedStudent.dateOfBirth}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 font-medium uppercase tracking-wider text-[10px]">Gender</span>
                          <span className="font-bold text-gray-700">{selectedStudent.gender}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 font-medium uppercase tracking-wider text-[10px]">Aadhar</span>
                          <span className="font-mono font-bold text-gray-700">{selectedStudent.aadharNumber}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50/50 rounded-2xl p-6 border border-green-100 shadow-sm">
                      <h5 className="font-bold text-green-800 mb-4 text-xs uppercase tracking-widest flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        Course Details
                      </h5>
                      <div className="space-y-4">
                        <div>
                          <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider block mb-1">Course Type</span>
                          <span className="text-sm font-bold text-green-900 bg-white px-3 py-1.5 rounded-xl border border-green-200 inline-block shadow-sm">{selectedStudent.courseType || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider block mb-1">Coaching Center</span>
                          <span className="text-sm font-bold text-gray-800">{selectedStudent.coachingCenterName || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider block mb-1">Total Fee</span>
                          <span className="text-lg font-black text-green-700 font-literata">{selectedStudent.courseFee ? `₹${selectedStudent.courseFee}` : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Detailed Info */}
                  <div className="lg:col-span-2 space-y-8">
                    {/* Address & Parents */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-gray-900 flex items-center gap-3 text-sm uppercase tracking-widest">
                        <span className="w-8 h-[2px] bg-blue-500 rounded-full"></span>
                        Contact & Family
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 hover:border-blue-100 transition-colors">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Permanent Address</span>
                          <span className="text-sm text-gray-700 font-medium leading-relaxed">{selectedStudent.permanentAddress}</span>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 hover:border-blue-100 transition-colors">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2">Parent/Guardian Name</span>
                          <span className="text-sm text-gray-700 font-bold">{selectedStudent.fatherOrMotherName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Education */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-gray-900 flex items-center gap-3 text-sm uppercase tracking-widest">
                        <span className="w-8 h-[2px] bg-purple-500 rounded-full"></span>
                        Academic History
                      </h4>
                      {selectedStudent.educations && selectedStudent.educations.length > 0 ? (
                        <div className="overflow-hidden border border-gray-100 rounded-2xl shadow-sm">
                          <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50/50">
                              <tr>
                                <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Degree</th>
                                <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Institute</th>
                                <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Year</th>
                                <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Result</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                              {selectedStudent.educations.map((edu, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="px-5 py-4 text-sm font-bold text-gray-800">{edu.degreeOrClass}</td>
                                  <td className="px-5 py-4 text-sm text-gray-600">{edu.institute}</td>
                                  <td className="px-5 py-4 text-sm text-gray-500 font-medium">{edu.passingYear}</td>
                                  <td className="px-5 py-4 text-sm"><span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg font-bold text-xs">{edu.marksOrGrade}</span></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center">
                          <p className="text-sm text-gray-400 italic">No academic history provided.</p>
                        </div>
                      )}
                    </div>

                    {/* Work Experience */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-gray-900 flex items-center gap-3 text-sm uppercase tracking-widest">
                        <span className="w-8 h-[2px] bg-orange-500 rounded-full"></span>
                        Work Experience
                      </h4>
                      {selectedStudent.workExperiences && selectedStudent.workExperiences.length > 0 ? (
                        <div className="space-y-4">
                          {selectedStudent.workExperiences.map((work, idx) => (
                            <div key={idx} className="border border-gray-100 rounded-2xl p-5 hover:border-orange-200 transition-all bg-white shadow-sm group">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h5 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors uppercase tracking-tight">{work.designation}</h5>
                                  <p className="text-sm text-gray-500 font-bold">{work.companyName}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mb-3">
                                <span className="bg-orange-50 text-orange-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-orange-100">
                                  Ref: {work.reportingPerson}
                                </span>
                              </div>
                              {work.jobResponsibilities && (
                                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100 italic">
                                  "{work.jobResponsibilities}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center">
                          <p className="text-sm text-gray-400 italic">No professional experience listed.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="bg-gray-50 px-8 py-6 flex flex-col md:flex-row items-center justify-between border-t border-gray-100 gap-6">
                <div className="flex flex-wrap items-center gap-6 w-full md:w-auto">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Update Admission Status</label>
                    <select
                      value={selectedStudent.applicationStatus}
                      onChange={(e) => updateStatus(selectedStudent._id, e.target.value)}
                      disabled={approving}
                      className="text-sm border border-gray-200 rounded-2xl px-5 py-2.5 bg-white hover:border-[#4B9B6E] focus:ring-8 focus:ring-green-500/5 focus:border-[#4B9B6E] outline-none transition-all disabled:opacity-60 font-bold shadow-sm min-w-[240px]"
                    >
                      <option value="Submitted(Payment not initiated)">Submitted (No Payment)</option>
                      <option value="Submitted(Payment initiated)">Submitted (Payment Sent)</option>
                      <option value="Approved">Approved / Verified</option>
                      <option value="Reject">Rejected / Voided</option>
                    </select>
                  </div>

                  {selectedStudent?.transactionId && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Transaction Identification</label>
                      <div className="flex items-center bg-blue-50 border border-blue-100 rounded-2xl px-4 py-2.5 shadow-sm group">
                        <p className="font-mono text-xs font-black text-blue-800 mr-4 tracking-tighter">{selectedStudent.transactionId}</p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedStudent.transactionId);
                            // Simple toast feedback could be added here
                          }}
                          className="p-1 px-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5"
                          title="Copy to clipboard"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          <span className="text-[10px] font-bold uppercase tracking-wider">Copy</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                  <button
                    type="button"
                    className="flex-1 md:flex-none inline-flex justify-center items-center px-8 py-3 bg-white border border-gray-200 text-sm font-bold text-gray-600 rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition-all shadow-sm"
                    onClick={closeModal}
                  >
                    Close Profile
                  </button>
                  {selectedStudent?.applicationStatus !== 'Approved' && (
                    <button
                      type="button"
                      disabled={approving}
                      onClick={() => approveStudent(selectedStudent._id)}
                      className="flex-1 md:flex-none inline-flex justify-center items-center gap-2 rounded-2xl border border-transparent shadow-xl shadow-green-200/50 px-8 py-3 bg-[#4B9B6E] text-sm font-bold text-white hover:bg-[#3d825b] hover:scale-[1.02] active:scale-[0.98] focus:outline-none transition-all disabled:opacity-60"
                    >
                      {approving ? (
                        <><div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div> Processing</>
                      ) : (
                        <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Approve Entry</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudents;

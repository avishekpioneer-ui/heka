import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminCourseAssignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [centers, setCenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(null);
    const [formData, setFormData] = useState({
        courseId: '',
        coachingCenterId: '',
        price: ''
    });

    const API_URL = 'http://localhost:5001/api/admin';
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [assignmentsRes, coursesRes, centersRes] = await Promise.all([
                axios.get(`${API_URL}/assignments`, { headers: { 'x-user-id': userId } }),
                axios.get(`${API_URL}/courses`, { headers: { 'x-user-id': userId } }),
                axios.get(`${API_URL}/coaching-centers`, { headers: { 'x-user-id': userId } })
            ]);

            setAssignments(assignmentsRes.data.assignments);
            setCourses(coursesRes.data.courses);
            setCenters(centersRes.data.coachingCenters);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            // alert(error.response?.data?.message || 'Failed to fetch data');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingAssignment) {
                await axios.put(`${API_URL}/assignments/${editingAssignment._id}`,
                    { price: formData.price },
                    { headers: { 'x-user-id': userId } }
                );
                alert('Assignment updated successfully!');
            } else {
                await axios.post(`${API_URL}/assignments`, formData, {
                    headers: { 'x-user-id': userId }
                });
                alert('Course assigned successfully!');
            }
            handleModalClose();
            fetchData();
        } catch (error) {
            console.error('Error saving assignment:', error);
            alert(error.response?.data?.message || 'Failed to save assignment');
        }
    };

    const handleEdit = (assignment) => {
        setEditingAssignment(assignment);
        setFormData({
            courseId: assignment.courseId._id,
            coachingCenterId: assignment.coachingCenterId._id,
            price: assignment.price
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to remove this assignment?')) return;

        try {
            await axios.delete(`${API_URL}/assignments/${id}`, {
                headers: { 'x-user-id': userId }
            });
            alert('Assignment removed successfully!');
            fetchData();
        } catch (error) {
            console.error('Error deleting assignment:', error);
            alert(error.response?.data?.message || 'Failed to remove assignment');
        }
    };

    useEffect(() => {
        if (showModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showModal]);

    const handleModalClose = () => {
        setShowModal(false);
        setEditingAssignment(null);
        setFormData({ courseId: '', coachingCenterId: '', price: '' });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#4B9B6E] border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 font-literata tracking-tight">Course Assignments</h1>
                    <p className="text-gray-500 mt-1 font-dmsans">Assign courses to coaching centres</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-5 py-2.5 bg-[#4B9B6E] text-white rounded-xl hover:bg-[#3d825b] transition-all shadow-md shadow-green-200 flex items-center gap-2 font-medium"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Assign Course
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Course</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Coaching Centre</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price (₹)</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {assignments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        <div className="mx-auto h-12 w-12 text-gray-300 mb-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                            </svg>
                                        </div>
                                        <p className="text-lg font-medium text-gray-700">No assignments found</p>
                                        <p className="text-sm mt-1">Click "Assign Course" to link a course to a center.</p>
                                    </td>
                                </tr>
                            ) : (
                                assignments.map((assignment) => (
                                    <tr key={assignment._id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-gray-900 group-hover:text-[#4B9B6E] transition-colors">{assignment.courseId?.courseName || 'N/A'}</div>
                                            {assignment.courseId?.certificateAvailable && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 mt-1 border border-green-100">
                                                    Certificate
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 font-medium">{assignment.coachingCenterId?.name || 'N/A'}</div>
                                            <div className="text-xs text-gray-500 mt-0.5 max-w-xs truncate" title={assignment.coachingCenterId?.address}>{assignment.coachingCenterId?.address || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {assignment.courseId?.duration || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                            ₹{assignment.price?.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(assignment)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                    title="Edit Price"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(assignment._id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                    title="Remove"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div
                            className="fixed inset-0 bg-black/20 backdrop-blur-[1px] transition-opacity"
                            onClick={handleModalClose}
                        />

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100 scale-95 opacity-0 animate-[modalIn_0.2s_ease-out_forwards]">

                            {/* Modal Header */}
                            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                                <h2 className="text-xl font-bold font-literata text-gray-900">
                                    {editingAssignment ? 'Edit Assignment Price' : 'Assign Course'}
                                </h2>
                                <button onClick={handleModalClose} className="text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 p-2 rounded-full transition-colors border border-transparent hover:border-gray-200">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="px-6 py-6 bg-white">
                                <form id="assignmentForm" onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Course</label>
                                        <select
                                            required
                                            disabled={!!editingAssignment}
                                            value={formData.courseId}
                                            onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4B9B6E] focus:border-transparent transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed appearance-none"
                                        >
                                            <option value="">Select a course</option>
                                            {courses.map((course) => (
                                                <option key={course._id} value={course._id}>
                                                    {course.courseName} ({course.duration})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Coaching Centre</label>
                                        <select
                                            required
                                            disabled={!!editingAssignment}
                                            value={formData.coachingCenterId}
                                            onChange={(e) => setFormData({ ...formData, coachingCenterId: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4B9B6E] focus:border-transparent transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed appearance-none"
                                        >
                                            <option value="">Select a centre</option>
                                            {centers.map((center) => (
                                                <option key={center._id} value={center._id}>
                                                    {center.name} - {center.address}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Price (₹)</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 font-medium z-10">₹</span>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4B9B6E] focus:border-transparent transition-all outline-none"
                                                placeholder="Enter price"
                                            />
                                        </div>
                                    </div>
                                </form>
                            </div>

                            {/* Modal Footer */}
                            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={handleModalClose}
                                    className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="assignmentForm"
                                    className="px-5 py-2.5 bg-[#4B9B6E] hover:bg-[#3d825b] text-white rounded-xl font-medium transition-all shadow-md shadow-green-200 transform hover:-translate-y-0.5"
                                >
                                    {editingAssignment ? 'Update Price' : 'Assign Course'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCourseAssignments;

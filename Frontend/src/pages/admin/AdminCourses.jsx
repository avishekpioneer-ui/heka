import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [formData, setFormData] = useState({
        courseName: '',
        description: '',
        duration: '',
        certificateAvailable: false
    });

    const API_URL = 'http://localhost:5001/api/admin';
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const response = await axios.get(`${API_URL}/courses`, {
                headers: { 'x-user-id': userId }
            });
            setCourses(response.data.courses);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching courses:', error);
            alert(error.response?.data?.message || 'Failed to fetch courses');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCourse) {
                await axios.put(`${API_URL}/courses/${editingCourse._id}`, formData, {
                    headers: { 'x-user-id': userId }
                });
                alert('Course updated successfully!');
            } else {
                await axios.post(`${API_URL}/courses`, formData, {
                    headers: { 'x-user-id': userId }
                });
                alert('Course created successfully!');
            }
            setShowModal(false);
            setFormData({ courseName: '', description: '', duration: '', certificateAvailable: false });
            setEditingCourse(null);
            fetchCourses();
        } catch (error) {
            console.error('Error saving course:', error);
            alert(error.response?.data?.message || 'Failed to save course');
        }
    };

    const handleEdit = (course) => {
        setEditingCourse(course);
        setFormData({
            courseName: course.courseName,
            description: course.description,
            duration: course.duration,
            certificateAvailable: course.certificateAvailable
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this course?')) return;

        try {
            await axios.delete(`${API_URL}/courses/${id}`, {
                headers: { 'x-user-id': userId }
            });
            alert('Course deleted successfully!');
            fetchCourses();
        } catch (error) {
            console.error('Error deleting course:', error);
            alert(error.response?.data?.message || 'Failed to delete course');
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
        setEditingCourse(null);
        setFormData({ courseName: '', description: '', duration: '', certificateAvailable: false });
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
                    <h1 className="text-3xl font-bold text-gray-800 font-literata tracking-tight">Courses</h1>
                    <p className="text-gray-500 mt-1 font-dmsans">Manage available courses and certifications</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-5 py-2.5 bg-[#4B9B6E] text-white rounded-xl hover:bg-[#3d825b] transition-all shadow-md shadow-green-200 flex items-center gap-2 font-medium"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Course
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.length === 0 ? (
                    <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-gray-100 border-dashed">
                        <div className="mx-auto h-12 w-12 text-gray-300 mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <p className="text-lg font-medium text-gray-700">No courses found</p>
                        <p className="text-sm text-gray-500 mt-1">Click "Add Course" to create one.</p>
                    </div>
                ) : (
                    courses.map((course) => (
                        <div key={course._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-[#4B9B6E]/30 transition-all duration-300 group flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-[#4B9B6E] group-hover:text-white transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M12 14l9-5-9-5-9 5 9 5z" />
                                        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                                    </svg>
                                </div>
                                {course.certificateAvailable && (
                                    <span className="bg-green-50 text-green-700 border border-green-100 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Certificate
                                    </span>
                                )}
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-2 font-literata">{course.courseName}</h3>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed flex-1">{course.description}</p>

                            <div className="pt-4 border-t border-gray-100 mt-auto">
                                <div className="flex items-center text-sm text-gray-500 mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="font-medium">Duration:</span>
                                    <span className="ml-1">{course.duration}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(course)}
                                        className="flex-1 bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-600 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(course._id)}
                                        className="flex-1 bg-white border border-gray-200 hover:border-red-400 hover:text-red-600 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div
                            className="fixed inset-0 bg-black/20 backdrop-blur-[1px] transition-opacity"
                            onClick={handleModalClose}
                        ></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100 scale-95 opacity-0 animate-[modalIn_0.2s_ease-out_forwards]">

                            {/* Modal Header */}
                            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                                <h2 className="text-xl font-bold font-literata text-gray-900">
                                    {editingCourse ? 'Edit Course' : 'Create New Course'}
                                </h2>
                                <button onClick={handleModalClose} className="text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 p-2 rounded-full transition-colors border border-transparent hover:border-gray-200">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="px-6 py-6 bg-white">
                                <form id="courseForm" onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Course Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.courseName}
                                            onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4B9B6E] focus:border-transparent transition-all outline-none"
                                            placeholder="e.g. Advanced Medical Training"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                        <textarea
                                            required
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4B9B6E] focus:border-transparent transition-all outline-none resize-none"
                                            rows="4"
                                            placeholder="Describe the course content and objectives..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Duration</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.duration}
                                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4B9B6E] focus:border-transparent transition-all outline-none"
                                            placeholder="e.g. 6 months, 1 year"
                                        />
                                    </div>
                                    <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:border-[#4B9B6E]/30 transition-colors" onClick={() => setFormData({ ...formData, certificateAvailable: !formData.certificateAvailable })}>
                                        <input
                                            type="checkbox"
                                            id="certificate"
                                            checked={formData.certificateAvailable}
                                            onChange={(e) => setFormData({ ...formData, certificateAvailable: e.target.checked })}
                                            className="w-5 h-5 text-[#4B9B6E] border-gray-300 rounded focus:ring-[#4B9B6E] cursor-pointer"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <label htmlFor="certificate" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer select-none">
                                            Certificate Available upon Completion
                                        </label>
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
                                    form="courseForm"
                                    className="px-5 py-2.5 bg-[#4B9B6E] hover:bg-[#3d825b] text-white rounded-xl font-medium transition-all shadow-md shadow-green-200 transform hover:-translate-y-0.5"
                                >
                                    {editingCourse ? 'Save Changes' : 'Create Course'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCourses;

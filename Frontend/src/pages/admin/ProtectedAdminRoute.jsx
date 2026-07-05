import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ProtectedAdminRoute = ({ children }) => {
    const navigate = useNavigate();

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const userCategory = localStorage.getItem('userCategory');

        // Check if user is logged in and is admin
        if (!userId || userCategory !== 'admin') {
            navigate('/admin/login');
        }
    }, [navigate]);

    const userId = localStorage.getItem('userId');
    const userCategory = localStorage.getItem('userCategory');

    // If not authenticated, don't render anything (redirect will happen)
    if (!userId || userCategory !== 'admin') {
        return null;
    }

    return children;
};

export default ProtectedAdminRoute;

import React from "react"
import ScrollToTop from "./components/ScrollToTop";
import { Routes, Route, useLocation } from "react-router-dom"
import Home from "./pages/Home"
import ChooseCity from "./pages/ChooseCity"
import FindHospitals from "./pages/FindHospitals"
import FindHotels from "./pages/FindHotels"
import FindRooms from "./pages/FindRooms"
import BookAmbulance from "./pages/BookAmbulance"
import EmergencyServices from "./pages/EmergencyServices"
import HomeCareServices from "./pages/HomeCareServices"
import PatientSwipeForm from "./components/PatientFormOnline"
import DoctorConsultation from "./pages/DoctorConsultation"
import LabTest from "./pages/LabTest"

import OfflineConsultation from "./forms/OfflineConsultation"
import OnlineConsultation from "./forms/OnlineConsultation"
import HomeLabTestForm from "./forms/HomeLabTestForm"
import CenterLabTestForm from "./forms/CenterLabTestForm"
import AddPatient from "./pages/AddPatient"

import Login from "./pages/Login"
import Register from "./pages/Register"

import Footer from './components/Footer'
import ForgotPassword from './pages/ForgotPassword'
import Privacy from './pages/Privacy'
// --- IMPORT YOUR NEW FORM HERE ---
import AdmissionForm from "./components/AdmissionForm" // Adjust the path if it's in /components or /forms

import AdminLogin from "./pages/admin/AdminLogin"
import ProtectedAdminRoute from "./pages/admin/ProtectedAdminRoute"
import AdminLayout from "./pages/admin/AdminLayout"
import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminUsers from "./pages/admin/AdminUsers"
import AdminHospitals from "./pages/admin/AdminHospitals"
import AdminServices from "./pages/admin/AdminServices"
import AdminSettings from "./pages/admin/AdminSettings"
import AdminStudents from "./pages/admin/AdminStudents"
import AdminCoachingCenters from "./pages/admin/AdminCoachingCenters"
import AdminCourses from "./pages/admin/AdminCourses"
import AdminCourseAssignments from "./pages/admin/AdminCourseAssignments"
import AdminPayments from "./pages/admin/AdminPayments"
import StudentPanel from "./pages/StudentPanel"

// OPD imports
import OpdLogin from "./pages/opd/OpdLogin";
import OpdLayout from "./pages/opd/OpdLayout";
import OpdDashboard from "./pages/opd/OpdDashboard";
import OpdPatients from "./pages/opd/OpdPatients";
import OpdAppointments from "./pages/opd/OpdAppointments";
import OpdConsultations from "./pages/opd/OpdConsultations";
import OpdBilling from "./pages/opd/OpdBilling";
import OpdDiagnosticTests from "./pages/opd/OpdDiagnosticTests";
import OpdMedicines from "./pages/opd/OpdMedicines";
import OpdRoles from "./pages/opd/OpdRoles";
import OpdReminders from "./pages/opd/OpdReminders";

function App() {
    const location = useLocation();
    const isExcludedRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/opd');

    // localStorage.removeItem("preloaderShown")
    return (
        <>
            <ScrollToTop />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/choose-city/:service" element={<ChooseCity />} />
                <Route path="/find-hospitals/:city" element={<FindHospitals />} />
                <Route path="/find-hotels/:city" element={<FindHotels />} />
                <Route path="/find-rooms/:city" element={<FindRooms />} />
                <Route path="/find-ambulance/:city" element={<BookAmbulance />} />
                <Route path="/find-services/:city" element={<EmergencyServices />} />
                <Route path="/find-home-care/:city" element={<HomeCareServices />} />


                <Route path="/consultation" element={<DoctorConsultation />} />
                <Route path="/test" element={<LabTest />} />


                <Route path="/consultation/offline" element={<OfflineConsultation />} />
                <Route path="/consultation/online" element={<OnlineConsultation />} />
                <Route path="/test/home" element={<HomeLabTestForm />} />
                <Route path="/test/center" element={<CenterLabTestForm />} />
                <Route path="/patient/add" element={<AddPatient />} />

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/privacy" element={<Privacy />} />

                <Route path="/admission-form" element={<AdmissionForm />} />
                <Route path="/student-panel" element={<StudentPanel />} />

                {/* Admin Login */}
                <Route path="/admin/login" element={<AdminLogin />} />

                {/* Admin Routes - Protected */}
                <Route path="/admin" element={<ProtectedAdminRoute><AdminLayout /></ProtectedAdminRoute>}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="students" element={<AdminStudents />} />
                    <Route path="coaching-centers" element={<AdminCoachingCenters />} />
                    <Route path="courses" element={<AdminCourses />} />
                    <Route path="course-assignments" element={<AdminCourseAssignments />} />
                    <Route path="payments" element={<AdminPayments />} />
                    <Route path="hospitals" element={<AdminHospitals />} />
                    <Route path="services" element={<AdminServices />} />
                    <Route path="settings" element={<AdminSettings />} />
                </Route>

                {/* OPD Routes */}
                <Route path="/opd/login" element={<OpdLogin />} />
                <Route path="/opd" element={<OpdLayout />}>
                    <Route index element={<OpdDashboard />} />
                    <Route path="patients" element={<OpdPatients />} />
                    <Route path="appointments" element={<OpdAppointments />} />
                    <Route path="consultations" element={<OpdConsultations />} />
                    <Route path="billing" element={<OpdBilling />} />
                    <Route path="tests" element={<OpdDiagnosticTests />} />
                    <Route path="medicines" element={<OpdMedicines />} />
                    <Route path="roles" element={<OpdRoles />} />
                    <Route path="reminders" element={<OpdReminders />} />
                </Route>
            </Routes>
            {!isExcludedRoute && <Footer />}
        </>
    )
}

export default App
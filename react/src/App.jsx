import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute     from './components/GuestRoute';

import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';  // ← add this
import HomePage         from './pages/HomePage';
import FindAPet         from './pages/FindAPet';
import UserDashboard    from './pages/UserDashboard';
import LandingPage      from './pages/LandingPage';
import HowItWorks       from './pages/HowItWorks';
import Rehome           from './pages/Rehome';
import MissingPets      from './pages/MissingPets';
import About            from './pages/About';
import AdminDashboard   from './pages/AdminDashboard';
import ProfilePage      from './pages/ProfilePage';
import FollowUpSurveys  from './pages/FollowUpSurveys';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Landing is public — no GuestRoute or ProtectedRoute */}
                <Route path="/"             element={<Navigate to="/landing" replace />} />
                <Route path="/landing"      element={<LandingPage />} />

                <Route path="/login"        element={<GuestRoute><LoginPage /></GuestRoute>} />
                <Route path="/register"     element={<GuestRoute><RegisterPage /></GuestRoute>} />
                <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
                <Route path="/home"         element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                <Route path="/pets"         element={<ProtectedRoute><FindAPet /></ProtectedRoute>} />
                <Route path="/profile/edit" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/profile"      element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
                <Route path="/how-it-works" element={<ProtectedRoute><HowItWorks /></ProtectedRoute>} />
                <Route path="/rehome"       element={<ProtectedRoute><Rehome /></ProtectedRoute>} />
                <Route path="/missing-pets" element={<ProtectedRoute><MissingPets /></ProtectedRoute>} />
                <Route path="/about"        element={<ProtectedRoute><About /></ProtectedRoute>} />
                <Route path="/admin"        element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
                <Route path="/follow-up-surveys" element={<ProtectedRoute><FollowUpSurveys /></ProtectedRoute>} />
                <Route path="*"             element={<Navigate to="/landing" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
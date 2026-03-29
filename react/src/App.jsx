import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute     from './components/GuestRoute';

import LoginPage      from './pages/LoginPage';
import RegisterPage   from './pages/RegisterPage';
import HomePage       from './pages/HomePage';
import PetListings    from './pages/FindaPet';
import UserDashboard  from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* ── Default ────────────────────────────────────────────── */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* ── Guest-only ─────────────────────────────────────────── */}
                <Route path="/login" element={
                    <GuestRoute><LoginPage /></GuestRoute>
                } />
                <Route path="/register" element={
                    <GuestRoute><RegisterPage /></GuestRoute>
                } />

                {/* ── Protected: any logged-in user ──────────────────────── */}
                <Route path="/home" element={
                    <ProtectedRoute><HomePage /></ProtectedRoute>
                } />
                <Route path="/pets" element={
                    <ProtectedRoute><PetListings /></ProtectedRoute>
                } />
                <Route path="/profile" element={
                    <ProtectedRoute><UserDashboard /></ProtectedRoute>
                } />

                {/* ── Protected: admin only ──────────────────────────────── */}
                <Route path="/admin" element={
                    <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>
                } />

                {/* ── Fallback ───────────────────────────────────────────── */}
                <Route path="*" element={<Navigate to="/login" replace />} />

            </Routes>
        </BrowserRouter>
    );
}

export default App;
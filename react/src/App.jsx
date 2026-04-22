import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useCallback, useEffect } from 'react';
import ScrollToTop from './components/ScrollToTop';
import { useAuth } from './hooks/useAuth';
import { useMessaging } from './hooks/useMessaging';
import Navbar from './pages/Navbar';
import MessagingModal from './pages/MessagingModal';

import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute     from './components/GuestRoute';

import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
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
import FollowUpFeedback  from './pages/FollowUpFeedback';
import MessagingPage    from './pages/MessagingPage';

function ChatIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <rect x="7" y="3" width="13" height="9" rx="2.5" opacity="0.45"/>
      <path d="M2 8.5C2 7.4 2.9 6.5 4 6.5H14C15.1 6.5 16 7.4 16 8.5V15C16 16.1 15.1 17 14 17H8.5L5.5 19.5C5.2 19.8 4.7 19.6 4.7 19.2V17H4C2.9 17 2 16.1 2 15V8.5Z"/>
      <rect x="5" y="10.5" width="8" height="1.5" rx="0.75" fill="white" opacity="0.9"/>
      <rect x="5" y="13" width="5" height="1.5" rx="0.75" fill="white" opacity="0.9"/>
    </svg>
  );
}

function AppInner() {
  const { user } = useAuth();
  const location = useLocation();
  const [chatOpen, setChatOpen] = useState(false);
  const [unread,   setUnread]   = useState(0);

  const { unreadCount } = useMessaging(user);

  useEffect(() => { setUnread(unreadCount); }, [unreadCount]);

  const handleUnreadChange = useCallback((count) => setUnread(count), []);

  const toggleChat = () => setChatOpen(o => !o);

  const hideNavbar = ['/', '/landing', '/login', '/register', '/forgot-password', '/admin'].includes(location.pathname);

  return (
    <>
      <ScrollToTop />

      {!hideNavbar && <Navbar />}

      {user && user.role !== "admin" && (
        <MessagingModal
          user={user}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          onUnreadChange={handleUnreadChange}
        />
      )}

      {user && user.role !== "admin" && (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 997 }}>
          <button
            onClick={toggleChat}
            title="Messages"
            style={{
              position: "relative",
              width: 56,
              height: 56,
              borderRadius: "50%",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: chatOpen
                ? "#1c4f09"
                : "linear-gradient(135deg,#1c4f09,#3a8a18)",
              color: "#fff",
              boxShadow: chatOpen
                ? "0 4px 20px rgba(28,79,9,0.5)"
                : "0 6px 24px rgba(28,79,9,0.38), 0 2px 8px rgba(0,0,0,0.15)",
              transition: "all 0.2s ease",
              transform: chatOpen ? "scale(0.93)" : "scale(1)",
            }}
            onMouseEnter={e => {
              if (!chatOpen) e.currentTarget.style.transform = "scale(1.08)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = chatOpen ? "scale(0.93)" : "scale(1)";
            }}
          >
            <ChatIcon size={24} />
            {unread > 0 && (
              <span style={{
                position: "absolute",
                top: 2,
                right: 2,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                background: "#B45A22",
                color: "#fff",
                fontSize: 10,
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
                border: "2px solid #fff",
                fontFamily: "'Nunito', sans-serif",
              }}>
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
        </div>
      )}

      <Routes>
        <Route path="/"             element={<Navigate to="/landing" replace />} />
        <Route path="/landing"      element={<LandingPage />} />
        <Route path="/messages"     element={<ProtectedRoute><MessagingPage /></ProtectedRoute>} />
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
        <Route path="/follow-up-surveys" element={<ProtectedRoute><FollowUpFeedback /></ProtectedRoute>} />
        <Route path="*"             element={<Navigate to="/landing" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}

export default App;
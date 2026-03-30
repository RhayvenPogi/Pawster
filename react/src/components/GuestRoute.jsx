import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function PawsterSpinner() {
    return (
        <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#EDDABB', fontFamily:"'Nunito',sans-serif" }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'1rem' }}>
                <div style={{ width:48, height:48, border:'5px solid rgba(28,79,9,0.15)', borderTop:'5px solid #1c4f09', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                <p style={{ fontWeight:800, color:'#1c4f09', fontSize:'0.95rem' }}>Loading...</p>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

const GuestRoute = ({ children }) => {
    const { isAuthenticated, isAdmin, isLoading } = useAuth();

    if (isLoading) return <PawsterSpinner />;
    if (isAuthenticated) return <Navigate to={isAdmin ? '/admin' : '/home'} replace />;

    return children;
};

export default GuestRoute;
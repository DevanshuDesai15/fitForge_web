import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PublicRoute({ children }) {
    const { currentUser } = useAuth();

    // If user is already authenticated, redirect to main app
    if (currentUser) {
        return <Navigate to="/" />;
    }

    return children;
}
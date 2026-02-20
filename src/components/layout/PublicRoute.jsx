import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

export default function PublicRoute({ children }) {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress sx={{ color: 'primary.main' }} />
            </Box>
        );
    }

    // If user is already authenticated, redirect to main app
    if (currentUser) {
        return <Navigate to="/" />;
    }

    return children;
}
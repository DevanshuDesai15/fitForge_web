import { useAuth } from '../contexts/AuthContext';
import LandingPage from './LandingPage';
import Home from './Home';
import Navigation from './Navigation';

export default function DefaultRoute() {
    const { currentUser } = useAuth();

    if (currentUser) {
        // User is authenticated - show the main app
        return (
            <>
                <Home />
                <Navigation />
            </>
        );
    } else {
        // User is not authenticated - show landing page
        return <LandingPage />;
    }
}
import { useAuth } from '../../contexts/AuthContext';
import LandingPage from '../../pages/Landing/LandingPage';
import Home from '../../pages/Home/Home';
import Layout from './Layout';

export default function DefaultRoute() {
    const { currentUser } = useAuth();

    if (currentUser) {
        // User is authenticated - show the main app with responsive layout
        return (
            <Layout>
                <Home />
            </Layout>
        );
    } else {
        // User is not authenticated - show landing page
        return <LandingPage />;
    }
}
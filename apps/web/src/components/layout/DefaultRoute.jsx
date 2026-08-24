import { lazy, Suspense } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Layout from './Layout';
import LoadingFallback from '../common/LoadingFallback';

const LandingPage = lazy(() => import('../../pages/Landing/LandingPage'));
const Home = lazy(() => import('../../pages/Home/Home'));

export default function DefaultRoute() {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return <LoadingFallback />;
    }

    if (currentUser) {
        // User is authenticated - show the main app with responsive layout
        return (
            <Suspense fallback={<LoadingFallback />}>
                <Layout>
                    <Home />
                </Layout>
            </Suspense>
        );
    } else {
        // User is not authenticated - show landing page
        return (
            <Suspense fallback={<LoadingFallback />}>
                <LandingPage />
            </Suspense>
        );
    }
}
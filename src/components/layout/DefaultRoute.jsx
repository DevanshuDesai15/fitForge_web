import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useMediaQuery, useTheme } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import Layout from './Layout';
import LoadingFallback from '../common/LoadingFallback';
import { useProfile } from '../../hooks/useProfile';
import { shouldShowSetup } from '../../pages/Auth/mobile/onboarding';
import { isInstalledApp } from '../../utils/installedApp';

const LandingPage = lazy(() => import('../../pages/Landing/LandingPage'));
const Home = lazy(() => import('../../pages/Home/Home'));
const MobileAuth = lazy(() => import('../../pages/Auth/mobile/MobileAuth'));

export default function DefaultRoute() {
    const { currentUser, loading } = useAuth();
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
    const { profile, isLoading: profileLoading } = useProfile();

    if (loading || (currentUser && !isDesktop && profileLoading)) {
        return <LoadingFallback />;
    }

    // A brand-new phone account sets itself up once (units, level, goal, first program) before Home.
    if (currentUser && !isDesktop && shouldShowSetup({ profile, user: currentUser })) {
        return <Navigate to="/setup" replace />;
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
    } else if (!isDesktop && isInstalledApp()) {
        // The installed app opens on the welcome carousel; browsers (phone or desktop) get the landing page.
        return (
            <Suspense fallback={<LoadingFallback />}>
                <MobileAuth start="welcome" />
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
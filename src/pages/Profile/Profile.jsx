import { useState, useEffect, useCallback } from 'react';
import {
    Alert,
    Box,
    Typography,
    Button,
    useMediaQuery,
    useTheme,
    Container,
    styled
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useUnits } from '../../contexts/UnitsContext';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useSupabase } from '../../hooks/useSupabase';
import { Edit3 } from "lucide-react";
import TabNavigation from '../../components/profile/TabNavigation';
import ProfileTab from '../../components/profile/ProfileTab';
import PreferencesTab from '../../components/profile/PreferencesTab';
import AccountTab from '../../components/profile/AccountTab';
import EditProfileModal from '../../components/profile/EditProfileModal';
import {
    buildProfileUpdatePayload,
    getProfileNotifications,
    getProfilePreferences,
    mapProfileToUserData,
} from './profileData';

const PageHeader = styled(Box)(() => ({
    marginBottom: '32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '16px',
}));

const HeaderInfo = styled(Box)({
    flex: 1,
});

const Title = styled(Typography)(({ theme }) => ({
    fontSize: '32px',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '8px',
}));

const Subtitle = styled(Typography)(() => ({
    fontSize: '15px',
    color: 'rgba(255, 255, 255, 0.7)',
}));

const EditButton = styled(Button)(({ theme }) => ({
    background: 'transparent',
    color: theme.palette.primary.main,
    border: `1px solid ${theme.palette.primary.main}`,
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: '8px',
    padding: '10px 20px',
    '&:hover': {
        backgroundColor: 'rgba(221, 237, 0, 0.1)',
        transform: 'translateY(-1px)',
    },
}));

export default function Profile() {
    const { currentUser, logout } = useAuth();
    const { updateUnitPreference } = useUnits();
    const navigate = useNavigate();

    // State Management
    // User Data State (Supabase Hooks)
    const { profile, isLoading: profileLoading, error: profileError, updateProfile, isUpdating } = useProfile();
    const { data: dashboardData, isLoading: statsLoading } = useDashboardStats();

    const [activeTab, setActiveTab] = useState('profile');
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Derived states
    const userData = mapProfileToUserData({ profile, currentUser });
    const preferences = getProfilePreferences(profile);
    const notifications = getProfileNotifications(profile);

    const weeklyStats = dashboardData?.weeklyStats;
    const stats = {
        totalWorkouts: weeklyStats?.workoutsDone || 0,
        currentStreak: weeklyStats?.streakDays || 0,
        caloriesBurned: (weeklyStats?.workoutsDone || 0) * 350,
        personalRecords: 0,
    };

    const [storageUsed, setStorageUsed] = useState(2.4 * 1024 * 1024);
    const supabase = useSupabase();

    useEffect(() => {
        if (profileError) {
            setError('Failed to load profile data');
        }
    }, [profileError]);

    // Handlers
    const handleEditProfile = () => {
        setEditModalOpen(true);
    };

    const handleSaveProfile = async (formData) => {
        setError('');
        setSuccess('');

        try {
            const profileUpdate = buildProfileUpdatePayload({
                formData,
                currentUser,
                profile,
            });

            await updateProfile(profileUpdate);

            setSuccess('Profile updated successfully!');
            setEditModalOpen(false);
        } catch (error) {
            setError('Failed to update profile: ' + error.message);
        }
    };

    const handlePreferenceChange = async (key, value) => {
        // Special handling for units - use UnitsContext
        if (key === 'units') {
            try {
                await updateUnitPreference(value);
                // Also update in Supabase profile
                const newPreferences = { ...preferences, units: value };
                await updateProfile({ preferences: newPreferences });
                setSuccess('Units preference updated successfully!');
                setTimeout(() => setSuccess(''), 3000);
            } catch (error) {
                console.error('Error updating units:', error);
                setError('Failed to update units preference');
            }
            return;
        }

        // Handle other preferences normally
        const newPreferences = { ...preferences, [key]: value };

        try {
            await updateProfile({ preferences: newPreferences });
        } catch (error) {
            console.error('Error saving preference:', error);
        }
    };

    const handleNotificationChange = async (key, value) => {
        const newNotifications = { ...notifications, [key]: value };
        const newPreferences = {
            ...preferences,
            notifications: newNotifications,
        };

        try {
            await updateProfile({ preferences: newPreferences });
        } catch (error) {
            console.error('Error saving notification preference:', error);
        }
    };

    const handleExportData = async () => {
        try {
            // Fetch workouts from Supabase
            const { data: workouts, error: workoutError } = await supabase
                .from('workouts')
                .select('*')
                .eq('user_id', profile.id);

            if (workoutError) throw workoutError;

            const exportData = {
                profile: userData,
                preferences,
                notifications,
                workouts: workouts,
                exportedAt: new Date().toISOString(),
            };

            // Create and download JSON file
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `fitforge-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setSuccess('Data exported successfully!');
        } catch (error) {
            setError('Failed to export data: ' + error.message);
        }
    };

    const handleClearCache = () => {
        // Clear localStorage
        const keysToKeep = ['weightUnit']; // Keep essential data
        const allKeys = Object.keys(localStorage);
        allKeys.forEach(key => {
            if (!keysToKeep.includes(key)) {
                localStorage.removeItem(key);
            }
        });

        setSuccess('Cache cleared successfully!');
    };

    const handleSignOut = async () => {
        try {
            await logout();
            navigate('/signin');
        } catch (error) {
            setError('Failed to sign out: ' + error.message);
        }
    };

    const handlePrivacyClick = () => {
        // TODO: Implement privacy settings modal
        console.log('Privacy & Security clicked');
    };

    const handleConnectedAppsClick = () => {
        // TODO: Implement connected apps modal
        console.log('Connected Apps clicked');
    };

    const handleDataExportClick = () => {
        handleExportData();
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            background: '#121212',
            py: { xs: 2, sm: 4 },
        }}>
            <Container maxWidth="lg" sx={{
                px: { xs: 2, sm: 3 },
                paddingBottom: { xs: '120px', sm: '2rem' },
            }}>
                {/* Page Header */}
                <PageHeader>
                    <HeaderInfo>
                        <Title>Profile & Settings</Title>
                        <Subtitle>Manage your account, preferences, and app settings</Subtitle>
                    </HeaderInfo>
                    <EditButton
                        startIcon={<Edit3 size={18} />}
                        onClick={handleEditProfile}
                    >
                        Edit Profile
                    </EditButton>
                </PageHeader>

                {/* Alerts */}
                {error && (
                    <Alert
                        severity="error"
                        onClose={() => setError('')}
                        sx={{
                            mb: 3,
                            backgroundColor: 'rgba(211, 47, 47, 0.1)',
                            color: '#ff4444',
                            border: '1px solid rgba(211, 47, 47, 0.3)',
                            borderRadius: '12px',
                        }}
                    >
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert
                        severity="success"
                        onClose={() => setSuccess('')}
                        sx={{
                            mb: 3,
                            backgroundColor: 'rgba(221, 237, 0, 0.1)',
                            color: '#dded00',
                            border: '1px solid rgba(221, 237, 0, 0.3)',
                            borderRadius: '12px',
                        }}
                    >
                        {success}
                    </Alert>
                )}

                {/* Tab Navigation */}
                <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

                {/* Tab Content */}
                {activeTab === 'profile' && (
                    <ProfileTab
                        userData={userData}
                        stats={stats}
                        statsLoading={statsLoading}
                        preferences={preferences}
                    />
                )}

                {activeTab === 'preferences' && (
                    <PreferencesTab
                        preferences={preferences}
                        notifications={notifications}
                        storageUsed={storageUsed}
                        onPreferenceChange={handlePreferenceChange}
                        onNotificationChange={handleNotificationChange}
                        onExportData={handleExportData}
                        onClearCache={handleClearCache}
                    />
                )}

                {activeTab === 'account' && (
                    <AccountTab
                        onPrivacyClick={handlePrivacyClick}
                        onConnectedAppsClick={handleConnectedAppsClick}
                        onDataExportClick={handleDataExportClick}
                        onSignOut={handleSignOut}
                    />
                )}

                {/* Edit Profile Modal */}
                <EditProfileModal
                    open={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    userData={userData}
                    onSave={handleSaveProfile}
                    loading={isUpdating}
                    preferences={preferences}
                />
            </Container>
        </Box>
    );
}

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
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { updateEmail } from 'firebase/auth';
import { db } from '../../firebase/config';
import { Edit3 } from "lucide-react";
import TabNavigation from '../../components/profile/TabNavigation';
import ProfileTab from '../../components/profile/ProfileTab';
import PreferencesTab from '../../components/profile/PreferencesTab';
import AccountTab from '../../components/profile/AccountTab';
import EditProfileModal from '../../components/profile/EditProfileModal';

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
    const navigate = useNavigate();

    // State Management
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editModalOpen, setEditModalOpen] = useState(false);

    // User Data State
    const [userData, setUserData] = useState({
        username: '',
        fullName: '',
        email: currentUser?.email || '',
        age: '',
        weight: '',
        weightUnit: 'lbs',
        height: '',
        heightUnit: 'ft',
        gender: 'male',
        bio: '',
        fitnessGoal: '',
        preferredWorkoutTime: '',
        experienceLevel: '',
        workoutFrequency: '',
        targetWeight: '',
        createdAt: null,
    });

    // Preferences State
    const [preferences, setPreferences] = useState({
        units: 'imperial',
        theme: 'dark',
        language: 'english',
        autoSync: true,
    });

    // Notifications State
    const [notifications, setNotifications] = useState({
        workoutReminders: true,
        progressUpdates: true,
        achievements: true,
        aiRecommendations: true,
    });

    // Stats State
    const [stats, setStats] = useState({
        totalWorkouts: 0,
        currentStreak: 0,
        caloriesBurned: 0,
        personalRecords: 0,
    });

    const [storageUsed, setStorageUsed] = useState(2.4 * 1024 * 1024); // Default 2.4MB

    // Load User Data
    const loadUserData = useCallback(async () => {
        if (!currentUser) return;

        try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setUserData(prev => ({
                    ...prev,
                    username: data.username || '',
                    fullName: data.fullName || '',
                    age: data.age || '',
                    weight: data.weight || '',
                    weightUnit: data.weightUnit || 'lbs',
                    height: data.height || '',
                    heightUnit: data.heightUnit || 'ft',
                    gender: data.gender || 'male',
                    bio: data.bio || '',
                    fitnessGoal: data.fitnessGoal || '',
                    preferredWorkoutTime: data.preferredWorkoutTime || '',
                    experienceLevel: data.experienceLevel || '',
                    workoutFrequency: data.workoutFrequency || '',
                    targetWeight: data.targetWeight || '',
                    createdAt: data.createdAt || null,
                }));

                // Load preferences
                if (data.preferences) {
                    setPreferences(prev => ({
                        ...prev,
                        ...data.preferences
                    }));
                }

                // Load notifications
                if (data.notifications) {
                    setNotifications(prev => ({
                        ...prev,
                        ...data.notifications
                    }));
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            setError('Failed to load profile data');
        }
    }, [currentUser]);

    // Calculate Stats
    const calculateStats = useCallback(async () => {
        if (!currentUser) return;

        setStatsLoading(true);
        try {
            // Get all workouts for the user
            const workoutsRef = collection(db, 'workouts');
            const workoutsQuery = query(
                workoutsRef,
                where('userId', '==', currentUser.uid),
                orderBy('createdAt', 'desc')
            );
            const workoutsSnapshot = await getDocs(workoutsQuery);

            const totalWorkouts = workoutsSnapshot.size;

            // Calculate current streak
            let currentStreak = 0;
            const workoutDates = workoutsSnapshot.docs.map(doc => {
                const data = doc.data();
                return data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            }).sort((a, b) => b - a); // Sort descending

            if (workoutDates.length > 0) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                let checkDate = new Date(today);
                for (const workoutDate of workoutDates) {
                    const workout = new Date(workoutDate);
                    workout.setHours(0, 0, 0, 0);

                    const diffDays = Math.floor((checkDate - workout) / (1000 * 60 * 60 * 24));

                    if (diffDays === 0 || diffDays === 1) {
                        currentStreak++;
                        checkDate = new Date(workout);
                        checkDate.setDate(checkDate.getDate() - 1);
                    } else {
                        break;
                    }
                }
            }

            // Calculate calories burned (estimate if not tracked)
            const caloriesBurned = totalWorkouts * 350; // Rough estimate

            // Count personal records (would need actual PR tracking in workouts)
            const personalRecords = Math.floor(totalWorkouts * 0.1); // Rough estimate

            setStats({
                totalWorkouts,
                currentStreak,
                caloriesBurned,
                personalRecords,
            });
        } catch (error) {
            console.error('Error calculating stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        loadUserData();
        calculateStats();
    }, [loadUserData, calculateStats]);

    // Handlers
    const handleEditProfile = () => {
        setEditModalOpen(true);
    };

    const handleSaveProfile = async (formData) => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Map modal field names to database field names
            const profileData = {
                username: formData.username || userData.username,
                fullName: formData.fullName || `${formData.firstName} ${formData.lastName}`.trim(),
                age: formData.age || userData.age,
                weight: formData.weight || userData.weight,
                height: formData.height || userData.height,
                heightUnit: formData.heightUnit || userData.heightUnit,
                gender: userData.gender, // Keep existing gender
                weightUnit: userData.weightUnit, // Keep existing weightUnit
                bio: formData.bio || userData.bio,
                // Map primaryGoal to fitnessGoal
                fitnessGoal: formData.primaryGoal || formData.fitnessGoal || userData.fitnessGoal,
                preferredWorkoutTime: formData.preferredWorkoutTime || userData.preferredWorkoutTime,
                experienceLevel: formData.experienceLevel || userData.experienceLevel,
                // Map workoutsPerWeek to workoutFrequency
                workoutFrequency: formData.workoutsPerWeek || formData.workoutFrequency || userData.workoutFrequency,
                targetWeight: formData.targetWeight || userData.targetWeight,
                // Update with notifications from modal if provided
                preferences: preferences,
                notifications: formData.notifications || notifications,
                updatedAt: new Date().toISOString(),
            };

            // Only include createdAt if it doesn't exist yet
            if (!userData.createdAt) {
                profileData.createdAt = new Date().toISOString();
            }

            // Update user profile data
            await setDoc(doc(db, 'users', currentUser.uid), profileData, { merge: true });

            // Update email if changed
            if (formData.email && formData.email !== currentUser.email) {
                await updateEmail(currentUser, formData.email);
            }

            setSuccess('Profile updated successfully!');
            setEditModalOpen(false);

            // Update local notifications state if changed
            if (formData.notifications) {
                setNotifications(formData.notifications);
            }

            // Reload user data
            await loadUserData();
        } catch (error) {
            setError('Failed to update profile: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePreferenceChange = async (key, value) => {
        const newPreferences = { ...preferences, [key]: value };
        setPreferences(newPreferences);

        // Save to Firestore
        try {
            await setDoc(doc(db, 'users', currentUser.uid), {
                preferences: newPreferences,
                updatedAt: new Date().toISOString(),
            }, { merge: true });
        } catch (error) {
            console.error('Error saving preference:', error);
        }
    };

    const handleNotificationChange = async (key, value) => {
        const newNotifications = { ...notifications, [key]: value };
        setNotifications(newNotifications);

        // Save to Firestore
        try {
            await setDoc(doc(db, 'users', currentUser.uid), {
                notifications: newNotifications,
                updatedAt: new Date().toISOString(),
            }, { merge: true });
        } catch (error) {
            console.error('Error saving notification preference:', error);
        }
    };

    const handleExportData = async () => {
        try {
            // Fetch all user data
            const workoutsSnapshot = await getDocs(
                query(collection(db, 'workouts'), where('userId', '==', currentUser.uid))
            );

            const exportData = {
                profile: userData,
                preferences,
                notifications,
                workouts: workoutsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
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
                    loading={loading}
                    preferences={preferences}
                />
            </Container>
        </Box>
    );
}

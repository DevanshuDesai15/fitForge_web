import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  styled,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Typography,
  Box,
  Avatar
} from '@mui/material';
import { X, Save, User, Activity, Target, Bell } from 'lucide-react';

const StyledDialog = styled(Dialog)(() => ({
  '& .MuiDialog-paper': {
    backgroundColor: '#1a1a1a',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    maxWidth: '600px',
    width: '100%',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '20px 24px 16px',
}));

const TitleSection = styled(Box)({
  flex: 1,
});

const ModalTabs = styled(Box)(() => ({
  display: 'flex',
  gap: '16px',
  marginTop: '16px',
}));

const ModalTab = styled(Box)(({ active }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  fontSize: '14px',
  fontWeight: active ? 600 : 500,
  color: active ? '#dded00' : 'rgba(255, 255, 255, 0.6)',
  backgroundColor: active ? 'rgba(221, 237, 0, 0.1)' : 'transparent',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',

  '&:hover': {
    color: '#dded00',
    backgroundColor: 'rgba(221, 237, 0, 0.05)',
  },

  '& svg': {
    width: '16px',
    height: '16px',
  },
}));

const StyledTextField = styled(TextField)(() => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    '&:hover fieldset': {
      borderColor: '#dded00',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#dded00',
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#dded00',
  },
}));

const StyledSelect = styled(Select)(() => ({
  backgroundColor: 'rgba(255, 255, 255, 0.02)',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: '#dded00',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#dded00',
  },
}));

const SaveButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #dded00 0%, #c4d600 100%)',
  color: '#000',
  fontWeight: 600,
  textTransform: 'none',
  padding: '10px 24px',
  borderRadius: '8px',
  '&:hover': {
    background: 'linear-gradient(135deg, #f0f040 0%, #dded00 100%)',
    transform: 'translateY(-1px)',
  },
  '&:disabled': {
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.3)',
  },
}));

const CancelButton = styled(Button)(() => ({
  color: 'rgba(255, 255, 255, 0.7)',
  textTransform: 'none',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
}));

const ProfilePhotoSection = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  marginBottom: '24px',
});

const PhotoAvatar = styled(Avatar)({
  width: '80px',
  height: '80px',
  backgroundColor: '#dded00',
  color: '#000',
  fontSize: '28px',
  fontWeight: 700,
});

const SectionTitle = styled(Typography)({
  fontSize: '18px',
  fontWeight: 600,
  color: '#fff',
  marginBottom: '20px',
});

const Label = styled(Typography)({
  fontSize: '13px',
  color: 'rgba(255, 255, 255, 0.7)',
  marginBottom: '8px',
});

const NotificationItem = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  padding: '16px 0',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  '&:last-child': {
    borderBottom: 'none',
  },
});

const NotificationInfo = styled(Box)({
  flex: 1,
});

const NotificationTitle = styled(Typography)({
  fontSize: '15px',
  fontWeight: 500,
  color: '#fff',
  marginBottom: '4px',
});

const NotificationDesc = styled(Typography)({
  fontSize: '13px',
  color: 'rgba(255, 255, 255, 0.6)',
});

const StyledSwitch = styled('input')({
  appearance: 'none',
  width: '48px',
  height: '28px',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  borderRadius: '14px',
  position: 'relative',
  cursor: 'pointer',
  transition: 'background-color 0.3s',
  outline: 'none',
  border: 'none',

  '&:checked': {
    backgroundColor: '#dded00',
  },

  '&::before': {
    content: '""',
    position: 'absolute',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    top: '2px',
    left: '2px',
    transition: 'transform 0.3s',
  },

  '&:checked::before': {
    transform: 'translateX(20px)',
  },
});

const EditProfileModal = ({ open, onClose, userData, onSave, loading, preferences }) => {
  const [activeTab, setActiveTab] = useState('personal');

  // Get unit preference
  const unitPreference = preferences?.units || 'imperial';
  const weightUnit = unitPreference === 'metric' ? 'kg' : 'lbs';
  const heightUnit = unitPreference === 'metric' ? 'cm' : 'ft';

  const [formData, setFormData] = useState({
    firstName: userData?.fullName?.split(' ')[0] || '',
    lastName: userData?.fullName?.split(' ').slice(1).join(' ') || '',
    username: userData?.username || '',
    email: userData?.email || '',
    bio: userData?.bio || '',
    height: userData?.height || '',
    heightUnit: userData?.heightUnit || 'ft',
    weight: userData?.weight || '',
    age: userData?.age || '',
    targetWeight: userData?.targetWeight || '',
    primaryGoal: userData?.fitnessGoal || 'Build Muscle & Strength',
    experienceLevel: userData?.experienceLevel || 'Intermediate',
    workoutsPerWeek: userData?.workoutFrequency || '5 times',
    preferredWorkoutTime: userData?.preferredWorkoutTime || 'Morning (6-10 AM)',
  });

  const [notifications, setNotifications] = useState({
    workoutReminders: userData?.notifications?.workoutReminders !== false,
    progressUpdates: userData?.notifications?.progressUpdates !== false,
    achievementCelebrations: userData?.notifications?.achievementCelebrations !== false,
    weeklyReports: userData?.notifications?.weeklyReports !== false,
    emailNotifications: userData?.notifications?.emailNotifications !== false,
  });

  // Update form data when modal opens or userData changes
  useEffect(() => {
    if (open && userData) {
      setFormData({
        firstName: userData?.fullName?.split(' ')[0] || '',
        lastName: userData?.fullName?.split(' ').slice(1).join(' ') || '',
        username: userData?.username || '',
        email: userData?.email || '',
        bio: userData?.bio || '',
        height: userData?.height || '',
        heightUnit: userData?.heightUnit || 'ft',
        weight: userData?.weight || '',
        age: userData?.age || '',
        targetWeight: userData?.targetWeight || '',
        primaryGoal: userData?.fitnessGoal || 'Build Muscle & Strength',
        experienceLevel: userData?.experienceLevel || 'Intermediate',
        workoutsPerWeek: userData?.workoutFrequency || '5 times',
        preferredWorkoutTime: userData?.preferredWorkoutTime || 'Morning (6-10 AM)',
      });

      setNotifications({
        workoutReminders: userData?.notifications?.workoutReminders !== false,
        progressUpdates: userData?.notifications?.progressUpdates !== false,
        achievementCelebrations: userData?.notifications?.achievementCelebrations !== false,
        weeklyReports: userData?.notifications?.weeklyReports !== false,
        emailNotifications: userData?.notifications?.emailNotifications !== false,
      });
    }
  }, [open, userData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationToggle = (field) => {
    setNotifications(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = () => {
    const saveData = {
      ...formData,
      fullName: `${formData.firstName} ${formData.lastName}`.trim(),
      notifications,
    };
    onSave(saveData);
  };

  const getInitials = () => {
    const first = formData.firstName?.[0] || '';
    const last = formData.lastName?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  const tabs = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'physical', label: 'Physical', icon: Activity },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <StyledDialogTitle>
        <TitleSection>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0 }}>
            Edit Profile
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mt: 0.5 }}>
            Update your personal information, fitness goals, and preferences.
          </Typography>
          <ModalTabs>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <ModalTab
                  key={tab.id}
                  active={activeTab === tab.id ? 1 : 0}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon />
                  {tab.label}
                </ModalTab>
              );
            })}
          </ModalTabs>
        </TitleSection>
        <IconButton onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          <X size={20} />
        </IconButton>
      </StyledDialogTitle>

      <DialogContent sx={{ p: 3, minHeight: '400px' }}>
        {/* Personal Tab */}
        {activeTab === 'personal' && (
          <Box>
            <SectionTitle>Personal Information</SectionTitle>

            <ProfilePhotoSection>
              <PhotoAvatar>
                {getInitials()}
              </PhotoAvatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#fff' }}>
                  Profile Avatar
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px' }}>
                  Your initials are displayed as your profile avatar
                </Typography>
              </Box>
            </ProfilePhotoSection>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Label>First Name</Label>
                <StyledTextField
                  fullWidth
                  size="small"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="John"
                />
              </Grid>
              <Grid item xs={6}>
                <Label>Last Name</Label>
                <StyledTextField
                  fullWidth
                  size="small"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="Doe"
                />
              </Grid>
              <Grid item xs={12}>
                <Label>Email</Label>
                <StyledTextField
                  fullWidth
                  size="small"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="john.doe@email.com"
                />
              </Grid>
              <Grid item xs={12}>
                <Label>Bio</Label>
                <StyledTextField
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="Fitness enthusiast passionate about strength training and healthy living."
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Physical Tab */}
        {activeTab === 'physical' && (
          <Box>
            <SectionTitle>Physical Statistics</SectionTitle>
            <Grid container spacing={3}>
              <Grid item xs={4}>
                <Label>Height ({heightUnit})</Label>
                <StyledTextField
                  fullWidth
                  size="small"
                  value={formData.height}
                  onChange={(e) => handleChange('height', e.target.value)}
                  placeholder={heightUnit === 'cm' ? '183' : "6'0&quot;"}
                />
              </Grid>
              <Grid item xs={4}>
                <Label>Current Weight ({weightUnit})</Label>
                <StyledTextField
                  fullWidth
                  size="small"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleChange('weight', e.target.value)}
                  placeholder={weightUnit === 'kg' ? '82' : '180'}
                />
              </Grid>
              <Grid item xs={4}>
                <Label>Age</Label>
                <StyledTextField
                  fullWidth
                  size="small"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleChange('age', e.target.value)}
                  placeholder="28"
                />
              </Grid>
              <Grid item xs={12}>
                <Label>Target Weight ({weightUnit})</Label>
                <StyledTextField
                  fullWidth
                  size="small"
                  type="number"
                  value={formData.targetWeight}
                  onChange={(e) => handleChange('targetWeight', e.target.value)}
                  placeholder={weightUnit === 'kg' ? '84' : '185'}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <Box>
            <SectionTitle>Fitness Goals & Preferences</SectionTitle>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Label>Primary Fitness Goal</Label>
                <FormControl fullWidth size="small">
                  <StyledSelect
                    value={formData.primaryGoal}
                    onChange={(e) => handleChange('primaryGoal', e.target.value)}
                  >
                    <MenuItem value="Build Muscle & Strength">Build Muscle & Strength</MenuItem>
                    <MenuItem value="Lose Weight">Lose Weight</MenuItem>
                    <MenuItem value="General Fitness">General Fitness</MenuItem>
                    <MenuItem value="Athletic Performance">Athletic Performance</MenuItem>
                  </StyledSelect>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <Label>Experience Level</Label>
                <FormControl fullWidth size="small">
                  <StyledSelect
                    value={formData.experienceLevel}
                    onChange={(e) => handleChange('experienceLevel', e.target.value)}
                  >
                    <MenuItem value="Beginner">Beginner</MenuItem>
                    <MenuItem value="Intermediate">Intermediate</MenuItem>
                    <MenuItem value="Advanced">Advanced</MenuItem>
                    <MenuItem value="Expert">Expert</MenuItem>
                  </StyledSelect>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <Label>Workouts per Week</Label>
                <FormControl fullWidth size="small">
                  <StyledSelect
                    value={formData.workoutsPerWeek}
                    onChange={(e) => handleChange('workoutsPerWeek', e.target.value)}
                  >
                    <MenuItem value="1-2 times">1-2 times</MenuItem>
                    <MenuItem value="3-4 times">3-4 times</MenuItem>
                    <MenuItem value="5 times">5 times</MenuItem>
                    <MenuItem value="6+ times">6+ times</MenuItem>
                  </StyledSelect>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Label>Preferred Workout Time</Label>
                <FormControl fullWidth size="small">
                  <StyledSelect
                    value={formData.preferredWorkoutTime}
                    onChange={(e) => handleChange('preferredWorkoutTime', e.target.value)}
                  >
                    <MenuItem value="Early Morning (5-7 AM)">Early Morning (5-7 AM)</MenuItem>
                    <MenuItem value="Morning (6-10 AM)">Morning (6-10 AM)</MenuItem>
                    <MenuItem value="Afternoon (12-3 PM)">Afternoon (12-3 PM)</MenuItem>
                    <MenuItem value="Evening (5-8 PM)">Evening (5-8 PM)</MenuItem>
                    <MenuItem value="Night (8-11 PM)">Night (8-11 PM)</MenuItem>
                  </StyledSelect>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <Box>
            <SectionTitle>Notification Preferences</SectionTitle>
            <Box>
              <NotificationItem>
                <NotificationInfo>
                  <NotificationTitle>Workout Reminders</NotificationTitle>
                  <NotificationDesc>Get notified when it's time for your next workout</NotificationDesc>
                </NotificationInfo>
                <StyledSwitch
                  type="checkbox"
                  checked={notifications.workoutReminders}
                  onChange={() => handleNotificationToggle('workoutReminders')}
                />
              </NotificationItem>

              <NotificationItem>
                <NotificationInfo>
                  <NotificationTitle>Progress Updates</NotificationTitle>
                  <NotificationDesc>Weekly summaries of your fitness progress</NotificationDesc>
                </NotificationInfo>
                <StyledSwitch
                  type="checkbox"
                  checked={notifications.progressUpdates}
                  onChange={() => handleNotificationToggle('progressUpdates')}
                />
              </NotificationItem>

              <NotificationItem>
                <NotificationInfo>
                  <NotificationTitle>Achievement Celebrations</NotificationTitle>
                  <NotificationDesc>Get notified when you reach milestones</NotificationDesc>
                </NotificationInfo>
                <StyledSwitch
                  type="checkbox"
                  checked={notifications.achievementCelebrations}
                  onChange={() => handleNotificationToggle('achievementCelebrations')}
                />
              </NotificationItem>

              <NotificationItem>
                <NotificationInfo>
                  <NotificationTitle>Weekly Reports</NotificationTitle>
                  <NotificationDesc>Detailed analytics of your weekly performance</NotificationDesc>
                </NotificationInfo>
                <StyledSwitch
                  type="checkbox"
                  checked={notifications.weeklyReports}
                  onChange={() => handleNotificationToggle('weeklyReports')}
                />
              </NotificationItem>

              <NotificationItem>
                <NotificationInfo>
                  <NotificationTitle>Email Notifications</NotificationTitle>
                  <NotificationDesc>Receive important updates via email</NotificationDesc>
                </NotificationInfo>
                <StyledSwitch
                  type="checkbox"
                  checked={notifications.emailNotifications}
                  onChange={() => handleNotificationToggle('emailNotifications')}
                />
              </NotificationItem>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <CancelButton onClick={onClose}>
          Cancel
        </CancelButton>
        <SaveButton
          onClick={handleSubmit}
          disabled={loading}
          startIcon={<Save size={18} />}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </SaveButton>
      </DialogActions>
    </StyledDialog>
  );
};

export default EditProfileModal;

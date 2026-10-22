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
  Select,
  MenuItem,
  IconButton,
  InputAdornment,
  Typography,
  Box,
  Avatar
} from '@mui/material';
import { X, User, Activity, Target, Bell } from 'lucide-react';
import FitForgeSwitch from '../common/FitForgeSwitch';
import { formatHeight } from '../../utils/unitConversions';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    backgroundColor: '#1a1a1a',
    backgroundImage: 'none',
    borderRadius: '16px',
    border: '1px solid rgba(221, 237, 0, 0.28)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    maxWidth: '600px',
    width: '100%',
    margin: '16px',
    overflowX: 'hidden',
    [theme.breakpoints.down('sm')]: {
      margin: '16px',
      borderRadius: '16px',
      maxHeight: 'calc(100vh - 32px)',
    },
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  padding: '24px 24px 0',
  gap: '12px',
  [theme.breakpoints.down('sm')]: {
    padding: '20px 16px 0',
    gap: '8px',
  },
}));

const TitleSection = styled(Box)(({ theme }) => ({
  flex: 1,
  minWidth: 0, // Allow flex item to shrink below content size
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    maxWidth: 'calc(100% - 48px)', // Account for close button and gap
  },
}));

const ModalTabs = styled(Box)({
  display: 'flex',
  gap: '4px',
  marginTop: '16px',
  overflowX: 'auto',
  overflowY: 'hidden',
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
});

const ModalTab = styled(Box)(({ active }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  minHeight: '44px',
  padding: '0 12px',
  fontSize: '13px',
  fontWeight: active ? 700 : 500,
  color: active ? '#dded00' : 'rgba(255, 255, 255, 0.6)',
  borderBottom: `2px solid ${active ? '#dded00' : 'transparent'}`,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  transition: 'color 0.2s ease, border-color 0.2s ease',
  '&:hover': { color: '#dded00' },
  '& svg': { width: '16px', height: '16px', flexShrink: 0 },
}));

const StyledTextField = styled(TextField, { shouldForwardProp: (prop) => prop !== 'numeric' })(({ numeric }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.08)' },
    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.16)' },
    '&.Mui-focused fieldset': { borderColor: '#dded00', borderWidth: '1px' },
    '& input': numeric
      ? { textAlign: 'center', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontWeight: 700, fontSize: '1.25rem', padding: '12px' }
      : { fontSize: '1rem', padding: '12px' },
    '& .MuiInputAdornment-root p': { color: 'rgba(255, 255, 255, 0.35)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.875rem' },
  },
}));

const StyledSelect = styled(Select)(() => ({
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  borderRadius: '8px',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.08)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.16)' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#dded00', borderWidth: '1px' },
  '& .MuiSelect-select': { padding: '12px' },
}));

const SaveButton = styled(Button)(() => ({
  backgroundColor: '#dded00',
  color: '#121212',
  fontWeight: 700,
  textTransform: 'none',
  padding: '8px 24px',
  borderRadius: '8px',
  boxShadow: 'none',
  '&:hover': { backgroundColor: '#e8f15d', boxShadow: 'none' },
  '&:disabled': { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.3)' },
}));

const CancelButton = styled(Button)(() => ({
  color: 'rgba(255, 255, 255, 0.7)',
  textTransform: 'none',
  fontWeight: 600,
  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
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
  fontSize: '0.75rem',
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
    height: userData?.height ? formatHeight(userData.height, userData.heightUnit, unitPreference) : '',
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
        height: userData?.height ? formatHeight(userData.height, userData.heightUnit, unitPreference) : '',
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
  }, [open, userData, unitPreference]);

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
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 0,
              fontSize: '1.25rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            Edit Profile
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              mt: 0.5,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: { xs: 'none', sm: 'block' },
            }}
          >
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
        <IconButton
          onClick={onClose}
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            flexShrink: 0,
            padding: { xs: '6px', sm: '8px' },
            '& svg': {
              width: { xs: '18px', sm: '20px' },
              height: { xs: '18px', sm: '20px' },
            },
          }}
        >
          <X />
        </IconButton>
      </StyledDialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 3, sm: 3 }, minHeight: { xs: '300px', sm: '400px' } }}>
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
              <Grid item xs={6} sm={4}>
                <Label>Height</Label>
                <StyledTextField
                  numeric
                  fullWidth
                  size="small"
                  InputProps={heightUnit === 'cm' ? { endAdornment: <InputAdornment position="end">cm</InputAdornment> } : undefined}
                  value={formData.height}
                  onChange={(e) => handleChange('height', e.target.value)}
                  placeholder={heightUnit === 'cm' ? '182' : "5'11\""}
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <Label>Weight</Label>
                <StyledTextField
                  numeric
                  fullWidth
                  InputProps={{ endAdornment: <InputAdornment position="end">{weightUnit}</InputAdornment> }}
                  size="small"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleChange('weight', e.target.value)}
                  placeholder={weightUnit === 'kg' ? '82' : '180'}
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <Label>Age</Label>
                <StyledTextField
                  numeric
                  fullWidth
                  size="small"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleChange('age', e.target.value)}
                  placeholder="28"
                />
              </Grid>
              <Grid item xs={12}>
                <Label>Target Weight</Label>
                <StyledTextField
                  numeric
                  fullWidth
                  InputProps={{ endAdornment: <InputAdornment position="end">{weightUnit}</InputAdornment> }}
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
                <FitForgeSwitch
                  checked={notifications.workoutReminders}
                  onChange={() => handleNotificationToggle('workoutReminders')}
                  inputProps={{ 'aria-label': 'Workout Reminders' }}
                />
              </NotificationItem>

              <NotificationItem>
                <NotificationInfo>
                  <NotificationTitle>Progress Updates</NotificationTitle>
                  <NotificationDesc>Weekly summaries of your fitness progress</NotificationDesc>
                </NotificationInfo>
                <FitForgeSwitch
                  checked={notifications.progressUpdates}
                  onChange={() => handleNotificationToggle('progressUpdates')}
                  inputProps={{ 'aria-label': 'Progress Updates' }}
                />
              </NotificationItem>

              <NotificationItem>
                <NotificationInfo>
                  <NotificationTitle>Achievement Celebrations</NotificationTitle>
                  <NotificationDesc>Get notified when you reach milestones</NotificationDesc>
                </NotificationInfo>
                <FitForgeSwitch
                  checked={notifications.achievementCelebrations}
                  onChange={() => handleNotificationToggle('achievementCelebrations')}
                  inputProps={{ 'aria-label': 'Achievement Celebrations' }}
                />
              </NotificationItem>

              <NotificationItem>
                <NotificationInfo>
                  <NotificationTitle>Weekly Reports</NotificationTitle>
                  <NotificationDesc>Detailed analytics of your weekly performance</NotificationDesc>
                </NotificationInfo>
                <FitForgeSwitch
                  checked={notifications.weeklyReports}
                  onChange={() => handleNotificationToggle('weeklyReports')}
                  inputProps={{ 'aria-label': 'Weekly Reports' }}
                />
              </NotificationItem>

              <NotificationItem>
                <NotificationInfo>
                  <NotificationTitle>Email Notifications</NotificationTitle>
                  <NotificationDesc>Receive important updates via email</NotificationDesc>
                </NotificationInfo>
                <FitForgeSwitch
                  checked={notifications.emailNotifications}
                  onChange={() => handleNotificationToggle('emailNotifications')}
                  inputProps={{ 'aria-label': 'Email Notifications' }}
                />
              </NotificationItem>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)', gap: 1.5 }}>
        <CancelButton onClick={onClose}>
          Cancel
        </CancelButton>
        <SaveButton
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save'}
        </SaveButton>
      </DialogActions>
    </StyledDialog>
  );
};

export default EditProfileModal;

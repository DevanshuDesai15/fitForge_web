import { Box, Card, CardContent, Typography, Grid, Avatar, styled, Chip } from '@mui/material';
import { Mail, Calendar } from 'lucide-react';
import QuickStatsCard from './QuickStatsCard';
import { formatWeight, formatHeight } from '../../utils/unitConversion';

const ProfileCard = styled(Card)(({ theme }) => ({
  backgroundColor: '#282828',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
}));

const AvatarCircle = styled(Avatar)(({ theme }) => ({
  width: '100px',
  height: '100px',
  backgroundColor: theme.palette.primary.main,
  color: '#000',
  fontSize: '36px',
  fontWeight: 700,
  marginBottom: '16px',
}));

const InfoRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: '24px',
  marginTop: '24px',
  paddingTop: '24px',
  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
}));

const InfoItem = styled(Box)(({ theme }) => ({
  flex: 1,
}));

const InfoLabel = styled(Typography)(({ theme }) => ({
  fontSize: '12px',
  color: theme.palette.text.secondary,
  marginBottom: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}));

const InfoValue = styled(Typography)(({ theme }) => ({
  fontSize: '18px',
  fontWeight: 600,
  color: theme.palette.text.primary,
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '14px',
  color: theme.palette.text.secondary,
  marginBottom: '8px',
  marginTop: '24px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}));

const GoalText = styled(Typography)(({ theme }) => ({
  fontSize: '16px',
  color: theme.palette.text.primary,
  lineHeight: 1.6,
}));

const BioText = styled(Typography)(({ theme }) => ({
  fontSize: '14px',
  color: theme.palette.text.secondary,
  lineHeight: 1.6,
  marginTop: '12px',
}));

const MemberSinceText = styled(Typography)(({ theme }) => ({
  fontSize: '13px',
  color: theme.palette.text.disabled,
  marginTop: '8px',
}));

const ProfileTab = ({ userData, stats, statsLoading, preferences }) => {
  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const unitPreference = preferences?.units || 'imperial';

  const getHeightDisplay = () => {
    if (!userData.height) return 'N/A';
    return formatHeight(userData.height, userData.heightUnit, unitPreference);
  };

  const getWeightDisplay = () => {
    if (!userData.weight) return 'N/A';

    // Convert weight if needed
    const currentWeightUnit = userData.weightUnit || 'lbs';
    const targetWeightUnit = unitPreference === 'metric' ? 'kg' : 'lbs';

    let displayWeight = userData.weight;
    if (currentWeightUnit !== targetWeightUnit) {
      if (currentWeightUnit === 'lbs' && targetWeightUnit === 'kg') {
        displayWeight = Math.round(userData.weight / 2.20462);
      } else if (currentWeightUnit === 'kg' && targetWeightUnit === 'lbs') {
        displayWeight = Math.round(userData.weight * 2.20462);
      }
    }

    return `${displayWeight} ${targetWeightUnit}`;
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={7}>
        <ProfileCard>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <AvatarCircle>
                {getInitials(userData.fullName || userData.username)}
              </AvatarCircle>

              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {userData.fullName || userData.username || 'User'}
              </Typography>

              <Chip
                icon={<Mail size={16} />}
                label={userData.email || 'No email'}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: 'text.secondary',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  '& .MuiChip-icon': {
                    color: 'text.disabled',
                  },
                }}
              />

              <BioText>
                {userData.bio || 'Fitness enthusiast passionate about strength training and healthy living.'}
              </BioText>

              <MemberSinceText sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Calendar size={12} />
                Member since {formatDate(userData.createdAt)}
              </MemberSinceText>
            </Box>

            <InfoRow>
              <InfoItem>
                <InfoLabel>Height</InfoLabel>
                <InfoValue>{getHeightDisplay()}</InfoValue>
              </InfoItem>

              <InfoItem>
                <InfoLabel>Weight</InfoLabel>
                <InfoValue>{getWeightDisplay()}</InfoValue>
              </InfoItem>

              <InfoItem>
                <InfoLabel>Age</InfoLabel>
                <InfoValue>{userData.age || 'N/A'}</InfoValue>
              </InfoItem>
            </InfoRow>

            <Box>
              <SectionTitle>Fitness Goal</SectionTitle>
              <GoalText>
                {userData.fitnessGoal || 'Build muscle and increase strength'}
              </GoalText>
            </Box>
          </CardContent>
        </ProfileCard>

        {/* Workout Preferences Section */}
        <ProfileCard sx={{ mt: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Workout Preferences
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={6}>
                <InfoLabel>Preferred Workout Time</InfoLabel>
                <InfoValue>{userData.preferredWorkoutTime || 'Morning (6-8 AM)'}</InfoValue>
              </Grid>

              <Grid item xs={6}>
                <InfoLabel>Experience Level</InfoLabel>
                <InfoValue>{userData.experienceLevel || 'Intermediate'}</InfoValue>
              </Grid>

              <Grid item xs={6}>
                <InfoLabel>Workout Frequency</InfoLabel>
                <InfoValue>{userData.workoutFrequency || '5 times/week'}</InfoValue>
              </Grid>

              <Grid item xs={6}>
                <InfoLabel>Target Weight</InfoLabel>
                <InfoValue>
                  {userData.targetWeight ? (() => {
                    const currentWeightUnit = userData.weightUnit || 'lbs';
                    const targetWeightUnit = unitPreference === 'metric' ? 'kg' : 'lbs';
                    let displayWeight = userData.targetWeight;

                    if (currentWeightUnit !== targetWeightUnit) {
                      if (currentWeightUnit === 'lbs' && targetWeightUnit === 'kg') {
                        displayWeight = Math.round(userData.targetWeight / 2.20462);
                      } else if (currentWeightUnit === 'kg' && targetWeightUnit === 'lbs') {
                        displayWeight = Math.round(userData.targetWeight * 2.20462);
                      }
                    }

                    return `${displayWeight} ${targetWeightUnit}`;
                  })() : (unitPreference === 'metric' ? '84 kg' : '185 lbs')}
                </InfoValue>
              </Grid>
            </Grid>
          </CardContent>
        </ProfileCard>
      </Grid>

      <Grid item xs={12} md={5}>
        <QuickStatsCard stats={stats} loading={statsLoading} />
      </Grid>
    </Grid>
  );
};

export default ProfileTab;

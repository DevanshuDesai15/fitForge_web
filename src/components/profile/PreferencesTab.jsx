import { Box, Card, CardContent, Typography, Grid, Switch, Button, LinearProgress, styled, Select, MenuItem, FormControl } from '@mui/material';
import { Languages, Palette, Ruler, RefreshCw, HardDrive, Download, Trash2 } from 'lucide-react';

const PreferenceCard = styled(Card)(({ theme }) => ({
  backgroundColor: '#282828',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
}));

const PreferenceRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 0',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',

  '&:last-child': {
    borderBottom: 'none',
  },
}));

const PreferenceLabel = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',

  '& svg': {
    width: '20px',
    height: '20px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
}));

const PreferenceInfo = styled(Box)({
  flex: 1,
});

const PreferenceTitle = styled(Typography)(({ theme }) => ({
  fontSize: '15px',
  fontWeight: 500,
  color: theme.palette.text.primary,
}));

const PreferenceSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: '13px',
  color: theme.palette.text.secondary,
  marginTop: '2px',
}));

const PreferenceValue = styled(Typography)(({ theme }) => ({
  fontSize: '14px',
  color: theme.palette.text.secondary,
  marginRight: '16px',
}));

const StyledSwitch = styled(Switch)(({ theme }) => ({
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: theme.palette.primary.main,
  },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    backgroundColor: theme.palette.primary.main,
  },
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  minWidth: '120px',
  color: theme.palette.text.primary,
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.primary.main,
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.primary.main,
  },
  '& .MuiSelect-icon': {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  '& .MuiSelect-select': {
    padding: '8px 14px',
  },
}));

const StorageBar = styled(LinearProgress)(({ theme }) => ({
  height: '8px',
  borderRadius: '4px',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  '& .MuiLinearProgress-bar': {
    backgroundColor: theme.palette.primary.main,
    borderRadius: '4px',
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderColor: 'rgba(255, 255, 255, 0.2)',
  color: theme.palette.text.primary,
  textTransform: 'none',
  fontWeight: 500,

  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: 'rgba(221, 237, 0, 0.05)',
  },
}));

const PreferencesTab = ({
  preferences,
  notifications,
  storageUsed,
  onPreferenceChange,
  onNotificationChange,
  onExportData,
  onClearCache
}) => {
  const storagePercentage = (storageUsed / (15 * 1024 * 1024)) * 100; // Assuming 15MB limit

  const selectMenuProps = {
    PaperProps: {
      sx: {
        bgcolor: '#282828',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        '& .MuiMenuItem-root': {
          color: '#fff',
          '&:hover': {
            bgcolor: 'rgba(221, 237, 0, 0.1)',
          },
          '&.Mui-selected': {
            bgcolor: 'rgba(221, 237, 0, 0.2)',
            '&:hover': {
              bgcolor: 'rgba(221, 237, 0, 0.3)',
            },
          },
        },
      },
    },
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        {/* App Preferences Card */}
        <PreferenceCard>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              App Preferences
            </Typography>

            <Box>
              <PreferenceRow>
                <PreferenceLabel>
                  <Ruler size={20} />
                  <PreferenceInfo>
                    <PreferenceTitle>Units</PreferenceTitle>
                    <PreferenceSubtitle>Choose measurement system</PreferenceSubtitle>
                  </PreferenceInfo>
                </PreferenceLabel>
                <FormControl size="small">
                  <StyledSelect
                    value={preferences?.units || 'imperial'}
                    onChange={(e) => onPreferenceChange('units', e.target.value)}
                    MenuProps={selectMenuProps}
                  >
                    <MenuItem value="imperial">Imperial</MenuItem>
                    <MenuItem value="metric">Metric</MenuItem>
                  </StyledSelect>
                </FormControl>
              </PreferenceRow>

              <PreferenceRow>
                <PreferenceLabel>
                  <Palette size={20} />
                  <PreferenceInfo>
                    <PreferenceTitle>Theme</PreferenceTitle>
                    <PreferenceSubtitle>App appearance</PreferenceSubtitle>
                  </PreferenceInfo>
                </PreferenceLabel>
                <FormControl size="small">
                  <StyledSelect
                    value={preferences?.theme || 'dark'}
                    onChange={(e) => onPreferenceChange('theme', e.target.value)}
                    MenuProps={selectMenuProps}
                  >
                    <MenuItem value="dark">Dark</MenuItem>
                    <MenuItem value="light">Light</MenuItem>
                  </StyledSelect>
                </FormControl>
              </PreferenceRow>

              <PreferenceRow>
                <PreferenceLabel>
                  <Languages size={20} />
                  <PreferenceInfo>
                    <PreferenceTitle>Language</PreferenceTitle>
                    <PreferenceSubtitle>App language</PreferenceSubtitle>
                  </PreferenceInfo>
                </PreferenceLabel>
                <FormControl size="small">
                  <StyledSelect
                    value={preferences?.language || 'english'}
                    onChange={(e) => onPreferenceChange('language', e.target.value)}
                    MenuProps={selectMenuProps}
                  >
                    <MenuItem value="english">English</MenuItem>
                    <MenuItem value="spanish">Spanish</MenuItem>
                    <MenuItem value="french">French</MenuItem>
                  </StyledSelect>
                </FormControl>
              </PreferenceRow>

              <PreferenceRow>
                <PreferenceLabel>
                  <RefreshCw size={20} />
                  <PreferenceInfo>
                    <PreferenceTitle>Auto-sync</PreferenceTitle>
                    <PreferenceSubtitle>Automatically sync workout data</PreferenceSubtitle>
                  </PreferenceInfo>
                </PreferenceLabel>
                <StyledSwitch
                  checked={preferences?.autoSync !== false}
                  onChange={(e) => onPreferenceChange('autoSync', e.target.checked)}
                />
              </PreferenceRow>
            </Box>
          </CardContent>
        </PreferenceCard>
      </Grid>

      <Grid item xs={12} md={6}>
        {/* Notifications Card */}
        <PreferenceCard>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Notifications
            </Typography>

            <Box>
              <PreferenceRow>
                <PreferenceInfo>
                  <PreferenceTitle>Workout Reminders</PreferenceTitle>
                  <PreferenceSubtitle>Daily workout notifications</PreferenceSubtitle>
                </PreferenceInfo>
                <StyledSwitch
                  checked={notifications?.workoutReminders !== false}
                  onChange={(e) => onNotificationChange('workoutReminders', e.target.checked)}
                />
              </PreferenceRow>

              <PreferenceRow>
                <PreferenceInfo>
                  <PreferenceTitle>Progress Updates</PreferenceTitle>
                  <PreferenceSubtitle>Weekly progress summaries</PreferenceSubtitle>
                </PreferenceInfo>
                <StyledSwitch
                  checked={notifications?.progressUpdates !== false}
                  onChange={(e) => onNotificationChange('progressUpdates', e.target.checked)}
                />
              </PreferenceRow>

              <PreferenceRow>
                <PreferenceInfo>
                  <PreferenceTitle>Achievements</PreferenceTitle>
                  <PreferenceSubtitle>Milestone celebrations</PreferenceSubtitle>
                </PreferenceInfo>
                <StyledSwitch
                  checked={notifications?.achievements !== false}
                  onChange={(e) => onNotificationChange('achievements', e.target.checked)}
                />
              </PreferenceRow>

              <PreferenceRow>
                <PreferenceInfo>
                  <PreferenceTitle>AI Recommendations</PreferenceTitle>
                  <PreferenceSubtitle>Personalized workout suggestions</PreferenceSubtitle>
                </PreferenceInfo>
                <StyledSwitch
                  checked={notifications?.aiRecommendations !== false}
                  onChange={(e) => onNotificationChange('aiRecommendations', e.target.checked)}
                />
              </PreferenceRow>
            </Box>
          </CardContent>
        </PreferenceCard>
      </Grid>

      <Grid item xs={12}>
        {/* Data & Storage Card */}
        <PreferenceCard>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Data & Storage
            </Typography>

            <Box>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <PreferenceLabel>
                    <HardDrive size={20} />
                    <PreferenceTitle>Storage Used</PreferenceTitle>
                  </PreferenceLabel>
                  <PreferenceValue>{(storageUsed / (1024 * 1024)).toFixed(1)} MB</PreferenceValue>
                </Box>
                <StorageBar variant="determinate" value={Math.min(storagePercentage, 100)} />
                <Typography variant="caption" sx={{ color: 'text.disabled', mt: 1, display: 'block' }}>
                  {storagePercentage.toFixed(0)}% of available storage used
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <ActionButton
                  variant="outlined"
                  startIcon={<Download size={18} />}
                  onClick={onExportData}
                >
                  Export Data
                </ActionButton>
                <ActionButton
                  variant="outlined"
                  startIcon={<Trash2 size={18} />}
                  onClick={onClearCache}
                >
                  Clear Cache
                </ActionButton>
              </Box>
            </Box>
          </CardContent>
        </PreferenceCard>
      </Grid>
    </Grid>
  );
};

export default PreferencesTab;

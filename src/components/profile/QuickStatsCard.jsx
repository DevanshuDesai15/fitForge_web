import { Box, Card, CardContent, Typography, styled, CircularProgress } from '@mui/material';
import { Dumbbell, Flame, TrendingUp, Trophy } from 'lucide-react';

const StatsCard = styled(Card)(({ theme }) => ({
  backgroundColor: '#282828',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  height: '100%',
}));

const StatRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 0',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',

  '&:last-child': {
    borderBottom: 'none',
  },
}));

const StatLabel = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  color: theme.palette.text.secondary,
  fontSize: '14px',

  '& svg': {
    width: '20px',
    height: '20px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
}));

const StatValue = styled(Typography)(({ theme }) => ({
  fontSize: '18px',
  fontWeight: 600,
  color: theme.palette.text.primary,
}));

const QuickStatsCard = ({ stats, loading }) => {
  const statsData = [
    {
      icon: Dumbbell,
      label: 'Total Workouts',
      value: stats?.totalWorkouts || 0,
    },
    {
      icon: TrendingUp,
      label: 'Current Streak',
      value: stats?.currentStreak ? `${stats.currentStreak} days` : '0 days',
    },
    {
      icon: Flame,
      label: 'Calories Burned',
      value: stats?.caloriesBurned?.toLocaleString() || 0,
    },
    {
      icon: Trophy,
      label: 'Personal Records',
      value: stats?.personalRecords || 0,
    },
  ];

  return (
    <StatsCard>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Quick Stats
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} sx={{ color: 'primary.main' }} />
          </Box>
        ) : (
          <Box>
            {statsData.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <StatRow key={index}>
                  <StatLabel>
                    <Icon />
                    {stat.label}
                  </StatLabel>
                  <StatValue>{stat.value}</StatValue>
                </StatRow>
              );
            })}
          </Box>
        )}
      </CardContent>
    </StatsCard>
  );
};

export default QuickStatsCard;

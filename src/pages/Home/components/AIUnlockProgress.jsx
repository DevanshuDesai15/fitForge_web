import { Box, Typography } from '@mui/material';

export default function AIUnlockProgress({
  completedWorkouts,
  totalWorkouts = 5,
}) {
  const safeCompleted = Math.max(0, Math.min(completedWorkouts, totalWorkouts));

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: 1.25,
          mb: 2,
        }}
      >
        {Array.from({ length: totalWorkouts }, (_, index) => {
          const filled = index < safeCompleted;

          return (
            <Box
              key={`ai-unlock-bar-${index}`}
              data-testid="ai-unlock-bar"
              data-filled={filled ? 'true' : 'false'}
              sx={{
                width: 18,
                height: 44,
                borderRadius: '5px',
                border: '2px solid rgba(255, 255, 255, 0.7)',
                background: filled
                  ? 'repeating-linear-gradient(135deg, rgba(221, 237, 0, 0.95) 0 6px, rgba(221, 237, 0, 0.15) 6px 14px)'
                  : 'transparent',
              }}
            />
          );
        })}
      </Box>

      {/* <Typography
        variant="body1"
        sx={{
          color: 'text.secondary',
          mb: 1,
        }}
      >
        {safeCompleted} of {totalWorkouts} workouts completed
      </Typography> */}
    </Box>
  );
}

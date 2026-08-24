import { Box, Button, Typography } from "@mui/material";
import { Pause, Play, Timer } from "lucide-react";

import {
  TIMER_STATUS,
  formatWorkoutDuration,
} from "../utils/workoutTimerState";

const WorkoutTimerControl = ({
  elapsedTime,
  timerStatus,
  onPause,
  onResume,
}) => {
  const isPaused = timerStatus === TIMER_STATUS.PAUSED;
  const statusLabel = isPaused ? "Workout paused" : "Workout running";
  const accentColor = isPaused ? "#ffb547" : "#dded00";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        flexWrap: "wrap",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.25,
          py: 0.75,
          borderRadius: "10px",
          border: `1px solid ${accentColor}55`,
          backgroundColor: `${accentColor}0d`,
        }}
      >
        <Timer size={17} color={accentColor} aria-hidden="true" />
        <Box>
          <Typography
            aria-live="polite"
            sx={{
              color: accentColor,
              fontSize: "0.95rem",
              fontWeight: 800,
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1.1,
            }}
          >
            {formatWorkoutDuration(elapsedTime)}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", lineHeight: 1.1 }}
          >
            {statusLabel}
          </Typography>
        </Box>
      </Box>

      <Button
        size="small"
        variant="text"
        aria-label={isPaused ? "Resume workout timer" : "Pause workout timer"}
        startIcon={
          isPaused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />
        }
        onClick={isPaused ? onResume : onPause}
        sx={{
          color: accentColor,
          minWidth: 0,
          px: 1,
          textTransform: "none",
          fontWeight: 700,
          "&:hover": { backgroundColor: `${accentColor}12` },
        }}
      >
        {isPaused ? "Resume" : "Pause"}
      </Button>
    </Box>
  );
};

export default WorkoutTimerControl;

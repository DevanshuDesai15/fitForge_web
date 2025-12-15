import { useState, useCallback } from "react";
import ProgressiveOverloadAIService from "../../../services/progressiveOverloadAI";
import { useAuth } from "../../../contexts/AuthContext";

export const usePlateauDetection = () => {
  const [plateauAlerts, setPlateauAlerts] = useState([]);
  const [appliedInterventions, setAppliedInterventions] = useState({});
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
  const [aiService] = useState(() => ProgressiveOverloadAIService);

  const { currentUser } = useAuth();

  const generatePlateauMessage = useCallback((plateau) => {
    const duration = plateau.plateauDuration;
    const type = plateau.plateauType;
    return `No ${type} progress for ${duration} sessions. Time to shake things up with new training strategies.`;
  }, []);

  const loadPlateauAlerts = useCallback(
    async (exerciseNames) => {
      if (!exerciseNames.length) return;

      try {
        // Detect plateaus for all exercises
        const plateaus = await aiService.detectPlateaus(currentUser.uid);

        const alerts = plateaus
          .filter((plateau) => plateau.plateauDuration >= 3) // Only show significant plateaus
          .map((plateau) => ({
            id: `plateau_${plateau.exerciseId}`,
            exerciseId: plateau.exerciseId,
            exerciseName: plateau.exerciseName,
            severity: plateau.severity,
            duration: plateau.plateauDuration,
            type: plateau.plateauType,
            message: generatePlateauMessage(plateau),
            interventions: plateau.suggestedInterventions || [],
            lastProgressDate: plateau.lastProgressDate,
          }));

        setPlateauAlerts(alerts);
      } catch (error) {
        console.error("Error loading plateau alerts:", error);
      }
    },
    [currentUser.uid, aiService, generatePlateauMessage]
  );

  const handleInterventionApply = useCallback(async (alertId, intervention) => {
    try {
      // Mark intervention as applied
      setAppliedInterventions((prev) => ({
        ...prev,
        [alertId]: {
          intervention,
          appliedAt: new Date(),
          status: "applied",
        },
      }));

      console.log("Applied intervention:", intervention, "for alert:", alertId);
    } catch (error) {
      console.error("Error applying intervention:", error);
    }
  }, []);

  const handleAlertDismiss = useCallback(async (alertId) => {
    try {
      // Mark alert as dismissed
      setDismissedAlerts((prev) => new Set([...prev, alertId]));
      console.log("Dismissed alert:", alertId);
    } catch (error) {
      console.error("Error dismissing alert:", error);
    }
  }, []);

  return {
    plateauAlerts,
    appliedInterventions,
    dismissedAlerts,
    loadPlateauAlerts,
    handleInterventionApply,
    handleAlertDismiss,
  };
};

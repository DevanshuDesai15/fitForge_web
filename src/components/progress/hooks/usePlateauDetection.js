import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ProgressiveOverloadAIService from "../../../services/progressiveOverloadAI";
import { useAuth } from "../../../contexts/AuthContext";
import { useSupabase } from "../../../hooks/useSupabase";

export const usePlateauDetection = () => {
  const [appliedInterventions, setAppliedInterventions] = useState({});
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
  const [aiService] = useState(() => ProgressiveOverloadAIService);

  const { currentUser } = useAuth();
  const supabase = useSupabase();

  useEffect(() => {
    aiService.setSupabase(supabase);
  }, [supabase, aiService]);

  const generatePlateauMessage = useCallback((plateau) => {
    const duration = plateau.plateauDuration;
    const type = plateau.plateauType;
    return `No ${type} progress for ${duration} sessions. Time to shake things up with new training strategies.`;
  }, []);

  const { data: plateauAlerts = [], refetch: loadPlateauAlerts } = useQuery({
    queryKey: ['plateauAlerts', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) return [];

      const plateaus = await aiService.detectPlateaus(currentUser.uid);
      return plateaus
        .filter((plateau) => plateau.plateauDuration >= 3)
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
    },
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
  });

  const handleInterventionApply = useCallback(async (alertId, intervention) => {
    try {
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

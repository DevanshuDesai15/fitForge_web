import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/AuthContext";
import { useSupabase } from "../../../hooks/useSupabase";
import { programTemplates } from "../components/programTemplates"; 

export const useWorkoutPrograms = () => {
  const { currentUser } = useAuth();
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  const { data: programs = [], isLoading: loading } = useQuery({
    queryKey: ['workoutPrograms', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) {
        return programTemplates.map((p) => ({
          ...p,
          isTemplate: true,
        }));
      }

      // Check if user already has any programs
      const { data: existingPrograms, error: checkErr } = await supabase
        .from("workout_programs")
        .select("id")
        .eq("user_id", currentUser.uid)
        .limit(1);

      if (checkErr) throw checkErr;

      // Only save templates if user has no programs yet (new user)
      if (existingPrograms && existingPrograms.length === 0) {
        console.log("New user detected, saving template programs...");
        
        const programsToInsert = programTemplates.map(template => ({
            user_id: currentUser.uid,
            name: template.name,
            description: template.description || "",
            schedule: template.schedule || [],
        }));

        const { error: insertErr } = await supabase
          .from("workout_programs")
          .insert(programsToInsert);

        if (insertErr) throw insertErr;
      }

      // Fetch
      const { data, error } = await supabase
        .from("workout_programs")
        .select("*")
        .eq("user_id", currentUser.uid)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map(doc => ({
        id: doc.id,
        name: doc.name,
        description: doc.description,
        schedule: doc.schedule,
        userId: doc.user_id,
        createdAt: doc.created_at,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!currentUser) return;

    const subscription = supabase
      .channel('workout_programs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_programs',
          filter: `user_id=eq.${currentUser.uid}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['workoutPrograms', currentUser.uid] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUser, supabase, queryClient]);

  return { programs, loading };
};

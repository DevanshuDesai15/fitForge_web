import { useState, useEffect } from "react";
import { db } from "../../../firebase/config";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";
import { programTemplates } from "../components/programTemplates";

export const useWorkoutPrograms = () => {
  const { currentUser } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to save template programs to user's account
  const saveTemplatesToUser = async (userId) => {
    try {
      // Check if user already has any programs
      const existingQuery = query(
        collection(db, "workoutPrograms"),
        where("userId", "==", userId)
      );
      const existingPrograms = await getDocs(existingQuery);

      // Only save templates if user has no programs yet (new user)
      if (existingPrograms.empty) {
        console.log("New user detected, saving template programs...");

        for (const template of programTemplates) {
          const userProgram = {
            ...template,
            userId: userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isTemplate: false, // Convert to user program
            isFromTemplate: true, // Mark as originally from template
            templateId: template.id, // Keep reference to original template
          };

          // Remove the template id to create a new document
          delete userProgram.id;

          await addDoc(collection(db, "workoutPrograms"), userProgram);
        }

        console.log("Template programs saved successfully for new user");
      }
    } catch (error) {
      console.error("Error saving template programs:", error);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      // Show default templates for non-authenticated users
      const defaultPrograms = programTemplates.map((p) => ({
        ...p,
        isTemplate: true,
      }));
      setPrograms(defaultPrograms);
      setLoading(false);
      return;
    }

    // Save templates to new user's account
    saveTemplatesToUser(currentUser.uid);

    const q = query(
      collection(db, "workoutPrograms"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const userPrograms = [];
        querySnapshot.forEach((doc) => {
          userPrograms.push({ id: doc.id, ...doc.data() });
        });

        // Sort user programs by createdAt (newest first), but prioritize templates
        userPrograms.sort((a, b) => {
          // Put template-originated programs first
          if (a.isFromTemplate && !b.isFromTemplate) return -1;
          if (!a.isFromTemplate && b.isFromTemplate) return 1;

          // Then sort by creation date
          if (a.createdAt && b.createdAt) {
            return b.createdAt.toMillis() - a.createdAt.toMillis();
          }
          return 0;
        });

        setPrograms(userPrograms); // Only show user programs (including converted templates)
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching workout programs: ", error);
        setPrograms([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  return { programs, loading };
};

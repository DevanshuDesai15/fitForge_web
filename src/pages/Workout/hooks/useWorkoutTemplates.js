import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../firebase/config";
import { useAuth } from "../../../contexts/AuthContext";

export const useWorkoutTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { currentUser } = useAuth();

  const loadTemplates = useCallback(async () => {
    if (!currentUser) return;

    setLoading(true);
    setError("");

    try {
      const templatesQuery = query(
        collection(db, "workoutTemplates"),
        where("userId", "==", currentUser.uid)
      );
      const templateDocs = await getDocs(templatesQuery);
      const templateData = templateDocs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setTemplates(templateData);
    } catch (err) {
      console.error("Error loading templates:", err);
      setError("Failed to load workout templates");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return {
    templates,
    loading,
    error,
    loadTemplates,
  };
};

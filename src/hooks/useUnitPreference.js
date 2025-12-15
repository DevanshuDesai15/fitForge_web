import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook to get user's unit preference from Firestore
 * Returns 'imperial' or 'metric' based on user's saved preferences
 */
export const useUnitPreference = () => {
  const [unitPreference, setUnitPreference] = useState('imperial');
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const loadPreferences = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUnitPreference(userData.preferences?.units || 'imperial');
        }
      } catch (error) {
        console.error('Error loading unit preference:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [currentUser]);

  // Get weight unit label (kg or lbs)
  const weightUnit = unitPreference === 'metric' ? 'kg' : 'lbs';

  // Get height unit label (cm or ft)
  const heightUnit = unitPreference === 'metric' ? 'cm' : 'ft';

  return {
    unitPreference,    // 'imperial' or 'metric'
    weightUnit,        // 'kg' or 'lbs'
    heightUnit,        // 'cm' or 'ft'
    loading
  };
};

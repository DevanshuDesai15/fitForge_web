import { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import PropTypes from 'prop-types';
import { convertWeight as convertWeightUtil, formatWeight as formatWeightUtil, getWeightLabel as getWeightLabelUtil } from '../utils/unitConversions';

const UnitsContext = createContext();

export const useUnits = () => {
    const context = useContext(UnitsContext);
    if (!context) {
        throw new Error('useUnits must be used within a UnitsProvider');
    }
    return context;
};

export const UnitsProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [unitPreference, setUnitPreference] = useState('imperial'); // 'metric' or 'imperial'
    const [loading, setLoading] = useState(true);

    // Derived values
    const weightUnit = unitPreference === 'metric' ? 'kg' : 'lbs';
    const heightUnit = unitPreference === 'metric' ? 'cm' : 'ft';

    // Load user's unit preference from Firestore
    useEffect(() => {
        const loadUserPreference = async () => {
            if (!currentUser) {
                // Not logged in - use localStorage or default
                const storedUnit = localStorage.getItem('weightUnit');
                if (storedUnit === 'kg') {
                    setUnitPreference('metric');
                } else if (storedUnit === 'lbs') {
                    setUnitPreference('imperial');
                } else {
                    setUnitPreference('imperial'); // Default
                }
                setLoading(false);
                return;
            }

            try {
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const preference = userData.preferences?.units || 'imperial';
                    setUnitPreference(preference);

                    // Sync to localStorage for backward compatibility
                    const unit = preference === 'metric' ? 'kg' : 'lbs';
                    localStorage.setItem('weightUnit', unit);
                } else {
                    // New user - set default
                    setUnitPreference('imperial');
                    localStorage.setItem('weightUnit', 'lbs');
                }
            } catch (error) {
                console.error('Error loading user preferences:', error);
                setUnitPreference('imperial');
            } finally {
                setLoading(false);
            }
        };

        loadUserPreference();
    }, [currentUser]);

    // Update unit preference in Firestore and localStorage
    const updateUnitPreference = async (newPreference) => {
        if (!currentUser) {
            console.error('Cannot update preferences: user not logged in');
            return;
        }

        try {
            // Update Firestore
            await setDoc(doc(db, 'users', currentUser.uid), {
                preferences: {
                    units: newPreference
                },
                weightUnit: newPreference === 'metric' ? 'kg' : 'lbs',
                heightUnit: newPreference === 'metric' ? 'cm' : 'ft',
                updatedAt: new Date().toISOString(),
            }, { merge: true });

            // Update local state
            setUnitPreference(newPreference);

            // Sync to localStorage
            const unit = newPreference === 'metric' ? 'kg' : 'lbs';
            localStorage.setItem('weightUnit', unit);

            console.log('✅ Unit preference updated:', newPreference);
        } catch (error) {
            console.error('Error updating unit preference:', error);
            throw error;
        }
    };

    // Conversion utilities (from extracted pure functions)
    const _convertWeight = (weight, fromUnit, toUnit) => {
        return convertWeightUtil(weight, fromUnit, toUnit);
    };

    const _formatWeight = (weight, displayUnit = null) => {
        const unit = displayUnit || weightUnit;
        return formatWeightUtil(weight, unit);
    };

    const _getWeightLabel = (label = 'Weight') => {
        return getWeightLabelUtil(weightUnit, label);
    };

    const value = {
        unitPreference,
        weightUnit,
        heightUnit,
        updateUnitPreference,
        convertWeight: _convertWeight,
        formatWeight: _formatWeight,
        getWeightLabel: _getWeightLabel,
        loading
    };

    return (
        <UnitsContext.Provider value={value}>
            {children}
        </UnitsContext.Provider>
    );
};

UnitsProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export default UnitsContext;

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useSupabase } from '../hooks/useSupabase';
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
    const supabase = useSupabase();
    const [unitPreference, setUnitPreference] = useState('imperial'); // 'metric' or 'imperial'
    const [loading, setLoading] = useState(true);

    // Derived values
    const weightUnit = unitPreference === 'metric' ? 'kg' : 'lbs';
    const heightUnit = unitPreference === 'metric' ? 'cm' : 'ft';

    const getStoredUnitPreference = () => {
        const storedUnit = localStorage.getItem('weightUnit');
        if (storedUnit === 'kg') {
            return 'metric';
        }
        if (storedUnit === 'lbs') {
            return 'imperial';
        }
        return 'imperial';
    };

    // Load the user's unit preference from Supabase when authenticated,
    // otherwise fall back to the locally stored preference.
    useEffect(() => {
        const loadUserPreference = async () => {
            if (!currentUser?.uid) {
                setUnitPreference(getStoredUnitPreference());
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('preferences')
                    .eq('id', currentUser.uid)
                    .single();

                if (error) {
                    if (error.code === 'PGRST116') {
                        setUnitPreference(getStoredUnitPreference());
                    } else {
                        throw error;
                    }
                } else if (data?.preferences?.units) {
                    const preference = data.preferences.units;
                    setUnitPreference(preference);

                    // Sync to localStorage for backward compatibility
                    const unit = preference === 'metric' ? 'kg' : 'lbs';
                    localStorage.setItem('weightUnit', unit);
                } else {
                    setUnitPreference(getStoredUnitPreference());
                }
            } catch (error) {
                console.error('Error loading user preferences from Supabase:', error);
                setUnitPreference(getStoredUnitPreference());
            } finally {
                setLoading(false);
            }
        };

        loadUserPreference();
    }, [currentUser]);

    // Persist the preference to Supabase and mirror it into localStorage.
    const updateUnitPreference = async (newPreference) => {
        if (!currentUser?.uid) {
            console.error('Cannot update preferences: user not logged in');
            return;
        }

        try {
            // Update Supabase profiles table
            // We fetch the current preferences first to merge them properly
            const { data: currentProfile } = await supabase
                .from('profiles')
                .select('preferences')
                .eq('id', currentUser.uid)
                .single();

            const updatedPreferences = {
                ...(currentProfile?.preferences || {}),
                units: newPreference
            };

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: currentUser.uid,
                    preferences: updatedPreferences,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            // Update local state
            setUnitPreference(newPreference);

            // Sync to localStorage
            const unit = newPreference === 'metric' ? 'kg' : 'lbs';
            localStorage.setItem('weightUnit', unit);

            console.log('✅ Unit preference updated in Supabase:', newPreference);
        } catch (error) {
            console.error('Error updating unit preference in Supabase:', error);
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

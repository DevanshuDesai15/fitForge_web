import { createContext, useContext } from 'react';

export const UnitsContext = createContext();

export const useUnits = () => {
    const context = useContext(UnitsContext);
    if (!context) throw new Error('useUnits must be used within a UnitsProvider');
    return context;
};

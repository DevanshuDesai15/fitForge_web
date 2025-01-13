import { useState } from 'react';
import {
    BottomNavigation,
    BottomNavigationAction,
    Paper,
    useTheme
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    MdDashboard,
    MdFitnessCenter,
    MdHistory,
    MdShowChart,
    MdPerson
} from 'react-icons/md';

export default function Navigation() {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const [value, setValue] = useState(location.pathname);

    const handleChange = (event, newValue) => {
        setValue(newValue);
        navigate(newValue);
    };

    return (
        <Paper
            sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(30, 30, 30, 0.9)',
                backdropFilter: 'blur(10px)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}
            elevation={3}
        >
            <BottomNavigation
                value={value}
                onChange={handleChange}
                sx={{
                    background: 'transparent',
                    '& .Mui-selected': {
                        color: '#00ff9f !important',
                    },
                }}
            >
                <BottomNavigationAction
                    label="Home"
                    value="/"
                    icon={<MdDashboard />}
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                />
                <BottomNavigationAction
                    label="Workout"
                    value="/workout"
                    icon={<MdFitnessCenter />}
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                />
                <BottomNavigationAction
                    label="History"
                    value="/history"
                    icon={<MdHistory />}
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                />
                <BottomNavigationAction
                    label="Progress"
                    value="/progress"
                    icon={<MdShowChart />}
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                />
                <BottomNavigationAction
                    label="Profile"
                    value="/profile"
                    icon={<MdPerson />}
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                />
            </BottomNavigation>
        </Paper>
    );
}
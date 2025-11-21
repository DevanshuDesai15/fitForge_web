import PropTypes from 'prop-types';
import { Box, Button, Typography } from '@mui/material';
import { Brain, Target, Sparkles, Shuffle } from 'lucide-react';

const tabs = [
    { id: 'overview', label: 'Overview', icon: <Target size={20} /> },
    { id: 'ai-coach', label: 'AI Coach', icon: <Brain size={20} /> },           
    { id: 'suggestions', label: 'Suggestions', icon: <Sparkles size={20} /> },
    { id: 'variations', label: 'Variations', icon: <Shuffle size={20} /> },
];

const WorkoutTabs = ({ activeTab, onChange }) => {
    return (
        <Box sx={{
            display: 'flex',
            justifyContent: 'space-around',
            backgroundColor: '#1a1a1a',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '8px',
            my: 3,
        }}>
            {tabs.map(tab => (
                <Button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    sx={{
                        flex: 1,
                        flexDirection: 'column',
                        color: activeTab === tab.id ? '#dded00' : 'rgba(255, 255, 255, 0.6)',
                        textTransform: 'none',
                        minWidth: 'auto',
                        gap: 0.5,
                        borderRadius: '8px',
                        py: 1,
                        '&:hover': {
                            backgroundColor: 'rgba(221, 237, 0, 0.1)'
                        },
                        transition: 'color 0.2s ease-in-out',
                    }}
                >
                    {tab.icon}
                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>{tab.label}</Typography>
                </Button>
            ))}
        </Box>
    );
};

WorkoutTabs.propTypes = {
    activeTab: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
};

export default WorkoutTabs;

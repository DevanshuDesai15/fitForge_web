import { useState } from 'react';
import { 
    Box, 
    Card, 
    CardContent, 
    Typography, 
    Grid,
    Tab,
    Tabs
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
    MdCalendarMonth, 
    MdHistory,
    MdFitnessCenter
} from 'react-icons/md';

const StyledCard = styled(Card)(({ theme }) => ({
    background: 'rgba(30, 30, 30, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    boxShadow: '0 4px 30px rgba(0, 255, 159, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
}));

export default function History() {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #121212 0%, #2d2d2d 100%)',
            padding: '1rem',
        }}>
            <div className="max-w-4xl mx-auto">
                <Typography 
                    variant="h4" 
                    sx={{ 
                        color: '#00ff9f', 
                        fontWeight: 'bold',
                        mb: 3 
                    }}
                >
                    Workout History
                </Typography>

                <StyledCard sx={{ mb: 3 }}>
                    <Tabs 
                        value={activeTab} 
                        onChange={handleTabChange}
                        variant="fullWidth"
                        sx={{
                            '& .MuiTab-root': { color: 'rgba(255, 255, 255, 0.7)' },
                            '& .Mui-selected': { color: '#00ff9f !important' },
                            '& .MuiTabs-indicator': { backgroundColor: '#00ff9f' },
                        }}
                    >
                        <Tab icon={<MdCalendarMonth />} label="Calendar" />
                        <Tab icon={<MdHistory />} label="Past Workouts" />
                        <Tab icon={<MdFitnessCenter />} label="Exercise History" />
                    </Tabs>
                </StyledCard>

                <StyledCard>
                    <CardContent>
                        {activeTab === 0 && (
                            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                Calendar View Coming Soon
                            </Typography>
                        )}
                        {activeTab === 1 && (
                            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                Past Workouts Coming Soon
                            </Typography>
                        )}
                        {activeTab === 2 && (
                            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                Exercise History Coming Soon
                            </Typography>
                        )}
                    </CardContent>
                </StyledCard>
            </div>
        </Box>
    );
}
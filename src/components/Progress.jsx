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
    MdShowChart,
    MdEmojiEvents,
    MdTrackChanges
} from 'react-icons/md';

const StyledCard = styled(Card)(({ theme }) => ({
    background: 'rgba(30, 30, 30, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    boxShadow: '0 4px 30px rgba(0, 255, 159, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
}));

export default function Progress() {
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
                    Progress Tracking
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
                        <Tab icon={<MdShowChart />} label="Weight Progress" />
                        <Tab icon={<MdEmojiEvents />} label="Personal Records" />
                        <Tab icon={<MdTrackChanges />} label="Goals" />
                    </Tabs>
                </StyledCard>

                <StyledCard>
                    <CardContent>
                        {activeTab === 0 && (
                            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                Weight Progress Charts Coming Soon
                            </Typography>
                        )}
                        {activeTab === 1 && (
                            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                Personal Records Coming Soon
                            </Typography>
                        )}
                        {activeTab === 2 && (
                            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                Goals Tracking Coming Soon
                            </Typography>
                        )}
                    </CardContent>
                </StyledCard>
            </div>
        </Box>
    );
}
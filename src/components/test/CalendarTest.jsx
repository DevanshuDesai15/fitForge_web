import { useState } from 'react';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { format } from 'date-fns';
import { getCurrentDate, resetToCurrentMonth, debugDate } from '../../utils/dateUtils';

export default function CalendarTest() {
    const [testResults, setTestResults] = useState(null);

    const runTests = () => {
        const now = getCurrentDate();
        const currentMonth = resetToCurrentMonth();
        debugDate(now, 'Current Date');
        debugDate(currentMonth, 'Current Month Start');
        setTestResults({ current: now, currentMonth });
    };

    const currentDate = getCurrentDate();

    return (
        <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
            <Card sx={{ mb: 3, backgroundColor: '#282828' }}>
                <CardContent>
                    <Typography variant="h5" sx={{ color: '#dded00', mb: 2 }}>
                        Calendar Date Test
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body1" sx={{ color: 'white' }}>
                            System Date: {format(currentDate, 'MMMM dd, yyyy')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            ISO: {currentDate.toISOString()}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        onClick={runTests}
                        sx={{ mb: 2 }}
                    >
                        Run Date Tests
                    </Button>

                    {testResults && (
                        <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: 1 }}>
                            <Typography variant="h6" sx={{ color: '#dded00', mb: 1 }}>
                                Test Results:
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'white' }}>
                                Current: {format(testResults.current, 'MMMM dd, yyyy HH:mm:ss')}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'white' }}>
                                Current Month: {format(testResults.currentMonth, 'MMMM yyyy')}
                            </Typography>
                        </Box>
                    )}

                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', mt: 2, display: 'block' }}>
                        💡 Check browser console for detailed date debugging info
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
}
import { useState } from 'react';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { format } from 'date-fns';
import { getCurrentDate, resetToCurrentMonth, debugDate, testDateHandling, getCorrectCurrentDate } from '../../utils/dateUtils';

export default function CalendarTest() {
    const [testResults, setTestResults] = useState(null);

    const runTests = () => {
        const results = testDateHandling();
        setTestResults(results);
    };

    const currentDate = getCurrentDate();
    const correctedDate = getCorrectCurrentDate();

    return (
        <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
            <Card sx={{ mb: 3, backgroundColor: 'rgba(30, 30, 30, 0.9)' }}>
                <CardContent>
                    <Typography variant="h5" sx={{ color: '#00ff9f', mb: 2 }}>
                        Calendar Date Test
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body1" sx={{ color: 'white' }}>
                            System Date: {format(currentDate, 'MMMM dd, yyyy')}
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#00ff9f' }}>
                            Corrected Date: {format(correctedDate, 'MMMM dd, yyyy')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            System ISO: {currentDate.toISOString()}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Corrected ISO: {correctedDate.toISOString()}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                        </Typography>
                        <Typography variant="body2" sx={{
                            color: currentDate.getFullYear() > 2024 ? '#f44336' : '#4caf50'
                        }}>
                            Date Status: {currentDate.getFullYear() > 2024 ? '⚠️ Future date detected' : '✅ Date looks correct'}
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
                            <Typography variant="h6" sx={{ color: '#00ff9f', mb: 1 }}>
                                Test Results:
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'white' }}>
                                Current: {format(testResults.current, 'MMMM dd, yyyy HH:mm:ss')}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'white' }}>
                                Current Month: {format(testResults.currentMonth, 'MMMM yyyy')}
                            </Typography>
                            <Typography variant="body2" sx={{
                                color: testResults.isCorrect ? '#4caf50' : '#f44336'
                            }}>
                                Date Correct: {testResults.isCorrect ? '✅ Yes' : '❌ No'}
                            </Typography>
                        </Box>
                    )}

                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', mt: 2, display: 'block' }}>
                        💡 Check browser console for detailed date debugging info
                    </Typography>
                </CardContent>
            </Card>

            <Card sx={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
                <CardContent>
                    <Typography variant="h6" sx={{ color: '#00ff9f', mb: 2 }}>
                        Expected vs Actual
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'white' }}>
                        If calendar shows August 2025, that's correct for the current date.
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'white' }}>
                        If it shows a different month/year, there's a date handling issue.
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
}
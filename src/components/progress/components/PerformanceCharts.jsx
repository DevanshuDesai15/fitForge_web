import {
    Box,
    Typography,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CardContent,
    Chip,
    Tooltip
} from '@mui/material';
import { MdShowChart, MdPsychology } from 'react-icons/md';
import { format } from 'date-fns';
import { StyledCard } from './shared/StyledComponents';
import { getTimeRangeData, calculateTrendLine, identifyPlateauPoints } from '../utils/progressUtils';

const EnhancedProgressChart = ({ data, weightUnit = 'kg' }) => {
    if (data.length < 2) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography sx={{ color: 'text.secondary' }}>
                    Need at least 2 sessions to show progress chart
                </Typography>
            </Box>
        );
    }

    const maxWeight = Math.max(...data.map(d => Array.isArray(d.sets) ? Math.max(...d.sets.map(s => s.weight || 0)) : d.weight));
    const minWeight = Math.min(...data.map(d => Array.isArray(d.sets) ? Math.max(...d.sets.map(s => s.weight || 0)) : d.weight));
    const weightRange = maxWeight - minWeight;

    // Calculate AI trend line
    const trendLine = calculateTrendLine(data);
    const plateauPoints = identifyPlateauPoints(data);

    return (
        <Box sx={{ position: 'relative', height: '200px', mb: 2 }}>
            {/* Chart Background */}
            <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(180deg, rgba(221, 237, 0, 0.1) 0%, rgba(221, 237, 0, 0.05) 50%, transparent 100%)',
                borderRadius: '8px',
                border: '1px solid rgba(221, 237, 0, 0.2)'
            }} />

            {/* Data Points */}
            <Box sx={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'end', justifyContent: 'space-between', px: 2, py: 2 }}>
                {data.slice(-10).map((point, index) => {
                    const weight = Array.isArray(point.sets) ? Math.max(...point.sets.map(s => s.weight || 0)) : point.weight;
                    const heightPercent = weightRange > 0 ? ((weight - minWeight) / weightRange) * 80 + 10 : 50;
                    const isPlateauPoint = plateauPoints.includes(index);

                    return (
                        <Tooltip key={index} title={`${weight}${weightUnit} on ${format(point.date, 'MMM dd')}`}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                                {/* Data Point */}
                                <Box sx={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    backgroundColor: isPlateauPoint ? '#ff9800' : '#dded00',
                                    border: isPlateauPoint ? '2px solid #ff9800' : '2px solid #dded00',
                                    boxShadow: isPlateauPoint ? '0 0 8px rgba(255, 152, 0, 0.5)' : '0 0 8px rgba(221, 237, 0, 0.5)',
                                    position: 'relative',
                                    zIndex: 2
                                }} />

                                {/* Weight Bar */}
                                <Box sx={{
                                    width: '8px',
                                    height: `${heightPercent}%`,
                                    backgroundColor: isPlateauPoint ? 'rgba(255, 152, 0, 0.3)' : 'rgba(221, 237, 0, 0.3)',
                                    borderRadius: '4px 4px 0 0',
                                    mt: 1
                                }} />

                                {/* Date Label */}
                                <Typography variant="caption" sx={{
                                    color: 'text.secondary',
                                    mt: 1,
                                    fontSize: '0.7rem',
                                    transform: 'rotate(-45deg)',
                                    transformOrigin: 'center'
                                }}>
                                    {format(point.date, 'MM/dd')}
                                </Typography>
                            </Box>
                        </Tooltip>
                    );
                })}
            </Box>

            {/* AI Trend Line Overlay */}
            {trendLine.slope !== 0 && (
                <Box sx={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    right: '20px',
                    height: '2px',
                    background: trendLine.slope > 0
                        ? 'linear-gradient(90deg, transparent, rgba(76, 175, 80, 0.8))'
                        : 'linear-gradient(90deg, transparent, rgba(255, 68, 68, 0.8))',
                    transform: `rotate(${Math.atan(trendLine.slope) * (180 / Math.PI)}deg)`,
                    transformOrigin: 'left center',
                    zIndex: 1
                }} />
            )}

            {/* Legend */}
            <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#dded00' }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Progress</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff9800' }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Plateau</Typography>
                </Box>
            </Box>
        </Box>
    );
};

const PerformanceCharts = ({
    progressData,
    selectedExercise,
    setSelectedExercise,
    timeRange,
    setTimeRange,
    weightUnit = 'kg'
}) => {
    const exerciseNames = Object.keys(progressData);
    const currentExerciseData = selectedExercise ? progressData[selectedExercise] || [] : [];
    const filteredData = getTimeRangeData(currentExerciseData, timeRange);

    return (
        <Box>
            <Typography variant="h6" sx={{ color: '#dded00', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MdShowChart />
                Performance Visualization
                <Chip
                    label="AI Enhanced"
                    size="small"
                    sx={{
                        backgroundColor: 'rgba(221, 237, 0, 0.2)',
                        color: '#dded00',
                        fontWeight: 'bold'
                    }}
                />
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Weight progression with AI trend analysis and plateau detection
            </Typography>

            {/* Exercise and Time Range Selectors */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Exercise</InputLabel>
                        <Select
                            value={selectedExercise}
                            onChange={(e) => setSelectedExercise(e.target.value)}
                            sx={{
                                color: '#fff',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                },
                            }}
                        >
                            {exerciseNames.map(name => (
                                <MenuItem key={name} value={name}>{name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Time Range</InputLabel>
                        <Select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            sx={{
                                color: '#fff',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                },
                            }}
                        >
                            <MenuItem value="1month">1 Month</MenuItem>
                            <MenuItem value="3months">3 Months</MenuItem>
                            <MenuItem value="6months">6 Months</MenuItem>
                            <MenuItem value="1year">1 Year</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>

            {/* Chart with AI Indicators */}
            {filteredData.length > 0 ? (
                <StyledCard>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ color: '#fff' }}>
                                {selectedExercise}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Chip label="AI Trend Line" size="small" sx={{ backgroundColor: 'rgba(76, 175, 80, 0.2)', color: '#4caf50' }} />
                                <Chip label="Plateau Points" size="small" sx={{ backgroundColor: 'rgba(255, 152, 0, 0.2)', color: '#ff9800' }} />
                                <Chip label="Volume Data" size="small" sx={{ backgroundColor: 'rgba(33, 150, 243, 0.2)', color: '#2196f3' }} />
                            </Box>
                        </Box>

                        <EnhancedProgressChart data={filteredData} weightUnit={weightUnit} />

                        {/* Chart Statistics */}
                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid item xs={3}>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Current Weight</Typography>
                                <Typography variant="h6" sx={{ color: '#dded00' }}>
                                    {filteredData[filteredData.length - 1]?.weight || 0}{weightUnit}
                                </Typography>
                            </Grid>
                            <Grid item xs={3}>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Best Weight</Typography>
                                <Typography variant="h6" sx={{ color: '#4caf50' }}>
                                    {Math.max(...filteredData.map(d => d.weight))}{weightUnit}
                                </Typography>
                            </Grid>
                            <Grid item xs={3}>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Total Sessions</Typography>
                                <Typography variant="h6" sx={{ color: '#dded00' }}>
                                    {filteredData.length}
                                </Typography>
                            </Grid>
                            <Grid item xs={3}>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Plateau Points</Typography>
                                <Typography variant="h6" sx={{ color: '#ff9800' }}>
                                    {identifyPlateauPoints(filteredData).length}
                                </Typography>
                            </Grid>
                        </Grid>

                        {/* AI Analysis Box */}
                        <Box sx={{
                            mt: 2,
                            p: 2,
                            backgroundColor: 'rgba(221, 237, 0, 0.1)',
                            borderRadius: '8px',
                            border: '1px solid rgba(221, 237, 0, 0.2)'
                        }}>
                            <Typography variant="subtitle2" sx={{ color: '#dded00', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <MdPsychology />
                                AI Analysis
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {selectedExercise} shows {identifyPlateauPoints(filteredData).length > 2 ?
                                    '3 plateau periods. Consider implementing progressive overload variations or deload protocols.' :
                                    'good progression. Continue with current training intensity and consider gradual weight increases.'}
                            </Typography>
                        </Box>
                    </CardContent>
                </StyledCard>
            ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography sx={{ color: 'text.secondary' }}>
                        Select an exercise to view detailed performance charts
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default PerformanceCharts;

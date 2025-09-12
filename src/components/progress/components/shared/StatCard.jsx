import { Typography, LinearProgress } from '@mui/material';
import { StatCard as StyledStatCard } from './StyledComponents';

const StatCard = ({
    icon,
    value,
    unit = '',
    label,
    sublabel,
    progress,
    progressLabel,
    color = '#dded00',
    backgroundColor,
    ...props
}) => {
    return (
        <StyledStatCard sx={{ textAlign: 'center', backgroundColor, ...props.sx }}>
            {icon && (
                <div style={{ fontSize: '24px', color, marginBottom: '8px' }}>
                    {icon}
                </div>
            )}
            <Typography variant="h4" sx={{ color, fontWeight: 'bold', mb: 1 }}>
                {value}
                {unit && (
                    <Typography component="span" variant="caption" sx={{ color: 'text.secondary' }}>
                        {unit}
                    </Typography>
                )}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {label}
            </Typography>
            {sublabel && (
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    {sublabel}
                </Typography>
            )}
            {progress !== undefined && (
                <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '8px' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Progress</Typography>
                        <div style={{ flex: 1, marginLeft: '8px', marginRight: '8px' }}>
                            <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    '& .MuiLinearProgress-bar': { backgroundColor: color }
                                }}
                            />
                        </div>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{progress}%</Typography>
                    </div>
                    {progressLabel && (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {progressLabel}
                        </Typography>
                    )}
                </>
            )}
        </StyledStatCard>
    );
};

export default StatCard;

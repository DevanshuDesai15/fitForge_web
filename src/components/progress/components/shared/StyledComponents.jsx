import { Card, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

export const StyledCard = styled(Card)(() => ({
    background: '#282828',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    boxShadow: '0 4px 30px rgba(221, 237, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
}));

export const StatCard = styled(Card)(() => ({
    background: '#282828',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '1rem',
}));

export const ProgressChart = styled(Box)(({ progress }) => ({
    width: '100%',
    height: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
    position: 'relative',
    '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: `${Math.min(progress, 100)}%`,
        background: progress >= 100 ?
            'linear-gradient(90deg, #dded00, #e8f15d)' :
            'linear-gradient(90deg, #ff9800, #ffc107)',
        transition: 'width 0.3s ease',
    }
}));

export const PlateauWarningCard = styled(Card)(({ severity }) => ({
    background: severity === 'severe'
        ? 'linear-gradient(135deg, rgba(255, 68, 68, 0.15), rgba(255, 68, 68, 0.05))'
        : severity === 'moderate'
            ? 'linear-gradient(135deg, rgba(255, 152, 0, 0.15), rgba(255, 152, 0, 0.05))'
            : 'linear-gradient(135deg, rgba(255, 193, 7, 0.15), rgba(255, 193, 7, 0.05))',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    border: severity === 'severe'
        ? '1px solid rgba(255, 68, 68, 0.3)'
        : severity === 'moderate'
            ? '1px solid rgba(255, 152, 0, 0.3)'
            : '1px solid rgba(255, 193, 7, 0.3)',
    marginBottom: '16px',
}));

export const ConfidenceIndicator = styled(Box)(({ confidence }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    background: confidence >= 0.8
        ? 'rgba(76, 175, 80, 0.2)'
        : confidence >= 0.6
            ? 'rgba(255, 193, 7, 0.2)'
            : 'rgba(255, 152, 0, 0.2)',
    color: confidence >= 0.8
        ? '#4caf50'
        : confidence >= 0.6
            ? '#ffc107'
            : '#ff9800',
    border: confidence >= 0.8
        ? '1px solid rgba(76, 175, 80, 0.3)'
        : confidence >= 0.6
            ? '1px solid rgba(255, 193, 7, 0.3)'
            : '1px solid rgba(255, 152, 0, 0.3)',
}));

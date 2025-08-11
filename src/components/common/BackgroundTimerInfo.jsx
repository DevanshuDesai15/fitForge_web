import { useState, useEffect } from 'react';
import {
    Alert,
    AlertTitle,
    Box,
    Button,
    Collapse,
    IconButton,
    Typography
} from '@mui/material';
import { MdClose, MdInfo, MdTimer, MdPhoneAndroid } from 'react-icons/md';

export default function BackgroundTimerInfo({ show, onDismiss }) {
    const [expanded, setExpanded] = useState(false);

    if (!show) return null;

    return (
        <Collapse in={show}>
            <Alert
                severity="info"
                sx={{
                    mb: 2,
                    backgroundColor: 'rgba(0, 188, 212, 0.1)',
                    border: '1px solid rgba(0, 188, 212, 0.3)',
                    '& .MuiAlert-icon': {
                        color: '#00bcd4'
                    }
                }}
                action={
                    <IconButton
                        aria-label="close"
                        color="inherit"
                        size="small"
                        onClick={onDismiss}
                    >
                        <MdClose />
                    </IconButton>
                }
            >
                <AlertTitle sx={{ color: '#00bcd4', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MdTimer /> Background Timer Active
                </AlertTitle>

                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1 }}>
                    Your workout timer will continue running even if you close the app or switch tabs!
                </Typography>

                <Button
                    size="small"
                    onClick={() => setExpanded(!expanded)}
                    sx={{ color: '#00bcd4', p: 0, minWidth: 'auto' }}
                >
                    {expanded ? 'Show less' : 'Learn more'}
                </Button>

                <Collapse in={expanded}>
                    <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                            <strong>How it works:</strong>
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <MdTimer style={{ color: '#00bcd4', fontSize: '1rem' }} />
                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                    Timer runs in a Web Worker (background thread)
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <MdPhoneAndroid style={{ color: '#00bcd4', fontSize: '1rem' }} />
                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                    Screen stays awake during workout (if supported)
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <MdInfo style={{ color: '#00bcd4', fontSize: '1rem' }} />
                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                    Workout progress is automatically saved
                                </Typography>
                            </Box>
                        </Box>

                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', mt: 2, display: 'block' }}>
                            💡 Tip: You can pause/resume the timer using the button next to the time display
                        </Typography>
                    </Box>
                </Collapse>
            </Alert>
        </Collapse>
    );
}
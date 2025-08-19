import React from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { MdError, MdRefresh } from 'react-icons/md';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '50vh',
                    p: 3
                }}>
                    <Card sx={{
                        maxWidth: 500,
                        background: '#282828',
                        border: '1px solid rgba(255, 68, 68, 0.3)'
                    }}>
                        <CardContent sx={{ textAlign: 'center', p: 4 }}>
                            <MdError style={{
                                fontSize: '4rem',
                                color: '#ff4444',
                                marginBottom: '1rem'
                            }} />

                            <Typography variant="h5" sx={{
                                color: '#ff4444',
                                fontWeight: 'bold',
                                mb: 2
                            }}>
                                Something went wrong
                            </Typography>

                            <Typography variant="body2" sx={{
                                color: 'rgba(255, 255, 255, 0.7)',
                                mb: 3
                            }}>
                                {this.state.error && this.state.error.toString()}
                            </Typography>

                            <Button
                                variant="contained"
                                startIcon={<MdRefresh />}
                                onClick={() => window.location.reload()}
                                sx={{
                                    background: 'linear-gradient(45deg, #ff4444, #ff6666)',
                                    color: 'white',
                                    '&:hover': {
                                        background: 'linear-gradient(45deg, #ff6666, #ff4444)',
                                    }
                                }}
                            >
                                Reload Page
                            </Button>

                            {process.env.NODE_ENV === 'development' && (
                                <Box sx={{
                                    mt: 3,
                                    p: 2,
                                    background: 'rgba(0, 0, 0, 0.3)',
                                    borderRadius: 1,
                                    textAlign: 'left'
                                }}>
                                    <Typography variant="caption" sx={{
                                        color: 'rgba(255, 255, 255, 0.5)',
                                        fontFamily: 'monospace',
                                        fontSize: '0.7rem'
                                    }}>
                                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;